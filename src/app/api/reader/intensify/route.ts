// src/app/api/reader/intensify/route.ts
// AI Agent: take an existing AnalysisResult and rewrite it as a "极压版"
// Same character, same story arc structure, same 4 value axes —
// but every dilemma escalates to life/death / irreversible betrayal / total ruin consequences.
import { NextRequest, NextResponse } from "next/server";
import { appAi } from "@/lib/eazo-ai-billing";
import type { AnalysisResult } from "@/lib/reader/types";

const SYSTEM_PROMPT = `你是一位深谙人性的极端情境设计师。
你的任务是把一个已有的经典文学决策剧本升级为「极压版本」：
- 保持同一角色、同一故事主线、同一四个价值轴
- 但每一幕的困境都升级到生死/永久失去/无法挽回的级别
- 让用户在极压下看清自己真正的价值排序

极压升级原则：
1. 原版第1幕→极压第1幕：利益冲突升级为生死抉择或骨肉分离
2. 原版第2幕→极压第2幕：面子冲突升级为彻底背叛或毁灭性代价
3. 每一幕的三个选项，后果都要量级更重——不是小麻烦，而是无法回头的人生转折
4. 极压版的「陷阱」要比原版更震撼、更真实——是人在绝境下真实会做出的极端选择
5. 剧情必须合情合理，不要离奇——是同一角色在同一世界里被逼到极限的延伸

极压困境升级参考——覆盖现代人全场域的极端版本：
职场极压：被迫签假材料才能保住饭碗 / 举报违规意味着全家失业 / 说真话会毁掉所有人
家庭极压：父母的重病和自己的出走只能选一 / 孩子的未来和婚姻的体面只能保一个
感情极压：说出真相会彻底毁掉这段关系 / 放手等于亲手宣判对方的崩溃
身份极压：承认脆弱意味着失去所有人的尊重 / 做真实的自己代价是永远被抛弃
生存极压：活下去需要出卖最后的原则 / 保住尊严意味着选择死亡或彻底毁灭

极压版的axes与原版完全相同（key/low/high/description一字不差），只更新scenes和endingTypes。
你必须严格按照JSON格式输出，不要有任何额外文字。`;

