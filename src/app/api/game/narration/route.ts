// src/app/api/game/narration/route.ts
import { NextRequest } from "next/server";
import { appAi } from "@/lib/eazo-ai-billing";

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    scores: { authority: number; professional: number; action: number; sincerity: number };
    ending: string;
  };

  const { scores, ending } = body;

  const endingMap: Record<string, string> = {
    "high-authority-low-monkey": "赢了朝堂、输了沙场（高权威服从、低猴战友情）",
    "low-authority-high-monkey": "丢了官帽、捡了盔甲（低权威服从、高专业信任与坦诚）",
    "balanced": "活成了大多数人的样子（中庸平衡）",
  };

  const prompt = `你是一位深谙人性的叙事旁白者，用温柔而犀利的语气，为一位玩家写一段100字以内的专属结语。

玩家扮演的是《西游记·三打白骨精》中的猪八戒，刚刚走完白虎岭一程。

他的价值观数据如下：
- 权威服从度：${scores.authority}%（跟着领导走的倾向）
- 专业信任度：${scores.professional}%（相信事实/专业判断的倾向）
- 行动奋斗值：${scores.action}%（主动出击/燃烧自己的倾向）
- 情感坦诚度：${scores.sincerity}%（非交易化真诚沟通的倾向）

最终结局类型：${endingMap[ending] || ending}

请写一段100字以内的专属旁白，要求：
1. 不评判好坏，只描述他的选择轨迹
2. 将他的数据用诗意但不失犀利的语言呈现
3. 结尾留一句真实的问句或感悟
4. 语气如同旧友深夜点评，直白、温柔、有点刺骨
5. 不要提到游戏、玩家等词，沉浸在故事视角内`;

  const stream = await appAi.chat({
    model: process.env.EAZO_AI_MODEL_KEY || "deepseek.v3.1",
    messages: [
      { role: "system", content: "你是一位深谙人性的叙事旁白者，善于用简洁而有力的语言描述人的价值选择。" },
      { role: "user", content: prompt },
    ],
    stream: true,
    max_tokens: 200,
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
}
