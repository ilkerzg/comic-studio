"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BookOpen, History, Home, Key, Sparkles } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { href: "/new", label: "New", icon: Sparkles, match: (p: string) => p.startsWith("/new") || p.startsWith("/studio") },
  { href: "/library", label: "Library", icon: BookOpen, match: (p: string) => p.startsWith("/library") },
  { href: "/history", label: "History", icon: History, match: (p: string) => p.startsWith("/history") || p.startsWith("/read") },
  { href: "/settings", label: "Key", icon: Key, match: (p: string) => p.startsWith("/settings") },
] as const;

export function Shell({ children, className }: { children: React.ReactNode; className?: string }) {
  const pathname = usePathname() ?? "/";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-subtle bg-background/85 backdrop-blur safe-top">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground font-[family-name:var(--font-display)] text-[18px] font-bold tracking-wider text-background">
              CS
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-[family-name:var(--font-display)] text-[15px] tracking-[0.02em] text-foreground sm:text-[17px]">
                COMIC STUDIO
              </span>
              <span className="hidden text-[10.5px] uppercase tracking-[0.16em] text-foreground/55 sm:inline">
                ai-directed comics on fal
              </span>
            </span>
          </Link>
          {/* Desktop nav */}
          <nav className="hidden items-center gap-1.5 md:flex">
            {NAV_ITEMS.filter((i) => i.href !== "/").map((item) => {
              const active = item.match(pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition",
                    active
                      ? "border border-subtle bg-surface text-foreground"
                      : "text-foreground/60 hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label === "New" ? "New comic" : item.label}
                </Link>
              );
            })}
          </nav>
          {/* Mobile header action */}
          <Link
            href="/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-3 font-[family-name:var(--font-display)] text-[12.5px] tracking-wider text-accent-ink md:hidden"
          >
            <Sparkles className="h-3.5 w-3.5" />
            New
          </Link>
        </div>
      </header>

      <main className={cn("mx-auto max-w-6xl px-4 pb-mobile-nav", className)}>{children}</main>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-subtle bg-background/85 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "var(--safe-bottom)" }}
      >
        <ul className="mx-auto flex max-w-6xl items-stretch justify-around px-1">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 px-1 text-[10.5px] font-medium tracking-wide transition",
                    active ? "text-accent" : "text-foreground/60",
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_8px_oklch(0.75_0.2_35/0.6)]")} />
                  <span className="leading-none">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
