"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Plus, Trash2, Upload, Users, Wand2 } from "lucide-react";
import { Shell } from "@/components/Shell";
import { FalKeyGate } from "@/components/FalKeyGate";
import { useFalKey } from "@/lib/fal-key";
import { uploadToFalStorage } from "@/lib/fal-browser";
import { generateCharacterPortrait } from "@/lib/pipeline";
import { useStudio } from "@/lib/state";
import { STYLES } from "@/lib/styles";
import type { CharacterDraft } from "@/lib/types";
import { cn, uid } from "@/lib/utils";

const STEPS = [
  { id: "style", label: "Style", icon: Wand2 },
  { id: "cast", label: "Cast", icon: Users },
  { id: "story", label: "Story", icon: BookOpen },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export default function NewComicPage() {
  return (
    <Shell>
      <FalKeyGate>
        <Wizard />
      </FalKeyGate>
    </Shell>
  );
}

function Wizard() {
  const { key } = useFalKey();
  const brief = useStudio((s) => s.brief);
  const registerProject = useStudio((s) => s.registerProject);
  const router = useRouter();
  const [step, setStep] = useState<StepId>("style");
  const [submitting, setSubmitting] = useState(false);

  const canProceed = useMemo(() => {
    if (step === "style") return !!brief.styleId;
    if (step === "cast") {
      return brief.characters.length > 0 && brief.characters.every((c) => c.name.trim() && c.sheetStatus === "ready");
    }
    return brief.story.trim().length >= 10 && brief.panelCount >= 2;
  }, [step, brief]);

  function next() {
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
  }

  function prev() {
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx > 0) setStep(STEPS[idx - 1].id);
  }

  async function start() {
    if (!canProceed) return;
    setSubmitting(true);
    const projectId = uid("project");
    const project = {
      id: projectId,
      createdAt: Date.now(),
      brief,
      status: "draft" as const,
      panels: Array.from({ length: brief.panelCount }, (_, i) => ({
        index: i + 1,
        status: "pending" as const,
      })),
    };
    registerProject(project);
    router.push(`/studio/${projectId}`);
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-foreground/55">
        <span>New comic</span>
        <span>·</span>
        <span>
          Step {STEPS.findIndex((s) => s.id === step) + 1} of {STEPS.length}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {STEPS.map((s, idx) => {
          const current = step === s.id;
          const done = STEPS.findIndex((x) => x.id === step) > idx;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition",
                current
                  ? "border-accent/60 bg-accent/15 text-foreground"
                  : done
                    ? "border-subtle bg-surface-2 text-foreground/80"
                    : "border-subtle bg-surface text-foreground/55",
              )}
            >
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-subtle bg-surface p-5 sm:p-7">
        {step === "style" && <StyleStep />}
        {step === "cast" && <CastStep falKey={key} />}
        {step === "story" && <StoryStep />}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={prev}
          disabled={step === STEPS[0].id}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-subtle bg-surface px-4 text-[13px] text-foreground/80 hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span>Back</span>
          <ArrowLeft className="h-4 w-4" />
        </button>
        {step === "story" ? (
          <button
            type="button"
            onClick={start}
            disabled={!canProceed || submitting}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-5 font-[family-name:var(--font-display)] text-[14px] tracking-wider text-accent-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Starting..." : "Start production"}
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            disabled={!canProceed}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-foreground px-5 text-[13px] font-medium text-background disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function StyleStep() {
  const brief = useStudio((s) => s.brief);
  const setStyle = useStudio((s) => s.setStyle);

  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.18em] text-foreground/55">Step 1</div>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-[28px] tracking-wider">
        CHOOSE THE STYLE
      </h2>
      <p className="mt-2 max-w-[560px] text-[13px] text-foreground/60">
        Style cards only set the visual system. No comic type is selected here: each style card is the
        only direction for the book.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STYLES.map((s) => {
          const selected = brief.styleId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStyle(s.id)}
              className={cn(
                "group flex flex-col overflow-hidden rounded-xl border text-left transition",
                selected
                  ? "border-accent bg-surface-2 ring-2 ring-accent/40"
                  : "border-subtle bg-surface hover:border-white/20",
              )}
            >
              <div className="relative aspect-[4/5] w-full bg-surface-2">
                <img
                  src={s.reference}
                  alt={s.name}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                  }}
                />
              </div>
              <div className="border-t border-subtle p-3">
                <div className="font-[family-name:var(--font-display)] text-[14px] tracking-wider">
                  {s.name.toUpperCase()}
                </div>
                <div className="mt-1 text-[11px] leading-snug text-foreground/60">{s.tagline}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CastStep({ falKey }: { falKey: string }) {
  const brief = useStudio((s) => s.brief);
  const addCharacter = useStudio((s) => s.addCharacter);
  const removeCharacter = useStudio((s) => s.removeCharacter);
  const updateCharacter = useStudio((s) => s.updateCharacter);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-foreground/55">Step 2</div>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-[28px] tracking-wider">
            CAST THE STORY
          </h2>
          <p className="mt-2 max-w-[560px] text-[13px] text-foreground/60">
            Add 1 to 4 characters, fill name + description, upload a reference photo if you have one,
            then generate the portrait for each character.
          </p>
        </div>
        {brief.characters.length < 4 && (
          <button
            type="button"
            onClick={addCharacter}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-subtle bg-surface-2 px-3 text-[12.5px] hover:border-white/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Add character
          </button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {brief.characters.map((c) => (
          <CharacterCard
            key={c.id}
            character={c}
            falKey={falKey}
            onChange={(patch) => updateCharacter(c.id, patch)}
            onRemove={() => removeCharacter(c.id)}
          />
        ))}
      </div>
    </div>
  );
}

function CharacterCard({
  character,
  falKey,
  onChange,
  onRemove,
}: {
  character: CharacterDraft;
  falKey: string;
  onChange: (patch: Partial<CharacterDraft>) => void;
  onRemove: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const styleId = useStudio((s) => s.brief.styleId);

  async function onFile(f: File) {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadToFalStorage(falKey, f);
      onChange({ sourcePhotoUrl: url, sheetUrl: null, sheetStatus: "idle" });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  }

  async function generatePortrait() {
    if (!character.name.trim() || !character.description.trim()) return;
    onChange({ sheetStatus: "generating", sheetError: undefined });
    try {
      const stylePrompt = STYLES.find((s) => s.id === styleId)?.promptStub ?? "";
      const res = await generateCharacterPortrait({
        falKey,
        name: character.name,
        description: character.description,
        role: character.role,
        styleStub: stylePrompt,
        photoUrl: character.sourcePhotoUrl ?? null,
      });
      onChange({ sheetUrl: res.url, sheetStatus: "ready" });
    } catch (err) {
      onChange({
        sheetStatus: "failed",
        sheetError: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return (
    <div className="rounded-xl border border-subtle bg-surface-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <input
          value={character.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Name"
          className="h-9 flex-1 rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 text-[13px] focus:border-white/[0.25] focus:outline-none"
        />
        <select
          value={character.role}
          onChange={(e) => onChange({ role: e.target.value as CharacterDraft["role"] })}
          className="h-9 rounded-lg border border-white/[0.1] bg-white/[0.03] px-2 text-[12px] focus:border-white/[0.25] focus:outline-none"
        >
          <option value="protagonist">Protagonist</option>
          <option value="antagonist">Antagonist</option>
          <option value="ally">Ally</option>
          <option value="side">Side</option>
        </select>
        <button
          type="button"
          onClick={onRemove}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-subtle text-foreground/55 hover:border-red-500/40 hover:text-red-300"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <textarea
        value={character.description}
        onChange={(e) => onChange({ description: e.target.value })}
        rows={3}
        placeholder="Visual description, personality, costume, props. Keep it concrete."
        className="mt-2 w-full resize-none rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-[13px] placeholder:text-foreground/35 focus:border-white/[0.25] focus:outline-none"
      />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="flex h-28 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/[0.15] bg-white/[0.02] text-[12px] text-foreground/65 hover:border-white/[0.3]">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
          {character.sourcePhotoUrl ? (
            <img
              src={character.sourcePhotoUrl}
              alt="Source"
              className="h-full w-full rounded-lg object-cover"
            />
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              {uploading ? "Uploading..." : "Reference photo"}
            </span>
          )}
        </label>
        <div className="relative h-28 overflow-hidden rounded-lg border border-white/[0.08] bg-black/30">
          {character.sheetUrl ? (
            <img
              src={character.sheetUrl}
              alt="Character portrait"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-[11.5px] text-foreground/55">
              <span>Character portrait</span>
              <span className="text-[10.5px] text-foreground/40">
                {character.sheetStatus === "generating" ? "Generating..." : "Not ready"}
              </span>
            </div>
          )}
        </div>
      </div>

      {error && <div className="mt-2 text-[11.5px] text-red-300">{error}</div>}
      {character.sheetError && <div className="mt-2 text-[11.5px] text-red-300">{character.sheetError}</div>}

      <div className="mt-3 flex items-center justify-between">
        <div className="text-[11px] text-foreground/50">
          {character.sheetStatus === "ready"
            ? "Portrait ready"
            : character.sheetStatus === "generating"
              ? "Generating with openai/gpt-image-2 (low)"
              : "Generate portrait to continue"}
        </div>
        <button
          type="button"
          onClick={generatePortrait}
          disabled={
            !character.name.trim() ||
            !character.description.trim() ||
            !styleId ||
            character.sheetStatus === "generating"
          }
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-subtle bg-surface px-3 text-[12px] font-medium hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {character.sheetStatus === "generating" ? "Generating..." : "Generate portrait"}
        </button>
      </div>
    </div>
  );
}

function StoryStep() {
  const brief = useStudio((s) => s.brief);
  const setStory = useStudio((s) => s.setStory);
  const setPanelCount = useStudio((s) => s.setPanelCount);

  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.18em] text-foreground/55">Step 3</div>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-[28px] tracking-wider">
        STORY & OUTPUT COUNT
      </h2>
      <p className="mt-2 max-w-[560px] text-[13px] text-foreground/60">
        Write your story prompt. Then choose how many panels to generate.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-[0.12em] text-foreground/55">Topic / Story prompt</span>
          <textarea
            value={brief.story}
            onChange={(e) => setStory(e.target.value)}
            rows={7}
            placeholder="A pickpocket in 1920s Istanbul returns a stolen pocket watch after realizing it belonged to her mentor."
            className="w-full resize-none rounded-lg border border-white/[0.1] bg-white/[0.02] p-3 text-[13.5px] leading-relaxed placeholder:text-foreground/35 focus:border-white/[0.25] focus:outline-none"
          />
        </label>

        <div className="mt-2">
          <div className="flex items-center justify-between">
            <label htmlFor="panel-count" className="text-[11px] uppercase tracking-[0.12em] text-foreground/55">
              Number of outputs (panels)
            </label>
            <div className="text-[13px] font-medium">
              {brief.panelCount} <span className="text-foreground/50">(max 50)</span>
            </div>
          </div>
          <input
            id="panel-count"
            type="range"
            min={2}
            max={50}
            step={1}
            value={brief.panelCount}
            onChange={(e) => setPanelCount(Number(e.target.value))}
            className="mt-3 w-full accent-[oklch(0.75_0.2_35)]"
          />
          <div className="mt-2 text-[11.5px] text-foreground/55">
            Every panel is rendered with <code className="rounded bg-white/[0.06] px-1 py-0.5 font-mono">openai/gpt-image-2/edit</code> using style + character references.
          </div>
        </div>
      </div>
    </div>
  );
}
