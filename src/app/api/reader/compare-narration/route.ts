// src/app/api/reader/compare-narration/route.ts
// AI Agent: streaming comparison narration — normal vs intensified results
import { NextRequest } from "next/server";
import { appAi } from "@/lib/eazo-ai-billing";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      bookTitle: string;
      character: string;
      normalChoiceLabels: string[];
      intensifyChoiceLabels: string[];
      normalScenes: string[];
      intensifyScenes: string[];
      axisKeys: string[];
      normalScores: Record<string, number>;
      intensifyScores: Record<string, number>;
    };

    const {
      bookTitle, character,
      normalChoiceLabels, intensifyChoiceLabels,
      normalScenes, intensifyScenes,
      axisKeys, normalScores, intensifyScores,
    } = body;

    // Build axis shift summary
    const axisShifts = axisKeys.map((key) => {
      const n = normalScores[key] ?? 50;
      const i = intensifyScores[key] ?? 50;
      const diff = i - n;
      const dir = diff > 8 ? "↑明显上升" : diff < -8 ? "↓明显下降" : "≈基本稳定";
      return `${key}：普通版${n} → 极压版${i}（${dir}）`;
    }).join("\n");

    const normalLines = normalChoiceLabels.map((l, i) => `  ${i + 1}. [${normalScenes[i] ?? ""}] ${l}`).join("\n");
    const intensifyLines = intensifyChoiceLabels.map((l, i) => `  ${i + 1}. [${intensifyScenes[i] ?? ""}] ${l}`).join("\n");

    const prompt = `你是一位深谙人性的对比旁白者。
同一个人，用同一个角色「${character}」经历了两版故事：普通版和极压版（生死级别的困境）。
请写一段200字以内的对比洞察，揭示这个人的价值观在压力下是否稳定，以及这意味着什么。

【普通版选择路径】
${normalLines}

【极压版选择路径】
${intensifyLines}

【四轴数值变化】
${axisShifts}

请写对比洞察，包含以下四点，不要分标题，连贯自然：
1. 这个人在普通压力和极端压力下，选择模式有没有变（变了哪里，或没变什么）
2. 极压下，哪个价值观被迫暴露出来（他之前可能没意识到的）
3. 数值变化最大的轴意味着什么（具体说哪个轴，为什么这个轴在极压下移动了）
4. 由此可以得出一个新的结论——关于这个人在生死关头真正在乎什么

语气：像一个睿智的老朋友，在深夜对你说完这件事的真相——不评判，但不绕弯子。
不要说"你是什么类型"，不要给标签，只说证据和结论。`;

    const stream = await appAi.chat({
      model: process.env.EAZO_AI_MODEL_KEY || "deepseek.v3.1",
      messages: [
        { role: "system", content: "你是一位洞察人心的对比旁白者，擅长从两次不同压力下的选择中找出真正的价值排序。" },
        { role: "user", content: prompt },
      ],
      stream: true,
      max_tokens: 400,
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
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[reader/compare-narration]", err);
    return new Response("对比分析生成失败，请重试", { status: 500 });
  }
}
