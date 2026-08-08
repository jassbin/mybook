// src/lib/game/story-data.ts
// Complete story data for 《八戒的抉择·白虎岭惊魂》

export type MessageType = "narrator" | "dialog" | "inner-voice" | "system";

export interface StoryMessage {
  id: string;
  type: MessageType;
  text: string;
  delay?: number; // ms delay before showing
}

export interface Choice {
  id: string;
  label: string; // 甲乙丙
  text: string;
  innerVoice: string;
  socialTag: string;
  scores: {
    authority: number;   // 权威服从度
    professional: number; // 专业信任度
    action: number;      // 行动奋斗值
    sincerity: number;   // 情感坦诚度
  };
}

export interface DecisionPoint {
  id: string;
  scene: string;
  messages: StoryMessage[];
  choices: Choice[];
  consequences: Record<string, StoryMessage[]>; // choiceId -> aftermath messages
  forcedContinue: StoryMessage[]; // always shown after consequence
}

export interface BadEnding {
  id: string;
  title: string;
  description: string;
  guanyin: string; // Guanyin's words on revival
}

export interface Ending {
  type: "high-authority-low-monkey" | "low-authority-high-monkey" | "balanced";
  title: string;
  narration: string;
  tooltip: string;
}

export const BAD_ENDING: BadEnding = {
  id: "pig-in-snake",
  title: "猪入蛇口",
  description: `你钻进最密的草丛，屏住呼吸。突然，一只冰冷的手抓住你的后颈，把你从草里提了出来。白骨精咧嘴一笑：「猪八戒，唐僧肉吃之前，先拿你打个牙祭。」你被整个吞下，黑暗永久降临。`,
  guanyin: "八戒，躺平不是罪，但在敌人面前躺平，是把生命献祭给虚无。我送你回去，重选。",
};

export const ENDINGS: Ending[] = [
  {
    type: "high-authority-low-monkey",
    title: "赢了朝堂，输了沙场",
    narration: `唐僧拍你肩膀说「稳重」，悟空冷笑。你赢得了领导的垂青，却输掉了唯一的铠甲。此后遇险，悟空袖手旁观半小时才出手。`,
    tooltip: "极度权威服从型",
  },
  {
    type: "low-authority-high-monkey",
    title: "丢了官帽，捡了盔甲",
    narration: `悟空偷偷塞给你一颗九转还魂丹，说：「当初你替我说话，老孙记你的情。」唐僧对你不冷不热，但你从此走路带风，因为背后有硬汉撑腰。`,
    tooltip: "极度专业信任型",
  },
  {
    type: "balanced",
    title: "活成了大多数人的样子",
    narration: "唐僧对你既不格外信任也不厌恶，悟空也不记恨也不亲近。你依然每天偷懒挨骂，但夜深人静时，你会看着星空想：当初要是我再勇敢一点，会不会不一样？",
    tooltip: "中庸平衡型",
  },
];

