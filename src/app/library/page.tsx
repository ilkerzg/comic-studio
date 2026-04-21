"use client";

import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";
import { Shell } from "@/components/Shell";
import { useStudio } from "@/lib/state";
import { STYLES } from "@/lib/styles";

export default function LibraryPage() {
  const projects = useStudio((s) => s.projects);
  return (
    <Shell>
      <div className="mt-10 flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-[32px] tracking-wider">
          LIBRARY
        </h1>
        <Link
          href="/new"
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 font-[family-name:var(--font-display)] text-[14px] tracking-wider text-accent-ink"
        >
          <Sparkles className="h-4 w-4" />
          New comic
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-subtle bg-surface p-10 text-center">
          <BookOpen className="mx-auto h-6 w-6 text-foreground/50" />
          <div className="mt-3 text-[13.5px] text-foreground/70">
            No comics yet. Your finished books land here.
          </div>
          <Link
            href="/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-subtle bg-surface-2 px-4 py-2 text-[12.5px]"
          >
            Start one
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const cover = p.panels.find((x) => x.imageUrl)?.imageUrl;
            const style = STYLES.find((s) => s.id === p.brief.styleId);
            const done = p.panels.filter((x) => x.status === "done").length;
            return (
              <Link
                key={p.id}
                href={done > 0 ? `/read/${p.id}` : `/studio/${p.id}`}
                className="group overflow-hidden rounded-xl border border-subtle bg-surface transition hover:border-white/20"
              >
                <div className="relative aspect-[4/5] w-full bg-surface-2">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt={`Cover ${p.id}`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center font-[family-name:var(--font-display)] text-[32px] tracking-wider text-foreground/25">
                      COMIC
                    </div>
                  )}
                </div>
                <div className="border-t border-subtle p-3">
                  <div className="font-[family-name:var(--font-display)] text-[14px] tracking-wider">
                    {(style?.name ?? "Comic").toUpperCase()} · {p.brief.panelCount} panels
                  </div>
                  <div className="mt-1 line-clamp-2 text-[11.5px] text-foreground/60">
                    {p.brief.story || "No brief"}
                  </div>
                  <div className="mt-2 text-[11px] text-foreground/45">
                    {done}/{p.panels.length} rendered · {new Date(p.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
