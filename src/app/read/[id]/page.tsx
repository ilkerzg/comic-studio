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

const BookPage = forwardRef<HTMLDivElement, { panel: ReadyPanel }>(function BookPage(
  { panel },
  ref,
) {
  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={panel.imageUrl}
        alt={`Page ${panel.index}`}
        className="h-full w-full object-contain"
        draggable={false}
      />
      <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/60 px-2 py-0.5 font-mono text-[10px] text-white/85 backdrop-blur">
        #{String(panel.index).padStart(2, "0")}
      </div>
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
    <div className="mt-6">
      <TopBar panelCount={total} project={project} />
      <div className="relative mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={flipPrev}
          disabled={page === 0}
          aria-label="Previous page"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-subtle bg-surface text-foreground/75 hover:border-white/20 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex-1" style={{ maxWidth: "min(96vw, 1400px)" }}>
          <HTMLFlipBook
            ref={bookRef}
            width={pageWidth}
            height={pageHeight}
            size="stretch"
            minWidth={280}
            maxWidth={900}
            minHeight={400}
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
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-subtle bg-surface text-foreground/75 hover:border-white/20 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2 text-[11.5px] text-foreground/55">
        <span>
          Page {page + 1} / {total}
        </span>
        <span>·</span>
        <span>Use ← and → or drag the page corner to turn</span>
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
