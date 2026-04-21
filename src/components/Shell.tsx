import Link from "next/link";
import { cn } from "@/lib/utils";
import { BookOpen, History, Key, Sparkles } from "lucide-react";

export function Shell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-subtle bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground font-[family-name:var(--font-display)] text-[18px] font-bold tracking-wider text-background">
              CS
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-[family-name:var(--font-display)] text-[17px] tracking-[0.02em] text-foreground">
                COMIC STUDIO
              </span>
              <span className="text-[10.5px] uppercase tracking-[0.16em] text-foreground/55">
                ai-directed comics on fal
              </span>
            </span>
          </Link>
          <nav className="flex items-center gap-1.5">
            <Link
              href="/new"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-subtle bg-surface px-3 text-[12.5px] font-medium text-foreground/80 hover:border-white/20 hover:text-foreground"
            >
              <Sparkles className="h-3.5 w-3.5" />
              New comic
            </Link>
            <Link
              href="/library"
              className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-foreground/60 hover:text-foreground"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Library
            </Link>
            <Link
              href="/history"
              className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-foreground/60 hover:text-foreground"
            >
              <History className="h-3.5 w-3.5" />
              History
            </Link>
            <Link
              href="/settings"
              className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-foreground/60 hover:text-foreground"
            >
              <Key className="h-3.5 w-3.5" />
              Key
            </Link>
          </nav>
        </div>
      </header>
      <main className={cn("mx-auto max-w-6xl px-4 pb-20", className)}>{children}</main>
    </div>
  );
}
