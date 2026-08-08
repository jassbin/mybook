// src/app/api/reader/narration/route.ts
// AI Agent: streaming choice-evidence narration (no scores/personality labels)
import { NextRequest } from "next/server";
import { appAi } from "@/lib/eazo-ai-billing";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      bookTitle: string;
      character: string;
      choiceLabels: string[];   // e.g. ["第1次，你选择了——沉默自保", ...]
      sceneTitles: string[];    // scene titles in order
    };

    const { bookTitle, character, choiceLabels, sceneTitles } = body;

    const choiceLines = choiceLabels
      .map((label, i) => `${i + 1}. ${label}`)
      .join("\n");

    const prompt = `你是一位深谙人性的旁白者。根据用户在故事中的真实选择，写一段150字以内的「选择证据链」分析。

用户扮演的是《${bookTitle}》中的「${character}」，他依次做了以下选择：
${choiceLines}

请按以下四个维度写，用短句，白话，直接说人话。不用分标题，连贯自然：
1. 他反复保护了什么（从选择中归纳）
2. 为此他牺牲了什么（代价是什么）
3. 哪一次选择影响最大（具体说哪次，为什么）
4. 这些决定如何一步步累积成他现在的处境

不要：说他是什么类型的人、给出人格分数、用学术词汇、说好坏对错。
只说：他做了什么、这意味着什么、事情是怎么连起来的。
语气：像旧友在深夜对你说真话——温柔、直白、有点刺骨。`;

    const stream = await appAi.chat({
      model: process.env.EAZO_AI_MODEL_KEY || "deepseek.v3.1",
      messages: [
        { role: "system", content: "你是一位洞察人心的叙事旁白者，擅长从行为证据中归纳出真实的人性选择。" },
        { role: "user", content: prompt },
      ],
      stream: true,
      max_tokens: 300,
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
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[reader/narration]", err);
    return new Response("生成失败，请重试", { status: 500 });
  }
}
