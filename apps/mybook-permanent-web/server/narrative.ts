import { invokeLLM, listLLMModels } from "./_core/llm";
import type { Comparison, Locale, Portrait, StoryAct, StoryChoice, StoryMode, StorySession, StoryState } from "../shared/narrative";
import { bookCatalog } from "../shared/books";

const MODEL_CACHE_MS = 10 * 60 * 1000;
let modelCache: { id: string; expiresAt: number } | null = null;

const jsonInstruction = "只输出合法 JSON，不要 Markdown、解释或代码围栏。所有数组字段必须存在。";

async function narrativeModel() {
  if (modelCache && modelCache.expiresAt > Date.now()) return modelCache.id;
  const { data } = await listLLMModels();
  const model = data.find(item => item.id === "gpt-5-mini") ?? data.find(item => item.id.startsWith("gpt-5")) ?? data[0];
  if (!model) throw new Error("没有可用的内置模型。");
  modelCache = { id: model.id, expiresAt: Date.now() + MODEL_CACHE_MS };
  return model.id;
}

async function askJson<T>(system: string, user: string): Promise<T> {
  const model = await narrativeModel();
  const result = await invokeLLM({
    model,
    messages: [{ role: "system", content: `${system}\n${jsonInstruction}` }, { role: "user", content: user }],
    maxCompletionTokens: 1800,
    tool_choice: "none",
    reasoning: { effort: "minimal" },
  });
  const content = result.choices?.[0]?.message?.content;
  const text = typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content.filter(part => part.type === "text").map(part => part.text).join("\n")
      : "";
  if (!text) {
    console.warn("[narrative] empty model response", {
      model: result.model,
      finishReason: result.choices?.[0]?.finish_reason,
      messageKeys: Object.keys(result.choices?.[0]?.message ?? {}),
    });
    throw new Error("模型未返回有效内容。");
  }
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = (fenced?.[1] ?? text).trim();
  return JSON.parse(candidate) as T;
}

const languageRule = (locale: Locale) => locale === "zh-CN" ? "所有叙事与字段值使用简体中文。" : "Write all narrative values in natural American English.";

export function normalizeChoices(items: any[]): StoryChoice[] {
  const ids: Array<"A" | "B" | "C"> = ["A", "B", "C"];
  return ids.map((id, index) => ({
    id,
    text: String(items?.[index]?.text ?? ""),
    revealText: String(items?.[index]?.revealText ?? ""),
    axis: String(items?.[index]?.axis ?? ""),
    delta: Number(items?.[index]?.delta ?? 0),
  }));
}

export function normalizeAct(raw: any, number: number, withChoices: boolean): StoryAct {
  return {
    number,
    title: String(raw.title ?? ""),
    sceneName: String(raw.sceneName ?? ""),
    messages: Array.isArray(raw.messages) ? raw.messages.slice(0, 3).map((item: any, index: number) => ({ id: String(item.id ?? index + 1), text: String(item.text ?? ""), innerVoice: item.innerVoice ? String(item.innerVoice) : undefined })) : [],
    choices: withChoices ? normalizeChoices(raw.choices) : [],
    consequences: withChoices ? ["A", "B", "C"].map((choiceId, index) => ({ choiceId: choiceId as "A" | "B" | "C", text: String(raw.consequences?.[index]?.text ?? "") })) : [],
    forceContinue: String(raw.forceContinue ?? ""),
  };
}

export async function createSession(input: { bookTitle: string; character: string; locale: Locale; mode: StoryMode }) : Promise<StorySession> {
  const catalogEntry = bookCatalog[input.locale].find(book => book.title === input.bookTitle);
  const catalogAnchor = catalogEntry
    ? `书库提示：${catalogEntry.hook}；推荐角色：${catalogEntry.character}；主题：${catalogEntry.domain}。`
    : "书库没有该书目，请谨慎将其视为用户自定义文学入口。";
  const raw = await askJson<any>(
    "你是经典文学互动叙事设计师。忠于原著已知的人物关系和时代，不复述原文，不编造确定的原著事实。",
    `${languageRule(input.locale)}\n书名：${input.bookTitle}\n角色：${input.character}\n${catalogAnchor}\n模式：${input.mode === "extreme" ? "极压，困境更紧迫但不血腥" : "普通"}\n输出 JSON：{"tagline":"","dna":["","",""],"domains":["",""],"axes":[{"key":"","low":"","high":"","value":50}],"act":{"title":"","sceneName":"","messages":[{"id":"1","text":"","innerVoice":""}],"forceContinue":""}}。axes 恰好 4 项；messages 恰好 3 项，第一人称、每项 35-65 字。`,
  );
  const state: StoryState = {
    bookTitle: input.bookTitle,
    character: input.character,
    locale: input.locale,
    mode: input.mode,
    actNumber: 1,
    maxActs: 3,
    pressureLevel: input.mode === "extreme" ? 1 : 0,
    axes: Array.isArray(raw.axes) ? raw.axes.slice(0, 4).map((axis: any) => ({ key: String(axis.key ?? ""), low: String(axis.low ?? ""), high: String(axis.high ?? ""), value: Number(axis.value ?? 50) })) : [],
    history: [],
  };
  return {
    state,
    character: { name: input.character, tagline: String(raw.tagline ?? ""), dna: Array.isArray(raw.dna) ? raw.dna.slice(0, 3).map(String) : [], domains: Array.isArray(raw.domains) ? raw.domains.slice(0, 2).map(String) : [] },
    act: normalizeAct(raw.act, 1, false),
  };
}

