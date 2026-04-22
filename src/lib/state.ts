"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Brief, CharacterDraft, ComicProject, PanelState, ProjectPhase } from "./types";
import { uid } from "./utils";

type StudioState = {
  brief: Brief;
  projects: ComicProject[];
  setStyle: (styleId: string) => void;
  setFormat: (format: Brief["format"]) => void;
  setAspect: (aspect: Brief["aspect"]) => void;
  addCharacter: () => void;
  removeCharacter: (id: string) => void;
  updateCharacter: (id: string, patch: Partial<CharacterDraft>) => void;
  setStory: (story: string) => void;
  setTone: (tone: string) => void;
  setLanguage: (lang: string) => void;
  setPanelCount: (n: number) => void;
  reset: () => void;
  registerProject: (project: ComicProject) => void;
  updatePanels: (projectId: string, patch: PanelState[]) => void;
  patchPanel: (projectId: string, index: number, patch: Partial<PanelState>) => void;
  setProjectPhase: (projectId: string, phase: ProjectPhase, phaseError?: string | null) => void;
  consumeAutoStart: (projectId: string) => boolean;
  getProject: (projectId: string) => ComicProject | undefined;
};

function emptyBrief(): Brief {
  return {
    styleId: "",
    format: "manga",
    aspect: "portrait",
    characters: [emptyCharacter("Protagonist", "protagonist")],
    story: "",
    tone: "",
    language: "English",
    panelCount: 12,
  };
}

function emptyCharacter(name: string, role: CharacterDraft["role"]): CharacterDraft {
  return {
    id: uid("char"),
    name,
    role,
    description: "",
    sourcePhotoUrl: null,
    sheetUrl: null,
    sheetStatus: "idle",
  };
}

export const useStudio = create<StudioState>()(
  persist(
    (set, get) => ({
      brief: emptyBrief(),
      projects: [],
      setStyle: (styleId) => set((s) => ({ brief: { ...s.brief, styleId } })),
      setFormat: (format) => set((s) => ({ brief: { ...s.brief, format } })),
      setAspect: (aspect) => set((s) => ({ brief: { ...s.brief, aspect } })),
      addCharacter: () =>
        set((s) => ({
          brief: {
            ...s.brief,
            characters: [...s.brief.characters, emptyCharacter("New character", "ally")],
          },
        })),
      removeCharacter: (id) =>
        set((s) => ({
          brief: { ...s.brief, characters: s.brief.characters.filter((c) => c.id !== id) },
        })),
      updateCharacter: (id, patch) =>
        set((s) => ({
          brief: {
            ...s.brief,
            characters: s.brief.characters.map((c) => (c.id === id ? { ...c, ...patch } : c)),
          },
        })),
      setStory: (story) => set((s) => ({ brief: { ...s.brief, story } })),
      setTone: (tone) => set((s) => ({ brief: { ...s.brief, tone } })),
      setLanguage: (language) => set((s) => ({ brief: { ...s.brief, language } })),
      setPanelCount: (panelCount) =>
        set((s) => ({ brief: { ...s.brief, panelCount: Math.max(2, Math.min(50, panelCount)) } })),
      reset: () => set({ brief: emptyBrief() }),
      registerProject: (project) =>
        set((s) => ({ projects: [project, ...s.projects].slice(0, 10) })),
      updatePanels: (projectId, patch) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, panels: patch, updatedAt: Date.now() } : p,
          ),
        })),
      patchPanel: (projectId, index, patch) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  updatedAt: Date.now(),
                  panels: p.panels.map((pn) =>
                    pn.index === index ? { ...pn, ...patch } : pn,
                  ),
                }
              : p,
          ),
        })),
      setProjectPhase: (projectId, phase, phaseError) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  phase,
                  phaseError: phaseError ?? undefined,
                  updatedAt: Date.now(),
                  ...(phase === "rendering" && !p.startedAt ? { startedAt: Date.now() } : {}),
                }
              : p,
          ),
        })),
      consumeAutoStart: (projectId) => {
        const current = get().projects.find((p) => p.id === projectId);
        if (!current?.autoStart) return false;
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, autoStart: false } : p,
          ),
        }));
        return true;
      },
      getProject: (projectId) => get().projects.find((p) => p.id === projectId),
    }),
    { name: "comic-studio-state", version: 2 },
  ),
);
