// src/lib/agent/dilemma-library.ts
// 困境库 — 结构化困境数据，按场域分类，Agent 按条件筛选

export type DilemmaDomain =
  | "职场权力"
  | "家庭代际"
  | "感情关系"
  | "身份认同"
  | "生存底线"
  | "命运偏爱"
  | "禁忌诱惑"
  | "背叛信任";

export interface Dilemma {
  id: string;
  domain: DilemmaDomain;
  core: string;
  modernContext: string;
  modernTag: string;
  intensity: 1 | 2 | 3;
  extremeVersion?: string;
  /** 故事吸引力 1-5，加权随机时权重为 score²；5=爽/虐兼备，3=平稳推进，1=思辨压轴 */
  storyAppeal: 1 | 2 | 3 | 4 | 5;
  /**
   * 现代结构性张力——这个处境在今天可以被命名的底层问题。
   * 不是评判，是认知工具：让锚点能照见"处境本身"，而不只是"你的选择"。
   * 格式：一句话，点出这个处境的结构性本质，带有当代视角的锐度。
   */
  modernTension: string;
}

export const DILEMMA_LIBRARY: Dilemma[] = [
  // ── 职场权力 ─────────────────────────────────────────────────
  {
    id: "wp-01",
    domain: "职场权力",
    core: "服从体制 vs 坚守原则",
    modernContext: "明知上面的决定是错的，但执行了就没事，不执行就是你的问题",
    modernTag: "职场PUA受害者",
    intensity: 1,
    extremeVersion: "被迫签假材料才能保住饭碗，签了就是共谋",
    storyAppeal: 3,
    modernTension: "当服从被包装成「职业素养」，个人的道德判断就被系统性地剥夺了",
  },
  {
    id: "wp-02",
    domain: "职场权力",
    core: "忠诚上级 vs 说出真相",
    modernContext: "你知道领导在撒谎，但说出来对你没有任何好处",
    modernTag: "沉默的共谋者",
    intensity: 2,
    extremeVersion: "举报违规意味着全部同事失业，包括你",
    storyAppeal: 3,
    modernTension: "沉默保护了自己，也保护了那个让沉默成为唯一理性选择的系统",
  },
  {
    id: "wp-03",
    domain: "职场权力",
    core: "留下忍耐 vs 果断离开",
    modernContext: "待够了，但走了就什么都没了，不走就继续耗",
    modernTag: "35岁危机",
    intensity: 1,
    extremeVersion: "走了意味着彻底背叛某个人对你的信任",
    storyAppeal: 3,
    modernTension: "「离不开」的感觉里，有多少是真实的代价，有多少是被驯化出来的恐惧",
  },
  {
    id: "wp-04",
    domain: "职场权力",
    core: "抢功劳 vs 守安全",
    modernContext: "功劳是别人的，锅是你的——但如果你反击，会显得斤斤计较",
    modernTag: "职场政治旁观者",
    intensity: 2,
    storyAppeal: 2,
    modernTension: "「显得斤斤计较」的羞耻感，是一种让人主动放弃正当权益的社会规训",
  },
  {
    id: "wp-05",
    domain: "职场权力",
    core: "保护下属 vs 服从上级",
    modernContext: "上面要你交出一个人，这个人跟了你很久，但挡着了别人的路",
    modernTag: "中层困境",
    intensity: 3,
    extremeVersion: "不交出他，你们两个都完了",
    storyAppeal: 4,
    modernTension: "中层的忠诚被同时向上和向下索取，这本身就是一个让人不可能正直的结构",
  },

  // ── 家庭代际 ─────────────────────────────────────────────────
  {
    id: "fa-01",
    domain: "家庭代际",
    core: "孝顺父母 vs 活出自我",
    modernContext: "他们的期待和你想要的根本不是同一件事，但他们不觉得这是问题",
    modernTag: "孝顺绑架",
    intensity: 1,
    extremeVersion: "满足他们的期待意味着永久放弃你已经走了一半的路",
    storyAppeal: 4,
    modernTension: "爱和控制可以用同一种语言说出来，这让人很难分辨自己在逃什么",
  },
  {
    id: "fa-02",
    domain: "家庭代际",
    core: "家庭牺牲 vs 个人边界",
    modernContext: "已经付出很多了，但家人觉得这是理所当然，甚至要求更多",
    modernTag: "照顾者疲惫",
    intensity: 2,
    extremeVersion: "继续牺牲会彻底毁掉你自己，但停下来意味着抛弃他们",
    storyAppeal: 3,
    modernTension: "「理所当然」是一种无声的剥削——当付出不再被看见，边界就变成了自私",
  },
  {
    id: "fa-03",
    domain: "家庭代际",
    core: "留守原地 vs 出走远方",
    modernContext: "根在这里，但这里已经留不住你了",
    modernTag: "小镇做题家",
    intensity: 2,
    extremeVersion: "留下来意味着某人的一生被绑在这里，走了意味着某人独自面对一切",
    storyAppeal: 4,
    modernTension: "离开的孩子和留下的父母，谁在为谁的选择付代价——这笔账从来没有人算清楚过",
  },
  {
    id: "fa-04",
    domain: "家庭代际",
    core: "传承重担 vs 断裂重生",
    modernContext: "接过来意味着背负别人的债，但不接就是彻底的背叛",
    modernTag: "原生家庭困境",
    intensity: 3,
    extremeVersion: "断裂重生的代价是某个亲人的彻底崩溃",
    storyAppeal: 3,
    modernTension: "代际创伤有一个传递的逻辑：不是承接就是切断，两种都有代价，只是方向不同",
  },

  // ── 感情关系 ─────────────────────────────────────────────────
  {
    id: "re-01",
    domain: "感情关系",
    core: "安全感 vs 真实自我",
    modernContext: "在这段关系里你变成了另一个人，但这个人让你觉得安全",
    modernTag: "情感回避型",
    intensity: 1,
    extremeVersion: "继续这段关系意味着永久压抑某个核心的自己",
    storyAppeal: 4,
    modernTension: "用变成另一个人来换取安全感——这不只是爱，也是一种关于自我消失的交换",
  },
  {
    id: "re-02",
    domain: "感情关系",
    core: "放手 vs 执念",
    modernContext: "明知没有结果，但离开需要承认失败",
    modernTag: "分手恐惧症",
    intensity: 2,
    extremeVersion: "不放手意味着对方永远走不出去，而你的执念正在慢慢杀死他",
    storyAppeal: 4,
    modernTension: "「放不下」有时候关于爱，有时候关于自我价值——两者很难分清，但答案不一样",
  },
  {
    id: "re-03",
    domain: "感情关系",
    core: "说出真相 vs 保护对方",
    modernContext: "真相会伤人，但谎言会更深地伤人",
    modernTag: "恋爱脑",
    intensity: 2,
    extremeVersion: "说出来会彻底毁掉这段关系，不说就是永远的共谋",
    storyAppeal: 4,
    modernTension: "用「保护对方」的名义决定对方能不能承受真相——这也是一种温柔的控制",
  },
  {
    id: "re-04",
    domain: "感情关系",
    core: "选择合适的 vs 选择心动的",
    modernContext: "理性告诉你选哪个，心跳告诉你选另一个",
    modernTag: "理性择偶困境",
    intensity: 1,
    extremeVersion: "选错了意味着某个人的一生被彻底改变，那个人可能是你，也可能是他",
    storyAppeal: 5,
    modernTension: "「合适」是一种社会标准，「心动」是一种个人感受——两者都真实，但不是同一个维度的东西",
  },
  {
    id: "re-05",
    domain: "感情关系",
    core: "爱而不得的生死 vs 活下去的背叛",
    modernContext: "那个人要消失了——不是离开，是真的要消失——你能用什么留住他",
    modernTag: "生死别离",
    intensity: 3,
    extremeVersion: "他的离开不是选择，是命运。你能做的只有：陪他走完，还是提前离开保全自己",
    storyAppeal: 5,
    modernTension: "面对不可挽回的失去，「好好告别」和「提前离场自保」都是真实的人类反应，没有一种是正确答案",
  },
  {
    id: "re-06",
    domain: "感情关系",
    core: "为爱毁掉自己 vs 为自己放弃爱",
    modernContext: "爱到最后，你发现你已经不剩什么了——继续爱，还是先救自己",
    modernTag: "消耗型关系",
    intensity: 3,
    extremeVersion: "继续爱他意味着你会先于他消失；放弃他意味着他会因你的离开彻底崩溃",
    storyAppeal: 5,
    modernTension: "「消耗型关系」里有时候有真实的爱，但也有一个结构：其中一个人的需要被默认优先于另一个人的存在",
  },
  {
    id: "re-07",
    domain: "感情关系",
    core: "错过的永久性 vs 追回的代价",
    modernContext: "那个时刻已经过去了，过去了就是过去了——但你还没准备好接受",
    modernTag: "执念与错过",
    intensity: 3,
    extremeVersion: "追回他意味着摧毁他现在拥有的一切，包括他现在的幸福",
    storyAppeal: 4,
    modernTension: "执着于追回一段错过，有时候是爱，有时候是无法接受自己当初做错了选择",
  },
  {
    id: "re-08",
    domain: "感情关系",
    core: "见最后一面 vs 不见",
    modernContext: "他快不行了，见了你可能会崩；不见，你可能一辈子后悔",
    modernTag: "道别的勇气",
    intensity: 3,
    extremeVersion: "见了，他会以为你回来了，然后带着这个误会离开；不见，你永远不知道他最后想说什么",
    storyAppeal: 5,
    modernTension: "告别有时候是为了对方，有时候是为了自己——分清这两种动机，会改变你对这件事的理解",
  },

  // ── 身份认同 ─────────────────────────────────────────────────
  {
    id: "id-01",
    domain: "身份认同",
    core: "别人的期待 vs 真实的自己",
    modernContext: "你扮演的那个角色，已经和你是谁越来越不一样了",
    modernTag: "冒名顶替综合症",
    intensity: 1,
    extremeVersion: "放弃那个角色意味着失去所有人的信任和依赖",
    storyAppeal: 3,
    modernTension: "长期扮演一个角色，会让人分不清哪部分是表演，哪部分是真的自己——这不是软弱，是人在系统里的正常反应",
  },
  {
    id: "id-02",
    domain: "身份认同",
    core: "公开脆弱 vs 维持强人形象",
    modernContext: "崩溃了，但不能让人看见，因为你是那个「最坚强的人」",
    modernTag: "高敏感人群",
    intensity: 2,
    extremeVersion: "暴露脆弱意味着永远失去某个人对你的尊重",
    storyAppeal: 4,
    modernTension: "「最坚强的人」是一个角色，不是一个人——这个角色被需要的程度，说明他的真实感受有多少年没有被看见过",
  },
  {
    id: "id-03",
    domain: "身份认同",
    core: "顺从集体 vs 保持异见",
    modernContext: "大家都这么说，所以就对吗？但你一个人对抗所有人",
    modernTag: "精英焦虑",
    intensity: 2,
    extremeVersion: "坚持异见意味着被所有人孤立，包括你最信任的人",
    storyAppeal: 3,
    modernTension: "「大家都这么说」是一种共识压力，它的力量不来自于它是对的，而来自于它让不同意的代价太高",
  },
  {
    id: "id-04",
    domain: "身份认同",
    core: "向上攀爬 vs 向内探索",
    modernContext: "成功了，然后呢？但停下来意味着承认之前都是表演",
    modernTag: "中年意义危机",
    intensity: 3,
    extremeVersion: "向内探索的代价是已经拥有的一切开始崩塌",
    storyAppeal: 3,
    modernTension: "外部成功和内部意义是两套标准，很多人用前者的积累来推迟后者的问题——直到推不下去",
  },

  // ── 生存底线 ─────────────────────────────────────────────────
  {
    id: "su-01",
    domain: "生存底线",
    core: "尊严 vs 活下去",
    modernContext: "这口气到底咽不咽——咽了，就永远咽了",
    modernTag: "底线测试",
    intensity: 2,
    extremeVersion: "活下去需要出卖你最后剩下的原则",
    storyAppeal: 3,
    modernTension: "「咽了就永远咽了」——尊严被侵蚀的过程往往不是一次，而是一次一次的小幅让步",
  },
  {
    id: "su-02",
    domain: "生存底线",
    core: "集体大局 vs 个体代价",
    modernContext: "为什么牺牲的总是我？但如果不是你，就是更弱的那个",
    modernTag: "集体主义压迫",
    intensity: 2,
    extremeVersion: "拒绝牺牲意味着更弱的人承受你不愿意承受的代价",
    storyAppeal: 2,
    modernTension: "「大局」常常是由不需要牺牲的人定义的——被要求牺牲的人，很少是定义大局的人",
  },
  {
    id: "su-03",
    domain: "生存底线",
    core: "反抗的代价 vs 忍耐的代价",
    modernContext: "哪个更难承受——反抗带来的毁灭，还是忍耐带来的消耗",
    modernTag: "内卷受害者",
    intensity: 3,
    extremeVersion: "反抗意味着某个无辜的人被牵连进来",
    storyAppeal: 3,
    modernTension: "「先忍忍」是一种理性的生存策略，也是维持不公正系统的集体机制",
  },
  {
    id: "su-04",
    domain: "生存底线",
    core: "说出来 vs 沉默共谋",
    modernContext: "知道真相，开不开口——开口意味着麻烦，不开口意味着同谋",
    modernTag: "道德代价",
    intensity: 3,
    extremeVersion: "说出来会毁掉一个你本来尊重的人",
    storyAppeal: 2,
    modernTension: "沉默不只是个人选择，它也在为让沉默变得理性的那个环境续命",
  },

  // ── 命运偏爱（逆袭/被选中/一夜改变）────────────────────────
  {
    id: "fate-01",
    domain: "命运偏爱",
    core: "抓住机会 vs 配不上机会",
    modernContext: "命运忽然把一扇门开到你面前——但你不确定自己有没有资格走进去",
    modernTag: "冒牌者困境",
    intensity: 1,
    extremeVersion: "走进去意味着挤走一个比你更需要这个机会的人",
    storyAppeal: 5,
    modernTension: "「我配不上这个机会」的感觉，有时候是准确的自我评估，有时候是内化了别人对你的低估",
  },
  {
    id: "fate-02",
    domain: "命运偏爱",
    core: "被选中的代价 vs 被忽视的安全",
    modernContext: "终于被看见了，但被看见之后你发现，被注意是有代价的",
    modernTag: "出圈焦虑",
    intensity: 2,
    extremeVersion: "被选中意味着你要永远活在别人的期待版本里",
    storyAppeal: 5,
    modernTension: "被看见是一种需要，但「被选中」附带的是别人版本的你——两者不是一回事",
  },
  {
    id: "fate-03",
    domain: "命运偏爱",
    core: "逆袭时踩过的人 vs 成功后的代价",
    modernContext: "你用了一些手段爬上来，那个被你踩过的人现在就站在你面前",
    modernTag: "逆袭的代价",
    intensity: 2,
    extremeVersion: "你的成功建立在一个谎言上，那个谎言现在要被揭穿了",
    storyAppeal: 5,
    modernTension: "逆袭叙事里有一个很少被说的部分：爬上来的路上，谁被留下了，谁被踩过了",
  },
  {
    id: "fate-04",
    domain: "命运偏爱",
    core: "坚守底层身份 vs 进入上层世界",
    modernContext: "你有机会进入一个更好的圈子，但进去就意味着和从前的自己切断",
    modernTag: "阶层跨越撕裂",
    intensity: 2,
    extremeVersion: "进入那个圈子需要否认你的来处，而你的来处里有你最爱的人",
    storyAppeal: 5,
    modernTension: "阶层流动要求人用「融入」来证明自己，但融入的代价往往是离原来的自己越来越远",
  },
  {
    id: "fate-05",
    domain: "命运偏爱",
    core: "命运的馈赠 vs 等待反噬",
    modernContext: "得到了一个不该属于你的东西——太顺了，反而开始害怕",
    modernTag: "得到恐惧症",
    intensity: 3,
    extremeVersion: "那个东西是别人的，他也知道它在你这里",
    storyAppeal: 4,
    modernTension: "「得到恐惧」有时候是良心，有时候是深度内化的「我不配」——两种感觉很像，但来源不同",
  },

  // ── 禁忌诱惑（权力/越界/不该有的东西）───────────────────────
  {
    id: "taboo-01",
    domain: "禁忌诱惑",
    core: "理智 vs 心动",
    modernContext: "这件事不该发生，但已经发生了一点点——剩下的那一步，你要不要迈",
    modernTag: "越界的边缘",
    intensity: 1,
    extremeVersion: "迈过去意味着一段关系永远回不去，不迈意味着你余生都在想这件事",
    storyAppeal: 5,
    modernTension: "「禁忌」的力量一部分来自它是禁忌本身——想清楚自己在追求什么，还是在追求越界的感觉",
  },
  {
    id: "taboo-02",
    domain: "禁忌诱惑",
    core: "触碰禁区 vs 保持安全距离",
    modernContext: "那件事是禁区，但禁区里有你真正想要的东西",
    modernTag: "禁忌代价",
    intensity: 2,
    extremeVersion: "进去了就出不来，但不进去你永远不知道自己想要什么",
    storyAppeal: 5,
    modernTension: "禁区有时候划定得有道理，有时候只是别人的权力边界——值得问一下，这个禁区是为谁服务的",
  },
  {
    id: "taboo-03",
    domain: "禁忌诱惑",
    core: "权力的快感 vs 权力的腐蚀",
    modernContext: "你忽然发现自己有能力决定别人的命运，这个感觉很好，但有点可怕",
    modernTag: "权力上瘾",
    intensity: 2,
    extremeVersion: "你已经用过这个权力一次了，用第二次会更容易",
    storyAppeal: 4,
    modernTension: "权力让人成瘾的方式不总是贪婪，有时候是「我终于可以保护我想保护的人」——但这个动机和控制欲的边界很模糊",
  },
  {
    id: "taboo-04",
    domain: "禁忌诱惑",
    core: "享受被特别对待 vs 揭穿背后的算计",
    modernContext: "他对你好得不像真的——也许不是真的，但你还是想继续被这样对待",
    modernTag: "被偏爱的代价",
    intensity: 2,
    extremeVersion: "揭穿之后一切都消失，不揭穿就要一直假装不知道",
    storyAppeal: 5,
    modernTension: "想被特别对待是真实的需要，但「明知可能是假的还是想要」——这个地方值得停下来看一眼",
  },
  {
    id: "taboo-05",
    domain: "禁忌诱惑",
    core: "拥有不该拥有的 vs 归还的勇气",
    modernContext: "你有一样东西，得到它的方式不太光彩——现在你可以假装不知道，也可以归还",
    modernTag: "灰色地带",
    intensity: 3,
    extremeVersion: "归还意味着承认自己的丑陋，不归还意味着余生活在谎言里",
    storyAppeal: 4,
    modernTension: "「灰色地带」不是价值观真空，是一个人在有利益的情况下测试自己边界的地方",
  },
  {
    id: "taboo-06",
    domain: "禁忌诱惑",
    core: "强势偏爱 vs 清醒离开",
    modernContext: "他用不讲道理的方式爱你，越界、强势、但你真的很喜欢被这样需要",
    modernTag: "被强势爱着",
    intensity: 2,
    extremeVersion: "留下来意味着你要永久放弃某种自主权；走开意味着也许再也遇不到这种强度的感情",
    storyAppeal: 5,
    modernTension: "「越界的爱」和「强烈的爱」在感受上很难区分——但它们对当事人的长期影响是不同的",
  },

  // ── 背叛信任（最近的人的最深的伤）──────────────────────────
  {
    id: "betray-01",
    domain: "背叛信任",
    core: "发现被骗 vs 继续假装不知道",
    modernContext: "你发现了一个秘密，说出来会毁掉一段关系，不说你会憋死自己",
    modernTag: "知情者困境",
    intensity: 1,
    extremeVersion: "那个秘密关系到你们所有人的未来",
    storyAppeal: 4,
    modernTension: "「假装不知道」是一种自我保护，也是一种主动参与维持谎言的方式——两者同时成立",
  },
  {
    id: "betray-02",
    domain: "背叛信任",
    core: "原谅 vs 放不下",
    modernContext: "他道歉了，理由也够充分——但有些东西被打碎了，拼不回去",
    modernTag: "信任修复困境",
    intensity: 2,
    extremeVersion: "选择原谅意味着承认你可以接受被这样对待；不原谅意味着失去你们之间所有的一切",
    storyAppeal: 5,
    modernTension: "原谅是自己的事，和对方值不值得无关——但「原谅」不等于「没事了」，这两件事经常被混淆",
  },
  {
    id: "betray-03",
    domain: "背叛信任",
    core: "被最信任的人出卖 vs 自己先发制人",
    modernContext: "你有预感他要对你做什么——你可以等，也可以先动手",
    modernTag: "预防性背叛",
    intensity: 2,
    extremeVersion: "你的预感可能是错的，但等你确认的时候可能已经太晚",
    storyAppeal: 5,
    modernTension: "「先背叛比后受伤更理性」——这个逻辑本身是被以前的伤教出来的，值得看见",
  },
  {
    id: "betray-04",
    domain: "背叛信任",
    core: "复仇 vs 放下",
    modernContext: "你有能力让那个人付出代价——但动手之后你还是你吗",
    modernTag: "复仇的代价",
    intensity: 3,
    extremeVersion: "复仇成功意味着你要用和他一样的手段，你们会变成同一种人",
    storyAppeal: 5,
    modernTension: "复仇让受害者暂时掌握了主动权，但它也要求受害者进入施害者的逻辑——这个代价不是每个人都看见了",
  },
  {
    id: "betray-05",
    domain: "背叛信任",
    core: "守护背叛你的人 vs 彻底切断",
    modernContext: "他伤过你，但现在他需要你——你是唯一一个可以帮他的人",
    modernTag: "施害者求救",
    intensity: 3,
    extremeVersion: "帮他意味着他永远不需要为伤害你的事负责；不帮意味着你看着他沉下去",
    storyAppeal: 5,
    modernTension: "「我是唯一可以帮他的人」这个前提本身值得质疑——它是真的，还是一种被植入的责任感",
  },
  {
    id: "betray-06",
    domain: "背叛信任",
    core: "说出真相 vs 保护伤你最深的人",
    modernContext: "你知道一件事，说出来会毁掉他——即使他伤过你，你还是没办法真的对他残忍",
    modernTag: "无法狠心",
    intensity: 3,
    extremeVersion: "你的沉默让他继续伤害下一个人",
    storyAppeal: 4,
    modernTension: "「狠不下心」有时候是善意，有时候是还没从那段关系里真正走出来的标志——两者感觉很像",
  },
];

