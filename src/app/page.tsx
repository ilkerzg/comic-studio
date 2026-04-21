"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Users, Wand2 } from "lucide-react";
import { Shell } from "@/components/Shell";
import { STYLES } from "@/lib/styles";

export default function LandingPage() {
  return (
    <Shell>
      <section className="relative mt-14 overflow-hidden rounded-3xl border border-subtle bg-surface p-8 sm:p-12">
        <div className="halftone absolute inset-0 opacity-30" aria-hidden />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-[family-name:var(--font-display)] text-[11.5px] uppercase tracking-[0.16em] text-accent">
            Comic Studio
          </span>
          <h1 className="mt-5 max-w-3xl font-[family-name:var(--font-display)] text-[52px] leading-[0.92] tracking-[0.01em] text-foreground sm:text-[72px]">
            Direct a whole comic in one brief.
          </h1>
          <p className="mt-5 max-w-[640px] text-[15.5px] leading-relaxed text-foreground/70">
            Pick a style. Cast one to four characters. Write the story. An agent drafts the
            storyboard, fires off every panel on <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[13px]">openai/gpt-image-2</code>, and
            stitches a readable book on the other side.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/new"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 font-[family-name:var(--font-display)] text-[15px] tracking-wider text-accent-ink transition hover:brightness-110"
            >
              Start a comic
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/library"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-subtle bg-surface-2 px-5 text-[13px] font-medium text-foreground/85 hover:border-white/20"
            >
              <BookOpen className="h-4 w-4" />
              Open the library
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-[family-name:var(--font-display)] text-[26px] tracking-wider text-foreground">
          HOW IT WORKS
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: Wand2,
              title: "Pick a style",
              body: "Shonen ink, Franco-Belgian clear line, Moebius sci-fi, Western superhero, chibi, more.",
            },
            {
              icon: Users,
              title: "Cast the story",
              body: "Name one to four characters. Upload a photo per character if you want the resemblance locked in.",
            },
            {
              icon: BookOpen,
              title: "Read it",
              body: "Agent writes the storyboard, renders every panel, opens a flipbook on the other side.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-subtle bg-surface p-5"
            >
              <Icon className="h-5 w-5 text-accent" />
              <div className="mt-3 text-[14px] font-semibold text-foreground">{title}</div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground/65">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="flex items-end justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-[26px] tracking-wider text-foreground">
            STYLE CARDS
          </h2>
          <span className="text-[12px] text-foreground/50">{STYLES.length} styles, more coming</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STYLES.map((s) => (
            <div
              key={s.id}
              className="group flex flex-col overflow-hidden rounded-xl border border-subtle bg-surface"
            >
              <div className="relative aspect-[4/5] w-full bg-surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.reference}
                  alt={`${s.name} reference`}
                  className="absolute inset-0 h-full w-full object-cover opacity-95 transition group-hover:opacity-100"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/65 to-transparent" />
              </div>
              <div className="border-t border-subtle p-3">
                <div className="font-[family-name:var(--font-display)] text-[15px] tracking-wider text-foreground">
                  {s.name.toUpperCase()}
                </div>
                <div className="mt-1 text-[11.5px] leading-snug text-foreground/60">
                  {s.tagline}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}
