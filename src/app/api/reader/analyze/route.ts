// src/app/api/reader/analyze/route.ts
// AI Agent: analyze book → recommend character → generate full game script
import { NextRequest, NextResponse } from "next/server";
import { appAi } from "@/lib/eazo-ai-billing";

const SYSTEM_PROMPT = `你是一位深谙人性的经典文学解读专家，擅长用现代视角重新分析经典文学角色。
你的任务是为用户生成一个沉浸式决策体验的完整剧本JSON。

【核心驱动分析框架】
五层核心驱动（由浅到深）：生存 → 利益 → 尊严/面子 → 情感关系 → 意义/信念

【决策困境类型——覆盖现代人的全场域焦虑，从中选取最贴合角色的3-4类】

职场与权力：
- 服从体制 vs 坚守原则（明知错了还要执行吗）
- 忠诚上级 vs 说出真相（讲真话的代价）
- 短期利益 vs 长期信用（割韭菜还是做长期）
- 抢功劳 vs 守安全（暴露才华还是藏着掖着）
- 留下忍耐 vs 果断离开（待够了要不要走）

家庭与代际：
- 孝顺父母 vs 活出自我（他们的期待和我要的不是同一件事）
- 家庭牺牲 vs 个人边界（为家人付出到哪里算尽头）
- 留守原地 vs 出走远方（根在这里，但这里留不住我）
- 传承重担 vs 断裂重生（继续还是另起炉灶）

感情与关系：
- 安全感 vs 真实自我（在关系里变成另一个人）
- 付出 vs 索取（爱到最后谁先撑不住）
- 放手 vs 执念（明知没结果还要不要撑）
- 选择合适的 vs 选择心动的（理性配偶还是心跳对象）

身份与自我：
- 别人的期待 vs 真实的自己（你扮演的那个角色，是你吗）
- 向上攀爬 vs 向内探索（成功了，然后呢）
- 顺从集体 vs 保持异见（大家都这么说，所以就对吗）
- 公开脆弱 vs 维持强人形象（崩溃了，但不能让人看见）

生存与底线：
- 尊严 vs 活下去（这口气到底咽不咽）
- 集体大局 vs 个体代价（为什么牺牲的总是我）
- 说出来 vs 沉默共谋（知道真相，开不开口）
- 反抗的代价 vs 忍耐的代价（哪个更难承受）

选角标准：
- 多次面对真实的两难困境
- 贯穿主要情节
- 有强烈的现代共情点（上述任一场域均可）
- 主角配角均可

故事结构——必须遵守起承转合四段式弧线：
1. 起（第1幕）：平静日常或局势介绍，初步展示角色处境，矛盾尚未激化，选项以日常两难为主，不出现极端情形
2. 承（第2幕）：矛盾升温，压力从外部逼近，价值观冲突开始显现，选项难度中等，无陷阱
3. 转（第3幕及后）：转折到来，局势骤变，角色被逼到墙角，两难越来越无解，可出现第一个陷阱选项
4. 合（最后一幕）：最高压时刻，核心价值观逼出极端抉择，陷阱概率最高，结局由此决定

极端情形设计规则：
- isTrap=true 的选项必须且只能出现在第3幕或之后
- 每场故事最多2个陷阱（分布在不同后期幕次，同一幕至多1个）
- 陷阱必须符合剧情逻辑，是角色在绝境下真实可能做出的极端选择
- 陷阱触发后的结局要有震撼性，但不离奇——是该角色命运的可信延伸

【socialTag 社会焦虑标签——每个选项的标签要精准戳中现代人的真实处境】
参考标签池（选最贴合的，也可自创）：
职场类：「职场PUA受害者」「躺平预备军」「绩效焦虑症候群」「职场政治旁观者」「35岁危机」「中层困境」「空降兵综合征」
家庭类：「孝顺绑架」「原生家庭困境」「啃老/被啃老」「婚育压力」「照顾者疲惫」「隔代教育冲突」
感情类：「恋爱脑」「情感回避型」「付出型人格」「分手恐惧症」「理性择偶困境」「异地关系」
身份类：「高敏感人群」「讨好型人格」「冒名顶替综合症」「中年意义危机」「精英焦虑」「小镇做题家」
生存类：「沉默的共谋者」「内卷受害者」「底线测试」「道德代价」「集体主义压迫」

你必须严格按照JSON格式输出，不要有任何额外文字。`;

