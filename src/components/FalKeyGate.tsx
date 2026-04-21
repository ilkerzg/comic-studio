"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Key } from "lucide-react";
import { looksLikeFalKey, useFalKey } from "@/lib/fal-key";

export function FalKeyGate({ children }: { children: React.ReactNode }) {
  const { key, setKey, hasKey, loaded } = useFalKey();
  const [draft, setDraft] = useState("");
  const [visible, setVisible] = useState(false);

  if (!loaded) return null;
  if (hasKey) return <>{children}</>;

  return (
    <div className="mt-10 rounded-2xl border border-subtle bg-surface/70 p-5 sm:p-6">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
        <Key className="h-4 w-4" />
        Paste your fal API key
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-foreground/65">
        Everything runs from the browser with your own fal credentials. Keys stay in localStorage
        and are sent only to fal endpoints. Grab one at{" "}
        <a
          href="https://fal.ai/dashboard/keys"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          fal.ai/dashboard/keys
        </a>
        .
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <input
            type={visible ? "text" : "password"}
            autoComplete="off"
            spellCheck={false}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="12345678-90ab-cdef-1234-567890abcdef:abcd1234..."
            className="h-11 w-full rounded-lg border border-white/[0.1] bg-white/[0.02] pl-3 pr-11 font-mono text-[13px] text-foreground placeholder:text-foreground/30 focus:border-white/[0.2] focus:outline-none"
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
          onClick={() => {
            if (looksLikeFalKey(draft)) setKey(draft.trim());
          }}
          disabled={!looksLikeFalKey(draft)}
          className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-[13px] font-medium text-background transition hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save key
        </button>
      </div>
      <p className="mt-3 text-[11.5px] text-foreground/55">
        Looking for the format? Paste the single string fal shows on the dashboard. Manage it later
        at <Link href="/settings" className="underline underline-offset-2">/settings</Link>.
      </p>
    </div>
  );
}

export function useRequireFalKey() {
  const { key, hasKey, loaded } = useFalKey();
  return { key, hasKey, loaded };
}
