"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, BookOpen, Loader2, Play, Wand2 } from "lucide-react";
import { Shell } from "@/components/Shell";
import { FalKeyGate } from "@/components/FalKeyGate";
import { useFalKey } from "@/lib/fal-key";
import { generateStoryboard, renderPanel, resumeRenderPanel } from "@/lib/pipeline";
import { useStudio } from "@/lib/state";
import { STYLES } from "@/lib/styles";
import type { PanelState } from "@/lib/types";
import { cn } from "@/lib/utils";

const CONCURRENCY = 5;

// Module-level lock so a run started on one mount keeps working if the
// component remounts (navigating away and back) without starting a duplicate.
const activeRuns = new Set<string>();

export default function StudioPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  if (!projectId) {
    return (
      <Shell>
        <FalKeyGate>
          <div className="mt-16 rounded-2xl border border-subtle bg-surface p-8 text-center">
            <div className="text-[13px] text-foreground/70">Invalid studio link.</div>
          </div>
        </FalKeyGate>
      </Shell>
    );
  }

  return (
    <Shell>
      <FalKeyGate>
        <StudioView projectId={projectId} />
      </FalKeyGate>
    </Shell>
  );
}

function StudioView({ projectId }: { projectId: string }) {
  const { key } = useFalKey();
  const project = useStudio((s) => s.getProject(projectId));
  const patchPanel = useStudio((s) => s.patchPanel);
  const updatePanels = useStudio((s) => s.updatePanels);
  const setProjectPhase = useStudio((s) => s.setProjectPhase);
  const consumeAutoStart = useStudio((s) => s.consumeAutoStart);

  const persistedPhase = project?.phase;
  const persistedError = project?.phaseError;
  const panels = project?.panels ?? [];

  const running = useRef(false);
  const autoChecked = useRef(false);

  const brief = project?.brief;
  const style = brief ? STYLES.find((s) => s.id === brief.styleId) : undefined;

  const refs = useMemo(() => {
    if (!brief || !style) return [] as string[];
    const chars = brief.characters.filter((c) => !!c.sheetUrl);
    return [style.reference, ...chars.map((c) => c.sheetUrl as string)].filter(Boolean) as string[];
  }, [brief, style]);

  const refLabels = useMemo(() => {
    if (!brief || !style) return [] as string[];
    const chars = brief.characters.filter((c) => !!c.sheetUrl);
    return [
      `ART STYLE reference ONLY — match its linework, paneling, color palette, and lettering. DO NOT reuse any character, outfit, or scene from this image. Style: ${style.name}.`,
      ...chars.map(
        (c) =>
          `CHARACTER "${c.name}" (${c.role}) — this image is the canonical identity for ${c.name}. Match face, hair, body, and costume exactly whenever ${c.name} appears in a panel. Never use this character unless the panel explicitly names ${c.name}.`,
      ),
    ];
  }, [brief, style]);

  const run = useCallback(
    async ({ resume }: { resume: boolean }) => {
      if (!project || !brief || !key) return;
      if (running.current) return;
      if (activeRuns.has(projectId)) return;
      running.current = true;
      activeRuns.add(projectId);

      const safeBrief = brief;
      const safeKey = key;

      try {
        let storyboardBeats = panels
          .map((p) => p.beat)
          .filter(Boolean) as NonNullable<PanelState["beat"]>[];
        let workingPanels: PanelState[] = panels.length
          ? panels.map((p) => ({ ...p }))
          : Array.from({ length: safeBrief.panelCount }, (_, i) => ({
              index: i + 1,
              status: "pending" as const,
            }));

        const needsStoryboard =
          !resume || storyboardBeats.length === 0 || workingPanels.some((p) => !p.beat);

        if (needsStoryboard) {
          setProjectPhase(projectId, "outlining", null);
          // reset panels to clean pending state
          workingPanels = Array.from({ length: safeBrief.panelCount }, (_, i) => ({
            index: i + 1,
            status: "pending" as const,
          }));
          updatePanels(projectId, workingPanels);
          const beats = await generateStoryboard(safeBrief, safeKey);
          storyboardBeats = beats.map((b, i) => ({ ...b, index: i + 1, imageRefs: refs }));
          workingPanels = workingPanels.map((p, i) => {
            const beat = storyboardBeats[i];
            return beat
              ? { index: p.index, status: "pending" as const, beat }
              : p;
          });
          updatePanels(projectId, workingPanels);
        }

        setProjectPhase(projectId, "rendering", null);

        // Decide work set:
        // - resume: keep done/failed, re-poll any "rendering" with requestId, render any pending
        // - fresh: render all pendings in order
        // For simplicity, reset anything "rendering" without requestId back to pending
        workingPanels = workingPanels.map((p) => {
          if (p.status === "rendering" && !p.requestId) {
            return { ...p, status: "pending" as const };
          }
          return p;
        });
        updatePanels(projectId, workingPanels);

        // Build queue of indices still to process (pending or re-poll)
        const indicesToWork = workingPanels
          .filter((p) => p.status === "pending" || (p.status === "rendering" && p.requestId))
          .map((p) => p.index)
          .sort((a, b) => a - b);

        let cursor = 0;

        async function worker() {
          while (true) {
            const nextIdx = cursor++;
            if (nextIdx >= indicesToWork.length) return;
            const panelIndex = indicesToWork[nextIdx];
            const panel = workingPanels.find((x) => x.index === panelIndex);
            if (!panel || !panel.beat?.prompt) continue;

            try {
              let result: { url: string };
              if (panel.status === "rendering" && panel.requestId && panel.endpoint) {
                // Resume existing fal request
                result = await resumeRenderPanel({
                  falKey: safeKey,
                  endpoint: panel.endpoint,
                  requestId: panel.requestId,
                });
              } else {
                patchPanel(projectId, panelIndex, {
                  status: "rendering",
                  startedAt: Date.now(),
                  error: undefined,
                });
                result = await renderPanel({
                  falKey: safeKey,
                  prompt: panel.beat.prompt,
                  imageUrls: refs,
                  refLabels,
                  aspect: safeBrief.aspect,
                  onRequestId: (requestId, endpoint) => {
                    patchPanel(projectId, panelIndex, { requestId, endpoint });
                  },
                });
              }
              patchPanel(projectId, panelIndex, {
                status: "done",
                imageUrl: result.url,
                finishedAt: Date.now(),
              });
            } catch (err) {
              patchPanel(projectId, panelIndex, {
                status: "failed",
                error: err instanceof Error ? err.message : String(err),
                finishedAt: Date.now(),
              });
            }
          }
        }

        const workers = Array.from(
          { length: Math.min(CONCURRENCY, indicesToWork.length) },
          () => worker(),
        );
        await Promise.all(workers);

        setProjectPhase(projectId, "done", null);
      } catch (err) {
        setProjectPhase(
          projectId,
          "error",
          err instanceof Error ? err.message : String(err),
        );
      } finally {
        running.current = false;
        activeRuns.delete(projectId);
      }
    },
    [project, brief, key, projectId, panels, refs, refLabels, patchPanel, updatePanels, setProjectPhase],
  );

  // Auto-start (from /new) OR auto-resume (on mount if phase is in-progress)
  useEffect(() => {
    if (!project || autoChecked.current) return;
    autoChecked.current = true;
    if (!key) return;
    if (running.current || activeRuns.has(projectId)) return;

    if (consumeAutoStart(projectId)) {
      void run({ resume: false });
      return;
    }

    if (persistedPhase === "outlining" || persistedPhase === "rendering") {
      void run({ resume: true });
    }
  }, [project, projectId, key, consumeAutoStart, persistedPhase, run]);

  // On visibility change, if we're supposed to be rendering but not running, re-kick.
  useEffect(() => {
    function onVis() {
      if (document.visibilityState !== "visible") return;
      if (running.current || activeRuns.has(projectId)) return;
      if (!key) return;
      if (persistedPhase === "rendering" || persistedPhase === "outlining") {
        void run({ resume: true });
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [persistedPhase, key, run, projectId]);

  if (!project || !brief) {
    return (
      <div className="mt-16 rounded-2xl border border-subtle bg-surface p-8 text-center">
        <div className="text-[13px] text-foreground/70">Project not found.</div>
        <Link
          href="/new"
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-subtle bg-surface-2 px-4 py-2 text-[12.5px]"
        >
          Start a new comic
        </Link>
      </div>
    );
  }

  const done = panels.filter((p) => p.status === "done").length;
  const failed = panels.filter((p) => p.status === "failed").length;
  const active = panels.filter((p) => p.status === "rendering").length;
  const total = panels.length || brief.panelCount;
  const phase: "idle" | "outlining" | "rendering" | "done" | "error" =
    persistedPhase ??
    (panels.some((p) => p.status === "done") && panels.every((p) => p.status !== "pending" && p.status !== "rendering")
      ? "done"
      : "idle");
  const error = persistedError ?? null;

  function startFresh() {
    setProjectPhase(projectId, "idle", null);
    updatePanels(
      projectId,
      Array.from({ length: brief!.panelCount }, (_, i) => ({
        index: i + 1,
        status: "pending" as const,
      })),
    );
    void run({ resume: false });
  }

  function resumeRun() {
    if (running.current) return;
    void run({ resume: true });
  }

  return (
    <div className="mt-5 sm:mt-8">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:justify-between">
        <div className="w-full sm:w-auto">
          <div className="text-[11px] uppercase tracking-[0.18em] text-foreground/55">Studio</div>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[26px] leading-tight tracking-wider sm:text-[32px]">
            {style ? style.name.toUpperCase() : "COMIC"} · {brief.panelCount} PAGES
          </h1>
          <p className="mt-1 line-clamp-3 max-w-[620px] text-[13px] text-foreground/60 sm:line-clamp-none">{brief.story}</p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          {phase === "done" ? (
            <>
              <button
                type="button"
                onClick={startFresh}
                disabled={!key}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-subtle bg-surface px-4 text-[13px] text-foreground/80 hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10"
              >
                <Play className="h-4 w-4" />
                Re-run
              </button>
              <Link
                href={`/read/${projectId}`}
                className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-accent px-4 font-[family-name:var(--font-display)] text-[14px] tracking-wider text-accent-ink sm:h-10 sm:flex-initial"
              >
                <BookOpen className="h-4 w-4" />
                Open the book
              </Link>
            </>
          ) : phase === "outlining" || phase === "rendering" ? (
            <div className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-subtle bg-surface px-4 text-[12.5px] text-foreground/75 sm:h-10 sm:w-auto">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {phase === "outlining"
                ? "Outlining storyboard..."
                : `Rendering ${done}/${total}${active > 0 ? ` · ${active} in flight` : ""}`}
            </div>
          ) : (
            <button
              type="button"
              onClick={startFresh}
              disabled={!key}
              className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-accent px-4 font-[family-name:var(--font-display)] text-[14px] tracking-wider text-accent-ink disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-auto"
            >
              {phase === "error" ? <Play className="h-4 w-4" /> : <Wand2 className="h-4 w-4" />}
              {phase === "error"
                ? "Retry"
                : panels.some((p) => p.status === "done" || p.status === "failed")
                  ? "Re-run"
                  : "Start production"}
            </button>
          )}
        </div>
      </div>

      {(phase === "rendering" || phase === "outlining") && (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
          <div
            className="h-full bg-accent transition-[width] duration-500 ease-out"
            style={{ width: `${Math.round((done / Math.max(1, total)) * 100)}%` }}
          />
        </div>
      )}

      {error && phase === "error" && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-4 text-[13px] text-red-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <div>
            <div className="font-medium">Something broke</div>
            <p className="mt-1 font-mono text-[11.5px] text-red-200/80">{error}</p>
            <button
              type="button"
              onClick={resumeRun}
              className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-full border border-red-500/40 px-3 text-[12px]"
            >
              <Play className="h-3.5 w-3.5" />
              Resume
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: total }).map((_, i) => {
          const p = panels[i];
          return <PanelCard key={i} index={i + 1} panel={p} aspect={brief.aspect} />;
        })}
      </div>

      {phase === "done" && failed > 0 && (
        <div className="mt-5 rounded-xl border border-yellow-500/30 bg-yellow-500/[0.05] p-3 text-[12.5px] text-yellow-200">
          {failed} page{failed === 1 ? "" : "s"} failed. The book opens anyway; re-run to patch.
        </div>
      )}
    </div>
  );
}

