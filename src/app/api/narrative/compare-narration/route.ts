// src/app/api/narrative/compare-narration/route.ts
// 流式对比旁白：普通版 vs 极压版选择差异分析
// 输出四段，===SEP=== 分隔：
//   段1=对比证据链 | 段2=选择模式镜像 | 段3=时空折叠JSON | 段4=价值锚点JSON
import { NextRequest } from "next/server";
import { appAi } from "@/lib/eazo-ai-billing";
import type { WorldState } from "@/lib/agent/world-state";
import { DILEMMA_LIBRARY } from "@/lib/agent/dilemma-library";

export async function POST(request: NextRequest) {
  try {
    const { normalState, intensifyState } = await request.json() as {
      normalState: WorldState;
      intensifyState: WorldState;
    };

    const normalChoices = normalState.choiceHistory
      .map(c => `第${c.act}幕（${c.socialTag}）→ 选「${c.choiceText}」：${c.revealText}`)
      .join("\n");

    const intensifyChoices = intensifyState.choiceHistory
      .map(c => `第${c.act}幕（${c.socialTag}）→ 选「${c.choiceText}」：${c.revealText}`)
      .join("\n");

    const axesDiff = normalState.axes.map(a => {
      const ia = intensifyState.axes.find(x => x.key === a.key);
      const diff = (ia?.score ?? a.score) - a.score;
      return `${a.key}：普通${a.score}→极压${ia?.score ?? a.score}（${diff >= 0 ? "+" : ""}${diff}）`;
    }).join("，");

    // 统计选择模式
    const nTotal = normalState.choiceHistory.length;
    const nA = normalState.choiceHistory.filter(c => c.choiceId === "A").length;
    const nC = normalState.choiceHistory.filter(c => c.choiceId === "C").length;
    const xTotal = intensifyState.choiceHistory.length;
    const xA = intensifyState.choiceHistory.filter(c => c.choiceId === "A").length;
    const xC = intensifyState.choiceHistory.filter(c => c.choiceId === "C").length;

    const normalPattern = nA / nTotal >= 0.6 ? "习惯先保全自己"
      : nC / nTotal >= 0.6 ? "总是选代价更重"
      : "走中间路线，不走极端";

    const intensifyPattern = xA / xTotal >= 0.6 ? "在极限下依然守住了自己"
      : xC / xTotal >= 0.6 ? "在极限下每次都选了最重代价"
      : "在极限下依然不肯走向任何极端";

    // 是否有显著转向（普通vs极压，同一幕选择相反）
    const hasFlip = normalState.choiceHistory.some((n, i) => {
      const x = intensifyState.choiceHistory[i];
      if (!x) return false;
      return (n.choiceId === "A" && x.choiceId === "C") || (n.choiceId === "C" && x.choiceId === "A");
    });

    // ── 多维度交叉分析：普通版 vs 极压版 ──────────────────────────────────
    const { mapToMetaAxes: _map, META_AXES: _meta } = await import("@/lib/agent/world-state");

    // 普通版核心执念
    const nTagCounts: Record<string, number> = {};
    normalState.choiceHistory.forEach(c => { nTagCounts[c.socialTag] = (nTagCounts[c.socialTag] ?? 0) + 1; });
    const nTopTags = Object.entries(nTagCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => t);

    // 极压版核心执念
    const xTagCounts: Record<string, number> = {};
    intensifyState.choiceHistory.forEach(c => { xTagCounts[c.socialTag] = (xTagCounts[c.socialTag] ?? 0) + 1; });
    const xTopTags = Object.entries(xTagCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => t);

    // 价值轴变化最大的轴（偏移 > 10分）
    const shiftedAxes = normalState.axes
      .map(a => {
        const xa = intensifyState.axes.find(x => x.key === a.key);
        const diff = (xa?.score ?? a.score) - a.score;
        return { key: a.key, low: a.low, high: a.high, nScore: a.score, xScore: xa?.score ?? a.score, diff };
      })
      .filter(a => Math.abs(a.diff) > 10)
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

    // 元轴对比
    const nMeta = _map(normalState.axes);
    const xMeta = _map(intensifyState.axes);
    const metaShifts = _meta
      .map(m => ({ label: m.label, description: m.description, nScore: nMeta[m.id] ?? 50, xScore: xMeta[m.id] ?? 50, diff: (xMeta[m.id] ?? 50) - (nMeta[m.id] ?? 50) }))
      .filter(m => Math.abs(m.diff) > 8)
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      .slice(0, 2);

    // 最后3条关键选择对比
    const nKeyChoices = normalState.choiceHistory.slice(-2).map(c => `「${c.choiceText}」——${c.revealText}`).join("；");
    const xKeyChoices = intensifyState.choiceHistory.slice(-2).map(c => `「${c.choiceText}」——${c.revealText}`).join("；");

    // 是否极压下触发过陷阱
    const xTrapFired = intensifyState.trapTriggeredInActs?.length > 0;

    // 判断锚点类型
    const xB = intensifyState.choiceHistory.filter(c => c.choiceId === "B").length;
    let anchorType = "底线型";
    if (hasFlip)                                         anchorType = "转向型";
    else if (nA / nTotal >= 0.6 && xA / xTotal >= 0.6) anchorType = "自保型";
    else if (nC / nTotal >= 0.6 && xC / xTotal >= 0.6) anchorType = "牺牲型";
    else if (xTrapFired)                                anchorType = "越界型";

    // 组装多维锚点提炼指令
    const anchorTraits: string[] = [];

    // 行为对比层
    if (hasFlip) anchorTraits.push(`普通版${normalPattern}，极压版却${intensifyPattern}——两个版本出现了明显翻转`);
    else anchorTraits.push(`普通版${normalPattern}，极压版${intensifyPattern}——两次保持相似取向`);
    if (xTrapFired) anchorTraits.push("极压版触发过不可逆的极端选项");

    // 轴偏移层
    for (const ax of shiftedAxes.slice(0, 2)) {
      const dir = ax.diff > 0 ? `向「${ax.high}」偏移+${ax.diff}` : `向「${ax.low}」偏移${ax.diff}`;
      anchorTraits.push(`「${ax.key}」轴在极压下${dir}（普通${ax.nScore}→极压${ax.xScore}）`);
    }

    // 元轴对比层
    for (const m of metaShifts) {
      const dir = m.diff > 0 ? `上升${m.diff}分` : `下降${Math.abs(m.diff)}分`;
      anchorTraits.push(`${m.label}（${m.description}）在极压下${dir}（普通${m.nScore}→极压${m.xScore}）`);
    }

    // 执念对比层
    if (nTopTags.length) anchorTraits.push(`普通版核心执念：${nTopTags.join("、")}`);
    if (xTopTags.length) anchorTraits.push(`极压版核心执念：${xTopTags.join("、")}`);

    // 从困境库反查两个版本触碰过的结构性张力（socialTag 匹配）
    const allTags = [
      ...normalState.choiceHistory.map(c => c.socialTag),
      ...intensifyState.choiceHistory.map(c => c.socialTag),
    ];
    const allTensions = allTags
      .map(tag => DILEMMA_LIBRARY.find(d => d.modernTag === tag)?.modernTension)
      .filter((t): t is string => !!t);
    const uniqueTensions = [...new Set(allTensions)].slice(0, 3);

    const anchorHint = `
这个人走了两次故事，暴露出以下多重价值特征：
${anchorTraits.map((t, i) => `${i + 1}. ${t}`).join("\n")}

普通版最后的选择：${nKeyChoices || "（无）"}
极压版最后的选择：${xKeyChoices || "（无）"}
${uniqueTensions.length > 0 ? `
他在这两局里触碰过的处境，背后有这些结构性张力——今天的人能看见但古代人叫不出名字的东西：
${uniqueTensions.map(t => `• ${t}`).join("\n")}
` : ""}
生成锚点要求：
① 画面必须从两个版本的真实选择和对比里生长，不用通用比喻
② 如有多重特征（比如某轴在极压下明显偏移+执念标签变化），锚点要照见这种复杂性
③ 如果上面有结构性张力，question 可以从「处境本身」发力——不评判，但要让人感受到那个结构的重量
④ image 是让人认出自己的一个具体瞬间，而非标签或结论
⑤ question 从两个版本之间最尖锐的差异、最坚固的一致，或处境的结构性问题里找那个自省点`;

    const prompt = `你是洞察人心的叙事旁白者。

「${normalState.character}」走了两次《${normalState.book}》的故事——普通版和极压版。

【普通版选择路径】
${normalChoices || "（无记录）"}

【极压版选择路径（每幕都是生死或不可逆代价）】
${intensifyChoices || "（无记录）"}

【价值轴变化】
${axesDiff}

普通版倾向：${normalPattern}
极压版倾向：${intensifyPattern}
两个版本之间${hasFlip ? "出现了显著翻转——他在压力下改变了选择" : "保持了相似的选择取向——这是真正的底线"}

严格按以下四段输出，段与段之间只用 ===SEP=== 分隔，不加任何标题、序号或额外解释：

第一段（对比证据链，80-100字）：不评判对错，说证据和因果。普通版里他保护了什么、极压版里为什么他的选择变了（或没变）、哪一个时刻是两个版本最大的分岔点。语气：深夜旧友说真话，温柔直白有点刺骨。

===SEP===

第二段（选择模式镜像，40-60字）：直接对话"你"，点出两个版本的对比规律。参考：「普通版你${normalPattern}，极压版你${intensifyPattern}」。让玩家感受到"这说的是我"。不评判对错。

===SEP===

第三段（时空折叠，严格输出JSON，不要任何额外文字）：
{"ancientScene":"${normalState.character}在《${normalState.book}》里两次经历的核心困境（15字内，聚焦差异）","modernScene":"映射到今天——普通时你会怎样，极限时你变了什么（15字内现代语境）","bridge":"压力揭示的不是弱点，而是你的（填一个词）（18字内，打通两次体验）"}
【第三段范例——照这个狠度写】
· 好："bridge":"压力揭示的不是弱点，而是你藏在体面下的排序"（具体、指向两次落差）
· 坏："bridge":"压力让你成长，看清了真正的自己"（正确的废话，禁止）
bridge 里那个词必须尖锐、具体，不许用"成长/勇气/坚强/复杂"这类万能词。

===SEP===

第四段（价值锚点，严格输出JSON，不要任何额外文字）：
根据以下多维分析生成一个专属锚点——画面和问题必须从两个版本的真实选择内容里生长：
${anchorHint}

【第四段范例——照这个狠度写】
· 好 image："常态里你替他扛了，极压里你把他推了出去"；question："那个被你推出去的人，是不是你曾经想成为的自己？"
· 坏 image："你在两种情境下做了不同选择"；question："你如何看待这种变化？"（空洞、万能、禁止）
自检：这个 image 和 question 换到别人身上是否也成立？只要通用就重写，直到它只属于"这个人这两局"。

输出格式：
{
  "type": "${anchorType}",
  "image": "从这个故事的真实情节（选择内容、场景、人物）提炼的画面感陈述，20字内，动词强，照见上述多重特征——不评判，纯粹是画面",
  "question": "从最尖锐的特征交叉点找到的自省问题，25字内，不是建议，不含答案，用「你有没有」「是什么让你」「那个时候你是否」开头"
}`;

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
      max_tokens: 700,
      temperature: 0.82,
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
    console.error("[narrative/compare-narration]", err);
    return new Response("对比旁白生成失败", { status: 500 });
  }
}