export const STORY_SCENES: DecisionPoint[] = [
  // ── SCENE 1: 初遇血案 ──────────────────────────────────────────
  {
    id: "scene1",
    scene: "初遇血案",
    messages: [
      { id: "s1-1", type: "narrator", text: "白虎岭，黄昏。" },
      { id: "s1-2", type: "narrator", text: "你刚在草丛里美美睡了一觉，揉着肚皮回到师父身边。" },
      { id: "s1-3", type: "dialog", text: "地上躺着一个妙龄少女的尸体，脑袋都被打扁了。孙悟空拄着铁棒站在一旁，冷笑不语。", delay: 400 },
      { id: "s1-4", type: "dialog", text: "唐僧看见你回来，像抓住救命稻草，喝道：", delay: 600 },
      { id: "s1-5", type: "dialog", text: "「八戒！你来得正好！这女子悟空说她是妖怪，一棒就打死了！你给为师评评理——」", delay: 300 },
      { id: "s1-6", type: "inner-voice", text: "你低头看了一眼那少女的「尸体」，隐隐闻到一丝腥风——那绝不是活人的味道。但你也看见悟空的棒尖还在滴血，师父的眼泪都快下来了……", delay: 500 },
    ],
    choices: [
      {
        id: "s1-A",
        label: "甲",
        text: "顺着师父，落井下石",
        innerVoice: "师父正在气头上，我替他出气，他日后必拿我当心腹。大师兄再能打，也扛不住紧箍咒，我犯不着为一个狂妄的猴子得罪领导。保领导，永远没错。",
        socialTag: "权威崇拜 vs 事实信仰",
        scores: { authority: 20, professional: -20, action: 0, sincerity: -10 },
      },
      {
        id: "s1-B",
        label: "乙",
        text: "装傻充愣，含糊其辞",
        innerVoice: "我刚睡醒，啥也没看见。两头不得罪，两头都欠我人情——这荒山野岭的，多一事不如少一事。",
        socialTag: "沉默的大多数，回避判断责任",
        scores: { authority: -5, professional: 5, action: 0, sincerity: -5 },
      },
      {
        id: "s1-C",
        label: "丙",
        text: "顶着师父，力挺悟空",
        innerVoice: "那女人的尸首边沿泛着黑气，大师兄的火眼金睛从没看走过眼。我若不挺他，等真妖怪来了，谁顶在前面？维护唯一的战神，就是维护我自己的小命。",
        socialTag: "专业信用 vs 民粹情绪",
        scores: { authority: -20, professional: 25, action: 5, sincerity: 10 },
      },
    ],
    consequences: {
      "s1-A": [
        { id: "s1-A-1", type: "narrator", text: "唐僧重重拍你肩膀：「八戒，还是你明事理！」" },
        { id: "s1-A-2", type: "narrator", text: "紧箍咒连念三遍，悟空疼得满地打滚，回头看你时，眼底全是冰冷。" },
      ],
      "s1-B": [
        { id: "s1-B-1", type: "narrator", text: "唐僧叹气：「你也是个糊涂虫。」" },
        { id: "s1-B-2", type: "narrator", text: "悟空哼了一声。两边对你都不冷不热，但沙僧悄悄对你竖了个拇指。" },
      ],
      "s1-C": [
        { id: "s1-C-1", type: "narrator", text: "唐僧勃然大怒：「连你也替他狡辩！」紧箍咒疯狂念了五遍，悟空几乎晕厥。" },
        { id: "s1-C-2", type: "narrator", text: "但咒停之后，悟空挣扎着爬起来，对你低声道：「呆子……谢了。」" },
      ],
    },
    forcedContinue: [
      { id: "s1-end-1", type: "system", text: "无论如何，少女尸体缓缓化为一堆苍白枯骨。唐僧脸色忽青忽白，队伍沉默前行。" },
    ],
  },

  // ── SCENE 2: 老妇索命 ──────────────────────────────────────────
  {
    id: "scene2",
    scene: "老妇索命",
    messages: [
      { id: "s2-1", type: "narrator", text: "前行不过五里路。" },
      { id: "s2-2", type: "dialog", text: "一个白发苍苍的老妇人拄着拐杖，从山坳里颤巍巍走出来，嘴里喊着「女儿啊，我的女儿啊……」", delay: 400 },
      { id: "s2-3", type: "narrator", text: "你还没来得及反应，孙悟空已经跳起来，当头一棒！老妇脑浆迸裂，倒地身亡。", delay: 500 },
      { id: "s2-4", type: "dialog", text: "唐僧直接从马上摔了下来——「你这泼猴！连杀两人！天理何在！」他取出紧箍咒，高高举起，猛地转向你：", delay: 400 },
      { id: "s2-5", type: "dialog", text: "「八戒！你说！这老妇也是妖吗？！」", delay: 200 },
      { id: "s2-6", type: "inner-voice", text: "你看着地上的老妇尸体，袖口滑落一串佛珠——你认得那是妖气凝聚的障眼法。但这个节骨眼上，师父已经彻底疯了……", delay: 500 },
    ],
    choices: [
      {
        id: "s2-A",
        label: "甲",
        text: "趁热打铁，污蔑灭口",
        innerVoice: "既然少女那回我已经得罪了悟空，不如一不做二不休！把大师兄彻底赶走，我就是队伍里的第一战力，功劳全是我的！风险？反正他已经恨了，再恨一点又如何？",
        socialTag: "将错就错，彻底消灭对手",
        scores: { authority: 20, professional: -25, action: -5, sincerity: -15 },
      },
      {
        id: "s2-B",
        label: "乙",
        text: "息事宁人，递个台阶",
        innerVoice: "师父要的是面子，不是真相。我不说师兄打对，也不说他打错，就说荒山诡异、赶紧走人。气消一半，别把火引到自己身上。",
        socialTag: "冲突调解中的和稀泥",
        scores: { authority: 0, professional: 0, action: 0, sincerity: -5 },
      },
      {
        id: "s2-C",
        label: "丙",
        text: "公然叫板，力挺到底",
        innerVoice: "八十岁老太太走得比我快？分明是妖！师父看不见，我不能装瞎。我现在吼这一嗓子，师兄日后拿命护我。虽然师父气炸，但真理和兄弟，总得选一头。",
        socialTag: "为正确的事得罪所有人",
        scores: { authority: -25, professional: 30, action: 10, sincerity: 15 },
      },
    ],
    consequences: {
      "s2-A": [
        { id: "s2-A-1", type: "narrator", text: "唐僧怒极念咒，悟空额头撞石出血。" },
        { id: "s2-A-2", type: "narrator", text: "悟空好感跌至冰点。你彻底推倒了与他和解的任何可能。" },
      ],
      "s2-B": [
        { id: "s2-B-1", type: "narrator", text: "唐僧长叹止咒，悟空喘气瞪你但不发作。" },
        { id: "s2-B-2", type: "narrator", text: "你是团队里唯一「成熟」的人，也是唯一没有立场的人。" },
      ],
      "s2-C": [
        { id: "s2-C-1", type: "narrator", text: "唐僧疯狂念咒，悟空翻滚惨叫。念毕，唐僧流泪道「你们走吧」，被沙僧拉住。" },
        { id: "s2-C-2", type: "narrator", text: "悟空爬起在你耳边说：「呆子，你欠我一条命。」" },
      ],
    },
    forcedContinue: [
      { id: "s2-end-1", type: "system", text: "老妇尸体化为枯骨。唐僧上马丢下一句：「若再杀一人，我与你恩断义绝。」队伍沉默前行。" },
    ],
  },

  // ── SCENE 3: 三打显形·独处旷野 ────────────────────────────────
  {
    id: "scene3",
    scene: "三打显形",
    messages: [
      { id: "s3-1", type: "narrator", text: "又走半日，白发老翁哭喊着出现，悟空大喝一声：" },
      { id: "s3-2", type: "dialog", text: "「孽畜！三番两次戏弄老孙！」" },
      { id: "s3-3", type: "narrator", text: "第三棒砸下，老翁倒地瞬间化为巨形骷髅，脊背刻着「白骨夫人」四字。铁证如山。", delay: 300 },
      { id: "s3-4", type: "narrator", text: "但唐僧像疯了一样——不顾地上明晃晃的白骨，当场写下贬书，声泪俱下驱逐悟空。", delay: 500 },
      { id: "s3-5", type: "narrator", text: "悟空磕头告别，一个筋斗云飞走了。", delay: 400 },
      { id: "s3-6", type: "inner-voice", text: "「白骨夫人」四字你认得，那是魔界名册上有名的精怪。大师兄没骗人……可我……我可没少递刀。", delay: 600 },
      { id: "s3-7", type: "narrator", text: "天色骤暗，白骨精本体从地底钻出，狂风卷走唐僧，一招困住沙僧。", delay: 500 },
      { id: "s3-8", type: "dialog", text: "你独自站在旷野。阴风从四面八方吹来。你只有一把钉钯，两条腿。", delay: 300 },
    ],
    choices: [
      {
        id: "s3-A",
        label: "甲",
        text: "拼了！燃烧硬拼，冲进白骨洞",
        innerVoice: "我不想当英雄，但我知道如果现在转身跑，这辈子看不起自己。哪怕断两根骨头，我也要让妖怪知道老猪不是孬种！拼了不一定赢，但不拼我连自己都骗不过去。",
        socialTag: "996耗尽身体——用肉身换尊严",
        scores: { authority: 0, professional: 5, action: 30, sincerity: 5 },
      },
      {
        id: "s3-B",
        label: "乙",
        text: "理智撤退，跑去花果山请援",
        innerVoice: "我冲进去就是送菜。我不是大师兄，我没那本事。但我有脑子——承认自己不行，然后去找行的人，这是成年人最大的理性。不丢人。",
        socialTag: "承认平庸，战略性迂回",
        scores: { authority: 0, professional: 10, action: 10, sincerity: 5 },
      },
      {
        id: "s3-C",
        label: "丙",
        text: "就地躲藏，偷行李散伙（⚠️ 危险）",
        innerVoice: "我不干了。取经、正果、成佛——全是画饼。凭什么我替唐僧的信仰、悟空的骄傲买单？就偷这一次懒……就一次。",
        socialTag: "躺平学——用彻底放弃对抗压榨",
        scores: { authority: 0, professional: 0, action: -30, sincerity: -20 },
      },
    ],
    consequences: {
      "s3-A": [
        { id: "s3-A-1", type: "narrator", text: "你冲进去拼了三回合，断两根肋骨，口吐鲜血。但钉钯砸裂了白骨洞石门，留下了你战斗过的印迹。" },
        { id: "s3-A-2", type: "narrator", text: "你败逃出来，拖着血路，只能往花果山方向爬行。代价是身体，收获是尊严。" },
      ],
      "s3-B": [
        { id: "s3-B-1", type: "narrator", text: "你毫发无伤地跑到花果山。一路狂奔，内心反复质问：「我是不是太怂了？」" },
        { id: "s3-B-2", type: "narrator", text: "代价是自责，收获是效率。" },
      ],
      "s3-C": [], // handled by bad ending flow
    },
    forcedContinue: [
      { id: "s3-end-1", type: "system", text: "无论如何，你最终站在了花果山水帘洞前。群猴嬉闹，悟空高坐石台，俯视着你。" },
    ],
  },

  // ── SCENE 4: 花果山低头 ────────────────────────────────────────
  {
    id: "scene4",
    scene: "花果山低头",
    messages: [
      { id: "s4-1", type: "narrator", text: "花果山，水帘洞前。群猴嬉闹，桃子从四面砸来。" },
      { id: "s4-2", type: "dialog", text: "悟空翘着二郎腿，阴阳怪气地说：「哟，师父身边的大红人，怎么有空来我这破山？是不是师父让你来传圣旨？」" },
      { id: "s4-3", type: "narrator", text: "时间紧迫，师父在白骨洞里随时可能被蒸煮。" },
      { id: "s4-4", type: "inner-voice", text: "你回想起这一路上的每一次选择，每一刀递出去的谗言，或者每一句仗义执言。此刻，那些账全在悟空眼神里。" },
    ],
    choices: [
      {
        id: "s4-A",
        label: "甲",
        text: "激将法！说妖怪辱骂他",
        innerVoice: "他最恨别人骂「弼马温」。我只要说那妖怪指名道姓骂他，他立马炸毛——手段脏一点，但目的正确。成年人的世界，谈痛点比谈感情高效。",
        socialTag: "用对方软肋施压，操控人心",
        scores: { authority: 0, professional: 5, action: 5, sincerity: -10 },
      },
      {
        id: "s4-B",
        label: "乙",
        text: "彻底坦诚，跪求认错",
        innerVoice: "大师兄，我错了。我受够了算计。我想试一次，用真心换真心。哪怕你骂我、打我，我都认——只求你听完这句话，再做决定。",
        socialTag: "在充满算计的时代，敢不敢不设防",
        scores: { authority: -5, professional: 5, action: 5, sincerity: 25 },
      },
      {
        id: "s4-C",
        label: "丙",
        text: "量化交易，谈条件换救援",
        innerVoice: "谈感情太虚，谈买卖最稳。他救师父，以后所有苦活我全包。谁也不欠谁，公平合理——干干净净，不拖不欠。",
        socialTag: "亲密关系全面量化，安全但孤独",
        scores: { authority: 0, professional: 0, action: 0, sincerity: -15 },
      },
    ],
    consequences: {
      "s4-A": [
        { id: "s4-A-1", type: "narrator", text: "悟空拍案而起：「那妖怪敢骂我？！」立刻拎棒下山。" },
        { id: "s4-A-2", type: "narrator", text: "救回师父后，他戳你脑门：「呆子，你激将的小把戏，老孙早看穿了。不过，你总算还知道用老孙的名头。」" },
      ],
      "s4-B": [
        { id: "s4-B-1", type: "narrator", text: "悟空愣住，跳下石台扶起你：「八戒……你居然能说出这种话。」" },
        { id: "s4-B-2", type: "narrator", text: "他二话不说去救人。一路上，那道裂缝开始弥合。" },
      ],
      "s4-C": [
        { id: "s4-C-1", type: "narrator", text: "悟空冷笑转身：「八戒，你到现在还算计得失？」他转身要走。" },
        { id: "s4-C-2", type: "narrator", text: "你急得大哭，被迫低头认错——悟空叹了口气，终于下山救人。但之后一路，你被迫包揽了所有脏活累活。" },
      ],
    },
    forcedContinue: [
      { id: "s4-end-1", type: "system", text: "悟空降服白骨精，救回唐僧。师徒四人重新上路。夕阳西沉，取经路继续。" },
    ],
  },
];

