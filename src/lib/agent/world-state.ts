// src/lib/agent/world-state.ts
// 世界状态表 — 每局游戏一份，追踪玩家的价值观演进和叙事张力

export interface ChoiceRecord {
  act: number;
  choiceId: string;       // "A" | "B" | "C"
  choiceText: string;     // 玩家选的内容
  /** 本幕对应的原著知名桥段名（如「空城计」），一眼认出经历了什么 */
  sceneName?: string;
  revealText: string;     // 点破语
  socialTag: string;
  consequenceText: string; // 后果摘要
  /** 本幕困境的结构性张力——这个处境在今天可以被命名的底层问题 */
  modernTension?: string;
}

export interface WorldState {
  // 基础信息
  book: string;
  character: string;
  characterTagline: string;

  // 叙事进度
  actNumber: number;          // 当前第几幕（从1开始）
  storyPhase: "起" | "承" | "转" | "合" | "尾声";
  maxActs: number;            // 动态决定，8-12幕

  // 价值观分值（四轴，0-100，初始50）
  axes: {
    key: string;
    low: string;
    high: string;
    description: string;
    score: number;
  }[];

  // 叙事记忆
  choiceHistory: ChoiceRecord[];

  // 未解决的叙事张力（伏笔）
  pendingTensions: string[];

  // 当前情绪基调
  emotionalTone: "平静" | "压抑" | "紧张" | "绝望" | "愤怒" | "悲凉" | "释然";

  // 已触发的反转事件
  triggeredTwists: string[];

  // 陷阱相关
  trapTriggeredInActs: number[];

  // 叙事锚点：具体场景细节（地点、人名、道具），保持跨幕连贯
  narrativeAnchors: string[];

  // 连续选择追踪（用于触发反转规则）
  consecutiveSelfPreserve: number;  // 连续选「保全自己」次数
  consecutiveSacrifice: number;     // 连续选「牺牲自己」次数
}

export function createWorldState(
  book: string,
  character: string,
  characterTagline: string,
  axes: { key: string; low: string; high: string; description: string }[]
): WorldState {
  return {
    book,
    character,
    characterTagline,
    actNumber: 1,
    storyPhase: "起",
    maxActs: 10,
    axes: axes.map(a => ({ ...a, score: 50 })),
    choiceHistory: [],
    pendingTensions: [],
    emotionalTone: "平静",
    triggeredTwists: [],
    trapTriggeredInActs: [],
    narrativeAnchors: [],
    consecutiveSelfPreserve: 0,
    consecutiveSacrifice: 0,
  };
}

/** 应用一次选择，更新分值和计数器 */
export function applyChoice(
  state: WorldState,
  record: ChoiceRecord,
  scoreDelta: Record<string, number>,
  isSelfPreserve: boolean,
  isSacrifice: boolean,
  newTensions: string[],
  newTone: WorldState["emotionalTone"],
  newAnchors: string[] = [],
): WorldState {
  const next = { ...state };

  // 更新分值
  next.axes = state.axes.map(a => ({
    ...a,
    score: Math.min(100, Math.max(0, a.score + (scoreDelta[a.key] ?? 0))),
  }));

  // 追加历史
  next.choiceHistory = [...state.choiceHistory, record];

  // 更新伏笔（合并新张力，保留旧的未解决项）
  next.pendingTensions = [...state.pendingTensions, ...newTensions].slice(-6); // 最多保留6条

  // 更新叙事锚点（最多保留4个，保持场景细节连贯）
  next.narrativeAnchors = [...state.narrativeAnchors, ...newAnchors]
    .filter((v, i, arr) => arr.indexOf(v) === i) // 去重
    .slice(-4);

  // 更新情绪基调
  next.emotionalTone = newTone;

  // 更新连续计数
  next.consecutiveSelfPreserve = isSelfPreserve ? state.consecutiveSelfPreserve + 1 : 0;
  next.consecutiveSacrifice = isSacrifice ? state.consecutiveSacrifice + 1 : 0;

  // 推进幕次
  next.actNumber = state.actNumber + 1;

  // 更新叙事阶段
  const ratio = next.actNumber / next.maxActs;
  if (ratio < 0.2) next.storyPhase = "起";
  else if (ratio < 0.45) next.storyPhase = "承";
  else if (ratio < 0.75) next.storyPhase = "转";
  else if (ratio < 0.9) next.storyPhase = "合";
  else next.storyPhase = "尾声";

  return next;
}

