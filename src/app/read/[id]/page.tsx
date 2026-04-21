"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  FileArchive,
  FileText,
  Loader2,
} from "lucide-react";
import { Shell } from "@/components/Shell";
import { SpeechBubbleStack } from "@/components/Reader/SpeechBubble";
import { exportCbz, exportPdf } from "@/lib/export";
import { useStudio } from "@/lib/state";
import type { ComicProject, PanelState } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ReadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Shell className="pb-4">
      <Reader projectId={id} />
    </Shell>
  );
}

function Reader({ projectId }: { projectId: string }) {
  const project = useStudio((s) => s.getProject(projectId));
  const brief = project?.brief;

  const panels = useMemo(
    () => (project?.panels ?? []).filter((p) => p.imageUrl) as (PanelState & { imageUrl: string })[],
    [project?.panels],
  );

  if (!project || !brief) {
    return (
      <div className="mt-16 rounded-2xl border border-subtle bg-surface p-8 text-center">
        <div className="text-[13px] text-foreground/70">Book not found.</div>
        <Link
          href="/new"
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-subtle bg-surface-2 px-4 py-2 text-[12.5px]"
        >
          Start a new comic
        </Link>
      </div>
    );
  }

  if (panels.length === 0) {
    return (
      <div className="mt-16 rounded-2xl border border-subtle bg-surface p-8 text-center">
        <div className="text-[13px] text-foreground/70">No panels ready yet.</div>
        <Link
          href={`/studio/${projectId}`}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-subtle bg-surface-2 px-4 py-2 text-[12.5px]"
        >
          Back to the studio
        </Link>
      </div>
    );
  }

  if (brief.format === "webtoon") return <WebtoonReader project={project} panels={panels} />;
  return <FlipbookReader project={project} panels={panels} rtl={brief.format === "manga"} />;
}

