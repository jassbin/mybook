// src/app/api/narrative/next-act/route.ts
// 逐幕生成：接收当前 WorldState + 玩家选择，更新状态，生成下一幕
import { NextRequest, NextResponse } from "next/server";
import type { WorldState, ChoiceRecord } from "@/lib/agent/world-state";
import { applyChoice, summarizeState } from "@/lib/agent/world-state";
import { getCharacterDNA, selectDilemmas, buildPrinciplesPrompt, buildValueProfile, buildIntensifyDirectiveForAct } from "@/lib/agent";
import { callActGenerator } from "../init/route";

export async function POST(request: NextRequest) {
  try {
    const {
      state,
      choiceId,
      choiceText,
      sceneName,
      revealText,
      socialTag,
      consequenceText,
      scoreDelta,
      isSelfPreserve,
      isSacrifice,
      newTensions,
      newTone,
      newAnchors,
      modernTension,
      normalChoiceHistory,
    } = await request.json() as {
      state: WorldState;
      choiceId: string;
      choiceText: string;
      sceneName?: string;
      revealText: string;
      socialTag: string;
      consequenceText: string;
      scoreDelta: Record<string, number>;
      isSelfPreserve: boolean;
      isSacrifice: boolean;
      newTensions: string[];
      newTone: WorldState["emotionalTone"];
      newAnchors?: string[];
      modernTension?: string;
      normalChoiceHistory?: ChoiceRecord[];
    };

    // 1. 记录本次选择（含结构性张力）
    const record: ChoiceRecord = {
      act: state.actNumber,
      choiceId,
      choiceText,
      revealText,
      socialTag,
      consequenceText,
      ...(sceneName ? { sceneName } : {}),
      ...(modernTension ? { modernTension } : {}),
    };

    // 2. 更新 WorldState（newAnchors 来自上一幕 AI 返回，由前端随请求体传入）
    // 【伏笔来源收窄】普通模式砍掉 AI 自造伏笔（newTensions 一律清空），伏笔只依赖原著锚点自带的线索，
    // 从源头杜绝「AI 自造伏笔与原著锚点打架→回收时变质」。极限模式=平行推演，保留自造伏笔以支撑架空张力。
    const isIntensifyMode = !!(state as unknown as { intensifyMode?: boolean }).intensifyMode;
    const effectiveNewTensions = isIntensifyMode ? newTensions : [];
    const nextState = applyChoice(
      state, record, scoreDelta,
      isSelfPreserve, isSacrifice,
      effectiveNewTensions, newTone,
      newAnchors ?? [],
    );

    // 3. 检查原则，获取反转指令
    const axesMap = Object.fromEntries(nextState.axes.map(a => [a.key, a.score]));
    const { instructions, newTwistIds } = buildPrinciplesPrompt(
      axesMap,
      nextState.actNumber,
      nextState.consecutiveSelfPreserve,
      nextState.consecutiveSacrifice,
      nextState.triggeredTwists,
    );

    // 记录已触发的反转，避免重复
    if (newTwistIds.length > 0) {
      nextState.triggeredTwists = [...nextState.triggeredTwists, ...newTwistIds];
    }

    // 4. 从困境库选材料
    const dna = getCharacterDNA(nextState.character, nextState.book);
    const domains = dna?.dominantDomains ?? [];
    const isIntensify = !!(nextState as any).intensifyMode;
    // 极压模式全程最高强度；普通模式按幕号进度升级（不再用起承转合标签）
    const progress = nextState.actNumber / Math.max(nextState.maxActs, 1);
    const intensity: 1 | 2 | 3 = isIntensify ? 3
      : progress >= 0.75 ? 3
      : progress >= 0.45 ? 2
      : 1;

    const affinityText = dna ? `${dna.coreWound}${dna.protects}${dna.fears}` : "";
    const dilemmas = selectDilemmas(domains, intensity, [], 3, affinityText);

    // 4.5 极压·逐幕分型施压：按本幕幕号只下发对应那一层（第1幕砸主流 / 第2幕逃隐性 / 第3幕撞矛盾）
    let intensifyTargetBlock = "";
    if (isIntensify && normalChoiceHistory && normalChoiceHistory.length > 0) {
      const profile = buildValueProfile(normalChoiceHistory);
      intensifyTargetBlock = buildIntensifyDirectiveForAct(profile, nextState.actNumber);
    }

    // 5. 只生成【正文段】——快，玩家点继续后立刻能读到新一幕；选项由 /act-choices 异步补齐
    const scene = await callActGenerator({
      state: nextState,
      dilemmas,
      instructions,
      isFirstAct: false,
      intensifyMode: isIntensify,
      intensifyTargetBlock,
      phase: "scene",
    });

    // 返回正文 + 回传选项段所需的上下文（dilemmas 由 state 派生一致，前端原样带回给 /act-choices）
    return NextResponse.json({
      state: nextState,
      scene,
      choicesContext: { intensifyMode: isIntensify, intensifyTargetBlock },
    });
  } catch (err) {
    console.error("[narrative/next-act]", err);
    return NextResponse.json({ error: "下一幕生成失败，请重试" }, { status: 500 });
  }
}