/** 生成传给 AI 的状态摘要 */
export function summarizeState(state: WorldState): string {
  const axesSummary = state.axes
    .map(a => `${a.key}：${a.score}分（${a.low}↔${a.high}）`)
    .join("，");

  const recentChoices = state.choiceHistory
    .slice(-4)
    .map((c) => `第${c.act}幕选「${c.choiceText}」→${c.consequenceText}`)
    .join("\n");

  // 把「已发生的选择结果」升级为不可推翻的既定事实，强约束下一幕承接，
  // 防止 AI 用原著默认剧本覆盖玩家的选择（例如玩家已派魏延守街亭并守住，
  // 后面就绝不能再滑回「马谡失街亭」的默认走向）。
  const establishedFacts = state.choiceHistory.length > 0
    ? state.choiceHistory
        .map((c) => `· 第${c.act}幕：你选择了「${c.choiceText}」，其结果已经发生——${c.consequenceText}`)
        .join("\n")
    : "（暂无已发生的事实）";

  const tensions = state.pendingTensions.length > 0
    ? state.pendingTensions.join("；")
    : "暂无悬而未决的张力";

  const anchors = state.narrativeAnchors.length > 0
    ? `已有场景锚点（必须在本幕中引用至少一个）：${state.narrativeAnchors.join("、")}`
    : "";

  return `当前第${state.actNumber}幕（${state.storyPhase}段），情绪基调：${state.emotionalTone}
价值轴：${axesSummary}

【已成定局·不可推翻的事实】（本幕必须与以下事实完全一致，绝对不得出现与之矛盾的情节；玩家已做的选择就是唯一发生过的历史，禁止用原著默认剧本覆盖它，禁止让被玩家换下/否决的人物重新登场承担同一职责或结局）：
${establishedFacts}

近期选择：\n${recentChoices || "（暂无）"}
未解伏笔：${tensions}
${anchors}
已触发反转：${state.triggeredTwists.join("，") || "无"}`;
}

// ── 元价值轴（跨局可比较的底层维度）────────────────────────────────
export interface MetaAxis {
  id: string;
  label: string;         // 展示名
  description: string;   // 衡量什么
  keywords: string[];    // 用于匹配角色专属四轴的关键词
}

export const META_AXES: MetaAxis[] = [
  {
    id: "rule_vs_self",
    label: "规则感",
    description: "你在多大程度上服从外部规则，还是相信自己的判断",
    keywords: ["忍耐", "服从", "规则", "原则", "刚性", "招安", "反抗", "自由"],
  },
  {
    id: "self_vs_others",
    label: "自我优先度",
    description: "当自我利益和他人/集体冲突时，你更倾向于保全自己还是牺牲自己",
    keywords: ["自保", "牺牲", "牺牲", "忠诚", "集体", "个体", "付出", "利益"],
  },
  {
    id: "connection",
    label: "连接需求",
    description: "你需要多深的情感连接来获得安全感，还是更依赖独立自足",
    keywords: ["依附", "关系", "情感", "依赖", "独立", "孤独", "情义", "连接"],
  },
  {
    id: "risk_tolerance",
    label: "风险承受",
    description: "面对不确定的代价，你倾向于保守规避还是冒险出手",
    keywords: ["时机", "忍耐", "冒险", "代价", "等待", "出手", "行动", "等到"],
  },
  {
    id: "identity_anchor",
    label: "身份锚点",
    description: "你的自我认同更依赖外部评价（名声、认可）还是内部标准（自己的判断）",
    keywords: ["名声", "形象", "尊严", "面具", "认可", "期待", "真实", "野心"],
  },
  {
    id: "truth_vs_peace",
    label: "真实代价",
    description: "你愿意为了真实和诚实承担多大代价，还是更倾向于维持表面平静",
    keywords: ["真实", "诚实", "表演", "压抑", "掩藏", "说出", "隐瞒", "清醒"],
  },
];

/**
 * 把当前局的专属四轴分值映射到6个元轴上（关键词匹配投票法）
 * 返回 0-100 的元轴分值，可跨局比较
 */
export function mapToMetaAxes(axes: WorldState["axes"]): Record<string, number> {
  const result: Record<string, number> = {};

  for (const meta of META_AXES) {
    const matched = axes.filter(a =>
      meta.keywords.some(kw => a.key.includes(kw) || a.low.includes(kw) || a.high.includes(kw))
    );
    if (matched.length === 0) {
      result[meta.id] = 50; // 无关联轴时居中
    } else {
      // 取匹配轴分值均值
      result[meta.id] = Math.round(
        matched.reduce((sum, a) => sum + a.score, 0) / matched.length
      );
    }
  }

  return result;
}

/** 生成元轴的文字摘要（用于结局 prompt） */
export function summarizeMetaAxes(axes: WorldState["axes"]): string {
  const scores = mapToMetaAxes(axes);
  return META_AXES.map(m => {
    const score = scores[m.id];
    const tendency = score > 65 ? "偏高" : score < 35 ? "偏低" : "居中";
    return `${m.label}（${m.description}）：${tendency}（${score}分）`;
  }).join("\n");
}
