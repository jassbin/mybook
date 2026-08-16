// src/lib/agent/thrill.ts
// 爽感层（Thrill Layer）—— 与困境层并存的第二套坐标。
// 每一次选择同时携带：困境后果(价值层，已有) + 爽感增量/人格轴/风险(本模块，新增)。
// 玩家全程感到"在爽"，但每一次点击都在给人格分析器喂新数据（照见自己）。

import type { ChannelKey } from "@/lib/reader/types";

/** 爽感变量按题材换皮，但底层是同一个 0-100 正反馈数值 + 阈值名场面机制 */
export interface ThrillMeterConfig {
  /** 变量键，稳定标识 */
  key: string;
  /** 展示名，如「心动值」「推理值」「气运值」 */
  label: string;
  /** 单字符 emoji 图标 */
  icon: string;
  /** 强调色（HUD 数值条） */
  color: string;
  /** 名场面破阈线（数值越过它自动触发一次高光） */
  climaxThresholds: number[];
  /** 结算评级名，从低到高，如 ["R","SR","SSR","UR"] */
  ratingTiers: string[];
  /** 该题材的爽点定位一句话（喂给 prompt） */
  vibe: string;
}

export const THRILL_METERS: Record<string, ThrillMeterConfig> = {
  webromance: {
    key: "heart", label: "心动值", icon: "❤", color: "#E85D9B",
    climaxThresholds: [40, 70, 90],
    ratingTiers: ["心动", "怦然", "沦陷", "此生非你不可"],
    vibe: "言情爽点：被偏爱、双向奔赴、吃醋护短、颜面主动低头。选得好就让关系升温、逼近高糖名场面。",
  },
  scriptmurder: {
    key: "deduce", label: "推理值", icon: "🔍", color: "#3E7BE8",
    climaxThresholds: [40, 70, 90],
    ratingTiers: ["旁观者", "线人", "神探", "真相之主"],
    vibe: "剧本杀爽点：先人一步识破、串起线索、指认真凶、揭穿谎言的高光。选得准就逼近'神探时刻'。",
  },
  // 名著/其余频道：气运/声望，让经典也能爽，且与困境形成张力
  default: {
    key: "fortune", label: "气运值", icon: "🔥", color: "#E8913E",
    climaxThresholds: [40, 70, 90],
    ratingTiers: ["无名", "崭露", "锋芒", "一时无两"],
    vibe: "英雄爽点：一战成名、力压群雄、声望与气势节节攀升的高光时刻。选得漂亮就逼近'名场面'。",
  },
};

export function getThrillConfig(channel?: ChannelKey | null): ThrillMeterConfig {
  if (channel && THRILL_METERS[channel]) return THRILL_METERS[channel];
  return THRILL_METERS.default;
}

// ── 爽点人格轴（personaAxis）——每个选项底层绑定，用于"照见自己" ──
// 表面是"哪种更爽"，底层是"你追求哪种爽 = 你的深层需求"。
export const PERSONA_AXES = [
  "掌控型", "勇敢型", "策略型", "奉献型", "理性型", "直觉型", "社交型", "叛逆型",
] as const;
export type PersonaAxis = (typeof PERSONA_AXES)[number];

export const PERSONA_INSIGHT: Record<string, string> = {
  掌控型: "你享受的不是被给予，而是局面由你说了算——你的爽，是掌控欲被满足的爽。",
  勇敢型: "你总选最直接、最敢承担的那条路——你要的痛快，是不假掩饰地表达自己。",
  策略型: "你习惯用距离和节奏去经营局面——你相信爽是设计出来的，不是撞上的。",
  奉献型: "你一次次把自己放在后面——你的满足来自被需要，但也别忘了留一点给自己。",
  理性型: "你信证据、信推演，不轻易被情绪带走——冷静是你的武器，有时也是你的墙。",
  直觉型: "你敢赌，凭一股感觉就下判断——你活在当下的锐度里，也承担它的风险。",
  社交型: "你善于借力、结盟、读懂人心——你的强，是把别人变成自己的一部分。",
  叛逆型: "你偏要和'应该'对着干——你的爽，是打破被安排好的剧本。",
};

export type RiskLevel = "low" | "mid" | "high";

/** 本幕类型：两难抉择幕(代价) 或 爽点幕(三种爽法) */
export type ActKind = "dilemma" | "thrill";

