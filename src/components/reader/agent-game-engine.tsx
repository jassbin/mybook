"use client";
// src/components/reader/agent-game-engine.tsx
// Narrative Agent 版游戏引擎：逐幕实时生成，保持原有页面样式
import { useCallback, useEffect, useRef, useState } from "react";
import type { BookMeta } from "@/lib/reader/types";
import type { WorldState } from "@/lib/agent/world-state";
import type { ChoiceRecord } from "@/lib/agent/world-state";
import { DILEMMA_LIBRARY } from "@/lib/agent/dilemma-library";
import { SceneMessage } from "./scene-message";
import { ChoicePanel } from "./choice-panel";
import { TrapScreen } from "./trap-screen";
import { PageTopbar } from "./page-topbar";
import { buildAgentStoryShareUrl } from "@/lib/reader/share-codec";
import { getThrillConfig, shouldTriggerClimax } from "@/lib/agent/thrill";

/** 由所选选项 + 当前爽感数值，算出要随 next-act 上报的爽感参数（含名场面双触发判定） */
function thrillArgsFor(
  choice: { thrillDelta?: number; personaAxis?: string; riskLevel?: "low" | "mid" | "high"; triggersClimax?: boolean },
  meterBefore: number,
) {
  const delta = choice.thrillDelta ?? 0;
  const meterAfter = Math.min(100, Math.max(0, meterBefore + delta));
  const triggeredClimax = shouldTriggerClimax(meterBefore, meterAfter, [40, 70, 90], !!choice.triggersClimax);
  return {
    thrillDelta: delta,
    personaAxis: choice.personaAxis,
    riskLevel: choice.riskLevel,
    triggeredClimax,
  };
}

interface ActData {
  title: string;
  sceneName?: string;
  messages: { id: string; type: string; text: string; delay?: number }[];
  choices: {
    id: string; label: string; text: string;
    innerVoice: string; revealText: string; socialTag: string;
    scores: Record<string, number>;
    isTrap?: boolean; isSelfPreserve?: boolean; isSacrifice?: boolean;
    thrillDelta?: number; personaAxis?: string;
    riskLevel?: "low" | "mid" | "high"; triggersClimax?: boolean;
  }[];
  trapEndingText?: string;
  trapRevivalText?: string;
  consequenceMap: Record<string, { id: string; type: string; text: string }[]>;
  forcedContinue: { id: string; type: string; text: string }[];
  climaxScene?: { title: string; text: string; triggerChoiceId?: string } | null;
  newTensions?: string[];
  newAnchors?: string[];
  newEmotionalTone?: WorldState["emotionalTone"];
  shouldContinue?: boolean;
}

interface AgentGameEngineProps {
  bookTitle: string;
  character: string;
  characterTagline: string;
  driveAnalysis: string[];
  initialState: WorldState;
  initialAct: ActData;
  bookMeta: BookMeta | null;
  onComplete: (state: WorldState) => void;
  onBack?: () => void;
  intensifyMode?: boolean;
  /** 极压模式下传入普通局选择轨迹，供服务端逐幕分型施压 */
  normalChoiceHistory?: ChoiceRecord[];
}

type DisplayMsg = { id: string; type: string; text: string; key: string };

// 拆分生成第二段的返回：选项 + 后果映射
type ChoicesPart = Pick<ActData, "choices" | "consequenceMap" | "forcedContinue" | "trapEndingText" | "trapRevivalText" | "climaxScene">;