export interface GameState {
  currentScene: number;   // 0-3
  currentPhase: "story" | "choice" | "consequence" | "transition";
  messageIndex: number;
  selectedChoice: string | null;
  scores: {
    authority: number;
    professional: number;
    action: number;
    sincerity: number;
  };
  choiceHistory: string[];
  isDead: boolean;
  isRevived: boolean;
  isComplete: boolean;
  penaltyFlags: string[];
}

export const INITIAL_GAME_STATE: GameState = {
  currentScene: 0,
  currentPhase: "story",
  messageIndex: 0,
  selectedChoice: null,
  scores: { authority: 50, professional: 50, action: 50, sincerity: 50 },
  choiceHistory: [],
  isDead: false,
  isRevived: false,
  isComplete: false,
  penaltyFlags: [],
};

export function applyScores(current: GameState["scores"], delta: Choice["scores"]): GameState["scores"] {
  return {
    authority:    Math.min(100, Math.max(0, current.authority    + delta.authority)),
    professional: Math.min(100, Math.max(0, current.professional + delta.professional)),
    action:       Math.min(100, Math.max(0, current.action       + delta.action)),
    sincerity:    Math.min(100, Math.max(0, current.sincerity    + delta.sincerity)),
  };
}

export function computeEnding(scores: GameState["scores"], choiceHistory: string[]): Ending {
  const authorityHigh = scores.authority > 65;
  const monkeyHigh = scores.professional > 65 || scores.sincerity > 65;
  if (authorityHigh && !monkeyHigh) return ENDINGS[0];
  if (!authorityHigh && monkeyHigh) return ENDINGS[1];
  return ENDINGS[2];
}

export function computePenalties(scores: GameState["scores"], choiceHistory: string[]): string[] {
  const penalties: string[] = [];
  if (scores.authority >= 80) penalties.push("authority-extreme");
  if (scores.professional <= 20) penalties.push("professional-low");
  if (scores.action <= 20) penalties.push("action-low"); // triggered by death
  if (scores.sincerity <= 20) penalties.push("sincerity-low");
  return penalties;
}