const USER_TEMPLATE = (book: string, char?: string) => `
请为《${book}》${char ? `中的「${char}」` : ""}生成经典重读体验剧本。

输出格式（严格JSON）：
{
  "bookTitle": "书名",
  "character": "角色名",
  "characterTagline": "一句话现代定位（如：顶级技术骨干，情商为零）",
  "driveAnalysis": [
    "他的愤怒/痛苦从哪里来（1-2句白话）",
    "他在拼命保护什么（1-2句白话）",
    "他最怕失去什么（1-2句白话）"
  ],
  "axes": [
    {
      "key": "价值轴名称（如：尊严优先度）",
      "low": "低端标签（如：隐忍）",
      "high": "高端标签（如：爆发）",
      "description": "这个轴衡量什么（1句话）"
    }
  ],
  "scenes": [
    {
      "id": "scene1",
      "title": "场景标题",
      "messages": [
        {"id": "m1", "type": "narrator", "text": "旁白文字", "delay": 0},
        {"id": "m2", "type": "dialog", "text": "对话或动作描述", "delay": 400},
        {"id": "m3", "type": "inner", "text": "角色的内心感受", "delay": 600}
      ],
      "choices": [
        {
          "id": "A",
          "label": "甲",
          "text": "选项简短描述",
          "innerVoice": "这个选择背后的内心独白（赤裸裸的真实动机，50字左右）",
          "revealText": "选择后显示的点破语——白话，直接说这个选择意味着什么（30字内）",
          "socialTag": "对应的当代社会焦虑标签",
          "scores": {"价值轴名称": 15},
          "isTrap": false
        },
        {
          "id": "B",
          "label": "乙",
          "text": "选项简短描述",
          "innerVoice": "内心独白",
          "revealText": "点破语",
          "socialTag": "社会焦虑标签",
          "scores": {"价值轴名称": -5}
        },
        {
          "id": "C",
          "label": "丙",
          "text": "选项简短描述（至少一个场景的C选项设为极端陷阱）",
          "innerVoice": "内心独白",
          "revealText": "点破语",
          "socialTag": "社会焦虑标签",
          "scores": {"价值轴名称": -20},
          "isTrap": true
        }
      ],
      "trapEndingText": "触发陷阱时的极端结局描述（如果isTrap=true才需要）",
      "trapRevivalText": "命运/神明发话，强制回溯的台词（如果isTrap=true才需要）",
      "consequenceMap": {
        "A": [{"id": "ca1", "type": "narrator", "text": "选A后的即时结果"}],
        "B": [{"id": "cb1", "type": "narrator", "text": "选B后的即时结果"}],
        "C": []
      },
      "forcedContinue": [
        {"id": "fc1", "type": "system", "text": "无论如何，故事继续……"}
      ]
    }
  ],
  "endingTypes": [
    {
      "id": "ending1",
      "conditionDescription": "触发条件描述（用于展示，非代码）",
      "title": "结局标题",
      "narration": "结局描述（2-3句，照镜子语气，不评判对错）"
    },
    {
      "id": "ending2",
      "conditionDescription": "另一种价值倾向的触发条件",
      "title": "结局标题",
      "narration": "结局描述"
    },
    {
      "id": "ending3",
      "conditionDescription": "默认/平衡结局",
      "title": "结局标题",
      "narration": "结局描述"
    }
  ]
}

要求：
- 生成4-5个场景，严格按照起承转合结构排列
- 第1-2幕绝对不能有isTrap=true；第3幕之后才可以出现，全局最多2个陷阱
- axes必须恰好4个，key名称要简短（4字以内）
- messages每个场景3-6条
- 现代语言，白话，有力量
- 点破语要直白，不用学术词汇
- 故事情形随幕次推进要逐步升级，越到后期压力越大、两难越极端
- "isTrap": false 是正常选项默认值，不要在前两幕的任何选项上写 isTrap: true
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { bookTitle: string; character?: string };
    const { bookTitle, character } = body;

    if (!bookTitle?.trim()) {
      return NextResponse.json({ error: "书名不能为空" }, { status: 400 });
    }

    // Retry up to 3 times — handles token truncation and transient AI errors
    let lastErr: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await appAi.chat({
          model: process.env.EAZO_AI_MODEL_KEY || "deepseek.v3.1",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: USER_TEMPLATE(bookTitle.trim(), character) },
          ],
          max_tokens: 6000,
          temperature: 0.75,
        });

        const raw = (result.choices?.[0]?.message?.content) ?? "";
        // Handle both bare JSON and markdown fences
        const jsonMatch = raw.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
                          raw.match(/(\{[\s\S]*\})/);
        if (!jsonMatch) throw new Error("no JSON in response");

        const parsed = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
        if (!Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
          throw new Error("missing scenes");
        }
        return NextResponse.json(parsed);
      } catch (err) {
        lastErr = err;
        console.warn(`[reader/analyze] attempt ${attempt} failed:`, err);
        if (attempt < 3) await new Promise(r => setTimeout(r, (attempt - 1) * 1000));
      }
    }

    console.error("[reader/analyze] all 3 attempts failed:", lastErr);
    return NextResponse.json({ error: "分析失败，请重试" }, { status: 500 });
  } catch (err) {
    console.error("[reader/analyze] request error:", err);
    return NextResponse.json({ error: "分析失败，请重试" }, { status: 500 });
  }
}
