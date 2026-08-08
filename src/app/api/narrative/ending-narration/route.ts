// src/app/api/narrative/ending-narration/route.ts
// 结局旁白：流式生成，输出用 ===SEP=== 分割为四段：
//   段1=选择证据链 | 段2=选择模式镜像 | 段3=时空折叠JSON | 段4=价值锚点JSON
import { NextRequest } from "next/server";
import { appAi } from "@/lib/eazo-ai-billing";
import type { WorldState } from "@/lib/agent/world-state";
import { summarizeMetaAxes, mapToMetaAxes, META_AXES } from "@/lib/agent/world-state";
import { DILEMMA_LIBRARY } from "@/lib/agent/dilemma-library";

export async function POST(request: NextRequest) {
  try {
    const { state } = await request.json() as { state: WorldState };

    const axesSummary = state.axes
      .map(a => `${a.key}：最终${a.score}分（${a.score > 65 ? "偏" + a.high : a.score < 35 ? "偏" + a.low : "居中"}）`)
      .join("，");

    const choiceLines = state.choiceHistory
      .map(c => `第${c.act}幕，「${c.socialTag}」——选了「${c.choiceText}」，点破：${c.revealText}`)
      .join("\n");

    const twists = state.triggeredTwists.length > 0
      ? `触发反转：${state.triggeredTwists.join("，")}`
      : "";

    const totalChoices = state.choiceHistory.length;
    const selfPreserveCount  = state.choiceHistory.filter(c => c.choiceId === "A").length;
    const sacrificeCount     = state.choiceHistory.filter(c => c.choiceId === "C").length;
    const midCount           = state.choiceHistory.filter(c => c.choiceId === "B").length;
    const choiceSequence     = state.choiceHistory.map(c => c.choiceId).join("");
    const hasLateReversal    = /([ABC])\1.+(?!\1)[ABC]$/.test(choiceSequence);
    const alwaysChoseExtreme = (selfPreserveCount + sacrificeCount) === totalChoices && totalChoices >= 3;
    const trapFired          = state.trapTriggeredInActs?.length > 0;

    const patternHints = [
      `共${totalChoices}次选择`,
      selfPreserveCount >= 2 ? `${selfPreserveCount}次保全自己` : "",
      sacrificeCount >= 2    ? `${sacrificeCount}次选代价更重` : "",
      midCount >= 3          ? `${midCount}次走中间路` : "",
      hasLateReversal        ? "后期出现转向" : "",
      alwaysChoseExtreme     ? "每次都选极端" : "",
      trapFired              ? "触发过陷阱选项" : "",
    ].filter(Boolean).join("；");

    const metaAxesSummary = summarizeMetaAxes(state.axes);

    // ── 多维度交叉分析，提炼最突出的价值特征组合 ───────────────────────────
    const metaScores = mapToMetaAxes(state.axes);

    // 提取最后3条关键选择（含点破语和后果）
    const keyChoices = state.choiceHistory
      .slice(-Math.min(3, state.choiceHistory.length))
      .map(c => `「${c.choiceText}」（${c.socialTag}）——${c.revealText}`)
      .join("；");

    // 最频繁 socialTag（核心执念）
    const tagCounts: Record<string, number> = {};
    state.choiceHistory.forEach(c => {
      tagCounts[c.socialTag] = (tagCounts[c.socialTag] ?? 0) + 1;
    });
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([tag]) => tag);
    const topTag = topTags[0] ?? "";

    // 从困境库反查玩家触碰过的困境的结构性张力（用 socialTag 匹配）
    const touchedTensions = state.choiceHistory
      .map(c => DILEMMA_LIBRARY.find(d => d.modernTag === c.socialTag)?.modernTension)
      .filter((t): t is string => !!t);
    // 去重，取最多3条最具代表性的
    const uniqueTensions = [...new Set(touchedTensions)].slice(0, 3);

    // ── 第二段镜像描述词
    const patternWord = selfPreserveCount >= 2
      ? "习惯先保全自己"
      : sacrificeCount >= 2
        ? "总是选代价更重的那条路"
        : "走的是中间路线，不愿走极端";
    const reversalWord = hasLateReversal
      ? "在后期出现了转向，说明某件事触动了你"
      : "从头到尾保持了一致的选择倾向";

    // ── 分层归组：每个价值维度独立出一个锚点源 ─────────────────────────────
    const anchorGroups: { label: string; trait: string }[] = [];

    // 行为层（选择模式）
    const behaviorBits: string[] = [];
    if (selfPreserveCount / totalChoices >= 0.6)   behaviorBits.push("反复保全自己");
    if (sacrificeCount / totalChoices >= 0.6)       behaviorBits.push("反复承受更重代价");
    if (midCount / totalChoices >= 0.6)             behaviorBits.push("反复走中间路，不肯走极端");
    if (alwaysChoseExtreme)                         behaviorBits.push("每次都选最极端，从不走中间");
    if (hasLateReversal)                            behaviorBits.push("前期和后期选择出现了明显转向");
    if (trapFired)                                  behaviorBits.push("曾选择了不可逆的极端选项");
    if (state.consecutiveSelfPreserve >= 3)         behaviorBits.push("连续多幕坚持自保");
    if (state.consecutiveSacrifice >= 3)            behaviorBits.push("连续多幕坚持承受代价");
    if (behaviorBits.length > 0)
      anchorGroups.push({ label: "选择模式", trait: behaviorBits.join("；") });

    // 价值轴层（专属四轴偏移最大的2条）
    const extremeAxes = [...state.axes]
      .sort((a, b) => Math.abs(b.score - 50) - Math.abs(a.score - 50))
      .slice(0, 2);
    for (const axis of extremeAxes) {
      if (axis.score >= 72)
        anchorGroups.push({ label: axis.key, trait: `「${axis.key}」轴显著偏向「${axis.high}」（${axis.score}分）——${axis.description}` });
      else if (axis.score <= 28)
        anchorGroups.push({ label: axis.key, trait: `「${axis.key}」轴显著偏向「${axis.low}」（${axis.score}分）——${axis.description}` });
    }

    // 元轴层（偏移超过12分的底层价值维度，最多2条）
    const extremeMetaAxes = META_AXES
      .filter(m => Math.abs((metaScores[m.id] ?? 50) - 50) >= 12)
      .sort((a, b) => Math.abs((metaScores[b.id] ?? 50) - 50) - Math.abs((metaScores[a.id] ?? 50) - 50))
      .slice(0, 2);
    for (const meta of extremeMetaAxes) {
      const s = metaScores[meta.id] ?? 50;
      anchorGroups.push({
        label: meta.label,
        trait: `${meta.label}（${meta.description}）：${s > 50 ? "偏高" : "偏低"}（${s}分）`,
      });
    }

    // 情绪层（只有明显情绪时加入）
    if (["释然", "绝望", "愤怒", "悲凉"].includes(state.emotionalTone))
      anchorGroups.push({ label: "情绪底色", trait: `走到最后情绪是${state.emotionalTone}的` });

    // 限制最多4个锚点（避免结果页过长）
    const finalGroups = anchorGroups.slice(0, 4);

    // 主类型（回退兼容）
    let anchorType = "综合";
    if (selfPreserveCount / totalChoices >= 0.6)   anchorType = "自保";
    else if (sacrificeCount / totalChoices >= 0.6)  anchorType = "牺牲";
    else if (midCount / totalChoices >= 0.6)        anchorType = "中庸";
    else if (hasLateReversal)                       anchorType = "转向";
    else if (alwaysChoseExtreme)                    anchorType = "极端";
    else if (trapFired)                             anchorType = "越界";

    // ── 组装给 AI 的多维锚点提炼指令 ─────────────────────────────────────────
    const anchorHint = `
这个人在「${state.character}」的故事里暴露了以下${finalGroups.length}个独立的价值维度，每个维度分别生成一个锚点：
${finalGroups.map((g, i) => `维度${i + 1}【${g.label}】：${g.trait}`).join("\n")}

核心执念标签：${topTags.join("、") || "未明确"}
最典型选择：${keyChoices}
最终情绪基调：${state.emotionalTone}
${uniqueTensions.length > 0 ? `
这局触碰过的处境的结构性张力：
${uniqueTensions.map(t => `• ${t}`).join("\n")}
` : ""}
生成规则：
① 为每个维度单独生成一个锚点，共${finalGroups.length}个，不合并，不重复
② 每个锚点的 image 聚焦该维度，从「${state.character}」这局真实发生的场景里提炼，不用通用比喻
③ question 不评判——选择模式、价值取向、或处境的结构性问题都可以作为自省入口
④ type 用维度标签（如「${finalGroups[0]?.label}」）`;

    const prompt = `你是洞察人心的叙事旁白者。

「${state.character}」《${state.book}》走完${totalChoices}幕。
选择轨迹：
${choiceLines}
四轴：${axesSummary}
${twists}
行为统计：${patternHints}
底层倾向：
${metaAxesSummary}

严格按以下四段输出，段与段之间只用 ===SEP=== 分隔，不加任何标题、序号或额外解释：

第一段（选择证据链，80-100字）：不评判对错，说证据和因果。他反复在保护什么、为此付出什么代价、哪一幕是真正转折点（具体说哪幕）。语气：深夜旧友说真话，温柔直白有点刺骨。

===SEP===

第二段（选择模式镜像，40-60字）：直接对话"你"，点出模式规律。参考：「你${patternWord}」「你${reversalWord}」。让玩家感受到"这说的是我"。不评判对错。

===SEP===

第三段（时空折叠，严格输出JSON，不要任何额外文字）：
{"ancientScene":"${state.character}在《${state.book}》原著中经历的某个具体核心场景（15字内，必须是真实原著情节，不得架空）","modernScene":"映射到今天的具体处境（15字内用现代职场感情家庭语境）","bridge":"他当时的X就是你今天的Y（18字内一句话打通两个时代）"}

===SEP===

第四段（多维价值锚点，严格输出JSON数组，不要任何额外文字）：
${anchorHint}

输出格式（数组，每项对应一个维度，共${finalGroups.length}项）：
[{"type":"维度标签","image":"场景快照20字内","question":"自省问题25字内"},...]`;

    const stream = await appAi.chat({
      model: process.env.EAZO_AI_MODEL_KEY || "deepseek.v3.1",
      messages: [
        {
          role: "system",
          content: "严格按格式输出。===SEP===分隔符前后不加任何标题、序号或额外内容。第三段和第四段只输出JSON，不要任何其他文字。",
        },
        { role: "user", content: prompt },
      ],
      stream: true,
      max_tokens: 850,
      temperature: 0.85,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? "";
            if (delta) controller.enqueue(encoder.encode(delta));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    console.error("[narrative/ending-narration]", err);
    return new Response("旁白生成失败", { status: 500 });
  }
}
