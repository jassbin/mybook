// src/app/api/narrative/init/route.ts
// 初始化叙事 Agent：识别角色 DNA，建立 WorldState，生成第一幕
import { NextRequest, NextResponse } from "next/server";
import { appAi } from "@/lib/eazo-ai-billing";
import {
  createWorldState, summarizeState,
  getCharacterDNA, selectDilemmas,
  buildPrinciplesPrompt,
  validateAxes, pickArchetype,
  buildValueProfile, buildIntensifyDirectiveForAct,
} from "@/lib/agent";

export async function POST(request: NextRequest) {
  try {
    const { bookTitle, character, intensify, normalChoiceHistory, characterDomains, themeDomains } = await request.json() as {
      bookTitle: string;
      character?: string;
      intensify?: boolean;
      normalChoiceHistory?: import("@/lib/agent/world-state").ChoiceRecord[];
      characterDomains?: string[];
      themeDomains?: string[];
    };
    if (!bookTitle?.trim()) {
      return NextResponse.json({ error: "书名不能为空" }, { status: 400 });
    }

    // 1. 查角色 DNA
    const dna = character ? getCharacterDNA(character, bookTitle) : null;

    // 2. 如果没有预设 DNA，先让 AI 生成角色定位和四轴
    let axes: { key: string; low: string; high: string; description: string }[];
    let charName: string;
    let charTagline: string;
    let driveAnalysis: string[];
    let openingHook: string;
    let generatedMoments: string[] = [];
    let generatedLowConfidence = false;

    if (dna) {
      axes = dna.axes;
      charName = dna.name;
      charTagline = dna.modernMapping;
      driveAnalysis = [dna.coreWound, dna.protects, dna.fears];
      openingHook = dna.openingHook;
    } else {
      // 对自定义书名，先 AI 分析角色（最多重试2次，校验四轴质量）
      let p: Record<string, any> | null = null;
      for (let attempt = 1; attempt <= 2; attempt++) {
        const profileResult = await appAi.chat({
          model: process.env.EAZO_AI_MODEL_KEY || "deepseek.v3.1",
          messages: [{
            role: "system",
            content: "你是经典文学分析专家。严格输出JSON，不要额外文字。",
          }, {
            role: "user",
            content: `分析《${bookTitle}》${character ? `中的「${character}」` : "，选出困境最密集的角色"}，输出JSON。

【诚实底线——最高优先，必须遵守】
- 只有当你确实了解这本书及这个角色时才分析。若你并不熟悉、或无法确认它真实存在，绝不允许编造：把 "known" 设为 false 并留空其余字段。
- canonicalMoments 必须是原著真实发生的关键情节，按故事顺序排列；宁可少写，也不要编造原著没有的情节。
- confidence 如实反映你对本书原著细节的把握程度（0-1）。

{
  "known": true,
  "confidence": 0.0,
  "character": "角色名",
  "tagline": "一句话现代定位（20字内，用现代职场/人际语言翻译这个人的处境）",
  "driveAnalysis": ["核心伤口（他被什么深深伤过）", "在拼命保护什么", "最怕失去什么"],
  "openingHook": "第一幕开场的一句氛围描述（场景感，20字内）",
  "dominantDomains": ["最多2个：职场权力/家庭代际/感情关系/身份认同/生存底线"],
  "canonicalMoments": ["原著真实关键情节1（按故事顺序）","情节2","情节3","情节4","情节5"],
  "axes": [
    {"key":"轴名(4字以内，不能重复)","low":"低端标签(2-3字)","high":"高端标签(2-3字)","description":"衡量什么(15字内)"},
    {"key":"..."},{"key":"..."},{"key":"..."}
  ]
}`,
          }],
          max_tokens: 1200,
          temperature: 0.7,
        });
        const raw = profileResult.choices?.[0]?.message?.content ?? "";
        const m = raw.match(/\{[\s\S]*\}/);
        if (!m) continue;
        try {
          const parsed = JSON.parse(m[0]);
          // 诚实底线：AI 明确表示不认识这本书/角色 → 立即停止，不硬编
          if (parsed.known === false) {
            return NextResponse.json({
              error: "unknown_book",
              message: `我们暂时找不到可靠的《${bookTitle}》${character ? `「${character}」` : ""}原著资料。为了不凭空编造，建议你换一本更知名的经典，或从推荐书目里挑一位角色开始。`,
            }, { status: 200 });
          }
          if (validateAxes(parsed.axes)) { p = parsed; break; }
        } catch { continue; }
      }

      // 四轴校验失败 → 用通用原型兜底
      if (!p) throw new Error("角色分析失败");
      // 低置信度：诚实提示这是推测，可能与原著有出入（不阻断，但透明告知）
      const lowConfidence = typeof p.confidence === "number" && p.confidence < 0.45;
      generatedLowConfidence = lowConfidence;
      if (Array.isArray(p.canonicalMoments)) {
        generatedMoments = p.canonicalMoments.filter((x: unknown) => typeof x === "string" && (x as string).trim().length > 0);
      }
      charName = p.character;
      charTagline = p.tagline;
      driveAnalysis = p.driveAnalysis;
      openingHook = p.openingHook ?? `${bookTitle}的世界里，${charName}站在命运的岔路口。`;

      // 校验四轴，不通过就用原型兜底
      if (!validateAxes(p.axes)) {
        const archetype = pickArchetype(p.dominantDomains ?? []);
        axes = archetype.axes;
      } else {
        axes = p.axes;
      }
    }

    // 3. 建立 WorldState（极压模式标记到 book 字段，后续幕次识别）
    const state = createWorldState(bookTitle, charName, charTagline, axes);
    // 自定义书：把临时生成的原著锚点挂到 state，供 callActGenerator 保真约束使用
    if (generatedMoments.length > 0) {
      (state as any).canonicalMoments = generatedMoments;
    }
    // 三问（核心伤口/守护什么/最怕失去）= 角色一生的命题，挂到 state 作全程隐性暗线
    if (Array.isArray(driveAnalysis) && driveAnalysis.filter(Boolean).length > 0) {
      (state as any).lifeQuestions = driveAnalysis.filter(Boolean);
    }
    if (intensify) {
      // 极压模式：缩短总幕数（聚焦高强度），困境从第1幕就用最高强度
      state.maxActs = 6;
      (state as any).intensifyMode = true;
    }

    // 4. 选困境：优先用前端传入的 characterDomains（含新维度），其次 DNA，最后空
    const baseDomains = (characterDomains && characterDomains.length > 0)
      ? characterDomains
      : (dna?.dominantDomains ?? []);

    // 4.5 主题偏好加重（严守「原著相符、不硬来」）：
    // 仅当角色本身的场域与所选主题有交集时，才把主题场域提到最前（加重）。
    // 若角色原著里根本没有该主题的线索（无交集），则完全忽略主题，绝不硬塞。
    let domains = baseDomains;
    let themeBoostActive = false;
    if (themeDomains && themeDomains.length > 0) {
      const overlap = themeDomains.filter(d => baseDomains.includes(d));
      if (overlap.length > 0) {
        // 有交集 → 把命中的主题场域提到最前，其余保留
        domains = [...overlap, ...baseDomains.filter(d => !overlap.includes(d))];
        themeBoostActive = true;
      }
      // 无交集 → 保持 baseDomains 不变（不硬来）
    }
    const dilemmaIntensity: 1 | 2 | 3 = intensify ? 3 : 1;
    const dilemmas = selectDilemmas(domains, dilemmaIntensity, [], 3);

    // 5. 检查原则（第一幕通常不触发反转，但传入以备不测）
    const { instructions } = buildPrinciplesPrompt(
      Object.fromEntries(state.axes.map(a => [a.key, a.score])),
      1, 0, 0, []
    );

    // 5.5 极压·分型施压：从普通局识别三类价值（主流/隐性/矛盾），三幕分别对准施压
    let intensifyTargetBlock = "";
    if (intensify && normalChoiceHistory && normalChoiceHistory.length > 0) {
      const profile = buildValueProfile(normalChoiceHistory);
      // 逐幕分型：第一幕只下发【砸·主流值】那一层，与 next-act 逐幕对准保持一致
      intensifyTargetBlock = buildIntensifyDirectiveForAct(profile, 1);
    }

    // 6. 生成第一幕
    const themeHintBlock = themeBoostActive && themeDomains?.some(d => d === "感情关系" || d === "禁忌诱惑")
      ? `\n【本局主题偏好——情感线加重】\n玩家选择了「爱情/恋人」主题。在忠于原著的前提下，本幕应优先呈现「${character ?? charName}」与情感/关系相关的两难（爱、羁绊、取舍、背叛、错过等），让感情线成为主要张力。严禁为了主题而发明原著不存在的恋爱关系或人物——只放大原著本就存在的情感处境。`
      : "";
    const firstActResult = await callActGenerator({
      state,
      dilemmas,
      instructions,
      openingHook,
      isFirstAct: true,
      intensifyMode: !!intensify,
      intensifyTargetBlock: intensifyTargetBlock + themeHintBlock,
    });

    return NextResponse.json({
      state,
      character: charName,
      characterTagline: charTagline,
      driveAnalysis,
      act: firstActResult,
      lowConfidence: generatedLowConfidence,
    });
  } catch (err) {
    console.error("[narrative/init]", err);
    return NextResponse.json({ error: "初始化失败，请重试" }, { status: 500 });
  }
}

