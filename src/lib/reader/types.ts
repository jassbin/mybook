// src/lib/reader/types.ts
// Core types for the Classic Reader Engine

export type BookKey = "水浒传" | "西游记" | "红楼梦" | "三国演义" | "custom" | string;

export interface CharCandidate {
  name: string;
  hook: string;
  /** 这个角色最容易触发的困境场域（命运偏爱/禁忌诱惑/背叛信任/感情关系等） */
  dominantDomains: string[];
}

export interface BookMeta {
  key: BookKey;
  title: string;
  color: string;
  textColor: string;
  tagline: string;
  recommendedChar: string;
  charHook: string;
  charDomains: string[];   // 选中角色的场域，传给 init API
  candidates: CharCandidate[];
}

// ── 四大名著候选池 ───────────────────────────────────────────────
const SHUIHU_CANDIDATES: CharCandidate[] = [
  {
    name: "林冲",
    hook: "所有人都说忍一忍就过去了——他忍了，然后失去了全部",
    dominantDomains: ["背叛信任", "生存底线"],
  },
  {
    name: "宋江",
    hook: "他用「义气」绑住所有人，却不知道这是爱还是控制",
    dominantDomains: ["禁忌诱惑", "身份认同"],
  },
  {
    name: "燕青",
    hook: "被最厉害的人偏爱，却知道这段关系终究要结束",
    dominantDomains: ["命运偏爱", "背叛信任"],
  },
  {
    name: "武松",
    hook: "他不是不懂规则，他只是决定不配合了",
    dominantDomains: ["生存底线", "禁忌诱惑"],
  },
  {
    name: "鲁智深",
    hook: "每次出手都是代价，但他活得比任何人都干净",
    dominantDomains: ["命运偏爱", "身份认同"],
  },
];

const XIYOU_CANDIDATES: CharCandidate[] = [
  {
    name: "孙悟空",
    hook: "被规则关了五百年，然后被驯服了——他真的甘心吗",
    dominantDomains: ["禁忌诱惑", "身份认同"],
  },
  {
    name: "唐僧",
    hook: "用信念管理所有人，却不知道信念也是一种控制",
    dominantDomains: ["禁忌诱惑", "背叛信任"],
  },
  {
    name: "猪八戒",
    hook: "他最懂人性——因为他从来不对自己的欲望撒谎",
    dominantDomains: ["命运偏爱", "感情关系"],
  },
  {
    name: "沙僧",
    hook: "一直在等被人真正看见，但等的方式是沉默",
    dominantDomains: ["身份认同", "背叛信任"],
  },
];

const HONGLOU_CANDIDATES: CharCandidate[] = [
  {
    name: "王熙凤",
    hook: "她是整个家族最不可缺少的人——但没有人问过她累不累",
    dominantDomains: ["禁忌诱惑", "背叛信任"],
  },
  {
    name: "林黛玉",
    hook: "她爱得太真实，在一个需要表演的地方",
    dominantDomains: ["感情关系", "身份认同"],
  },
  {
    name: "薛宝钗",
    hook: "完美到令人心疼——但她自己想要什么，从来没人问",
    dominantDomains: ["禁忌诱惑", "身份认同"],
  },
  {
    name: "贾宝玉",
    hook: "他被所有人偏爱，却偏偏不想要那些偏爱",
    dominantDomains: ["命运偏爱", "感情关系"],
  },
  {
    name: "探春",
    hook: "用双倍努力证明出身不是命运，但有些门，努力打不开",
    dominantDomains: ["命运偏爱", "家庭代际"],
  },
];

const SANGUO_CANDIDATES: CharCandidate[] = [
  {
    name: "诸葛亮",
    hook: "明知赢不了，但停下来意味着承认当初的选择是错的",
    dominantDomains: ["背叛信任", "身份认同"],
  },
  {
    name: "曹操",
    hook: "他做了很多「坏事」，但每一件都有自己的逻辑——你认同吗",
    dominantDomains: ["禁忌诱惑", "命运偏爱"],
  },
  {
    name: "荀彧",
    hook: "帮老板做大，最后被踢走——原则到底值多少钱",
    dominantDomains: ["背叛信任", "身份认同"],
  },
  {
    name: "司马懿",
    hook: "装了一辈子，等了一辈子——忍耐到底是美德还是失去自己",
    dominantDomains: ["禁忌诱惑", "命运偏爱"],
  },
  {
    name: "周瑜",
    hook: "才华和地位都有，但总有人觉得你的位置应该是别人的",
    dominantDomains: ["命运偏爱", "背叛信任"],
  },
];

// ── 版权检查 ──────────────────────────────────────────────────────
// 中国著作权法：作者去世满50年进入公版
// 【比赛后·放开版权过滤】原本按作者去世满50年判定，现在放开：所有候选书目（含现代网文）
// 均可进入候选池。保留 authorDeathYear 字段以便日后需要时再收紧。
export function isCopyrightSafe(_authorDeathYear: number): boolean {
  return true;
}

// ── 非四大名著：有时代共鸣的书库 ──────────────────────────────────
// ── 频道分类（首页芯片分频道展示书库）──────────────────────────────
export type ChannelKey = "any" | "webromance" | "scriptmurder" | "classic" | "world" | "xianxia" | "romance" | "modern";

export interface ChannelDef {
  key: ChannelKey;
  label: string;
}

// 「不限」置顶：随机展示全库，没有四大名著硬置顶约束
export const CHANNELS: ChannelDef[] = [
  { key: "any", label: "不限" },
  { key: "classic", label: "经典殿堂" },
  { key: "romance", label: "儿女情长" },
  { key: "xianxia", label: "江湖仙侠" },
  { key: "modern", label: "热血今潮" },
  { key: "world", label: "人间世相" },
];

interface LooseBookDef {
  title: string;
  color: string;
  textColor: string;
  tagline: string;
  candidates: CharCandidate[];
  authorDeathYear: number;  // 用于版权判断，作者去世年份
  channel?: ChannelKey;     // 频道归属；不填默认「人间世相」(world)
}