/** 爽法策略——爽点幕里三个选项各是一种，用于区分"你偏好哪种爽" */
export const THRILL_STRATEGIES = [
  "硬刚", "智取", "被宠", "反杀", "扮猪吃虎", "一击制胜",
] as const;
export type ThrillStrategy = (typeof THRILL_STRATEGIES)[number];

export const STRATEGY_INSIGHT: Record<string, string> = {
  硬刚: "你爽在正面把话甩回去——不藏不忍，敢当场翻脸。你要的痛快，是不委屈自己。",
  智取: "你爽在用脑子四两拨千斤——不动声色就让对方下不来台。你享受的是掌控节奏。",
  被宠: "你爽在有人替你出头、把你护在身后——你渴望的是被在乎、被偏爱的安全感。",
  反杀: "你爽在忍到最后一刻的绝地翻盘——你享受把劣势一举掀桌的爆发。",
  扮猪吃虎: "你爽在藏拙之后亮出实力、看轻视你的人傻眼——你享受被低估再反转的落差。",
  一击制胜: "你爽在干净利落一招定胜负——不拖泥带水，要的是绝对的效率与锋芒。",
};

/** 单次爽感选择的记录（与困境层的 ChoiceRecord 并行累积） */
export interface ThrillRecord {
  act: number;
  delta: number;            // 本次爽感数值变化
  meterAfter: number;       // 变化后的数值
  personaAxis?: PersonaAxis;
  riskLevel?: RiskLevel;
  triggeredClimax: boolean; // 本次是否引爆名场面
}

/** 名场面双触发判定：数值破阈（自动） 或 选项自带 triggersClimax（关键选项直触） */
export function shouldTriggerClimax(
  meterBefore: number,
  meterAfter: number,
  thresholds: number[],
  optionTriggersClimax: boolean,
): boolean {
  if (optionTriggersClimax) return true;
  return thresholds.some((t) => meterBefore < t && meterAfter >= t);
}

/** 按最终数值选评级层级 */
export function pickRating(meter: number, tiers: string[]): string {
  if (meter >= 90) return tiers[tiers.length - 1];
  if (meter >= 70) return tiers[Math.min(2, tiers.length - 1)];
  if (meter >= 40) return tiers[Math.min(1, tiers.length - 1)];
  return tiers[0];
}

// ── 爽感数据 → 人格画像（照见自己层，结算用） ──
export interface ThrillProfile {
  dominantPersona?: PersonaAxis;      // 占比最高的爽点人格
  personaShare: [PersonaAxis, number][]; // 各人格轴计数（降序）
  riskAppetite: "冒险" | "稳健" | "均衡"; // 风险偏好
  peakAct?: number;                    // 单次涨幅最大的一幕 = 最吃这种刺激
  peakDelta: number;
  climaxCount: number;                 // 引爆了几个名场面
  insight: string;                     // 一句"照见自己"
}

export function buildThrillProfile(records: ThrillRecord[]): ThrillProfile {
  const counts = new Map<PersonaAxis, number>();
  let highRisk = 0, lowRisk = 0, climaxCount = 0;
  let peakAct: number | undefined; let peakDelta = 0;
  for (const r of records) {
    if (r.personaAxis) counts.set(r.personaAxis, (counts.get(r.personaAxis) ?? 0) + 1);
    if (r.riskLevel === "high") highRisk++;
    if (r.riskLevel === "low") lowRisk++;
    if (r.triggeredClimax) climaxCount++;
    if (r.delta > peakDelta) { peakDelta = r.delta; peakAct = r.act; }
  }
  const personaShare = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const dominantPersona = personaShare[0]?.[0];
  const riskAppetite: ThrillProfile["riskAppetite"] =
    highRisk > lowRisk + 1 ? "冒险" : lowRisk > highRisk + 1 ? "稳健" : "均衡";
  const base = dominantPersona
    ? (STRATEGY_INSIGHT[dominantPersona] ?? PERSONA_INSIGHT[dominantPersona] ?? "")
    : "";
  const riskLine =
    riskAppetite === "冒险" ? "而且你偏爱高风险高回报——宁可搏一把，也不要温吞的稳妥。"
    : riskAppetite === "稳健" ? "而且你偏爱稳妥的小步累积——你要的是可控的爽，不是失控的赌。"
    : "";
  const insight = base ? `${base}${riskLine}` : "";
  return { dominantPersona, personaShare, riskAppetite, peakAct, peakDelta, climaxCount, insight };
}
