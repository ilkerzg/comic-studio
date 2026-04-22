export type CharacterRole = "protagonist" | "antagonist" | "ally" | "side";

export type CharacterDraft = {
  id: string;
  name: string;
  role: CharacterRole;
  description: string;
  sourcePhotoUrl: string | null;
  sheetUrl: string | null;
  sheetStatus: "idle" | "generating" | "ready" | "failed";
  sheetError?: string;
};

export type AspectChoice = "portrait" | "landscape" | "square";

export type FormatChoice = "manga" | "comic" | "webtoon";

export type Brief = {
  styleId: string;
  format: FormatChoice;
  aspect: AspectChoice;
  characters: CharacterDraft[];
  story: string;
  tone: string;
  language: string;
  panelCount: number;
};

export type PanelDialog = { speaker?: string; text: string };

export type SubPanel = {
  position: string;
  composition: string;
  action: string;
  dialog: PanelDialog[];
  sfx?: string;
};

export type PanelBeat = {
  index: number;
  title: string;
  layout: string;
  subPanels: SubPanel[];
  imageRefs: string[];
  prompt: string;
};

export type PanelState = {
  index: number;
  status: "pending" | "rendering" | "done" | "failed";
  beat?: PanelBeat;
  imageUrl?: string;
  error?: string;
  requestId?: string;
  endpoint?: string;
  startedAt?: number;
  finishedAt?: number;
};

export type ProjectPhase = "idle" | "outlining" | "rendering" | "done" | "error";

export type ComicProject = {
  id: string;
  createdAt: number;
  brief: Brief;
  panels: PanelState[];
  status: "draft" | "outlining" | "rendering" | "complete" | "error";
  autoStart?: boolean;
  phase?: ProjectPhase;
  phaseError?: string;
  startedAt?: number;
  updatedAt?: number;
};