function WebtoonReader({ project, panels }: { project: ComicProject; panels: (PanelState & { imageUrl: string })[] }) {
  return (
    <div className="mt-6">
      <TopBar panelCount={panels.length} project={project} />
      <div className="mx-auto mt-6 flex max-w-[720px] flex-col gap-2">
        {panels.map((p) => (
          <div key={p.index} className="relative overflow-hidden rounded-lg border border-subtle bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.imageUrl} alt={`Panel ${p.index}`} className="block h-auto w-full" />
            {p.beat?.dialog && p.beat.dialog.length > 0 && (
              <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-center">
                <SpeechBubbleStack
                  dialog={p.beat.dialog}
                  side={panelSideForIndex(p.index)}
                  width={280}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function panelSideForIndex(i: number): "left" | "right" | "center" {
  return i % 2 === 0 ? "right" : "left";
}

function FlipbookReader({
  project,
  panels,
  rtl,
}: {
  project: ComicProject;
  panels: (PanelState & { imageUrl: string })[];
  rtl: boolean;
}) {
  const spreads: ((PanelState & { imageUrl: string }) | null)[][] = useMemo(() => {
    const out: ((PanelState & { imageUrl: string }) | null)[][] = [];
    out.push([null, panels[0] ?? null]);
    for (let i = 1; i < panels.length; i += 2) {
      out.push([panels[i] ?? null, panels[i + 1] ?? null]);
    }
    return out;
  }, [panels]);

  const [cursor, setCursor] = useState(0);

  const go = useCallback(
    (dir: 1 | -1) => {
      setCursor((c) => Math.max(0, Math.min(spreads.length - 1, c + dir)));
    },
    [spreads.length],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(rtl ? -1 : 1);
      if (e.key === "ArrowLeft") go(rtl ? 1 : -1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, rtl]);

  const spread = spreads[cursor];
  const [left, right] = rtl ? [spread[1], spread[0]] : spread;

  return (
    <div className="mt-6">
      <TopBar panelCount={panels.length} project={project} />
      <div className="relative mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={cursor === 0}
          aria-label="Previous spread"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-subtle bg-surface text-foreground/75 hover:border-white/20 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div
          className="ink-border grid aspect-[3/2] w-full max-w-[1100px] grid-cols-2 overflow-hidden rounded-2xl bg-[oklch(0.07_0_0)]"
          style={{ boxShadow: "inset 0 0 0 1.5px oklch(0 0 0 / 0.55), 0 30px 80px -20px oklch(0 0 0 / 0.75)" }}
        >
          <PageSide panel={left} side="left" rtl={rtl} />
          <PageSide panel={right} side="right" rtl={rtl} />
        </div>

        <button
          type="button"
          onClick={() => go(1)}
          disabled={cursor === spreads.length - 1}
          aria-label="Next spread"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-subtle bg-surface text-foreground/75 hover:border-white/20 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2 text-[11.5px] text-foreground/55">
        <span>Spread {cursor + 1} / {spreads.length}</span>
        <span>·</span>
        <span>Use ← and → to turn the page{rtl ? " (manga: reversed)" : ""}</span>
      </div>
    </div>
  );
}

function PageSide({
  panel,
  side,
  rtl,
}: {
  panel: (PanelState & { imageUrl: string }) | null;
  side: "left" | "right";
  rtl?: boolean;
}) {
  if (!panel) {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center bg-[oklch(0.08_0_0)] text-[11px] uppercase tracking-[0.2em] text-foreground/30",
          side === "left" ? "border-r border-black/60" : "",
        )}
      >
        <span className="font-[family-name:var(--font-display)] text-[32px] tracking-[0.1em] text-foreground/20">
          COMIC STUDIO
        </span>
      </div>
    );
  }
  const bubbleSide = side === "left" ? "left" : "right";
  return (
    <div
      className={cn(
        "relative flex h-full items-center justify-center bg-black",
        side === "left" ? "border-r border-black/60" : "",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={panel.imageUrl} alt={`Panel ${panel.index}`} className="max-h-full max-w-full object-contain" />
      {panel.beat?.dialog && panel.beat.dialog.length > 0 && (
        <div
          className={cn(
            "pointer-events-none absolute bottom-4",
            bubbleSide === "left" ? "left-4" : "right-4",
          )}
        >
          <SpeechBubbleStack
            dialog={panel.beat.dialog}
            side={bubbleSide}
            width={240}
            rtl={rtl}
          />
        </div>
      )}
      <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/60 px-2 py-0.5 font-mono text-[10px] text-white/85 backdrop-blur">
        #{String(panel.index).padStart(2, "0")}
      </div>
    </div>
  );
}

function TopBar({ panelCount, project }: { panelCount: number; project: ComicProject }) {
  const [busy, setBusy] = useState<null | "pdf" | "cbz">(null);
  const [err, setErr] = useState<string | null>(null);

  async function download(kind: "pdf" | "cbz") {
    setBusy(kind);
    setErr(null);
    try {
      if (kind === "pdf") await exportPdf(project);
      else await exportCbz(project);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-foreground/55">
        <BookOpen className="h-3.5 w-3.5" />
        Reader · {panelCount} panels
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => download("pdf")}
          disabled={!!busy}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-subtle bg-surface px-3 text-[12px] disabled:opacity-50"
        >
          {busy === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
          PDF
        </button>
        <button
          type="button"
          onClick={() => download("cbz")}
          disabled={!!busy}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-subtle bg-surface px-3 text-[12px] disabled:opacity-50"
        >
          {busy === "cbz" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileArchive className="h-3.5 w-3.5" />}
          CBZ
        </button>
        <Link
          href="/library"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-subtle bg-surface px-3 text-[12px]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Library
        </Link>
        <Link
          href="/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-3 font-[family-name:var(--font-display)] text-[13px] tracking-wider text-accent-ink"
        >
          New comic
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {err && (
        <div className="w-full rounded-lg border border-red-500/30 bg-red-500/[0.06] px-3 py-2 text-[11.5px] text-red-200">
          Download failed: {err}
        </div>
      )}
    </div>
  );
}
