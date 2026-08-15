// 生成两个 demo WorldState → base64url 链接，供直接预览结果页/对比页
const BASE = "https://3000-ivhgrqhc5osuwu5hzfix2.e2b.app";

function enc(obj) {
  const json = JSON.stringify(obj);
  return Buffer.from(json, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const axes = [
  { key: "规则感", low: "顺势而为", high: "谨守法度", description: "你更信奉既定的规矩，还是相信随机应变。", score: 78 },
  { key: "自我优先度", low: "先顾大局", high: "先护自身", description: "当集体与自身冲突，你更倾向牺牲还是自保。", score: 32 },
  { key: "情义权重", low: "就事论事", high: "以情为先", description: "决断时，人情分量有多重。", score: 64 },
  { key: "风险承受", low: "求稳", high: "敢赌", description: "面对不确定，你更愿意稳还是搏。", score: 45 },
];

const base = {
  book: "三国演义",
  character: "诸葛亮",
  characterTagline: "鞠躬尽瘁，明知不可为而为之",
  actNumber: 7, // 走完6幕
  storyPhase: "合",
  maxActs: 10,
  pendingTensions: [],
  emotionalTone: "悲凉",
  triggeredTwists: ["失街亭后的自省"],
  trapTriggeredInActs: [],
  narrativeAnchors: ["街亭", "军令状", "空城"],
  consecutiveSelfPreserve: 0,
  consecutiveSacrifice: 2,
};

const normalHistory = [
  { act: 1, choiceId: "B", choiceText: "力排众议，任用马谡守街亭", sceneName: "点将街亭", revealText: "你把信任押在了人情上", socialTag: "用人", consequenceText: "马谡领命而去，众将侧目。", modernTension: "你也曾把重要的事交给关系最近、却未必最合适的人吗？" },
  { act: 2, choiceId: "C", choiceText: "亲赴前线督战，把自己也压上", sceneName: "亲赴前线", revealText: "你不肯只当发号施令的人", socialTag: "担当", consequenceText: "你与士卒同宿营帐，军心稍安。", modernTension: "当团队出事，你是躲在后方，还是把自己也押上去？" },
  { act: 3, choiceId: "A", choiceText: "街亭已失，先保全大军撤退", sceneName: "痛失街亭", revealText: "你在崩盘时选择了止损", socialTag: "止损", consequenceText: "大军得以退回，但北伐受挫。", modernTension: "明知已经输了，你能不能及时收手、保住剩下的？" },
  { act: 4, choiceId: "C", choiceText: "空城抚琴，以命相赌退司马", sceneName: "空城计", revealText: "你敢用自己的命做筹码", socialTag: "冒险", consequenceText: "司马懿疑而退兵，你后背已湿透。", modernTension: "最险的时刻，你敢不敢拿自己当唯一的赌注？" },
  { act: 5, choiceId: "B", choiceText: "挥泪斩马谡，明正军法", sceneName: "挥泪斩马谡", revealText: "你让规矩压过了私情", socialTag: "问责", consequenceText: "马谡伏法，帐中无人再敢轻言。", modernTension: "对你最看重的人犯的错，你能不能照章办事？" },
  { act: 6, choiceId: "C", choiceText: "上表自贬三级，把责任揽到自己身上", sceneName: "自贬三级", revealText: "你把失败的账记在了自己名下", socialTag: "自省", consequenceText: "你退居其位，仍握军政。", modernTension: "团队失败时，你会不会第一个把责任揽到自己头上？" },
];

const normalState = { ...base, axes: axes.map(a => ({ ...a })), choiceHistory: normalHistory };

// 极压版：同角色，选择更极端（多为 C），价值轴偏移
const intensifyHistory = normalHistory.map((c, i) => ({
  ...c,
  choiceId: i % 2 === 0 ? "C" : c.choiceId,
  choiceText: c.choiceText + "（生死关头）",
  revealText: "绝境下，你依然按下了那个更重的选择",
}));
const intensifyAxes = axes.map((a, i) => ({
  ...a,
  score: Math.max(5, Math.min(95, a.score + (i % 2 === 0 ? 15 : -18))),
}));
const intensifyState = { ...base, emotionalTone: "绝望", axes: intensifyAxes, choiceHistory: intensifyHistory };

const resultUrl = `${BASE}/?ag=${enc(normalState)}&mode=agent-result`;
const compareUrl = `${BASE}/?agc=${enc(normalState)}&agc2=${enc(intensifyState)}&mode=agent-compare`;

console.log("RESULT_URL\n" + resultUrl + "\n");
console.log("COMPARE_URL\n" + compareUrl + "\n");
console.log("result_len", resultUrl.length, "compare_len", compareUrl.length);
