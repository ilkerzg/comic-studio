"use client";

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileArchive,
  FileText,
  Loader2,
  Maximize2,
  X,
} from "lucide-react";
import { Shell } from "@/components/Shell";
import { exportCbz, exportPdf } from "@/lib/export";
import { useStudio } from "@/lib/state";
import type { ComicProject, PanelState } from "@/lib/types";

type ReadyPanel = PanelState & { imageUrl: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HTMLFlipBook = dynamic<any>(() => import("react-pageflip").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] w-full items-center justify-center text-[12px] text-foreground/55">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Loading book...
    </div>
  ),
});

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
    () => (project?.panels ?? []).filter((p) => p.imageUrl) as ReadyPanel[],
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
        <div className="text-[13px] text-foreground/70">No pages ready yet.</div>
        <Link
          href={`/studio/${projectId}`}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-subtle bg-surface-2 px-4 py-2 text-[12.5px]"
        >
          Back to the studio
        </Link>
      </div>
    );
  }

  return <FlipbookReader project={project} panels={panels} />;
}

const BookPage = forwardRef<HTMLDivElement, { panel: ReadyPanel; onExpand: () => void }>(
  function BookPage({ panel, onExpand }, ref) {
    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        onClick={onExpand}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onExpand();
          }
        }}
        aria-label={`Open page ${panel.index} full-screen`}
        className="group relative h-full w-full cursor-zoom-in overflow-hidden bg-black"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={panel.imageUrl}
          alt={`Page ${panel.index}`}
          className="h-full w-full object-contain"
          draggable={false}
        />
        <div
          className="pointer-events-none absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white/85 opacity-80 backdrop-blur transition group-hover:opacity-100"
          aria-hidden
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </div>
      </div>
    );
  },
);

type FlipBookHandle = {
  pageFlip: () => {
    flipNext: () => void;
    flipPrev: () => void;
    turnToPage: (n: number) => void;
  };
};

