import Link from "next/link";
import { BookOpen, History, Sparkles } from "lucide-react";
import { Shell } from "@/components/Shell";
import { LIBRARY_EXAMPLES } from "@/lib/library-examples";

export default function LibraryPage() {
  return (
    <Shell>
      <div className="mt-10 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-[32px] tracking-wider">
            LIBRARY
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] text-foreground/65">
            Built-in reference shelf from the repo. Public inspiration lives here; your own generations live in History.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/history"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-subtle bg-surface px-4 text-[12.5px]"
          >
            <History className="h-4 w-4" />
            History
          </Link>
          <Link
            href="/new"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 font-[family-name:var(--font-display)] text-[14px] tracking-wider text-accent-ink"
          >
            <Sparkles className="h-4 w-4" />
            New comic
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LIBRARY_EXAMPLES.map((entry) => (
          <div
            key={entry.id}
            className="group overflow-hidden rounded-xl border border-subtle bg-surface"
          >
            <div className="relative aspect-[4/5] w-full bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={entry.cover} alt={entry.title} className="h-full w-full object-cover" />
            </div>
            <div className="border-t border-subtle p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="font-[family-name:var(--font-display)] text-[14px] tracking-wider">
                  {entry.title.toUpperCase()}
                </div>
                <span className="text-[10.5px] uppercase tracking-[0.14em] text-foreground/45">
                  {entry.format}
                </span>
              </div>
              <div className="mt-1 text-[11.5px] text-foreground/60">{entry.blurb}</div>
              <div className="mt-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-foreground/45">
                  <BookOpen className="h-3.5 w-3.5" />
                  {entry.note}
                </span>
                <Link
                  href="/new"
                  className="inline-flex h-8 items-center rounded-full border border-subtle bg-surface-2 px-3 text-[11.5px] hover:border-white/20"
                >
                  Use as reference
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