/**
 * 加权随机选困境：
 * - 按场域和强度过滤候选池
 * - 用 storyAppeal² 作为权重，高吸引力困境被选中概率显著更高
 * - 场域无匹配时降级到全库按强度筛
 */
export function selectDilemmas(
  domains: string[],
  intensity: 1 | 2 | 3,
  excludeIds: string[] = [],
  count = 3
): Dilemma[] {
  const pool = DILEMMA_LIBRARY.filter(
    d =>
      (domains.length === 0 || domains.includes(d.domain)) &&
      d.intensity <= intensity &&
      !excludeIds.includes(d.id)
  );

  const candidates = pool.length > 0
    ? pool
    : DILEMMA_LIBRARY.filter(d => d.intensity <= intensity && !excludeIds.includes(d.id));

  return weightedSample(candidates, count);
}

/** 加权随机抽样，权重为 storyAppeal²（拉大高低差距） */
function weightedSample(pool: Dilemma[], count: number): Dilemma[] {
  if (pool.length <= count) return [...pool].sort(() => Math.random() - 0.5);
  const result: Dilemma[] = [];
  const remaining = [...pool];
  while (result.length < count && remaining.length > 0) {
    const totalWeight = remaining.reduce((s, d) => s + d.storyAppeal * d.storyAppeal, 0);
    let rand = Math.random() * totalWeight;
    for (let i = 0; i < remaining.length; i++) {
      rand -= remaining[i].storyAppeal * remaining[i].storyAppeal;
      if (rand <= 0) { result.push(remaining[i]); remaining.splice(i, 1); break; }
    }
  }
  return result;
}