export async function createChoices(input: { state: StoryState; act: StoryAct }) {
  const raw = await askJson<any>(
    "你为一段既有的第一人称经典文学互动叙事设计三种互相冲突但都合理的抉择。",
    `${languageRule(input.state.locale)}\n状态：${JSON.stringify(input.state)}\n本幕正文：${JSON.stringify(input.act.messages)}\n输出 JSON：{"choices":[{"text":"","revealText":"","axis":"","delta":0}],"consequences":[{"text":""},{"text":""},{"text":""}],"forceContinue":""}。choices 恰好 3 项，依次对应 A、B、C；每项 text 12-24 字，revealText 12-28 字；consequences 恰好 3 项。`,
  );
  return normalizeAct({ ...input.act, ...raw }, input.act.number, true);
}

export function advanceState(state: StoryState, choice: StoryChoice): StoryState {
  return {
    ...state,
    actNumber: state.actNumber + 1,
    history: [...state.history, { act: state.actNumber, choiceId: choice.id, choiceText: choice.text }],
    axes: state.axes.map(axis => axis.key === choice.axis ? { ...axis, value: Math.max(0, Math.min(100, axis.value + choice.delta)) } : axis),
    pressureLevel: state.mode === "extreme" ? Math.min(3, state.pressureLevel + 1) : 0,
  };
}

export async function continueSession(input: { state: StoryState; choice: StoryChoice }) {
  const nextState = advanceState(input.state, input.choice);
  const pressure = nextState.mode === "extreme"
    ? `极压等级 ${nextState.pressureLevel}/3：${nextState.pressureLevel === 2 ? "收紧时间、关系或资源中的一项，迫使角色付出代价。" : "让时间、关系与资源同时收紧，逼近核心价值冲突，但避免血腥和羞辱。"}`
    : "普通模式：保持现实而有余地的两难。";
  const raw = await askJson<any>(
    "你继续第一人称互动文学叙事。承接玩家选择造成的情绪与关系变化，不总结说教。",
    `${languageRule(nextState.locale)}\n状态：${JSON.stringify(nextState)}\n刚做出的选择：${JSON.stringify(input.choice)}\n${pressure}\n输出 JSON：{"title":"","sceneName":"","messages":[{"id":"1","text":"","innerVoice":""}],"forceContinue":""}。messages 恰好 3 项，每项 35-65 字。${nextState.actNumber >= nextState.maxActs ? "这是收束一幕，forceContinue 要自然引向自我回望。" : "留下一个新的未解张力。"}`,
  );
  return { state: nextState, act: normalizeAct(raw, nextState.actNumber, false), complete: nextState.actNumber >= nextState.maxActs };
}

export async function createPortrait(state: StoryState): Promise<Portrait> {
  return askJson<Portrait>("你是温和、具体而不诊断人的叙事心理观察者。", `${languageRule(state.locale)}\n根据该选择轨迹生成画像：${JSON.stringify(state)}\n输出 JSON：{"title":"","reflection":"","traits":["","",""],"closing":""}。以“照见自己”为中心，不使用医学或人格障碍标签。`);
}

export async function createComparison(normal: StoryState, extreme: StoryState): Promise<Comparison> {
  return askJson<Comparison>("你比较同一人在普通困境和极压困境下的叙事选择，语气清醒而不评判。", `${languageRule(normal.locale)}\n普通：${JSON.stringify(normal)}\n极压：${JSON.stringify(extreme)}\n输出 JSON：{"title":"","summary":"","differences":[{"label":"","normal":"","extreme":""},{"label":"","normal":"","extreme":""},{"label":"","normal":"","extreme":""}]}。`);
}
