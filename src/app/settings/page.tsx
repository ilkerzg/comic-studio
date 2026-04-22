"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, Key, Trash2 } from "lucide-react";
import { Shell } from "@/components/Shell";
import { looksLikeFalKey, useFalKey } from "@/lib/fal-key";

export default function SettingsPage() {
  const { key, setKey, hasKey, loaded } = useFalKey();
  const [draft, setDraft] = useState("");
  const [visible, setVisible] = useState(false);
  const [saved, setSaved] = useState(false);

  function save() {
    if (!looksLikeFalKey(draft)) return;
    setKey(draft.trim());
    setDraft("");
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  }

  const masked = key
    ? `${key.slice(0, 10)}${"•".repeat(Math.max(0, key.length - 14))}${key.slice(-4)}`
    : "";

  return (
    <Shell>
      <section className="mx-auto mt-5 max-w-3xl sm:mt-10">
        <h1 className="font-[family-name:var(--font-display)] text-[28px] tracking-wider sm:text-[32px]">
          KEY & ACCOUNT
        </h1>
        <p className="mt-2 text-[13.5px] text-foreground/65">
          Comic Studio calls fal.ai directly from your browser with your own key. Nothing routes
          through our servers.
        </p>

        <div className="mt-6 rounded-2xl border border-subtle bg-surface/70 p-5">
          <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
            <Key className="h-4 w-4" />
            fal API key
          </div>

          {loaded && hasKey && (
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-subtle bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-[12.5px] font-medium">Saved to this browser</div>
                <div className="mt-0.5 truncate font-mono text-[11.5px] text-foreground/55">{masked}</div>
              </div>
              <button
                type="button"
                onClick={() => setKey("")}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-subtle bg-transparent px-3 text-[12px] text-foreground/70 hover:border-red-500/40 hover:text-red-300 sm:h-8"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <input
                type={visible ? "text" : "password"}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="12345678-90ab-cdef-1234-567890abcdef:abcd1234..."
                className="h-11 w-full rounded-lg border border-white/[0.1] bg-white/[0.02] pl-3 pr-11 font-mono text-[13px] placeholder:text-foreground/30 focus:border-white/[0.2] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-foreground/60 hover:bg-white/[0.05]"
              >
                {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button
              type="button"
              onClick={save}
              disabled={!looksLikeFalKey(draft)}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-foreground px-5 text-[13px] font-medium text-background disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saved ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved
                </>
              ) : (
                "Save key"
              )}
            </button>
          </div>

          <p className="mt-3 text-[11.5px] text-foreground/55">
            Get or rotate a key at{" "}
            <a
              className="underline underline-offset-2 hover:text-foreground"
              href="https://fal.ai/dashboard/keys"
              target="_blank"
              rel="noreferrer"
            >
              fal.ai/dashboard/keys
            </a>
            .
          </p>
        </div>
      </section>
    </Shell>
  );
}
