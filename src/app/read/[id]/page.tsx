"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
import { exportCbz, exportPdf } from "@/lib/export";
import { useStudio } from "@/lib/state";
import type { ComicProject, PanelState } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ReadPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  if (!projectId) {
    return (
      <Shell className="pb-4">
        <div className="mt-16 rounded-2xl border border-subtle bg-surface p-8 text-center">
          <div className="text-[13px] text-foreground/70">Invalid read link.</div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell className="pb-4">
      <Reader projectId={projectId} />
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
            <img src={p.imageUrl} alt={`Page ${p.index}`} className="block h-auto w-full" />
          </div>
        ))}
      </div>
    </div>
  );
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
  const [cursor, setCursor] = useState(0);
  const [flip, setFlip] = useState<null | { from: number; to: number; dir: 1 | -1 }>(null);

  const total = panels.length;
  const canPrev = cursor > 0;
  const canNext = cursor < total - 1;

  const go = useCallback(
    (dir: 1 | -1) => {
      setFlip((current) => {
        if (current) return current;
        const target = cursor + dir;
        if (target < 0 || target >= total) return current;
        return { from: cursor, to: target, dir };
      });
    },
    [cursor, total],
  );

  useEffect(() => {
    if (!flip) return;
    const id = window.setTimeout(() => {
      setCursor(flip.to);
      setFlip(null);
    }, 650);
    return () => window.clearTimeout(id);
  }, [flip]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(rtl ? -1 : 1);
      if (e.key === "ArrowLeft") go(rtl ? 1 : -1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, rtl]);

  const aspectRatio =
    project.brief.aspect === "landscape"
      ? "16 / 9"
      : project.brief.aspect === "square"
        ? "1 / 1"
        : "3 / 4";

  const backPage = panels[flip ? flip.to : cursor];
  const flipPage = flip ? panels[flip.from] : null;
  const flipClass = flip
    ? (flip.dir === 1) === !rtl
      ? "flip-toward-left"
      : "flip-toward-right"
    : "";

  return (
    <div className="mt-6">
      <TopBar panelCount={total} project={project} />
      <div className="relative mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(rtl ? 1 : -1)}
          disabled={rtl ? !canNext : !canPrev}
          aria-label={rtl ? "Next page" : "Previous page"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-subtle bg-surface text-foreground/75 hover:border-white/20 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div
          className="ink-border relative overflow-hidden rounded-2xl bg-[oklch(0.07_0_0)]"
          style={{
            perspective: "2500px",
            aspectRatio,
            height: "min(82vh, 1100px)",
            maxWidth: "min(92vw, 1100px)",
            boxShadow:
              "inset 0 0 0 1.5px oklch(0 0 0 / 0.55), 0 30px 80px -20px oklch(0 0 0 / 0.75)",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={backPage.imageUrl}
              alt={`Page ${backPage.index}`}
              className="h-full w-full object-contain"
            />
          </div>
          {flipPage && (
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center bg-black will-change-transform",
                flipClass,
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={flipPage.imageUrl}
                alt={`Page ${flipPage.index}`}
                className="h-full w-full object-contain"
              />
            </div>
          )}
          <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/60 px-2 py-0.5 font-mono text-[10px] text-white/85 backdrop-blur">
            #{String(backPage.index).padStart(2, "0")}
          </div>
        </div>

        <button
          type="button"
          onClick={() => go(rtl ? -1 : 1)}
          disabled={rtl ? !canPrev : !canNext}
          aria-label={rtl ? "Previous page" : "Next page"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-subtle bg-surface text-foreground/75 hover:border-white/20 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2 text-[11.5px] text-foreground/55">
        <span>
          Page {cursor + 1} / {total}
        </span>
        <span>·</span>
        <span>Use ← and → to turn the page{rtl ? " (manga: reversed)" : ""}</span>
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
        Reader · {panelCount} pages
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
          href="/history"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-subtle bg-surface px-3 text-[12px]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          History
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