const USER_TEMPLATE = (original: AnalysisResult) => `
请将以下《${original.bookTitle}》中「${original.character}」的普通版剧本升级为极压版。

【原版剧本摘要】
角色定位：${original.characterTagline}
原版价值轴（必须保持完全一致）：
${original.axes.map((a) => `- ${a.key}：${a.low} ↔ ${a.high}（${a.description}）`).join("\n")}

原版场景结构：
${original.scenes.map((s, i) => `第${i + 1}幕「${s.title}」：${s.choices.map((c) => c.text).join(" / ")}`).join("\n")}

【极压版输出格式（严格JSON）】
{
  "bookTitle": "${original.bookTitle}",
  "character": "${original.character}",
  "characterTagline": "${original.characterTagline}",
  "driveAnalysis": ${JSON.stringify(original.driveAnalysis)},
  "axes": ${JSON.stringify(original.axes)},
  "scenes": [
    {
      "id": "scene1",
      "title": "极压场景标题（体现生死/极端性）",
      "messages": [
        {"id": "m1", "type": "narrator", "text": "旁白——情境比原版严峻十倍", "delay": 0},
        {"id": "m2", "type": "dialog", "text": "对话或行动——直接点明极端后果", "delay": 400},
        {"id": "m3", "type": "inner", "text": "角色内心——在绝境边缘的真实恐惧", "delay": 600}
      ],
      "choices": [
        {
          "id": "A",
          "label": "甲",
          "text": "选项（极压版，涉及生命/永久失去/不可逆转）",
          "innerVoice": "内心独白——比原版更赤裸，更绝望，或更决绝（50字左右）",
          "revealText": "点破语——30字内，直击这个选择背后最深的人性",
          "socialTag": "当代极端焦虑标签",
          "scores": {"价值轴名称": 20},
          "isTrap": false
        },
        {
          "id": "B",
          "label": "乙",
          "text": "选项",
          "innerVoice": "内心独白",
          "revealText": "点破语",
          "socialTag": "社会焦虑标签",
          "scores": {"价值轴名称": -10}
        },
        {
          "id": "C",
          "label": "丙",
          "text": "极端陷阱选项（第3幕后才可出现）",
          "innerVoice": "内心独白",
          "revealText": "点破语",
          "socialTag": "社会焦虑标签",
          "scores": {"价值轴名称": -25},
          "isTrap": true
        }
      ],
      "trapEndingText": "极压版陷阱结局——比普通版更沉重、更震撼",
      "trapRevivalText": "命运的声音——更深沉",
      "consequenceMap": {
        "A": [{"id": "ca1", "type": "narrator", "text": "选A后极压版的即时后果"}],
        "B": [{"id": "cb1", "type": "narrator", "text": "选B后极压版的即时后果"}],
        "C": []
      },
      "forcedContinue": [
        {"id": "fc1", "type": "system", "text": "无论付出什么代价，命运还在继续……"}
      ]
    }
  ],
  "endingTypes": [
    {
      "id": "ending1",
      "conditionDescription": "极压版触发条件",
      "title": "极压版结局标题",
      "narration": "极压版结局（2-3句，沉重、真实）"
    },
    {
      "id": "ending2",
      "conditionDescription": "另一种极压价值倾向",
      "title": "极压版结局标题",
      "narration": "极压版结局"
    },
    {
      "id": "ending3",
      "conditionDescription": "默认极压结局",
      "title": "极压版结局标题",
      "narration": "极压版结局"
    }
  ]
}

要求：
- 场景数与原版相同（${original.scenes.length}个场景）
- axes完全照搬原版，一字不改
- 每个场景的每个选项都要有量级升级，生死/永久代价/不可逆
- isTrap规则不变：第1-2幕不得有陷阱，第3幕后最多2个
- 整体语气更沉重、更震撼，但叙述仍然合情合理
`;

/** Attempt one intensify call, return parsed result or throw */
async function attemptIntensify(analysis: AnalysisResult): Promise<AnalysisResult> {
  const result = await appAi.chat({
    model: process.env.EAZO_AI_MODEL_KEY || "deepseek.v3.1",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: USER_TEMPLATE(analysis) },
    ],
    // 8000 tokens — enough for 4-5 scenes × 3 choices × full fields
    max_tokens: 8000,
    temperature: 0.75,
  });

  const raw = (result.choices?.[0]?.message?.content) ?? "";

  // Extract JSON — handle both bare object and markdown fences
  const jsonMatch = raw.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
                    raw.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) throw new Error("no JSON in response");

  const parsed = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);

  // Must have scenes
  if (!Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
    throw new Error("parsed result missing scenes");
  }

  // Always inherit axes from original to guarantee consistency
  parsed.axes = analysis.axes;

  return parsed as AnalysisResult;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { analysis: AnalysisResult };
    const { analysis } = body;

    if (!analysis?.bookTitle) {
      return NextResponse.json({ error: "缺少原版分析数据" }, { status: 400 });
    }

    // Retry up to 3 times — handles token truncation and transient AI errors
    let lastErr: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const parsed = await attemptIntensify(analysis);
        return NextResponse.json(parsed);
      } catch (err) {
        lastErr = err;
        console.warn(`[reader/intensify] attempt ${attempt} failed:`, err);
        // Brief pause before retry (exponential: 0s, 1s, 2s)
        if (attempt < 3) await new Promise(r => setTimeout(r, (attempt - 1) * 1000));
      }
    }

    console.error("[reader/intensify] all 3 attempts failed:", lastErr);
    return NextResponse.json({ error: "极压版生成失败，请重试" }, { status: 500 });
  } catch (err) {
    console.error("[reader/intensify] request parse error:", err);
    return NextResponse.json({ error: "极压版生成失败，请重试" }, { status: 500 });
  }
}
