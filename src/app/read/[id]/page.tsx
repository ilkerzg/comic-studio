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

const LENS_SIZE = 220;
const LENS_ZOOM = 2.4;

const BookPage = forwardRef<HTMLDivElement, { panel: ReadyPanel }>(function BookPage(
  { panel },
  ref,
) {
  const [lens, setLens] = useState<{ x: number; y: number; w: number; h: number } | null>(
    null,
  );

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setLens({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      w: rect.width,
      h: rect.height,
    });
  }

  return (
    <div
      ref={ref}
      className="group relative h-full w-full overflow-hidden bg-black"
      onMouseMove={onMouseMove}
      onMouseLeave={() => setLens(null)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={panel.imageUrl}
        alt={`Page ${panel.index}`}
        className="h-full w-full object-contain"
        draggable={false}
      />
      {lens && (
        <div
          className="pointer-events-none absolute rounded-full border border-white/40 shadow-[0_10px_30px_rgba(0,0,0,0.55)] ring-1 ring-black/30"
          style={{
            left: lens.x - LENS_SIZE / 2,
            top: lens.y - LENS_SIZE / 2,
            width: LENS_SIZE,
            height: LENS_SIZE,
            backgroundImage: `url(${panel.imageUrl})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${lens.w * LENS_ZOOM}px ${lens.h * LENS_ZOOM}px`,
            backgroundPosition: `${-(lens.x * LENS_ZOOM - LENS_SIZE / 2)}px ${-(lens.y * LENS_ZOOM - LENS_SIZE / 2)}px`,
          }}
        />
      )}
    </div>
  );
});

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
      if (e.key === "ArrowRight") flipNext();
      if (e.key === "ArrowLeft") flipPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipNext, flipPrev]);

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
            disableFlipByClick={false}
            startPage={0}
            className="mx-auto"
            style={{}}
            onFlip={(e: { data: number }) => setPage(e.data)}
          >
            {panels.map((p) => (
              <BookPage key={p.index} panel={p} />
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
        <span>Use ← and → or drag the page corner to turn</span>
      </div>

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
