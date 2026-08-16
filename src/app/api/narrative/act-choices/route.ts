// src/app/api/narrative/act-choices/route.ts
// 拆分生成第二段：给定已生成的正文(scene.messages)，为本幕补齐三个选项 + 后果映射。
// 与 next-act 的正文段共享同一套上下文构造（dilemmas/instructions 由 state 确定性派生）。
import { NextRequest, NextResponse } from "next/server";
import type { WorldState, ChoiceRecord } from "@/lib/agent/world-state";
import { getCharacterDNA, selectDilemmas, buildPrinciplesPrompt, buildValueProfile, buildIntensifyDirectiveForAct } from "@/lib/agent";
import { callActGenerator } from "../init/route";

export async function POST(request: NextRequest) {
  try {
    const { state, sceneMessages, choicesContext, normalChoiceHistory } = await request.json() as {
      state: WorldState;
      sceneMessages: { text: string }[];
      choicesContext?: { intensifyMode?: boolean; intensifyTargetBlock?: string };
      normalChoiceHistory?: ChoiceRecord[];
    };

    // 重建与正文段一致的原则指令 & 困境素材（纯函数，由 state 确定性派生）
    const axesMap = Object.fromEntries(state.axes.map(a => [a.key, a.score]));
    const { instructions } = buildPrinciplesPrompt(
      axesMap, state.actNumber,
      state.consecutiveSelfPreserve, state.consecutiveSacrifice,
      state.triggeredTwists,
    );

    const dna = getCharacterDNA(state.character, state.book);
    const domains = dna?.dominantDomains ?? [];
    const isIntensify = choicesContext?.intensifyMode ?? !!(state as unknown as { intensifyMode?: boolean }).intensifyMode;
    const progress = state.actNumber / Math.max(state.maxActs, 1);
    const intensity: 1 | 2 | 3 = isIntensify ? 3
      : progress >= 0.75 ? 3
      : progress >= 0.45 ? 2 : 1;
    const affinityText = dna ? `${dna.coreWound}${dna.protects}${dna.fears}` : "";
    const dilemmas = selectDilemmas(domains, intensity, [], 3, affinityText);

    let intensifyTargetBlock = choicesContext?.intensifyTargetBlock ?? "";
    if (isIntensify && !intensifyTargetBlock && normalChoiceHistory && normalChoiceHistory.length > 0) {
      const profile = buildValueProfile(normalChoiceHistory);
      intensifyTargetBlock = buildIntensifyDirectiveForAct(profile, state.actNumber);
    }

    const choicesPart = await callActGenerator({
      state,
      dilemmas,
      instructions,
      isFirstAct: false,
      intensifyMode: isIntensify,
      intensifyTargetBlock,
      phase: "choices",
      sceneContext: { messages: sceneMessages },
    });

    return NextResponse.json({
      choices: choicesPart.choices ?? [],
      consequenceMap: choicesPart.consequenceMap ?? {},
      forcedContinue: choicesPart.forcedContinue ?? [{ id: "fc1", type: "system", text: "无论如何，故事继续……" }],
      trapEndingText: choicesPart.trapEndingText ?? "",
      trapRevivalText: choicesPart.trapRevivalText ?? "",
      climaxScene: choicesPart.climaxScene ?? null,
    });
  } catch (err) {
    console.error("[narrative/act-choices]", err);
    return NextResponse.json({ error: "选项生成失败，请重试" }, { status: 500 });
  }
}