export function AgentGameEngine({
  initialState, initialAct, bookMeta, onComplete, onBack, intensifyMode = false, normalChoiceHistory,
}: AgentGameEngineProps) {
  const [worldState, setWorldState] = useState<WorldState>(initialState);
  const [currentAct, setCurrentAct] = useState<ActData>(initialAct);
  const [nextActLoading, setNextActLoading] = useState(false);
  const [displayedMsgs, setDisplayedMsgs] = useState<DisplayMsg[]>([]);
  const [showChoices, setShowChoices] = useState(false);
  // 拆分生成：正文已渲染但选项还在异步生成时为 true，用于在选项位显示占位/骨架
  const [choicesLoading, setChoicesLoading] = useState(false);
  const [choiceDone, setChoiceDone] = useState(false);
  const [revealText, setRevealText] = useState<string | null>(null);
  const [waitingForContinue, setWaitingForContinue] = useState(false);
  const [lockedIds, setLockedIds] = useState<string[]>([]);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [showTrap, setShowTrap] = useState(false);
  const [trapData, setTrapData] = useState<{ ending: string; revival: string; trapChoiceId: string } | null>(null);
  // 名场面高光插屏：选择引爆爽点时短暂全屏呈现
  const [climaxPopup, setClimaxPopup] = useState<{ title: string; text: string } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // 过渡等待的分阶段文案索引：0=推演中… 1=正在为你推演下一幕… 2=马上就好，稍候…
  const [waitPhase, setWaitPhase] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const choicesAnchorRef = useRef<HTMLDivElement>(null);
  const spineColor = bookMeta?.color ?? "#1A3A5C";

  // 用 ref 保存预加载结果 — 避免闭包读到旧 state。记录预热对应的 choiceId，
  // 以便「选项一出现就预热默认项」：若用户点了别的选项，丢弃重来。
  const prefetchedRef = useRef<{ state: WorldState; act: ActData; choiceId: string; choicesPending?: boolean } | null>(null);
  const prefetchingRef = useRef(false);
  const prefetchingIdRef = useRef<string | null>(null);
  // 已到手的选项段：key=choiceId，避免旧目标的选项覆盖。存 null 表示该目标选项生成失败。
  const choicesResultRef = useRef<{ choiceId: string; part: ChoicesPart | null } | null>(null);
  const pendingChoiceRef = useRef<{ choice: ActData["choices"][0]; act: ActData } | null>(null);
  const worldStateRef = useRef<WorldState>(initialState);
  useEffect(() => { worldStateRef.current = worldState; }, [worldState]);

  // 新一幕开始时：滚回顶部，让用户从头读，而不是被拽到底
  useEffect(() => {
    const t = setTimeout(() => {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "auto" });
    }, 30);
    return () => clearTimeout(t);
  }, [currentAct]);

  // 选项 / 继续按钮 / 点破语出现时：温和地滚入视野（nearest，不猛拽到底）
  useEffect(() => {
    if (!showChoices && !waitingForContinue && !revealText) return;
    const t = setTimeout(() => {
      (choicesAnchorRef.current ?? bottomRef.current)?.scrollIntoView({
        behavior: "smooth", block: "nearest",
      });
    }, 120);
    return () => clearTimeout(t);
  }, [showChoices, waitingForContinue, revealText]);

  // 播放消息（逐条出现时不自动滚动，避免顶部还没看完就往下跳）
  useEffect(() => {
    setDisplayedMsgs([]);
    setShowChoices(false);
    setChoiceDone(false);
    setRevealText(null);
    setWaitingForContinue(false);
    setIsTransitioning(false);
    setLockedIds([]);
    prefetchedRef.current = null;
    prefetchingRef.current = false;
    choicesResultRef.current = null;
    pendingChoiceRef.current = null;

    const msgs = currentAct.messages;
    // 一口气全部展示：进入本幕时所有叙述一次性出现，不逐条、不闪
    setDisplayedMsgs(
      msgs.map(msg => ({ ...msg, key: `${worldStateRef.current.actNumber}-${msg.id}` }))
    );
    const t = setTimeout(() => setShowChoices(true), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAct]);

  // 拆分生成第二段：为已生成的正文补齐选项。结果存 ref；若该幕已是当前渲染幕则直接合并进 currentAct。
  const fetchChoicesFor = useCallback(async (
    state: WorldState,
    sceneAct: ActData,
    choicesContext: { intensifyMode?: boolean; intensifyTargetBlock?: string } | undefined,
    choiceId: string,
  ) => {
    try {
      const res = await fetch("/api/narrative/act-choices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state,
          sceneMessages: sceneAct.messages.map(m => ({ text: m.text })),
          choicesContext,
          normalChoiceHistory,
        }),
      });
      if (!res.ok) throw new Error("act-choices failed");
      const part = await res.json() as ChoicesPart;
      choicesResultRef.current = { choiceId, part };
      // 若预热结果仍指向这一目标，把选项补进去（供 handleContinue 后续读取）
      if (prefetchedRef.current?.choiceId === choiceId) {
        prefetchedRef.current = {
          ...prefetchedRef.current,
          act: { ...prefetchedRef.current.act, ...part },
          choicesPending: false,
        };
      }
      // 若这一幕已经渲染出来了（玩家已点继续、正文在读），直接把选项合并进 currentAct
      setCurrentAct(prev => {
        if (prev.choices.length > 0) return prev; // 已有选项，无需合并
        // 仅当当前渲染的正是这一幕（用首条消息比对）才合并，避免错配
        if (prev.messages[0]?.text !== sceneAct.messages[0]?.text) return prev;
        return { ...prev, ...part };
      });
      setChoicesLoading(false);
    } catch (e) {
      console.warn("fetchChoices failed:", e);
      choicesResultRef.current = { choiceId, part: null };
    }
  }, [normalChoiceHistory]);

  // 后台预加载下一幕，结果存 ref
  const prefetchNextAct = useCallback(async (
    choice: ActData["choices"][0],
    act: ActData,
    currentState: WorldState,
  ) => {
    // 已有正确目标的预热结果 / 正在预热同一目标 → 无需重复
    if (prefetchedRef.current?.choiceId === choice.id) return;
    if (prefetchingRef.current && prefetchingIdRef.current === choice.id) return;
    // 已有的是别的选项的预热结果 → 作废，重新预热当前选项
    if (prefetchedRef.current && prefetchedRef.current.choiceId !== choice.id) {
      prefetchedRef.current = null;
    }
    // 正在预热别的选项 → 让它跑完但结果会被下面的 choiceId 校验丢弃
    prefetchingRef.current = true;
    prefetchingIdRef.current = choice.id;
    setNextActLoading(true);
    const conseqText = [
      ...(act.consequenceMap[choice.id] ?? []),
      ...act.forcedContinue,
    ].map(m => m.text).join(" ");
    try {
      const res = await fetch("/api/narrative/next-act", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: currentState,
          choiceId: choice.id,
          choiceText: choice.text,
          sceneName: act.sceneName,
          revealText: choice.revealText,
          socialTag: choice.socialTag,
          consequenceText: conseqText,
          scoreDelta: choice.scores,
          isSelfPreserve: choice.isSelfPreserve ?? false,
          isSacrifice: choice.isSacrifice ?? false,
          newTensions: act.newTensions ?? [],
          newAnchors: act.newAnchors ?? [],
          newTone: act.newEmotionalTone ?? "平静",
          modernTension: DILEMMA_LIBRARY.find(d => d.modernTag === choice.socialTag)?.modernTension,
          normalChoiceHistory,
          ...thrillArgsFor(choice, currentState.thrillMeter),
        }),
      });
      // 第一段（正文）到手就先存下，让「继续」能立刻渲染正文；此时目标仍需最新
      if (res.ok && prefetchingIdRef.current === choice.id) {
        const data = await res.json() as {
          state: WorldState;
          scene: Partial<ActData> & { messages: ActData["messages"] };
          choicesContext?: { intensifyMode?: boolean; intensifyTargetBlock?: string };
        };
        // 组装成「正文就位、选项待补」的 act
        const sceneAct: ActData = {
          title: data.scene.title ?? "",
          sceneName: data.scene.sceneName,
          messages: data.scene.messages ?? [],
          choices: [],
          consequenceMap: {},
          forcedContinue: [],
          newTensions: data.scene.newTensions ?? [],
          newAnchors: data.scene.newAnchors ?? [],
          newEmotionalTone: data.scene.newEmotionalTone,
          shouldContinue: data.scene.shouldContinue ?? true,
        };
        prefetchedRef.current = { state: data.state, act: sceneAct, choiceId: choice.id, choicesPending: true };

        // 第二段（选项）异步补齐——玩家读正文的几秒内并行生成，读完时通常已就位
        fetchChoicesFor(data.state, sceneAct, data.choicesContext, choice.id);
      }
    } catch (e) {
      console.warn("prefetch failed:", e);
    } finally {
      if (prefetchingIdRef.current === choice.id) {
        prefetchingRef.current = false;
        prefetchingIdRef.current = null;
        setNextActLoading(false);
      }
    }
  }, [normalChoiceHistory]);

  const handleChoice = useCallback((choice: ActData["choices"][0]) => {
    setChoiceDone(true);
    setTimeout(() => setRevealText(choice.revealText), 180);

    // 存到 ref，继续时使用
    pendingChoiceRef.current = { choice, act: currentAct };

    // 立即预热下一幕（0ms，不再等 200ms）：玩家读「后果文字」的这几秒
    // 正好完全覆盖 LLM 生成时间，点「继续」时结果通常已就位 → 秒开。
    prefetchNextAct(choice, currentAct, worldStateRef.current);

    // ── 名场面双触发：关键选项自带 或 数值破阈 ──
    const meterBefore = worldStateRef.current.thrillMeter ?? 20;
    const meterAfter = Math.min(100, Math.max(0, meterBefore + (choice.thrillDelta ?? 0)));
    const climaxNow = shouldTriggerClimax(meterBefore, meterAfter, [40, 70, 90], !!choice.triggersClimax);
    const cs = currentAct.climaxScene;
    const csMatches = cs && (!cs.triggerChoiceId || cs.triggerChoiceId === choice.id);
    if (climaxNow && cs && csMatches) {
      setClimaxPopup({ title: cs.title, text: cs.text });
      setTimeout(() => setClimaxPopup(null), 2600);
    }

    // 方案A：陷阱选项不再「游戏结束」，而是「付出重大代价后继续」——
    // 把代价描述作为一条沉重后果插入，随后照常走到下一幕，保证最终能抵达价值观报告。
    const trapCostMsg = choice.isTrap && currentAct.trapEndingText
      ? [{ id: "trap-cost", type: "trapcost", text: currentAct.trapEndingText, delay: 0,
           key: `trapcost-${worldStateRef.current.actNumber}` }]
      : [];

    const conseqMsgs = [
      ...trapCostMsg,
      ...(currentAct.consequenceMap[choice.id] ?? []).map((m, i) => ({
        ...m, key: `conseq-${worldStateRef.current.actNumber}-${i}`,
      })),
      ...currentAct.forcedContinue.map((m, i) => ({
        ...m, key: `forced-${worldStateRef.current.actNumber}-${i}`,
      })),
    ];

    if (conseqMsgs.length === 0) {
      setTimeout(() => setWaitingForContinue(true), 600);
      return;
    }

    // 一口气展示所有后果，不逐条、不闪
    setDisplayedMsgs(prev => [...prev, ...conseqMsgs]);
    setTimeout(() => setWaitingForContinue(true), 500);
  }, [currentAct, prefetchNextAct]);

  // 说明：不再「选项一出现就投机预热第一个选项」——那样会：
  //   ① 浪费一次 LLM 请求（玩家若选了别的项，结果被丢弃再重发）；
  //   ② 与「点选项后的正确预热」抢服务端并发，反而拖慢真正需要的那次。
  // 正确策略见 handleChoice：玩家点定某选项后立刻预热该选项的下一幕。

  // 过渡等待时，随耗时升级安抚文案：≤3.5s「推演中…」→ ≤9s「正在为你推演下一幕…」→ 之后「马上就好，稍候…」
  // 说明：waitPhase 的重置放在 handleContinue（事件处理器）里做，effect 只调度定时器，避免在 effect body 内同步 setState。
  useEffect(() => {
    if (!isTransitioning) return;
    const t1 = setTimeout(() => setWaitPhase(1), 3500);
    const t2 = setTimeout(() => setWaitPhase(2), 9000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isTransitioning]);

  // 「继续」按钮：读 ref 不读 state，彻底避免闭包问题
  const handleContinue = useCallback(async () => {
    setWaitingForContinue(false);
    setWaitPhase(0);
    setIsTransitioning(true);

    // 直接用预加载结果（ref，永远是最新的）
    if (prefetchedRef.current) {
      const fetched = prefetchedRef.current as { state: WorldState; act: ActData; choicesPending?: boolean };
      prefetchedRef.current = null;
      if (!fetched.act.shouldContinue || fetched.state.actNumber > fetched.state.maxActs) {
        onComplete(fetched.state); return;
      }
      // 正文先渲染；若选项还没到，标记 loading，由 fetchChoicesFor 合并进来
      setChoicesLoading(!!fetched.choicesPending && fetched.act.choices.length === 0);
      setWorldState(fetched.state);
      setCurrentAct(fetched.act);
      return;
    }

    // 预加载还在进行中，等它（最多 20 秒）
    if (prefetchingRef.current) {
      setNextActLoading(true);
      const startTime = Date.now();
      await new Promise<void>(resolve => {
        const check = setInterval(() => {
          if (prefetchedRef.current || !prefetchingRef.current || Date.now() - startTime > 20000) {
            clearInterval(check); resolve();
          }
        }, 200);
      });
      setNextActLoading(false);
      if (prefetchedRef.current) {
        const fetched = prefetchedRef.current as { state: WorldState; act: ActData; choicesPending?: boolean };
        prefetchedRef.current = null;
        if (!fetched.act.shouldContinue || fetched.state.actNumber > fetched.state.maxActs) {
          onComplete(fetched.state); return;
        }
        setChoicesLoading(!!fetched.choicesPending && fetched.act.choices.length === 0);
        setWorldState(fetched.state);
        setCurrentAct(fetched.act);
        return;
      }
    }

    // 预加载失败或超时，主动重新 fetch
    const info = pendingChoiceRef.current;
    if (!info) return;
    const { choice, act } = info;
    const conseqText = [
      ...(act.consequenceMap[choice.id] ?? []),
      ...act.forcedContinue,
    ].map(m => m.text).join(" ");

    setNextActLoading(true);
    try {
      const res = await fetch("/api/narrative/next-act", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: worldStateRef.current,
          choiceId: choice.id,
          choiceText: choice.text,
          sceneName: act.sceneName,
          revealText: choice.revealText,
          socialTag: choice.socialTag,
          consequenceText: conseqText,
          scoreDelta: choice.scores,
          isSelfPreserve: choice.isSelfPreserve ?? false,
          isSacrifice: choice.isSacrifice ?? false,
          newTensions: act.newTensions ?? [],
          newAnchors: act.newAnchors ?? [],
          newTone: act.newEmotionalTone ?? "平静",
          modernTension: DILEMMA_LIBRARY.find(d => d.modernTag === choice.socialTag)?.modernTension,
          normalChoiceHistory,
          ...thrillArgsFor(choice, worldStateRef.current.thrillMeter),
        }),
      });
      if (!res.ok) throw new Error("next-act failed");
      const data = await res.json() as {
        state: WorldState;
        scene: Partial<ActData> & { messages: ActData["messages"] };
        choicesContext?: { intensifyMode?: boolean; intensifyTargetBlock?: string };
      };
      if (!(data.scene?.shouldContinue ?? true) || data.state.actNumber > data.state.maxActs) {
        onComplete(data.state); return;
      }
      const sceneAct: ActData = {
        title: data.scene.title ?? "",
        sceneName: data.scene.sceneName,
        messages: data.scene.messages ?? [],
        choices: [],
        consequenceMap: {},
        forcedContinue: [],
        newTensions: data.scene.newTensions ?? [],
        newAnchors: data.scene.newAnchors ?? [],
        newEmotionalTone: data.scene.newEmotionalTone,
        shouldContinue: data.scene.shouldContinue ?? true,
      };
      setChoicesLoading(true);
      setWorldState(data.state);
      setCurrentAct(sceneAct);
      // 正文已渲染，异步补选项
      fetchChoicesFor(data.state, sceneAct, data.choicesContext, choice.id);
    } catch (e) {
      console.error("handleContinue fetch failed:", e);
      setIsTransitioning(false);
      setWaitingForContinue(true); // 还原，让用户可以重试
    } finally {
      setNextActLoading(false);
    }
  }, [onComplete, fetchChoicesFor, normalChoiceHistory]);

  const handleRevive = useCallback(() => {
    setShowTrap(false);
    if (trapData) setLockedIds(prev => [...prev, trapData.trapChoiceId]);
    setTrapData(null);
    setShowChoices(true);
    setChoiceDone(false);
  }, [trapData]);

  const handleShareStory = useCallback(() => {
    const url = buildAgentStoryShareUrl(worldState.book, worldState.character);
    navigator.clipboard.writeText(url)
      .then(() => { setShareToast("故事链接已复制"); setTimeout(() => setShareToast(null), 2000); })
      .catch(() => { setShareToast("复制失败，请手动复制"); setTimeout(() => setShareToast(null), 2000); });
  }, [worldState]);

  if (showTrap && trapData) {
    return (
      <TrapScreen
        endingText={trapData.ending}
        revivalText={trapData.revival}
        onRevive={handleRevive}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "linear-gradient(160deg,#0d5c4e,#0a4f45 60%,#073b34)", paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}>
      <div className="paper-surface relative w-full max-w-sm mx-auto flex flex-col flex-1 border border-[rgba(239,230,201,.5)] overflow-hidden"
        style={{ boxShadow: "0 0 0 1px rgba(16,185,129,.22), 0 26px 80px rgba(6,60,50,.5)", margin: "8px auto" }}>

        {/* 名场面高光插屏 */}
        {climaxPopup && (() => {
          const tc = getThrillConfig((worldState.channel ?? undefined) as any);
          return (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center px-8 text-center anim-flash"
              style={{ background: `radial-gradient(circle at 50% 40%, ${tc.color}f2, ${tc.color}d9 55%, rgba(6,20,16,.92))`, backdropFilter: "blur(2px)" }}
              onClick={() => setClimaxPopup(null)}>
              <div className="text-[11px] font-black tracking-[.4em] mb-3" style={{ color: "rgba(255,255,255,.85)" }}>✦ 名场面 ✦</div>
              <div className="text-[30px] font-black mb-4 anim-thrill-pop" style={{ fontFamily: "'Ma Shan Zheng', serif", color: "#fff", letterSpacing: "2px" }}>{climaxPopup.title}</div>
              <div className="text-[15px] leading-relaxed anim-up" style={{ color: "rgba(255,255,255,.95)", maxWidth: 280 }}>{climaxPopup.text}</div>
              <div className="text-[11px] mt-6" style={{ color: "rgba(255,255,255,.6)" }}>轻触继续</div>
            </div>
          );
        })()}

        {/* 顶栏：返回 + 标题 + 分享（故事页用深色古香态，与内容页统一） */}
        <PageTopbar
          title={currentAct.title}
          subtitle={`第${worldState.actNumber}/${worldState.maxActs}幕${nextActLoading ? " · 生成中…" : ""}${intensifyMode ? " 🔥" : ""}`}
          onBack={onBack}
          onShare={handleShareStory}
          shareLabel="分享故事"
          darkMode
        />

        {/* 进度条：书脊色细线，幕次/总幕数 */}
        <div className="relative w-full shrink-0" style={{ height: 3, background: "rgba(1,1,1,.08)" }}>
          <div
            className="absolute left-0 top-0 h-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(100, ((worldState.actNumber - 1) / worldState.maxActs) * 100)}%`,
              background: spineColor,
              opacity: 0.85,
            }}
          />
        </div>

        {/* 爽感数值不再展示——爽靠"选完即时爽点兑现"与名场面，不靠计分条 */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ scrollBehavior: "smooth" }}>
          {(() => {
            // 找出「本幕后果段」的第一条消息下标——用于在已读正文与新出现的后果之间插入一条分隔线，
            // 让玩家一眼分清「刚才读的正文」与「选择后新发生的内容」。
            const firstConseqIdx = displayedMsgs.findIndex(
              m => /^(conseq|forced|trapcost)-/.test(m.key)
            );
            return displayedMsgs.map((msg, i) => (
              <div key={msg.key} className="contents">
                {i === firstConseqIdx && firstConseqIdx > 0 && (
                  <div className="flex items-center gap-2 my-1 anim-ink" aria-hidden>
                    <div className="flex-1 h-px" style={{ background: `${spineColor}44` }} />
                    <span className="text-[10px] font-bold tracking-widest shrink-0" style={{ color: `${spineColor}aa` }}>
                      你的选择之后
                    </span>
                    <div className="flex-1 h-px" style={{ background: `${spineColor}44` }} />
                  </div>
                )}
                <SceneMessage message={msg as any} />
              </div>
            ));
          })()}

          {revealText && (
            <div className="text-sm italic text-[rgba(1,1,1,.6)] border-l-4 pl-3 py-1 anim-ink"
              style={{ borderColor: spineColor }}>
              {revealText}
            </div>
          )}

          {/* 继续按钮 / 过渡提示 — 固定容器，纯 opacity 切换 */}
          {(waitingForContinue || isTransitioning) && (
            <div className="relative self-end mt-3" style={{ height: 44, minWidth: 130 }}>
              {/* 继续按钮 */}
              <button
                onClick={handleContinue}
                style={{
                  position: "absolute", inset: 0,
                  background: spineColor,
                  color: "#EFE6C9",
                  fontWeight: 700,
                  fontSize: 14,
                  letterSpacing: "0.03em",
                  border: "none",
                  cursor: "pointer",
                  opacity: !isTransitioning ? 1 : 0,
                  pointerEvents: !isTransitioning ? "auto" : "none",
                  transition: "opacity 180ms ease",
                }}>
                继续 →
              </button>
              {/* 过渡提示：无背景无边框，纯文字淡入 */}
              <div
                style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", gap: 8, paddingLeft: 4,
                  opacity: isTransitioning ? 1 : 0,
                  pointerEvents: "none",
                  transition: "opacity 180ms ease",
                }}>
                <span
                  className="animate-pulse inline-block rounded-full flex-shrink-0"
                  style={{ width: 6, height: 6, background: spineColor }} />
                <span style={{ fontSize: 12, color: "rgba(1,1,1,.4)" }}>
                  {waitPhase === 0 ? "推演中…" : waitPhase === 1 ? "正在为你推演下一幕…" : "马上就好，稍候…"}
                </span>
              </div>
            </div>
          )}

          {showChoices && !choiceDone && (
            <div ref={choicesAnchorRef} className="anim-ink" style={{ scrollMarginTop: 12 }}>
              {currentAct.choices.length > 0 ? (
                <ChoicePanel
                  choices={currentAct.choices as any}
                  lockedIds={lockedIds}
                  onChoice={handleChoice as any}
                />
              ) : choicesLoading ? (
                // 正文已就位、选项异步生成中：显示轻量占位骨架，而不是空白
                <div className="flex flex-col gap-2.5 py-1">
                  <div className="flex items-center gap-2 text-[13px]" style={{ color: "rgba(1,1,1,.5)" }}>
                    <span className="animate-pulse inline-block rounded-full" style={{ width: 6, height: 6, background: spineColor }} />
                    正在为你铺开三条路……
                  </div>
                  {[0, 1, 2].map(i => (
                    <div key={i} className="rounded-lg animate-pulse"
                      style={{ height: 52, background: "rgba(1,1,1,.05)", border: "1px solid rgba(1,1,1,.06)" }} />
                  ))}
                </div>
              ) : null}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {shareToast && (
        <div className="fixed bottom-8 left-1/2 z-[100] pointer-events-none"
          style={{ transform: "translateX(-50%)" }}>
          <div className="px-5 py-2.5 text-sm font-bold rounded-full"
            style={{ background: "#010101", color: "#EFE6C9", boxShadow: "0 4px 20px rgba(0,0,0,.45)" }}>
            {shareToast}
          </div>
        </div>
      )}
    </div>
  );
}