function PanelCard({
  index,
  panel,
  aspect,
}: {
  index: number;
  panel?: PanelState;
  aspect: "portrait" | "landscape" | "square";
}) {
  const aspectClass =
    aspect === "landscape" ? "aspect-[16/9]" : aspect === "square" ? "aspect-square" : "aspect-[4/5]";
  const status = panel?.status ?? "pending";
  return (
    <figure
      className={cn(
        "relative overflow-hidden rounded-xl border bg-surface",
        status === "done" ? "border-subtle" : "border-subtle/70",
      )}
    >
      <div className={cn("relative w-full bg-surface-2", aspectClass)}>
        {panel?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={panel.imageUrl}
            alt={`Panel ${index}`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[11.5px] text-foreground/55">
            <span className="font-[family-name:var(--font-display)] text-[24px] tracking-wider text-foreground/30">
              #{String(index).padStart(2, "0")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              {status === "rendering" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {status === "rendering" && "Rendering..."}
              {status === "pending" && "Queued"}
              {status === "failed" && "Failed"}
            </span>
          </div>
        )}
        {status === "rendering" && (
          <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur">
            <Loader2 className="h-3 w-3 animate-spin" />
            live
          </div>
        )}
      </div>
      <figcaption className="flex items-center justify-between border-t border-subtle px-3 py-2 text-[11.5px]">
        <span className="font-mono text-foreground/55">#{String(index).padStart(2, "0")}</span>
        <span className="truncate text-foreground/80">{panel?.beat?.title ?? ""}</span>
      </figcaption>
    </figure>
  );
}
