"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, ArrowRight, BookOpen, Loader2, Sparkles } from "lucide-react";
import { Shell } from "@/components/Shell";
import { ComicReader, type ReaderPanel } from "@/components/ComicReader";
import { decodeShare, type DecodedShare } from "@/lib/share";

export default function SharePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [share, setShare] = useState<DecodedShare | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const decoded = await decodeShare(token);
        if (!cancelled) setShare(decoded);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return (
      <Shell className="pb-4">
        <div className="mt-16 rounded-2xl border border-subtle bg-surface p-8 text-center">
          <div className="text-[13px] text-foreground/70">Invalid share link.</div>
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell className="pb-4">
        <div className="mt-12 flex flex-col items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-8 text-center sm:mt-16">
          <AlertTriangle className="h-5 w-5 text-red-300" />
          <div className="text-[13px] text-red-200">Could not open this share link.</div>
          <div className="max-w-md font-mono text-[11px] text-red-200/70">{error}</div>
          <Link
            href="/new"
            className="mt-2 inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 font-[family-name:var(--font-display)] text-[13px] tracking-wider text-accent-ink"
          >
            <Sparkles className="h-4 w-4" />
            Start your own
          </Link>
        </div>
      </Shell>
    );
  }

  if (!share) {
    return (
      <Shell className="pb-4">
        <div className="mt-16 flex items-center justify-center gap-2 text-[13px] text-foreground/60">
          <Loader2 className="h-4 w-4 animate-spin" />
          Unpacking book...
        </div>
      </Shell>
    );
  }

  const panels: ReaderPanel[] = share.panelUrls.map((url, i) => ({
    index: i + 1,
    imageUrl: url,
  }));

  if (panels.length === 0) {
    return (
      <Shell className="pb-4">
        <div className="mt-16 rounded-2xl border border-subtle bg-surface p-8 text-center">
          <div className="text-[13px] text-foreground/70">This share has no pages.</div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell className="pb-4">
      <div className="mt-4 sm:mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-foreground/55">
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              Shared · {panels.length} pages
              {share.title ? ` · ${share.title}` : ""}
            </span>
          </div>
          <Link
            href="/new"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-3 font-[family-name:var(--font-display)] text-[13px] tracking-wider text-accent-ink sm:h-9"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Make your own</span>
            <span className="sm:hidden">Make</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <ComicReader panels={panels} aspect={share.aspect} />
      </div>
    </Shell>
  );
}
