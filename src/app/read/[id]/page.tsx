"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  FileArchive,
  FileText,
  Loader2,
  Share2,
} from "lucide-react";
import { Shell } from "@/components/Shell";
import { ComicReader, type ReaderPanel } from "@/components/ComicReader";
import { exportCbz, exportPdf } from "@/lib/export";
import { encodeShare } from "@/lib/share";
import { useStudio } from "@/lib/state";
import { STYLES } from "@/lib/styles";
import type { ComicProject } from "@/lib/types";

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

  const panels: ReaderPanel[] = useMemo(
    () =>
      (project?.panels ?? [])
        .filter((p) => p.imageUrl)
        .map((p) => ({ index: p.index, imageUrl: p.imageUrl as string })),
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

  return (
    <div className="mt-4 sm:mt-6">
      <TopBar project={project} panels={panels} />
      <ComicReader panels={panels} aspect={brief.aspect} />
    </div>
  );
}

function TopBar({ project, panels }: { project: ComicProject; panels: ReaderPanel[] }) {
  const [busy, setBusy] = useState<null | "pdf" | "cbz" | "share">(null);
  const [err, setErr] = useState<string | null>(null);
  const [shared, setShared] = useState(false);

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

  async function share() {
    setBusy("share");
    setErr(null);
    try {
      const style = STYLES.find((s) => s.id === project.brief.styleId);
      const title = style ? `${style.name} · ${project.brief.panelCount} pages` : "Comic";
      const token = await encodeShare({
        title,
        aspect: project.brief.aspect,
        panelUrls: panels.map((p) => p.imageUrl),
      });
      const url = `${window.location.origin}/s/${token}`;
      let copied = false;
      const canShare =
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function"
          ? navigator.canShare({ title, url })
          : typeof navigator !== "undefined" && typeof navigator.share === "function";
      if (canShare) {
        try {
          await navigator.share({ title, url });
          copied = true;
        } catch {
          // user cancelled — fall through to copy
        }
      }
      if (!copied) {
        await navigator.clipboard.writeText(url);
      }
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  const panelCount = panels.length;

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
            onClick={share}
            disabled={!!busy}
            aria-label="Share"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-subtle bg-surface px-3 text-[12px] disabled:opacity-50 sm:h-9"
          >
            {busy === "share" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : shared ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Share2 className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">{shared ? "Copied" : "Share"}</span>
          </button>
          <button
            type="button"
            onClick={() => download("pdf")}
            disabled={!!busy}
            aria-label="Download PDF"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-subtle bg-surface px-3 text-[12px] disabled:opacity-50 sm:h-9"
          >
            {busy === "pdf" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            type="button"
            onClick={() => download("cbz")}
            disabled={!!busy}
            aria-label="Download CBZ"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-subtle bg-surface px-3 text-[12px] disabled:opacity-50 sm:h-9"
          >
            {busy === "cbz" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileArchive className="h-3.5 w-3.5" />
            )}
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
          {err}
        </div>
      )}
    </div>
  );
}