const EXTRA_BOOKS: LooseBookDef[] = [
  {
    title: "活着",
    color: "#4A3728", textColor: "#EFE6C9",
    tagline: "命运夺走一切之后，人凭什么还要活着",
    authorDeathYear: 9999, // 余华在世，版权保护中
    candidates: [
      { name: "福贵", hook: "失去了所有，却偏偏活得最久——这究竟是恩赐还是惩罚", dominantDomains: ["生存底线", "家庭代际"] },
      { name: "家珍", hook: "爱一个烂人，用一生宽容兑现了，值不值", dominantDomains: ["感情关系", "背叛信任"] },
    ],
  },
  {
    title: "白鹿原",
    color: "#5C4A1A", textColor: "#EFE6C9",
    tagline: "一块土地上，两家人把一个世纪活成了对照",
    authorDeathYear: 2016, // 陈忠实，2066年公版
    candidates: [
      { name: "白嘉轩", hook: "用礼义廉耻撑起一个家族，但这套规则到底伤了多少人", dominantDomains: ["家庭代际", "禁忌诱惑"] },
      { name: "黑娃", hook: "离经叛道，却始终没能逃出那块土地的引力", dominantDomains: ["命运偏爱", "背叛信任"] },
      { name: "田小娥", hook: "被所有规则压着，用身体争取的那一点自由，也被毁掉了", dominantDomains: ["禁忌诱惑", "背叛信任"] },
    ],
  },
  {
    title: "平凡的世界",
    color: "#3D5A3E", textColor: "#EFE6C9",
    tagline: "出身不是起点，但它决定了你要多费多少力气",
    authorDeathYear: 1992, // 路遥，2042年公版
    candidates: [
      { name: "孙少平", hook: "想从土地里走出去，走出去之后才发现代价是什么", dominantDomains: ["命运偏爱", "感情关系"] },
      { name: "孙少安", hook: "留下来的那个人，用双手撑起了家族，也压垮了自己", dominantDomains: ["家庭代际", "背叛信任"] },
      { name: "田晓霞", hook: "出身好、有理想、有爱——但命运不讲道理", dominantDomains: ["命运偏爱", "感情关系"] },
    ],
  },
  {
    title: "围城",
    color: "#7A6E5A", textColor: "#EFE6C9",
    tagline: "城外的人想进去，城里的人想出来——你现在在哪边",
    authorDeathYear: 1998, // 钱钟书，2048年公版
    candidates: [
      { name: "方鸿渐", hook: "聪明又懦弱，想要很多又总是退缩——他是你吗", dominantDomains: ["禁忌诱惑", "身份认同"] },
      { name: "苏文纨", hook: "主动争取、精于算计，但算错了一件事：感情不按逻辑走", dominantDomains: ["感情关系", "背叛信任"] },
    ],
  },
  {
    title: "骆驼祥子",
    color: "#8B4513", textColor: "#EFE6C9",
    tagline: "一个人拼尽全力，结果还是输给了命运——他错了吗",
    authorDeathYear: 1966, // 老舍，2016年已公版 ✅
    candidates: [
      { name: "祥子", hook: "靠力气吃饭，有梦想有尊严，被生活一次次打回原形", dominantDomains: ["命运偏爱", "生存底线"] },
      { name: "虎妞", hook: "爱错了人，用强硬掩盖软弱，最后什么都没留住", dominantDomains: ["禁忌诱惑", "感情关系"] },
    ],
  },
  {
    title: "呐喊",
    color: "#2C3E50", textColor: "#EFE6C9",
    tagline: "那些沉默的人，心里都藏着一声喊不出口的叫声",
    authorDeathYear: 1936, // 鲁迅，1986年已公版 ✅
    candidates: [
      { name: "阿Q", hook: "用精神胜利法活下去——可笑，但他还有别的选择吗", dominantDomains: ["身份认同", "生存底线"] },
      { name: "孔乙己", hook: "读过书，却落魄至此——知识分子的尊严值多少钱", dominantDomains: ["身份认同", "命运偏爱"] },
      { name: "闰土", hook: "少年时是朋友，长大后只剩下阶层的距离", dominantDomains: ["背叛信任", "命运偏爱"] },
    ],
  },
  {
    title: "芙蓉镇",
    color: "#6B4C6B", textColor: "#EFE6C9",
    tagline: "一个小镇，把每个人的命运都刻进了时代的缝隙里",
    authorDeathYear: 9999, // 古华在世，版权保护中
    candidates: [
      { name: "胡玉音", hook: "靠本分挣来的日子，被时代一次次推倒重来", dominantDomains: ["命运偏爱", "背叛信任"] },
      { name: "秦书田", hook: "用笑和沉默活过了最黑暗的年代，这算不算一种勇气", dominantDomains: ["禁忌诱惑", "身份认同"] },
    ],
  },
  {
    title: "长恨歌", channel: "romance",
    color: "#B5707A", textColor: "#EFE6C9",
    tagline: "一座城市的繁华背后，一个女人用一生换来了什么",
    authorDeathYear: 9999, // 王安忆在世，版权保护中
    candidates: [
      { name: "王琦瑶", hook: "美丽是她的资本，也是她的囚笼——被偏爱的人最后都怎么了", dominantDomains: ["命运偏爱", "禁忌诱惑"] },
    ],
  },
  {
    title: "许三观卖血记",
    color: "#A0522D", textColor: "#EFE6C9",
    tagline: "每一次卖血，都是一个普通人在绝境里最后的尊严",
    authorDeathYear: 9999, // 余华在世，版权保护中
    candidates: [
      { name: "许三观", hook: "用血换钱养了一家人，包括一个不是亲生的孩子——值吗", dominantDomains: ["家庭代际", "背叛信任"] },
      { name: "许玉兰", hook: "被出轨，被原谅，被依赖——她最后的底气从哪来", dominantDomains: ["背叛信任", "感情关系"] },
    ],
  },
  {
    title: "边城",
    color: "#4A7A6A", textColor: "#EFE6C9",
    tagline: "最干净的爱情，也逃不过最无声的错过",
    authorDeathYear: 1988, // 沈从文，2038年公版
    candidates: [
      { name: "翠翠", hook: "等了那么久，那个人会回来吗——她真的知道自己在等什么", dominantDomains: ["感情关系", "命运偏爱"] },
      { name: "傩送", hook: "选择了走，后来后悔了吗——他再也没有回答这个问题", dominantDomains: ["感情关系", "背叛信任"] },
    ],
  },
  {
    title: "雪国", channel: "romance",
    color: "#5A7A8A", textColor: "#EFE6C9",
    tagline: "明知没有结果，还是去了——这是浪漫还是自欺",
    authorDeathYear: 1972, // 川端康成，中国标准2022年公版（边缘，保守处理）
    candidates: [
      { name: "岛村", hook: "来了又走，把驹子的感情当成消遣——他有没有那一刻是真心的", dominantDomains: ["禁忌诱惑", "感情关系"] },
      { name: "驹子", hook: "爱了，拼命了，最后什么都没有——她后悔吗", dominantDomains: ["感情关系", "背叛信任"] },
    ],
  },
  {
    title: "麦田里的守望者",
    color: "#6B7A3A", textColor: "#EFE6C9",
    tagline: "讨厌这个世界的虚伪，但又不知道去哪——你有没有这样的时候",
    authorDeathYear: 2010, // 塞林格，美国70年规则2080年公版
    candidates: [
      { name: "霍尔顿", hook: "逃学、说谎、消沉——但他在乎的那些事，真的有人在乎吗", dominantDomains: ["身份认同", "禁忌诱惑"] },
    ],
  },
  {
    title: "局外人",
    color: "#3A3A4A", textColor: "#EFE6C9",
    tagline: "他什么都没做错，却被判了死刑——这个世界在审判什么",
    authorDeathYear: 1960, // 加缪，中国标准2010年已公版 ✅
    candidates: [
      { name: "默尔索", hook: "不哭、不解释、不配合——他是冷漠，还是唯一诚实的人", dominantDomains: ["身份认同", "禁忌诱惑"] },
    ],
  },
  {
    title: "挪威的森林", channel: "romance",
    color: "#2C5F4A", textColor: "#EFE6C9",
    tagline: "青春期的爱，浓烈到自己都不知道会把人烧成什么样",
    authorDeathYear: 9999, // 村上春树在世，版权保护中
    candidates: [
      { name: "渡边", hook: "爱着直子，却被绿子拉住——他究竟在选择什么", dominantDomains: ["感情关系", "禁忌诱惑"] },
      { name: "直子", hook: "再努力也回不来了——消失是她唯一找到的出口吗", dominantDomains: ["感情关系", "背叛信任"] },
    ],
  },
  {
    title: "百年孤独",
    color: "#8B5E3C", textColor: "#EFE6C9",
    tagline: "一个家族七代人，每个人都在重复同一种孤独",
    authorDeathYear: 2014, // 马尔克斯，2064年公版
    candidates: [
      { name: "奥雷里亚诺上校", hook: "打了那么多年仗，最后亲手画出了自己命运的边界", dominantDomains: ["命运偏爱", "背叛信任"] },
      { name: "乌尔苏拉", hook: "撑起了整个家族一百年，但她真的快乐过吗", dominantDomains: ["家庭代际", "禁忌诱惑"] },
    ],
  },
  {
    title: "了不起的盖茨比",
    color: "#1A4A6B", textColor: "#EFE6C9",
    tagline: "为了一个幻觉，他把自己活成了一个传奇，然后死了",
    authorDeathYear: 1940, // 菲茨杰拉德，1990年已公版 ✅
    candidates: [
      { name: "盖茨比", hook: "用五年时间和一座豪宅换取旧梦回来——值过，然后没了", dominantDomains: ["命运偏爱", "禁忌诱惑"] },
      { name: "黛西", hook: "被爱着被仰望着，最后坐进车里逃走了——她爱他吗", dominantDomains: ["禁忌诱惑", "背叛信任"] },
    ],
  },

  // ── 新增：大众认知高 + 版权安全 + 困境丰富 ──────────────────────────────

  // 中国现代文学
  {
    title: "子夜",
    color: "#2E3A28", textColor: "#EFE6C9",
    tagline: "一个商人用尽手段想活下去，结果被时代的齿轮碾碎",
    authorDeathYear: 1981, // 茅盾1981年去世，2031年公版（有版权风险）
    candidates: [
      { name: "吴荪甫", hook: "掌控欲极强、手段老辣，但那个时代根本不给他赢的机会", dominantDomains: ["生存底线", "命运偏爱"] },
    ],
  },
  {
    title: "家",
    color: "#6B3A2A", textColor: "#EFE6C9",
    tagline: "一个大家族的囚笼里，年轻人怎么活，怎么逃",
    authorDeathYear: 2005, // 巴金2005年去世，2055年公版（有版权风险）
    candidates: [
      { name: "觉新", hook: "接受了所有规则，也亲手送走了所爱的人——他后悔吗", dominantDomains: ["家庭代际", "背叛信任"] },
      { name: "觉慧", hook: "最先逃出去的那个，回头看时会不会也有一种罪感", dominantDomains: ["背叛信任", "身份认同"] },
      { name: "鸣凤", hook: "爱了、盼了，最后跳进湖里——这是绝望还是唯一的自由", dominantDomains: ["禁忌诱惑", "命运偏爱"] },
    ],
  },
  {
    title: "日出",
    color: "#C4852A", textColor: "#EFE6C9",
    tagline: "纸醉金迷的背后，每个人都在用自己的方式熬过黑夜",
    authorDeathYear: 1996, // 曹禺1996年去世，2046年公版（有版权风险）
    candidates: [
      { name: "陈白露", hook: "用美貌和聪明周旋于权贵之间，却救不了自己——她早就知道结局吗", dominantDomains: ["禁忌诱惑", "生存底线"] },
      { name: "方达生", hook: "带着理想来，却什么都没改变——天真是他的错吗", dominantDomains: ["身份认同", "命运偏爱"] },
    ],
  },
  {
    title: "雷雨",
    color: "#3A2A1A", textColor: "#EFE6C9",
    tagline: "一个家族藏了三十年的秘密，最后在一个雷雨夜全部炸开",
    authorDeathYear: 1996, // 曹禺，2046年公版（1996+50=2046，有版权风险）
    candidates: [
      { name: "周朴园", hook: "用权威和金钱维持了一个家，但这个家从来没有人是自由的", dominantDomains: ["家庭代际", "背叛信任"] },
      { name: "繁漪", hook: "爱上了不该爱的人，然后把所有人都拖进了深渊", dominantDomains: ["禁忌诱惑", "背叛信任"] },
      { name: "周萍", hook: "逃了，又回来了，最后什么都没逃掉", dominantDomains: ["禁忌诱惑", "命运偏爱"] },
    ],
  },
  {
    title: "祝福",
    color: "#4A3520", textColor: "#EFE6C9",
    tagline: "一个女人被规则碾碎，而每个人都觉得自己没有错",
    authorDeathYear: 1936, // 鲁迅，1986年已公版 ✅
    candidates: [
      { name: "祥林嫂", hook: "遵守了所有规则，仍然被所有人抛弃——规则到底保护了谁", dominantDomains: ["命运偏爱", "身份认同"] },
    ],
  },
  {
    title: "伤逝", channel: "romance",
    color: "#5C4A38", textColor: "#EFE6C9",
    tagline: "爱情烧得最旺的时候，生活的代价就开始显现了",
    authorDeathYear: 1936, // 鲁迅，1986年已公版 ✅
    candidates: [
      { name: "涓生", hook: "爱过，但爱不够用——他最后的那句话，是懦弱还是诚实", dominantDomains: ["感情关系", "背叛信任"] },
      { name: "子君", hook: "为爱放弃了一切，却发现爱本身也会耗尽", dominantDomains: ["感情关系", "命运偏爱"] },
    ],
  },

  // 外国经典（作者去世满50年）
  {
    title: "安娜·卡列尼娜", channel: "romance",
    color: "#7A3A3A", textColor: "#EFE6C9",
    tagline: "她只是想要真实地活着，却被整个社会判了死刑",
    authorDeathYear: 1910, // 列夫·托尔斯泰，1960年已公版 ✅
    candidates: [
      { name: "安娜", hook: "选择了爱，放弃了一切——她后悔过吗，还是从不后悔", dominantDomains: ["禁忌诱惑", "命运偏爱"] },
      { name: "卡列宁", hook: "被背叛了，选择了宽容，却没人感谢他——他到底输在哪里", dominantDomains: ["背叛信任", "感情关系"] },
      { name: "渥伦斯基", hook: "爱了，但爱得不够彻底——他心里知道吗", dominantDomains: ["禁忌诱惑", "背叛信任"] },
    ],
  },
  {
    title: "复活",
    color: "#3A5A3A", textColor: "#EFE6C9",
    tagline: "一个贵族良心发现，想救赎自己——但代价是全部",
    authorDeathYear: 1910, // 列夫·托尔斯泰，1960年已公版 ✅
    candidates: [
      { name: "聂赫留朵夫", hook: "亲手毁了一个人，良心来得太晚——救赎算不算一种自私", dominantDomains: ["背叛信任", "身份认同"] },
      { name: "玛丝洛娃", hook: "被辜负了，又被拯救了——她真的原谅了吗", dominantDomains: ["背叛信任", "命运偏爱"] },
    ],
  },
  {
    title: "罪与罚",
    color: "#2A2A3A", textColor: "#EFE6C9",
    tagline: "他以为自己是超人，杀了人之后才发现良心比法律更重",
    authorDeathYear: 1881, // 陀思妥耶夫斯基，1931年已公版 ✅
    candidates: [
      { name: "拉斯柯尔尼科夫", hook: "用理论说服了自己，却压不住那个声音——他的底线在哪", dominantDomains: ["生存底线", "身份认同"] },
      { name: "索尼娅", hook: "活在最深的污泥里，却是全书最干净的人——她靠什么撑着", dominantDomains: ["生存底线", "命运偏爱"] },
    ],
  },
  {
    title: "卡拉马佐夫兄弟",
    color: "#4A3A28", textColor: "#EFE6C9",
    tagline: "一家人各自信奉不同的道路，最后用父亲的死作了裁判",
    authorDeathYear: 1881, // 陀思妥耶夫斯基，1931年已公版 ✅
    candidates: [
      { name: "阿廖沙", hook: "善良到近乎圣人——在这个世界里，这是力量还是软弱", dominantDomains: ["身份认同", "生存底线"] },
      { name: "伊万", hook: "用理性否定了上帝，却发现理性本身也会崩溃", dominantDomains: ["身份认同", "禁忌诱惑"] },
      { name: "德米特里", hook: "激情、冲动、爱，然后坐进牢里——他是凶手吗", dominantDomains: ["禁忌诱惑", "命运偏爱"] },
    ],
  },
  {
    title: "悲惨世界",
    color: "#2A3A4A", textColor: "#EFE6C9",
    tagline: "一个人用一生证明：人可以变好，但社会不一定接受",
    authorDeathYear: 1885, // 雨果，1935年已公版 ✅
    candidates: [
      { name: "冉阿让", hook: "改变了，努力了，仍然被追着跑——他什么时候才能停下来", dominantDomains: ["身份认同", "命运偏爱"] },
      { name: "沙威", hook: "一辈子执行规则，却发现规则本身是错的——他该怎么办", dominantDomains: ["身份认同", "生存底线"] },
      { name: "芳汀", hook: "为了孩子卖掉一切，最后连命都没留住", dominantDomains: ["家庭代际", "生存底线"] },
    ],
  },
  {
    title: "老人与海",
    color: "#3A6A7A", textColor: "#EFE6C9",
    tagline: "他一无所获地回来了，但那条船上装着什么，只有他自己知道",
    authorDeathYear: 1961, // 海明威，2011年已公版 ✅
    candidates: [
      { name: "桑地亚哥", hook: "打了三天，什么都没带回来——这算失败吗，还是他赢了什么别的东西", dominantDomains: ["命运偏爱", "生存底线"] },
    ],
  },
  {
    title: "双城记",
    color: "#4A3A5A", textColor: "#EFE6C9",
    tagline: "在最好的时代和最坏的时代，爱和牺牲能走多远",
    authorDeathYear: 1870, // 狄更斯，1920年已公版 ✅
    candidates: [
      { name: "卡顿", hook: "爱着一个不爱他的人，最后用死亡完成了他一生最高光的时刻", dominantDomains: ["感情关系", "背叛信任"] },
      { name: "达内", hook: "放弃了贵族身份，却发现历史不在乎你的良心", dominantDomains: ["身份认同", "命运偏爱"] },
    ],
  },
  {
    title: "简·爱", channel: "romance",
    color: "#7A5A6A", textColor: "#EFE6C9",
    tagline: "一个一无所有的女人，坚持说：我和你地位平等",
    authorDeathYear: 1855, // 夏洛蒂·勃朗特，1905年已公版 ✅
    candidates: [
      { name: "简·爱", hook: "没钱、没背景，却拒绝了屈辱的爱——她的底气从哪里来", dominantDomains: ["身份认同", "感情关系"] },
      { name: "罗切斯特", hook: "藏了一个秘密，爱上了不该爱的人，最后双眼失明", dominantDomains: ["禁忌诱惑", "背叛信任"] },
    ],
  },
  {
    title: "呼啸山庄", channel: "romance",
    color: "#3A3028", textColor: "#EFE6C9",
    tagline: "他用一生去报复，却不知道自己究竟是在恨还是在爱",
    authorDeathYear: 1848, // 艾米莉·勃朗特，1898年已公版 ✅
    candidates: [
      { name: "希斯克利夫", hook: "被抛弃过，然后用恨撑了一辈子——那恨里有多少还是爱", dominantDomains: ["背叛信任", "禁忌诱惑"] },
      { name: "凯瑟琳", hook: "爱着一个人，嫁给了另一个——她一直知道自己选了什么吗", dominantDomains: ["感情关系", "禁忌诱惑"] },
    ],
  },
  {
    title: "战争与和平",
    color: "#4A5A3A", textColor: "#EFE6C9",
    tagline: "战争打完了，那些活下来的人，怎么跟自己和解",
    authorDeathYear: 1910, // 列夫·托尔斯泰，1960年已公版 ✅
    candidates: [
      { name: "安德烈公爵", hook: "荣耀、幻灭、重生——他每次以为找到了意义，下一刻又失去了", dominantDomains: ["命运偏爱", "身份认同"] },
      { name: "娜塔莎", hook: "热烈、冲动、犯了大错——她最后变成的那个人，是成长还是妥协", dominantDomains: ["禁忌诱惑", "感情关系"] },
      { name: "彼埃尔", hook: "有钱有地位，一直找不到活着的意义——最后找到了吗", dominantDomains: ["身份认同", "命运偏爱"] },
    ],
  },
  {
    title: "变形记",
    color: "#3A4A2A", textColor: "#EFE6C9",
    tagline: "一天早上他变成了甲虫，家人的反应比变形更让人心寒",
    authorDeathYear: 1924, // 卡夫卡，1974年已公版 ✅
    candidates: [
      { name: "格里高尔", hook: "一直在养活全家，变成虫子之后才看清楚他在这个家里是什么", dominantDomains: ["家庭代际", "身份认同"] },
      { name: "格蕾特", hook: "最爱他的人，最后也说：必须让他离开——她错了吗", dominantDomains: ["家庭代际", "背叛信任"] },
    ],
  },
  {
    title: "审判",
    color: "#2A2A2A", textColor: "#EFE6C9",
    tagline: "他被逮捕了，没人告诉他罪名，他花了一年试图搞清楚",
    authorDeathYear: 1924, // 卡夫卡，1974年已公版 ✅
    candidates: [
      { name: "约瑟夫·K", hook: "在一个没有解释的系统里拼命寻找出路——你有没有这种感觉", dominantDomains: ["身份认同", "生存底线"] },
    ],
  },
  {
    title: "约翰·克利斯朵夫",
    color: "#5A4A2A", textColor: "#EFE6C9",
    tagline: "一个天才用一生和世界较劲，输了很多次，但从没彻底认输",
    authorDeathYear: 1944, // 罗曼·罗兰，1994年已公版 ✅
    candidates: [
      { name: "克利斯朵夫", hook: "才华是他的铠甲，也是他的孤独——有多少人真正懂他", dominantDomains: ["命运偏爱", "身份认同"] },
    ],
  },
  {
    title: "包法利夫人", channel: "romance",
    color: "#8A5A6A", textColor: "#EFE6C9",
    tagline: "她以为浪漫可以填满生活，直到债主上门",
    authorDeathYear: 1880, // 福楼拜，1930年已公版 ✅
    candidates: [
      { name: "爱玛", hook: "向往诗意的生活，选择了现实的婚姻——她不幸福是谁的错", dominantDomains: ["禁忌诱惑", "感情关系"] },
      { name: "夏尔", hook: "爱她爱到最后，却从来不是她想要的那种爱", dominantDomains: ["感情关系", "背叛信任"] },
    ],
  },
  {
    title: "红与黑",
    color: "#8A2A2A", textColor: "#EFE6C9",
    tagline: "他想用才华和野心爬出底层，却不知道规则是为谁定的",
    authorDeathYear: 1842, // 司汤达，1892年已公版 ✅
    candidates: [
      { name: "于连", hook: "聪明、敏感、充满野心——他最大的敌人是社会还是他自己", dominantDomains: ["身份认同", "禁忌诱惑"] },
      { name: "德·瑞那夫人", hook: "爱上了不该爱的人，最后用一封信毁了他——她是输了还是赢了", dominantDomains: ["禁忌诱惑", "背叛信任"] },
    ],
  },
  {
    title: "高老头",
    color: "#6A5A3A", textColor: "#EFE6C9",
    tagline: "他把一切给了女儿，女儿给了他一个孤独的死亡",
    authorDeathYear: 1850, // 巴尔扎克，1900年已公版 ✅
    candidates: [
      { name: "高老头", hook: "父爱是他的全部，也是他被榨干的原因——他活该吗", dominantDomains: ["家庭代际", "背叛信任"] },
      { name: "拉斯蒂涅", hook: "刚入社会，看清了游戏规则——他决定加入，你怎么看他", dominantDomains: ["身份认同", "命运偏爱"] },
    ],
  },
  {
    title: "堂吉诃德",
    color: "#B5823A", textColor: "#EFE6C9",
    tagline: "他以为自己是骑士，所有人都说他疯了——谁才是对的",
    authorDeathYear: 1616, // 塞万提斯，1666年已公版 ✅
    candidates: [
      { name: "堂吉诃德", hook: "活在自己的意义里，哪怕风车是风车——这是愚蠢还是一种尊严", dominantDomains: ["身份认同", "命运偏爱"] },
      { name: "桑丘", hook: "陪着一个疯子跑遍全国，最后收获了什么——他后悔吗", dominantDomains: ["背叛信任", "命运偏爱"] },
    ],
  },
  // ── 言情 ──────────────────────────────────────────────
  {
    title: "牡丹亭", channel: "romance",
    color: "#B0447A", textColor: "#FBEAF1",
    tagline: "情不知所起，一往而深——为爱而死，值不值得",
    authorDeathYear: 1616, // 汤显祖，已公版 ✅
    candidates: [
      { name: "杜丽娘", hook: "被礼教关了一辈子，一场梦里的情让她甘愿去死——她疯了还是最清醒", dominantDomains: ["感情关系", "禁忌诱惑"] },
      { name: "柳梦梅", hook: "为一个梦里的女人掘墓、还魂、赴考——痴情到底是勇气还是执念", dominantDomains: ["感情关系", "命运偏爱"] },
    ],
  },
  {
    title: "半生缘", channel: "romance",
    color: "#8A5A6E", textColor: "#F5E8EE",
    tagline: "他们回不去了——被命运和至亲联手拆散的爱情",
    authorDeathYear: 1995, // 张爱玲
    candidates: [
      { name: "顾曼桢", hook: "明明相爱，却被亲姐姐和整个家庭的算计一步步推开——她该恨谁", dominantDomains: ["感情关系", "背叛信任"] },
      { name: "沈世钧", hook: "爱得不够勇敢，一次次退让，最后亲手放走了一生所爱", dominantDomains: ["感情关系", "身份认同"] },
    ],
  },
  // ── 仙侠 ──────────────────────────────────────────────
  {
    title: "蜀山剑侠传", channel: "xianxia",
    color: "#2E6B7A", textColor: "#E8F6FA",
    tagline: "长生、飞升、诛邪——修的是道，还是心中放不下的执念",
    authorDeathYear: 1961, // 还珠楼主
    candidates: [
      { name: "李英琼", hook: "少女拜入仙门追求长生大道，正邪之间步步是选择——修仙先修心", dominantDomains: ["身份认同", "命运偏爱"] },
    ],
  },
  {
    title: "诛仙", channel: "xianxia",
    color: "#3A4A7A", textColor: "#E8ECFA",
    tagline: "何为正，何为邪——当正道逼你堕入魔道，你还守什么",
    authorDeathYear: 9999, // 萧鼎在世·网文
    candidates: [
      { name: "张小凡", hook: "出身正道却被逼向魔道，深爱的两个女子分属正邪——他到底该信谁", dominantDomains: ["感情关系", "身份认同"] },
      { name: "陆雪琪", hook: "正道天才，一边是门派大义一边是心中所爱——剑再利，也斩不断情", dominantDomains: ["感情关系", "职场权力"] },
    ],
  },
  // ── 网文 ──────────────────────────────────────────────
  {
    title: "琅琊榜", channel: "modern",
    color: "#3A5A4A", textColor: "#E8F5EE",
    tagline: "背负血海深仇归来，用尽算计复仇——赢了棋局，输了什么",
    authorDeathYear: 9999, // 海宴·网文
    candidates: [
      { name: "梅长苏", hook: "以病弱之躯运筹翻案，为复仇不惜牺牲旧友与自己——值不值", dominantDomains: ["职场权力", "背叛信任"] },
      { name: "霓凰", hook: "等了一个人十几年，认出他却不能相认——大局与私情该怎么选", dominantDomains: ["感情关系", "身份认同"] },
    ],
  },
  {
    title: "全职高手", channel: "modern",
    color: "#2A5A6E", textColor: "#E8F4FA",
    tagline: "巅峰跌落后从零再来——尊严、热爱与现实，你为哪个坚持",
    authorDeathYear: 9999, // 蝴蝶蓝·网文
    candidates: [
      { name: "叶修", hook: "被俱乐部逼着退役、交出账号，从网吧重新打起——热爱能不能对抗现实", dominantDomains: ["职场权力", "身份认同"] },
    ],
  },

  // ── 江湖仙侠·扩充 ─────────────────────────────────────
  {
    title: "射雕英雄传", channel: "xianxia",
    color: "#2E5A6B", textColor: "#E8F4FA",
    tagline: "憨直少年一步步长成大侠——侠之大者，是天赋还是选择",
    authorDeathYear: 9999,
    candidates: [
      { name: "郭靖", hook: "天资平平却守着最笨的道义，家国与恩义冲突时他从不取巧——值不值", dominantDomains: ["身份认同", "背叛信任"] },
      { name: "黄蓉", hook: "聪明绝顶、为爱不管不顾——她的机变到底护住了什么、又放弃了什么", dominantDomains: ["感情关系", "命运偏爱"] },
      { name: "杨康", hook: "认贼作父享尽荣华，还是认祖归宗一无所有——他选了前者，你会怎么选", dominantDomains: ["身份认同", "背叛信任"] },
      { name: "梅超风", hook: "为爱偷师、练邪功、被逐出师门——世人骂她妖女，她只恨自己不够狠", dominantDomains: ["禁忌诱惑", "命运偏爱"] },
    ],
  },
  {
    title: "天龙八部", channel: "xianxia",
    color: "#3A4A5C", textColor: "#E8ECF4",
    tagline: "身世、家国、爱恨——每个人都被命运推着走向不愿去的地方",
    authorDeathYear: 9999,
    candidates: [
      { name: "乔峰", hook: "顶天立地的英雄一夜成了人人喊打的契丹人——身份是别人给的，他还能是谁", dominantDomains: ["身份认同", "命运偏爱"] },
      { name: "段誉", hook: "不愿学武、不愿争斗，却被卷进所有恩怨——善良在这个世界够用吗", dominantDomains: ["感情关系", "身份认同"] },
      { name: "虚竹", hook: "只想做个安分和尚，却被塞了一身武功和权位——你要的和命给的不一样时", dominantDomains: ["命运偏爱", "身份认同"] },
      { name: "慕容复", hook: "一辈子只为复国这一件事，亲情爱情全能牺牲——执念把人熬成了什么", dominantDomains: ["职场权力", "身份认同"] },
      { name: "阿紫", hook: "用最狠的方式霸占喜欢的人，坏得理直气壮——偏执的爱还算不算爱", dominantDomains: ["禁忌诱惑", "感情关系"] },
    ],
  },
  {
    title: "笑傲江湖", channel: "xianxia",
    color: "#3A5A4E", textColor: "#E8F5EE",
    tagline: "人人都说退隐江湖，可权力的游戏里，谁真能全身而退",
    authorDeathYear: 9999,
    candidates: [
      { name: "令狐冲", hook: "只想自由自在，却被门派、正邪、权谋反复裹挟——洒脱是不是也要付代价", dominantDomains: ["身份认同", "背叛信任"] },
      { name: "岳不群", hook: "端着君子的体面走向深渊——他是什么时候开始骗自己的", dominantDomains: ["职场权力", "禁忌诱惑"] },
      { name: "东方不败", hook: "为绝世武功挥刀自宫，登顶后却只想安静绣花陪爱人——权力和真心哪个是他要的", dominantDomains: ["禁忌诱惑", "职场权力"] },
      { name: "林平之", hook: "满门被灭的受害者，为复仇一步步变成比仇人更狠的人——恨能不能有尽头", dominantDomains: ["背叛信任", "命运偏爱"] },
    ],
  },

  // ── 热血今潮·扩充 ─────────────────────────────────────
  {
    title: "三体", channel: "modern",
    color: "#1C2A4A", textColor: "#E6ECFA",
    tagline: "文明存亡面前，道德与生存哪个先崩塌",
    authorDeathYear: 9999,
    candidates: [
      { name: "罗辑", hook: "被迫背负全人类的命运，用最冷酷的威慑换和平——救世主和刽子手只差一念", dominantDomains: ["生存底线", "身份认同"] },
      { name: "叶文洁", hook: "对人类彻底失望，按下了那个按钮——她是罪人，还是被时代逼疯的清醒者", dominantDomains: ["背叛信任", "命运偏爱"] },
      { name: "章北海", hook: "为了让人类活下去，不惜隐瞒、逃亡、甚至开枪——铁石心肠是懦弱还是最深的责任", dominantDomains: ["生存底线", "背叛信任"] },
      { name: "程心", hook: "两次在关键抉择上选择了善良，两次把人类推向深渊——好人做错事，该不该被原谅", dominantDomains: ["身份认同", "生存底线"] },
    ],
  },
  {
    title: "庆余年", channel: "modern",
    color: "#2A4A3E", textColor: "#E8F5EE",
    tagline: "带着现代观念闯入庙堂——是同流合污，还是改写规则",
    authorDeathYear: 9999,
    candidates: [
      { name: "范闲", hook: "看透了权力的肮脏却身在其中，想守着心里那点干净——现实允许吗", dominantDomains: ["职场权力", "身份认同"] },
    ],
  },
  {
    title: "鬼吹灯", channel: "modern",
    color: "#3A2E1A", textColor: "#F0E6D2",
    tagline: "贪婪、恐惧、义气——在生死墓穴里，人会露出真面目",
    authorDeathYear: 9999,
    candidates: [
      { name: "胡八一", hook: "为钱下墓，却总在生死关头选择救人——他嘴上的规矩和心里的底线哪个更硬", dominantDomains: ["生存底线", "背叛信任"] },
      { name: "王胖子", hook: "贪财、怕死、爱占便宜，可真到关头从不丢下兄弟——市侩和义气能不能共存", dominantDomains: ["生存底线", "感情关系"] },
    ],
  },

  // ── 经典殿堂·扩充（古典名著） ─────────────────────────
  {
    title: "聊斋志异", channel: "classic",
    color: "#3A2A4A", textColor: "#F0E6FA",
    tagline: "花妖狐魅比人更有情——真正吃人的从来不是鬼",
    authorDeathYear: 1715,
    candidates: [
      { name: "宁采臣", hook: "穷书生守着一身正气，面对聂小倩的深情与危险——胆小和守正只有一线之隔", dominantDomains: ["感情关系", "身份认同"] },
      { name: "聂小倩", hook: "被迫害人的女鬼想做回好人——洗清过往需要付出什么", dominantDomains: ["命运偏爱", "禁忌诱惑"] },
      { name: "王生（画皮）", hook: "明知那女子来历不明，还是把她带回了家——色欲和警觉之间，人常常选错", dominantDomains: ["禁忌诱惑", "生存底线"] },
    ],
  },
  {
    title: "封神演义", channel: "classic",
    color: "#5C2A2A", textColor: "#F5E6D2",
    tagline: "天命已定的封神榜上，忠与逆、人与神，谁能自己选",
    authorDeathYear: 1650,
    candidates: [
      { name: "姜子牙", hook: "七十岁才逢明主，替天封神却也替天背了骂名——奉命行事能不能免责", dominantDomains: ["职场权力", "命运偏爱"] },
      { name: "哪吒", hook: "剔骨还父削肉还母，只为不认这具身体带来的亏欠——你能选择自己的出身吗", dominantDomains: ["家庭代际", "身份认同"] },
    ],
  },
  {
    title: "儒林外史", channel: "classic",
    color: "#4A4028", textColor: "#F0E8D2",
    tagline: "读书人挤破头求功名——科举这条独木桥，压弯了多少人的脊梁",
    authorDeathYear: 1754,
    candidates: [
      { name: "范进", hook: "考了大半辈子终于中举，人却疯了——一个人的一生只值一张榜吗", dominantDomains: ["命运偏爱", "身份认同"] },
    ],
  },

  // ── 儿女情长·扩充 ─────────────────────────────────────
  {
    title: "西厢记", channel: "romance",
    color: "#A0446E", textColor: "#FBEAF1",
    tagline: "愿天下有情人终成眷属——可礼教从不给爱情让路",
    authorDeathYear: 1324,
    candidates: [
      { name: "崔莺莺", hook: "相府千金爱上穷书生，一边是门第一边是真心——她敢不敢越那道墙", dominantDomains: ["感情关系", "禁忌诱惑"] },
      { name: "张生", hook: "为爱奔走却前途未卜——爱情和功名，他能不能两全", dominantDomains: ["感情关系", "身份认同"] },
    ],
  },
  {
    title: "乱世佳人", channel: "romance",
    color: "#6E3A3A", textColor: "#F5E6E0",
    tagline: "战火烧尽一切，她靠什么活下去、又错过了什么",
    authorDeathYear: 1949,
    candidates: [
      { name: "斯嘉丽", hook: "为了活下去不择手段，却直到失去才懂自己爱谁——坚强是不是也是一种盲目", dominantDomains: ["生存底线", "感情关系"] },
      { name: "白瑞德", hook: "看透她也纵容她，爱到最后却选择转身离开——真正的爱要不要有底线", dominantDomains: ["感情关系", "背叛信任"] },
    ],
  },
  {
    title: "傲慢与偏见", channel: "romance",
    color: "#5A6E8A", textColor: "#EAF0FA",
    tagline: "先入为主的判断差点错过一生所爱——你敢不敢承认自己看错了人",
    authorDeathYear: 1817,
    candidates: [
      { name: "伊丽莎白", hook: "用偏见筑起高墙，也靠清醒守住自尊——她放下成见需要多大的勇气", dominantDomains: ["感情关系", "身份认同"] },
      { name: "达西", hook: "笨拙的骄傲藏着深情——放下身段去爱一个不如自己门第的人，值吗", dominantDomains: ["感情关系", "职场权力"] },
    ],
  },

  // ── 人间世相·扩充 ─────────────────────────────────────
  {
    title: "追风筝的人", channel: "world",
    color: "#8A5A2A", textColor: "#F5E8D2",
    tagline: "一次背叛背了一辈子——有些错，要用一生去赎",
    authorDeathYear: 9999,
    candidates: [
      { name: "阿米尔", hook: "小时候的懦弱害了最忠诚的朋友，多年后有了赎罪的机会——迟来的勇敢还算勇敢吗", dominantDomains: ["背叛信任", "身份认同"] },
    ],
  },
  {
    title: "四世同堂", channel: "world",
    color: "#4A3A28", textColor: "#F0E6D2",
    tagline: "国难当头的胡同里，每个普通人都在被逼着选边站",
    authorDeathYear: 1966,
    candidates: [
      { name: "祁瑞宣", hook: "想尽孝又想报国，夹在家族责任与民族气节之间——两难时他能不能不做懦夫", dominantDomains: ["家庭代际", "身份认同"] },
      { name: "冠晓荷", hook: "为了活得体面不惜投敌献媚——他是坏，还是只是把生存看得比一切都重", dominantDomains: ["生存底线", "背叛信任"] },
    ],
  },
  {
    title: "月亮与六便士", channel: "world",
    color: "#2A3A5A", textColor: "#E6ECFA",
    tagline: "抛下妻儿去追一个虚无的梦——这是伟大还是自私",
    authorDeathYear: 1965,
    candidates: [
      { name: "斯特里克兰德", hook: "四十岁抛下一切去画画，冷酷得近乎无情——追求纯粹能不能成为伤害别人的理由", dominantDomains: ["身份认同", "背叛信任"] },
    ],
  },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffled<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildBookMeta(
  key: BookKey,
  title: string,
  color: string,
  textColor: string,
  tagline: string,
  candidates: CharCandidate[]
): BookMeta {
  const picked = pickRandom(candidates);
  return {
    key, title, color, textColor, tagline, candidates,
    recommendedChar: picked.name,
    charHook: picked.hook,
    charDomains: picked.dominantDomains,
  };
}

function buildFromLoose(def: LooseBookDef): BookMeta {
  return buildBookMeta(def.title, def.title, def.color, def.textColor, def.tagline, def.candidates);
}

// 四大名著配置
const CLASSICS = [
  { key: "水浒传" as BookKey, title: "水浒传", color: "#1A3A5C", textColor: "#EFE6C9", tagline: "一个大型组织如何把好人逼成反贼", candidates: SHUIHU_CANDIDATES },
  { key: "西游记" as BookKey, title: "西游记", color: "#C34A28", textColor: "#EFE6C9", tagline: "体制、使命与自我之间的永恒拉锯", candidates: XIYOU_CANDIDATES },
  { key: "红楼梦" as BookKey, title: "红楼梦", color: "#C4A0A0", textColor: "#3B2327", tagline: "一个家族崩溃前夜，每个人的自保算计", candidates: HONGLOU_CANDIDATES },
  { key: "三国演义" as BookKey, title: "三国演义", color: "#8B6A1A", textColor: "#EFE6C9", tagline: "理想与权力碰撞的终极战场", candidates: SANGUO_CANDIDATES },
];

export function buildPresetBooks(): BookMeta[] {
  // 第一本：四大名著随机一本（全部公版，无版权风险）
  const classicDef = pickRandom(CLASSICS);
  const classic = buildBookMeta(classicDef.key, classicDef.title, classicDef.color, classicDef.textColor, classicDef.tagline, classicDef.candidates);

  // 版权安全池（作者去世满50年）
  const safeBooksPool = EXTRA_BOOKS.filter(b => isCopyrightSafe(b.authorDeathYear));
  // 情感/言情向：任一角色场域含「感情关系」或「禁忌诱惑」——大众更爱看，多露出
  const isRomance = (b: typeof safeBooksPool[number]) =>
    b.candidates.some(c => c.dominantDomains.some(d => d === "感情关系" || d === "禁忌诱惑"));
  const romancePool = shuffled(safeBooksPool.filter(isRomance));
  const otherPool = shuffled(safeBooksPool.filter(b => !isRomance(b)));

  // 其余三本：优先塞 2 本情感向（大众偏好），再补 1 本其它；不足则互相补齐
  const picks: typeof safeBooksPool = [];
  picks.push(...romancePool.slice(0, 2));
  picks.push(...otherPool.slice(0, 1));
  // 补齐到 3 本（若某类不足）
  const usedTitles = new Set(picks.map(b => b.title));
  for (const b of [...romancePool, ...otherPool]) {
    if (picks.length >= 3) break;
    if (!usedTitles.has(b.title)) { picks.push(b); usedTitles.add(b.title); }
  }

  const extras = picks.map(buildFromLoose);
  return [classic, ...shuffled(extras)];
}

/**
 * 按频道返回该频道的精选书（每个频道随机取 4 本，样式整齐）。
 * any=全库随机（含四大名著，但无硬置顶）；classic=四大名著；其余频道从 EXTRA_BOOKS 按 channel 筛。
 * 只返回版权安全的书。
 */
export function buildBooksByChannel(channel: ChannelKey): BookMeta[] {
  const N = 4;
  // 不限：四大名著 + 全部安全额外书，一起随机，无硬置顶
  if (channel === "any") {
    const classicsAsBooks = CLASSICS.map(d =>
      buildBookMeta(d.key, d.title, d.color, d.textColor, d.tagline, d.candidates));
    const extrasAsBooks = EXTRA_BOOKS
      .filter(b => isCopyrightSafe(b.authorDeathYear))
      .map(buildFromLoose);
    return shuffled([...classicsAsBooks, ...extrasAsBooks]).slice(0, N);
  }
  if (channel === "classic") {
    return shuffled(CLASSICS).slice(0, N).map(d =>
      buildBookMeta(d.key, d.title, d.color, d.textColor, d.tagline, d.candidates));
  }
  const pool = EXTRA_BOOKS
    .filter(b => isCopyrightSafe(b.authorDeathYear))
    .filter(b => (b.channel ?? "world") === channel);
  return shuffled(pool).slice(0, N).map(buildFromLoose);
}

// ── 主题偏好 ────────────────────────────────────────────────────
// 每个主题映射到「困境场域」。选主题只是「优先推荐 + 加重」，
// 绝不硬塞：只会浮现原著里本就带该场域标签的书与角色。
export type ThemeKey = "any" | "love" | "career" | "growth" | "family" | "survival";

export interface ThemeDef {
  key: ThemeKey;
  label: string;
  /** 该主题匹配的 dominantDomains（用于给书/角色打分与加重困境） */
  domains: string[];
}

export const THEMES: ThemeDef[] = [
  { key: "any", label: "不限", domains: [] },
  { key: "love", label: "爱情·恋人", domains: ["感情关系", "禁忌诱惑"] },
  { key: "career", label: "职场·权力", domains: ["生存底线", "背叛信任"] },
  { key: "growth", label: "自我·成长", domains: ["身份认同", "命运偏爱"] },
  { key: "family", label: "家庭·代际", domains: ["家庭代际", "背叛信任"] },
  { key: "survival", label: "命运·生存", domains: ["生存底线", "命运偏爱"] },
];

export function getThemeDomains(theme: ThemeKey): string[] {
  return THEMES.find(t => t.key === theme)?.domains ?? [];
}

/** 某角色对某主题的匹配分：dominantDomains 命中主题 domains 的数量 */
function charThemeScore(c: CharCandidate, domains: string[]): number {
  if (domains.length === 0) return 0;
  return c.dominantDomains.filter(d => domains.includes(d)).length;
}

/** 某书对某主题的匹配分：取书中角色的最高匹配分 */
function bookThemeScore(candidates: CharCandidate[], domains: string[]): number {
  return candidates.reduce((max, c) => Math.max(max, charThemeScore(c, domains)), 0);
}

/** 用主题偏好挑选推荐角色：优先命中主题的角色，其次随机 */
function buildBookMetaForTheme(
  key: BookKey, title: string, color: string, textColor: string,
  tagline: string, candidates: CharCandidate[], domains: string[]
): BookMeta {
  let picked: CharCandidate;
  if (domains.length > 0) {
    const matched = candidates.filter(c => charThemeScore(c, domains) > 0);
    picked = matched.length > 0
      ? pickRandom(matched.sort((a, b) => charThemeScore(b, domains) - charThemeScore(a, domains))
          .filter((c, _, arr) => charThemeScore(c, domains) === charThemeScore(arr[0], domains)))
      : pickRandom(candidates);
  } else {
    picked = pickRandom(candidates);
  }
  return { key, title, color, textColor, tagline, candidates,
    recommendedChar: picked.name, charHook: picked.hook, charDomains: picked.dominantDomains };
}

/**
 * 按主题偏好构建书架：
 * - theme=any → 等同 buildPresetBooks（随机）
 * - 其它主题 → 优先浮现「原著里本就带该场域」的书与角色，
 *   数量不足时用随机安全书补齐，保证书架始终 4 本。
 */
export function buildPresetBooksByTheme(theme: ThemeKey): BookMeta[] {
  const domains = getThemeDomains(theme);
  if (domains.length === 0) return buildPresetBooks();

  // 第一本仍优先四大名著（全部公版），且尽量选命中主题的那本
  const classicsScored = CLASSICS
    .map(d => ({ d, score: bookThemeScore(d.candidates, domains) }))
    .sort((a, b) => b.score - a.score);
  const topClassicScore = classicsScored[0]?.score ?? 0;
  const classicPool = classicsScored.filter(x => x.score === topClassicScore).map(x => x.d);
  const cDef = pickRandom(classicPool.length ? classicPool : CLASSICS);
  const classic = buildBookMetaForTheme(cDef.key, cDef.title, cDef.color, cDef.textColor, cDef.tagline, cDef.candidates, domains);

  // 其余：版权安全 + 命中主题的书优先，随机补足
  const safe = EXTRA_BOOKS.filter(b => isCopyrightSafe(b.authorDeathYear));
  const matched = shuffled(safe.filter(b => bookThemeScore(b.candidates, domains) > 0));
  const rest = shuffled(safe.filter(b => bookThemeScore(b.candidates, domains) === 0));
  const extraDefs = [...matched, ...rest].slice(0, 3);
  const extras = extraDefs.map(def =>
    buildBookMetaForTheme(def.title, def.title, def.color, def.textColor, def.tagline, def.candidates, domains));

  return [classic, ...extras];
}

// SSR 静态兜底（hydration 后立刻被客户端覆盖，只用版权安全的书）
const _safeExtras = EXTRA_BOOKS.filter(b => isCopyrightSafe(b.authorDeathYear));
export const PRESET_BOOKS: BookMeta[] = [
  buildBookMeta("水浒传", "水浒传", "#1A3A5C", "#EFE6C9", "一个大型组织如何把好人逼成反贼", SHUIHU_CANDIDATES),
  buildFromLoose(_safeExtras[0] ?? EXTRA_BOOKS[4]),
  buildFromLoose(_safeExtras[1] ?? EXTRA_BOOKS[5]),
  buildFromLoose(_safeExtras[2] ?? EXTRA_BOOKS[6]),
];

// ── 完整书库（用于校验与推荐）──────────────────────────────────────
export const ALL_BOOKS: BookMeta[] = [
  buildBookMeta("水浒传", "水浒传", "#1A3A5C", "#EFE6C9", "一个大型组织如何把好人逼成反贼", SHUIHU_CANDIDATES),
  buildBookMeta("西游记", "西游记", "#C34A28", "#EFE6C9", "体制、使命与自我之间的永恒拉锯", XIYOU_CANDIDATES),
  buildBookMeta("红楼梦", "红楼梦", "#C4A0A0", "#3B2327", "一个家族崩溃前夜，每个人的自保算计", HONGLOU_CANDIDATES),
  buildBookMeta("三国演义", "三国演义", "#8B6A1A", "#EFE6C9", "理想与权力碰撞的终极战场", SANGUO_CANDIDATES),
  ...EXTRA_BOOKS.map(buildFromLoose),
];

/**
 * 精确匹配书名（忽略空格、书名号、全半角差异）。
 * 返回 BookMeta 或 null。
 */
export function lookupBook(raw: string): BookMeta | null {
  const normalize = (s: string) =>
    s.replace(/[《》\s]/g, "").replace(/\uFF08/g, "(").replace(/\uFF09/g, ")").toLowerCase();
  const key = normalize(raw);
  return ALL_BOOKS.find(b => normalize(b.title) === key) ?? null;
}

/**
 * 按关键字相似度推荐最多 `n` 本书（字符重叠度排序）。
 */
export function findSimilarBooks(raw: string, n = 3): BookMeta[] {
  const normalize = (s: string) => s.replace(/[《》\s]/g, "").toLowerCase();
  const key = normalize(raw);
  const scored = ALL_BOOKS.map(b => {
    const title = normalize(b.title);
    // 计算共同字符数 / 最长长度
    let overlap = 0;
    for (const ch of key) if (title.includes(ch)) overlap++;
    const score = overlap / Math.max(key.length, title.length, 1);
    return { book: b, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(x => x.book);
}

/**
 * 按书名找到该书所有候选角色，按 dominantDomains 多样性排序。
 * excludeNames：已经展示过的角色名，不会再出现。
 * 排序规则：每个角色的 dominantDomains 和已展示角色的 domains 重叠越少越靠前
 *（保证每次换角色都带来新的故事维度）。
 */
export function getCandidatesForBook(
  bookTitle: string,
  excludeNames: string[] = []
): CharCandidate[] {
  const normalize = (s: string) => s.replace(/[《》\s]/g, "").toLowerCase();
  const key = normalize(bookTitle);

  // 先从四大名著候选池找
  const CLASSICS_MAP: Record<string, CharCandidate[]> = {};
  // 动态从 ALL_BOOKS 里取
  const book = ALL_BOOKS.find(b => normalize(b.title) === key);
  if (!book) return [];

  const remaining = book.candidates.filter(c => !excludeNames.includes(c.name));
  if (remaining.length === 0) return [];

  // 计算多样性分：和 excludeNames 对应角色的 domains 重叠越少，得分越高
  const usedDomains = new Set(
    book.candidates
      .filter(c => excludeNames.includes(c.name))
      .flatMap(c => c.dominantDomains)
  );

  return remaining
    .map(c => {
      const overlap = c.dominantDomains.filter(d => usedDomains.has(d)).length;
      const diversity = c.dominantDomains.length - overlap; // 新维度数量
      return { candidate: c, score: diversity };
    })
    .sort((a, b) => b.score - a.score)
    .map(x => x.candidate);
}

// ── AI Analysis Output ──────────────────────────────────────
export interface ValueAxis {
  key: string;       // e.g. "尊严优先度"
  low: string;       // low pole label e.g. "隐忍"
  high: string;      // high pole label e.g. "爆发"
  description: string;
}

export interface ChoiceOption {
  id: string;        // "A" | "B" | "C"
  label: string;     // 甲 乙 丙
  text: string;      // short option text
  innerVoice: string;// expandable monologue
  revealText: string;// post-choice "点破语" — plain language insight
  socialTag: string; // modern anxiety tag shown after choice
  scores: Record<string, number>; // axis key → delta (-30 to +30)
  isTrap?: boolean;  // triggers special ending if selected
}

export interface StoryScene {
  id: string;
  title: string;       // scene title e.g. "初遇血案"
  messages: StoryMessage[];
  choices: ChoiceOption[];
  trapEndingText?: string;    // shown on trap selection
  trapRevivalText?: string;   // spoken by fate/deity on revival
  consequenceMap: Record<string, StoryMessage[]>; // choiceId → aftermath
  forcedContinue: StoryMessage[];
}

export interface StoryMessage {
  id: string;
  type: "narrator" | "dialog" | "inner" | "system";
  text: string;
  delay?: number;
}

export interface AnalysisResult {
  bookTitle: string;
  character: string;
  characterTagline: string;  // modern one-liner e.g. "顶级技术骨干，情商为零"
  driveAnalysis: string[];   // 3 lines: anger source, protecting what, fears losing
  axes: ValueAxis[];         // 4 value axes
  scenes: StoryScene[];      // 3-5 scenes
  endingTypes: EndingType[];
}

export interface EndingType {
  id: string;
  condition: (scores: Record<string, number>) => boolean;
  title: string;
  narration: string;
}

// ── Game State ───────────────────────────────────────────────
export interface GameState {
  phase: "select" | "loading" | "character" | "game" | "result";
  bookMeta: BookMeta | null;
  customBookTitle: string;
  analysis: AnalysisResult | null;
  currentScene: number;
  scores: Record<string, number>;
  choiceHistory: string[];
  isDead: boolean;
  isRevived: boolean;
}

export const INITIAL_STATE: GameState = {
  phase: "select",
  bookMeta: null,
  customBookTitle: "",
  analysis: null,
  currentScene: 0,
  scores: {},
  choiceHistory: [],
  isDead: false,
  isRevived: false,
};

// ── Scoring helpers ──────────────────────────────────────────
export function applyScores(
  current: Record<string, number>,
  axes: ValueAxis[],
  delta: Record<string, number>
): Record<string, number> {
  const next = { ...current };
  for (const axis of axes) {
    const d = delta[axis.key] ?? 0;
    next[axis.key] = Math.min(100, Math.max(0, (next[axis.key] ?? 50) + d));
  }
  return next;
}

export function initScores(axes: ValueAxis[]): Record<string, number> {
  return Object.fromEntries(axes.map((a) => [a.key, 50]));
}

export function pickEnding(
  endings: EndingType[],
  scores: Record<string, number>
): EndingType {
  return endings.find((e) => e.condition(scores)) ?? endings[endings.length - 1];
}
