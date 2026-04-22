"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, BookOpen, Loader2, Play, Wand2 } from "lucide-react";
import { Shell } from "@/components/Shell";
import { FalKeyGate } from "@/components/FalKeyGate";
import { useFalKey } from "@/lib/fal-key";
import { generateStoryboard, renderPanel } from "@/lib/pipeline";
import { useStudio } from "@/lib/state";
import { STYLES } from "@/lib/styles";
import type { PanelState } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  const updatePanels = useStudio((s) => s.updatePanels);
  const consumeAutoStart = useStudio((s) => s.consumeAutoStart);
  const initialPhase: "idle" | "done" = (project?.panels ?? []).some((p) => p.status === "done")
    ? "done"
    : "idle";
  const [panels, setPanels] = useState<PanelState[]>(project?.panels ?? []);
  const [phase, setPhase] = useState<"idle" | "outlining" | "rendering" | "done" | "error">(initialPhase);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const autoStartChecked = useRef(false);

  const brief = project?.brief;
  const style = brief ? STYLES.find((s) => s.id === brief.styleId) : undefined;

  useEffect(() => {
    if (!project) return;
    setPanels(project.panels);
  }, [project]);

  const run = useCallback(async () => {
    if (!project || !brief || !key || started.current) return;
    const safeBrief = brief;
    started.current = true;
    setError(null);

    const charactersWithSheet = safeBrief.characters.filter((c) => !!c.sheetUrl);
    const refs = [
      style?.reference,
      ...charactersWithSheet.map((c) => c.sheetUrl as string),
    ].filter(Boolean) as string[];
    const refLabels = [
      `ART STYLE reference ONLY — match its linework, paneling, color palette, and lettering. DO NOT reuse any character, outfit, or scene from this image. Style: ${style?.name ?? "selected style"}.`,
      ...charactersWithSheet.map(
        (c) =>
          `CHARACTER "${c.name}" (${c.role}) — this image is the canonical identity for ${c.name}. Match face, hair, body, and costume exactly whenever ${c.name} appears in a panel. Never use this character unless the panel explicitly names ${c.name}.`,
      ),
    ];
    const working: PanelState[] = Array.from({ length: safeBrief.panelCount }, (_, i) => ({
      index: i + 1,
      status: "pending",
    }));
    setPanels(working);
    setPhase("outlining");

    try {
      const beats = await generateStoryboard(safeBrief, key);
      beats.forEach((b, i) => {
        const idx = i < working.length ? i : null;
        if (idx !== null) {
          working[idx] = {
            index: idx + 1,
            status: "pending",
            beat: { ...b, index: idx + 1, imageRefs: refs },
          };
        }
      });
      setPanels([...working]);
      updatePanels(projectId, [...working]);
      setPhase("rendering");

      for (let i = 0; i < working.length; i++) {
        const panel = working[i];
        if (!panel?.beat?.prompt) continue;
        working[i] = { ...panel, status: "rendering" };
        setPanels([...working]);
        try {
          const out = await renderPanel({
            falKey: key,
            prompt: panel.beat.prompt,
            imageUrls: refs,
            refLabels,
            aspect: safeBrief.aspect,
          });
          working[i] = { ...working[i], status: "done", imageUrl: out.url };
        } catch (err) {
          working[i] = {
            ...working[i],
            status: "failed",
            error: err instanceof Error ? err.message : String(err),
          };
        }
        setPanels([...working]);
        updatePanels(projectId, [...working]);
      }
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("error");
      started.current = false;
    }
  }, [project, brief, key, projectId, updatePanels, style?.reference, style?.name]);

  useEffect(() => {
    if (!project || autoStartChecked.current) return;
    autoStartChecked.current = true;
    if (phase !== "idle" || started.current) return;
    if (consumeAutoStart(projectId)) {
      void run();
    }
  }, [project, projectId, consumeAutoStart, phase, run]);

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
  const total = panels.length || brief.panelCount;

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
                onClick={() => {
                  started.current = false;
                  setError(null);
                  setPhase("idle");
                  void run();
                }}
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
              {phase === "outlining" ? "Outlining storyboard..." : `Rendering ${done}/${total}`}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                started.current = false;
                setError(null);
                setPhase("idle");
                void run();
              }}
              disabled={!key}
              className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-accent px-4 font-[family-name:var(--font-display)] text-[14px] tracking-wider text-accent-ink disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-auto"
            >
              {phase === "error" ? (
                <Play className="h-4 w-4" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {phase === "error"
                ? "Retry"
                : panels.some((p) => p.status === "done" || p.status === "failed")
                  ? "Re-run"
                  : "Start production"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-4 text-[13px] text-red-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <div>
            <div className="font-medium">Something broke</div>
            <p className="mt-1 font-mono text-[11.5px] text-red-200/80">{error}</p>
            <button
              type="button"
              onClick={() => {
                started.current = false;
                setError(null);
                setPhase("idle");
                void run();
              }}
              className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-full border border-red-500/40 px-3 text-[12px]"
            >
              <Play className="h-3.5 w-3.5" />
              Retry
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
      </div>
      <figcaption className="flex items-center justify-between border-t border-subtle px-3 py-2 text-[11.5px]">
        <span className="font-mono text-foreground/55">#{String(index).padStart(2, "0")}</span>
        <span className="truncate text-foreground/80">{panel?.beat?.title ?? ""}</span>
      </figcaption>
    </figure>
  );
}
