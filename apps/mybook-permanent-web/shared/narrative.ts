export type Locale = "zh-CN" | "en-US";
export type StoryMode = "normal" | "extreme";
export type BookChannel = "classic" | "women" | "world" | "modern";
export type BookCatalogItem = {
  id: string;
  channel: BookChannel;
  color: string;
  title: string;
  character: string;
  domain: string;
  hook: string;
  subtitle: string;
  characters: string[];
};

export type Axis = { key: string; low: string; high: string; value: number };
export type StoryMessage = { id: string; text: string; innerVoice?: string };
export type StoryChoice = {
  id: "A" | "B" | "C";
  text: string;
  revealText: string;
  axis: string;
  delta: number;
};
export type Consequence = { choiceId: "A" | "B" | "C"; text: string };
export type StoryAct = {
  number: number;
  title: string;
  sceneName: string;
  messages: StoryMessage[];
  choices: StoryChoice[];
  consequences: Consequence[];
  forceContinue: string;
};
export type StoryState = {
  bookTitle: string;
  character: string;
  locale: Locale;
  mode: StoryMode;
  actNumber: number;
  maxActs: number;
  pressureLevel: number;
  axes: Axis[];
  history: { act: number; choiceId: string; choiceText: string }[];
};
export type CharacterBrief = {
  name: string;
  tagline: string;
  dna: string[];
  domains: string[];
};
export type StorySession = { state: StoryState; character: CharacterBrief; act: StoryAct };
export type Portrait = { title: string; reflection: string; traits: string[]; closing: string };
export type Comparison = { title: string; summary: string; differences: { label: string; normal: string; extreme: string }[] };