// ── 共用幕次生成函数（init 和 next-act 复用） ────────────────────
export async function callActGenerator({
  state,
  dilemmas,
  instructions,
  openingHook,
  isFirstAct,
  intensifyMode = false,
  intensifyTargetBlock = "",
}: {
  state: ReturnType<typeof createWorldState>;
  dilemmas: ReturnType<typeof selectDilemmas>;
  instructions: string[];
  openingHook?: string;
  isFirstAct: boolean;
  intensifyMode?: boolean;
  intensifyTargetBlock?: string;
}) {
  const axesKeys = state.axes.map(a => a.key).join("，");
  const stateSummary = summarizeState(state);
  const dilemmaHints = dilemmas.map(d =>
    `[${d.domain}] ${d.core}（现代语境：${intensifyMode && d.extremeVersion ? d.extremeVersion : d.modernContext}；标签：${d.modernTag}；结构性张力：${d.modernTension}）`
  ).join("\n");
  const principleBlock = instructions.length > 0
    ? `\n【本幕特殊指令——必须执行】\n${instructions.join("\n")}`
    : "";

  const intensifyBlock = intensifyMode
    ? `\n【极压模式——全程生效】\n每幕困境必须直接升级到生死抉择或无法挽回的背叛，没有「先忍忍」的选项，没有软着陆。三个选项的代价都是永久性的，只是方向不同。`
    : "";

  const isTrapAllowed = intensifyMode ? state.actNumber >= 1 : state.actNumber >= 3;
  const trapHint = isTrapAllowed
    ? "可以在丙选项设置isTrap:true（代价极其沉重、影响不可逆的极端选择——但不是游戏结束，故事仍会继续）"
    : "本幕所有选项isTrap必须为false";

  // ── 原著情节锚点保护（核心新增）──────────────────────────────────────
  // 优先用 state 上挂载的锚点（自定义书临时生成），其次取预设角色 DNA
  const dna = getCharacterDNA(state.character, state.book);
  const moments: string[] = (state as any).canonicalMoments?.length
    ? (state as any).canonicalMoments
    : (dna?.canonicalMoments ?? []);
  const isGeneratedMoments = !dna?.canonicalMoments?.length && moments.length > 0;
  const canonicalBlock = moments.length
    ? `\n【原著情节锚点——必须保真，不得架空】${isGeneratedMoments ? "（以下锚点由AI依据对原著的理解生成，仍须严格围绕，不得再另编原著没有的重大情节）" : ""}
这些是「${state.character}」在《${state.book}》原著中的真实核心情节，按故事顺序排列：
${moments.map((m, i) => `${i + 1}. ${m}`).join("\n")}

【本幕锚点指派——必须落在这一段，不许回到更早的场景】
本幕是第 ${state.actNumber} / ${state.maxActs} 幕。按故事进度，本幕应聚焦上面第【${(() => {
      const idx = Math.min(moments.length, Math.max(1, Math.round((state.actNumber / Math.max(state.maxActs, 1)) * moments.length)));
      return idx;
    })()}】个锚点及其前后自然衔接的情节。
· 故事必须随幕数向前推进：前段幕在开头锚点，中段幕在中间锚点，末段幕在结局锚点。
· 严禁把多幕都停留在第 1 个锚点（起点场景）里反复打转——起点最多用 1 幕带过，之后必须离开起点、进入后续锚点。
· 若本幕指派的锚点发生在某个新场景（如从「流沙河」进入「取经路上」），就必须真正切换到那个场景，不能仍停在旧场景纠结。

生成规则——必须全部执行：
① 每一幕的场景、人物、道具、地点必须有原著依据，不得凭空发明不存在的人物或事件
② 玩家的"选择"是对原著情境的"视角代入"——让玩家思考「如果你是${state.character}，你会怎么做」，而不是改写原著情节本身
③ 上述锚点情节必须在全局叙事中完整体现，且严格按上面的「本幕锚点指派」推进——不同幕落在不同锚点，走完整条故事线（起点→中程→结局），绝不允许全程困在起点
④ 禁止发明原著没有的重大情节或背景设定
⑤ 困境的"现代语境翻译"是为了帮助玩家理解，不是替代原著场景——场景本身必须忠于原著
⑥【只认原著小说，排除一切改编】只依据《${state.book}》原著小说本身。严禁引入任何影视、电影、电视剧、游戏、动漫、戏曲、同人或其他改编版本里才有、而原著小说中并不存在的人物、情节或设定（例如《大话西游》中的紫霞仙子、白晶晶等均非《西游记》原著人物，绝不可出现）。若不确定某人物/情节是否出自原著，一律不用。
⑦ 若该角色在原著中本就没有某类关系或线索（如没有感情/恋爱线），则绝不为了戏剧性而凭空制造——宁可聚焦其原著真实的核心冲突。
⑧【因果连贯——禁止凭空转折】本幕必须从上一幕的既有处境自然推进：任何新出现的事件、人物、危机都要能追溯到之前已经出现的伏笔、关系或玩家的选择。严禁为了制造张力而空降一个与前文毫无因果关系的突发事件（例如人物毫无铺垫地"突然收到假钞""突遭横祸""凭空冒出一个仇敌"）。后期戏剧强度可以升高，但升高的必须是"已埋线索的自然爆发"，而不是"新造的意外"。若要引入新转折，必须在本幕文本里点明它与前文的因果链条。
⑨【锁定主线·选择只改姿态不改事实——最重要】原著已定的关键结局是锁定的，无论玩家怎么选都必然发生（历史类如诸葛亮斩马谡、五丈原病逝；命运类如祥子的沉沦、林黛玉的离世；关系类如某段感情的破裂或某次离别）。因此：
· 三个选项之间的差异，只能是「内心姿态 / 情感倾向 / 承受方式 / 付出的代价」层面的不同，绝不能是「改变客观事实」的不同。
· 严禁生成任何会逆转既定结局的选项。反例（一律不许出现）：军事历史类"连夜放走某人使其逃脱""改判免死"；情感关系类"一句话就让决意离开的人回心转意""让已故之人复生"；工作职场类"一句反驳就推翻老板/制度的决定"；生活成长类"凭一己之力扭转整个时代/家境的必然"。
· 允许玩家做出恻隐、心软、挽留、反抗、振作、妥协等任何选择，但这些只代表"你此刻以什么姿态面对"，不代表事实被改写。
⑩【心软/挽回类选择必自然收回——通用机制，适用一切题材】当玩家选择了恻隐 / 心软 / 挽留 / 试图挽回 / 奋力反抗类选项时，本幕后果文本必须用情境中本就存在的、比个人意志更大的力量，把结局自然地拉回既定终点，并写清因果，绝不能让"心软/挽回"直接改变事实，也绝不能不给理由就硬让结局发生。可用的收回力量有四类（按题材择其合逻辑者）：
　1) 制度 / 规则：军法、公司流程与合同、门第婚约世俗规矩、时代与经济现实——你立的或身处的规矩反噬你；
　2) 他人意志：众人依律请命、上级或客户拍板、对方已决意离开、家人群体的期待——不是你一个人说了算；
　3) 当事人自己的选择：如马谡自请领罪、对方主动放手、同伴自己走了——你想拦，他/她却选择了那条路；
　4) 大局 / 形势所迫：军心存亡、公司要活下去、感情已耗尽、命运的必然——私情让位于更大的现实。
收回后要让玩家感到：不是你没资格心软，而是"你心软了、也尽力了，但那股比你更大的力量仍把结局推回原点"——你付出的代价因此是内心的（自责、遗憾、心变硬、从此背负），而不是事实的改变。`
    : ""; // 自定义书目无法保证原著锚点，略过

  // 三问 = 角色一生的命题：作为全程隐性暗线注入，渐显不说破
  const lifeQuestions: string[] = (state as any).lifeQuestions ?? [];
  const isEndPhase = state.storyPhase === "合" || state.storyPhase === "尾声";
  const lifeBlock = lifeQuestions.length >= 3
    ? `\n【角色一生的命题——全程隐性暗线，不是本幕台词】
「${state.character}」一生的底色：核心伤口是「${lifeQuestions[0]}」；他在守护「${lifeQuestions[1]}」；最怕失去「${lifeQuestions[2]}」。
使用规则：
· 这是贯穿全程的暗线，不是某一幕要讲的内容——绝不让角色直接说出、也不要旁白点破。
· ${isEndPhase
        ? "已到后期：可以让这个命题较清晰地浮现，让玩家在此刻隐隐照见「他一生都在追问这个」。"
        : "尚在前中期：只让角色的处境与选择『不知不觉地符合』这个底色即可，绝不点破，把显影留到后面。"}
· 让它随剧情推进由隐到显，最终由玩家自己回味，而不是被告知。`
    : "";

  const prompt = `你是《${state.book}》「${state.character}」故事的叙事导演。

【角色定位】${state.characterTagline}
${canonicalBlock}${lifeBlock}
【当前叙事状态】
${stateSummary}
${principleBlock}${intensifyBlock}${intensifyTargetBlock}

【本幕可用困境方向（从中选取最贴合当前状态的）】
${dilemmaHints}

【本幕开场钩子】${openingHook ?? "续接上一幕的张力，不要另起炉灶"}

请生成第${state.actNumber}幕（${state.storyPhase}段），输出严格JSON：
{
  "title": "幕标题（8字内，体现本幕核心张力）",
  "messages": [
    {"id":"m1","type":"narrator/dialog/inner","text":"内容","delay":0},
    {"id":"m2","type":"...","text":"...","delay":400}
  ],
  "choices": [
    {
      "id":"A","label":"甲",
      "text":"选项简短描述",
      "innerVoice":"内心独白——赤裸真实动机，50字",
      "revealText":"点破语——30字内，白话，直击这个选择意味着什么",
      "socialTag":"当代社会焦虑标签（参考：${dilemmas.map(d=>d.modernTag).join("/")}）",
      "scores":{"${axesKeys.split("，")[0]}":10},
      "isTrap":false,
      "isSelfPreserve":false,
      "isSacrifice":false
    },
    {"id":"B","label":"乙","text":"...","innerVoice":"...","revealText":"...","socialTag":"...","scores":{},"isTrap":false,"isSelfPreserve":false,"isSacrifice":false},
    {"id":"C","label":"丙","text":"...","innerVoice":"...","revealText":"...","socialTag":"...","scores":{},"isTrap":${isTrapAllowed},"isSelfPreserve":false,"isSacrifice":false}
  ],
  "trapEndingText":"（仅isTrap=true时填写）选了这个极端选项后、你付出的沉重代价描述（2-3句）——写代价而非结局，故事会带着这个代价继续",
  "trapRevivalText":"（可留空）不再使用",
  "consequenceMap":{
    "A":[{"id":"ca1","type":"narrator","text":"选A后的即时后果（1-2句）"}],
    "B":[{"id":"cb1","type":"narrator","text":"选B后的即时后果"}],
    "C":[]
  },
  "forcedContinue":[{"id":"fc1","type":"system","text":"无论如何，故事继续……"}],
  "newTensions":["本幕引入的新伏笔，字符串数组"],
  "newAnchors":["本幕出现的1-2个具体场景细节（地点名/人名/道具），如「教演场」「那封信」「高衙内」，用于下一幕保持连贯"],
  "newEmotionalTone":"平静/压抑/紧张/绝望/愤怒/悲凉/释然",
  "shouldContinue":true
}

要求：
- messages 3-5条，情绪递进，场景必须有原著依据（人名/地点/道具不得凭空发明）
- 三个选项代表不同价值排序，没有明显优劣
- isSelfPreserve/isSacrifice 根据选项语义填写true/false
- scores 键名必须是：${axesKeys}
- ${trapHint}
- shouldContinue：如果故事张力已充分释放（通常≥8幕后），可设为false表示本幕是最后一幕`;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await appAi.chat({
        model: process.env.EAZO_AI_MODEL_KEY || "deepseek.v3.1",
        messages: [
          {
            role: "system",
            content: `你是经典文学叙事专家。严格输出JSON，不要额外文字。
核心原则：忠于原著情节，不架空，不发明原著没有的人物/事件。
玩家选择是"视角代入"——让玩家在原著情境中做出抉择，不是改写历史。`,
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 1800,
        temperature: 0.8,
      });
      const raw = result.choices?.[0]?.message?.content ?? "";
      const m = raw.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || raw.match(/(\{[\s\S]*\})/);
      if (!m) throw new Error("no JSON");
      const parsed = JSON.parse(m[1] ?? m[0]);
      if (!parsed.choices || parsed.choices.length < 2) throw new Error("invalid act");
      return parsed;
    } catch (e) {
      lastErr = e;
      if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 800));
    }
  }
  throw lastErr;
}
