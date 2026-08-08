// src/lib/agent/narrative-principles.ts
// 叙事原则表 — Agent 的「宪法」，每次生成都必须遵守

export interface TwistRule {
  id: string;
  condition: (consecutiveSelfPreserve: number, consecutiveSacrifice: number, axes: Record<string, number>, triggeredTwists: string[]) => boolean;
  instruction: string; // 触发时注入给 AI 的指令
  onceOnly: boolean;   // 是否只触发一次
}

export interface EscalationRule {
  id: string;
  condition: (axes: Record<string, number>, actNumber: number) => boolean;
  instruction: string;
}

/** 反转规则 */
export const TWIST_RULES: TwistRule[] = [
  {
    id: "self-preserve-backfire",
    condition: (sp, _, _axes, triggered) =>
      sp >= 2 && !triggered.includes("self-preserve-backfire"),
    instruction: "玩家连续选择了保全自己。本幕必须引入一个意外：他一直在保护的那个东西，正在悄悄消失或被别人拿走。不要明说，用细节暗示。",
    onceOnly: true,
  },
  {
    id: "sacrifice-exploited",
    condition: (_, sc, _axes, triggered) =>
      sc >= 2 && !triggered.includes("sacrifice-exploited"),
    instruction: "玩家连续选择了牺牲自己。本幕必须引入一个反转：他的牺牲被某人当成了理所当然，甚至被利用了。让玩家感受到付出的代价。",
    onceOnly: true,
  },
  {
    id: "dignity-turns-weapon",
    condition: (_, __, axes, triggered) =>
      (axes["尊严底线"] ?? 50) > 75 && !triggered.includes("dignity-turns-weapon"),
    instruction: "玩家非常执着于尊严。本幕引入困境：保住尊严需要伤害一个无辜的人，或者毁掉一段重要关系。让「尊严」的代价具体可见。",
    onceOnly: true,
  },
  {
    id: "loyalty-betrayal",
    condition: (_, __, axes, triggered) =>
      (axes["忠诚代价"] ?? 50) > 70 && !triggered.includes("loyalty-betrayal"),
    instruction: "玩家非常忠诚。本幕必须出现背叛：他忠诚的那个人/组织，做了一件让他彻底无法辩护的事。这不是玩家的错，但他必须面对。",
    onceOnly: true,
  },
  {
    id: "endurance-weaponized",
    condition: (_, __, axes, triggered) =>
      (axes["忍耐极限"] ?? 50) > 72 && !triggered.includes("endurance-weaponized"),
    instruction: "玩家一直在忍耐。本幕让忍耐被人看穿并利用：有人明确知道他会继续忍，所以变本加厉。让「忍耐」不再是美德，而是被人拿捏的弱点。",
    onceOnly: true,
  },
];

/** 困境升级规则 */
export const ESCALATION_RULES: EscalationRule[] = [
  {
    id: "act3-irreversible",
    condition: (_, act) => act >= 3,
    instruction: "从本幕起，至少有一个选项的代价是不可逆的——失去某人、某段关系、或某个身份。不再是「麻烦」，而是「永久失去」。",
  },
  {
    id: "act5-cascade",
    condition: (_, act) => act >= 5,
    instruction: "从本幕起，每个选择都要和之前的选择形成因果连接——提及玩家之前的某个选择带来的后续影响。让玩家感受到选择的累积重量。",
  },
  {
    id: "final-act-showdown",
    condition: (_, act) => act >= 8,
    instruction: "进入高压收尾段。本幕的困境要把故事所有未解的张力一次性逼到台面上。三个选项分别代表三种截然不同的价值排序，没有哪个是舒适的。",
  },
];

/** 铁律禁令（任何时候都不能违反） */
export const PROHIBITIONS = [
  "不能有标准答案，不能暗示某种选择更道德或更正确",
  "不能让角色做出完全脱离历史背景的行为",
  "不能在前两幕出现isTrap=true的选项",
  "点破语必须说人话，不用学术词汇，不评判对错",
  "内心独白必须赤裸真实，是这个人在那一刻真实会想的，不是道德表态",
];

/** 结局质量标准 */
export const ENDING_PRINCIPLES = [
  "结局不是惩罚也不是奖励，是选择累积的自然延伸",
  "用「照镜子」的语气，只描述他走到了哪里，不评价对错",
  "至少提及一次玩家在游戏中做的某个具体选择",
];

/** 把所有激活的原则组合成 prompt 片段 */
export function buildPrinciplesPrompt(
  axes: Record<string, number>,
  actNumber: number,
  consecutiveSelfPreserve: number,
  consecutiveSacrifice: number,
  triggeredTwists: string[]
): { instructions: string[]; newTwistIds: string[] } {
  const instructions: string[] = [];
  const newTwistIds: string[] = [];

  // 检查反转规则
  for (const rule of TWIST_RULES) {
    if (rule.condition(consecutiveSelfPreserve, consecutiveSacrifice, axes, triggeredTwists)) {
      instructions.push(`【剧情反转指令】${rule.instruction}`);
      if (rule.onceOnly) newTwistIds.push(rule.id);
    }
  }

  // 检查升级规则
  for (const rule of ESCALATION_RULES) {
    if (rule.condition(axes, actNumber)) {
      instructions.push(`【困境升级指令】${rule.instruction}`);
    }
  }

  return { instructions, newTwistIds };
}
