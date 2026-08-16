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

/**
 * 原则效力层级（宪法思想的代码化）：
 *   L1 = 宪法级红线：违反 → 产品失去存在合法性（欺诈/版权/核心命题崩塌）。永远最先注入、最高优先。
 *   L2 = 支柱级：违反 → 仍是这个产品，但核心体验残缺。
 *   L3 = 实施级：违反 → 局部粗糙，可迭代修。
 * 冲突仲裁规则：任意两条原则冲突时，低层永远为高层让步（L1 > L2 > L3）。
 */
export type PrincipleTier = "L1" | "L2" | "L3";

export interface Prohibition {
  tier: PrincipleTier;
  text: string;
}

/**
 * 铁律禁令（任何时候都不能违反）。已按效力层级标注，
 * 注入 prompt 时经 buildProhibitionsBlock() 按 L1→L2→L3 排序，红线永远排在最前。
 */
export const PROHIBITIONS: Prohibition[] = [
  // —— L1 宪法级红线 ——
  {
    tier: "L1",
    // 既定事实锁定（原则十八）：玩家已做的选择就是唯一发生过的历史，
    // 禁止用原著默认剧本回滚它（如已派魏延守街亭，则绝不能再出现马谡失街亭/斩马谡）。
    text: "玩家已做的选择就是唯一发生过的历史，绝不能被原著默认剧本推翻或覆盖；被玩家换下/否决的人物不得重新登场承担同一职责或同一结局",
  },
  { tier: "L1", text: "不能有标准答案，不能暗示某种选择更道德或更正确" },
  { tier: "L1", text: "只能围绕原著真实的人物/关键情节，绝不编造原著没有的重大情节或结局" },
  {
    tier: "L1",
    // 原则九·产品灵魂：每幕困境必须把古代处境翻译成当代结构性焦虑，不得只是古装复述。
    text: "本幕困境必须显式映射到一个当代人熟悉的结构性焦虑（socialTag 与 modernTension 都不得为空、不得只是古代处境的复述）——古人的两难要能被今天的读者对号入座，否则产品退化成古装换皮",
  },
  {
    tier: "L1",
    // 原则十二·好玩之所在：三个选项是同一困境的三种价值排序解法，等权、都疼、无标准答案。
    text: "三个选项必须是同一个核心困境的三种价值排序解法（保全/折中/最重代价），势均力敌、都难受、没有明显正确答案；不得让某一项明显更优、更安全或更划算，否则玩家会挑最划算的那条，抉择沦为策略博弈、测不出真实价值",
  },
  // —— L2 支柱级 ——
  { tier: "L2", text: "不能让角色做出完全脱离历史背景的行为" },
  { tier: "L2", text: "内心独白必须赤裸真实，是这个人在那一刻真实会想的，不是道德表态" },
  // —— L3 实施级 ——
  { tier: "L3", text: "不能在前两幕出现isTrap=true的选项" },
  { tier: "L3", text: "点破语必须说人话，不用学术词汇，不评判对错" },
];

const TIER_ORDER: Record<PrincipleTier, number> = { L1: 0, L2: 1, L3: 2 };

/**
 * 把禁令按效力层级（L1→L2→L3）排序、拼成可注入 prompt 的一段文字。
 * 宪法级红线永远排在最前，确保 AI 最先、最重地看到不可违背的约束。
 */
export function buildProhibitionsBlock(intensifyMode = false): string {
  const sorted = [...PROHIBITIONS].sort(
    (a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]
  );
  const lines = sorted.map((p) => {
    // 极限模式=平行推演：把「绝不编造原著没有的结局」这条软化为「可改写结局，但需因果自洽+代价」，
    // 避免它作为 L1 红线压死受控架空。其余红线（尤其玩家选择不可翻、当代映射、三选项等权）全部保留。
    if (intensifyMode && p.text.startsWith("只能围绕原著真实的人物/关键情节")) {
      return "只能围绕原著真实的人物出场，不得凭空发明原著没有的重要人物；但本局是平行推演，原著的默认结局可以被改写——前提是改写由玩家已做的选择+前文伏笔合理推导、并付出匹配的永久代价，禁止无铺垫的奇迹";
    }
    return p.text;
  });
  const numbered = sorted.map((p, i) => `${i + 1}. 【${p.tier}】${lines[i]}`);
  return `【铁律禁令·按效力层级排序（L1宪法红线最优先，冲突时低层为高层让步）】\n${numbered.join("\n")}`;
}

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