function FlipbookReader({
  project,
  panels,
}: {
  project: ComicProject;
  panels: ReadyPanel[];
}) {
  const bookRef = useRef<FlipBookHandle | null>(null);
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);
  const total = panels.length;

  const aspectRatio =
    project.brief.aspect === "landscape"
      ? 16 / 9
      : project.brief.aspect === "square"
        ? 1
        : 3 / 4;

  const pageHeight = 1000;
  const pageWidth = Math.round(pageHeight * aspectRatio);

  const flipNext = useCallback(() => {
    bookRef.current?.pageFlip()?.flipNext();
  }, []);

  const flipPrev = useCallback(() => {
    bookRef.current?.pageFlip()?.flipPrev();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && expanded !== null) {
        setExpanded(null);
        return;
      }
      if (expanded !== null) return;
      if (e.key === "ArrowRight") flipNext();
      if (e.key === "ArrowLeft") flipPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipNext, flipPrev, expanded]);

  useEffect(() => {
    if (expanded === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [expanded]);

  return (
    <div className="mt-4 sm:mt-6">
      <TopBar panelCount={total} project={project} />
      <div className="relative mt-4 flex items-center justify-center gap-2 sm:mt-6 sm:gap-3">
        <button
          type="button"
          onClick={flipPrev}
          disabled={page === 0}
          aria-label="Previous page"
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-subtle bg-surface text-foreground/75 hover:border-white/20 disabled:opacity-30 sm:flex"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex-1" style={{ maxWidth: "min(100vw, 1400px)" }}>
          <HTMLFlipBook
            ref={bookRef}
            width={pageWidth}
            height={pageHeight}
            size="stretch"
            minWidth={260}
            maxWidth={900}
            minHeight={360}
            maxHeight={1400}
            drawShadow
            flippingTime={700}
            usePortrait
            startZIndex={0}
            autoSize
            maxShadowOpacity={0.5}
            showCover={false}
            mobileScrollSupport
            clickEventForward
            useMouseEvents
            swipeDistance={30}
            showPageCorners
            disableFlipByClick
            startPage={0}
            className="mx-auto"
            style={{}}
            onFlip={(e: { data: number }) => setPage(e.data)}
          >
            {panels.map((p, i) => (
              <BookPage key={p.index} panel={p} onExpand={() => setExpanded(i)} />
            ))}
          </HTMLFlipBook>
        </div>

        <button
          type="button"
          onClick={flipNext}
          disabled={page >= total - 1}
          aria-label="Next page"
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-subtle bg-surface text-foreground/75 hover:border-white/20 disabled:opacity-30 sm:flex"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile bottom controls — stays above the mobile tab bar */}
      <div
        className="fixed inset-x-0 bottom-[calc(var(--mobile-nav-h)+var(--safe-bottom))] z-30 flex items-center justify-between gap-2 border-t border-subtle bg-background/90 px-4 py-3 backdrop-blur sm:hidden"
      >
        <button
          type="button"
          onClick={flipPrev}
          disabled={page === 0}
          aria-label="Previous page"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-subtle bg-surface text-foreground/75 disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center text-[12px] text-foreground/70">
          Page <span className="font-medium text-foreground">{page + 1}</span> / {total}
        </div>
        <button
          type="button"
          onClick={flipNext}
          disabled={page >= total - 1}
          aria-label="Next page"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-subtle bg-surface text-foreground/75 disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-5 hidden items-center justify-center gap-2 text-[11.5px] text-foreground/55 sm:flex">
        <span>
          Page {page + 1} / {total}
        </span>
        <span>·</span>
        <span>Tap a page to open it full-screen · ← and → to turn</span>
      </div>

      {expanded !== null && panels[expanded] && (
        <PageLightbox
          panel={panels[expanded]}
          onClose={() => setExpanded(null)}
          onPrev={expanded > 0 ? () => setExpanded(expanded - 1) : undefined}
          onNext={expanded < panels.length - 1 ? () => setExpanded(expanded + 1) : undefined}
          index={expanded + 1}
          total={panels.length}
        />
      )}

      {/* Spacer so flipbook doesn't sit under the mobile bottom bar */}
      <div className="h-16 sm:hidden" aria-hidden />
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
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-foreground/55">
          <BookOpen className="h-3.5 w-3.5" />
          Reader · {panelCount} pages
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => download("pdf")}
            disabled={!!busy}
            aria-label="Download PDF"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-subtle bg-surface px-3 text-[12px] disabled:opacity-50 sm:h-9"
          >
            {busy === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            type="button"
            onClick={() => download("cbz")}
            disabled={!!busy}
            aria-label="Download CBZ"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-subtle bg-surface px-3 text-[12px] disabled:opacity-50 sm:h-9"
          >
            {busy === "cbz" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileArchive className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">CBZ</span>
          </button>
          <Link
            href="/history"
            aria-label="History"
            className="hidden h-9 items-center gap-1.5 rounded-full border border-subtle bg-surface px-3 text-[12px] sm:inline-flex"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            History
          </Link>
          <Link
            href="/new"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-3 font-[family-name:var(--font-display)] text-[13px] tracking-wider text-accent-ink sm:h-9"
          >
            <span className="hidden sm:inline">New comic</span>
            <span className="sm:hidden">New</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
      {err && (
        <div className="w-full rounded-lg border border-red-500/30 bg-red-500/[0.06] px-3 py-2 text-[11.5px] text-red-200">
          Download failed: {err}
        </div>
      )}
    </div>
  );
}

function PageLightbox({
  panel,
  onClose,
  onPrev,
  onNext,
  index,
  total,
}: {
  panel: ReadyPanel;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  index: number;
  total: number;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" && onNext) onNext();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPrev, onNext]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Page ${index} of ${total}`}
      className="fixed inset-0 z-[80] flex flex-col bg-black/95 backdrop-blur"
      style={{ paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 py-3 text-[12px] text-white/75" onClick={(e) => e.stopPropagation()}>
        <span className="font-mono">{index} / {total}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/85 active:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="relative flex-1 overflow-auto native-scroll" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={panel.imageUrl}
          alt={`Page ${index}`}
          className="mx-auto h-full max-h-full w-auto max-w-full object-contain"
          draggable={false}
          onClick={onClose}
        />
      </div>
      <div
        className="flex items-center justify-between gap-2 px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onPrev}
          disabled={!onPrev}
          aria-label="Previous page"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/85 disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-[12px] text-white/60">Tap image or press Esc to close</span>
        <button
          type="button"
          onClick={onNext}
          disabled={!onNext}
          aria-label="Next page"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/85 disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
