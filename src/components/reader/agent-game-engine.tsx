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

interface ActData {
  title: string;
  sceneName?: string;
  messages: { id: string; type: string; text: string; delay?: number }[];
  choices: {
    id: string; label: string; text: string;
    innerVoice: string; revealText: string; socialTag: string;
    scores: Record<string, number>;
    isTrap?: boolean; isSelfPreserve?: boolean; isSacrifice?: boolean;
  }[];
  trapEndingText?: string;
  trapRevivalText?: string;
  consequenceMap: Record<string, { id: string; type: string; text: string }[]>;
  forcedContinue: { id: string; type: string; text: string }[];
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

export function AgentGameEngine({
  initialState, initialAct, bookMeta, onComplete, onBack, intensifyMode = false, normalChoiceHistory,
}: AgentGameEngineProps) {
  const [worldState, setWorldState] = useState<WorldState>(initialState);
  const [currentAct, setCurrentAct] = useState<ActData>(initialAct);
  const [nextActLoading, setNextActLoading] = useState(false);
  const [displayedMsgs, setDisplayedMsgs] = useState<DisplayMsg[]>([]);
  const [showChoices, setShowChoices] = useState(false);
  const [choiceDone, setChoiceDone] = useState(false);
  const [revealText, setRevealText] = useState<string | null>(null);
  const [waitingForContinue, setWaitingForContinue] = useState(false);
  const [lockedIds, setLockedIds] = useState<string[]>([]);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [showTrap, setShowTrap] = useState(false);
  const [trapData, setTrapData] = useState<{ ending: string; revival: string; trapChoiceId: string } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const choicesAnchorRef = useRef<HTMLDivElement>(null);
  const spineColor = bookMeta?.color ?? "#1A3A5C";

  // 用 ref 保存预加载结果 — 避免闭包读到旧 state。记录预热对应的 choiceId，
  // 以便「选项一出现就预热默认项」：若用户点了别的选项，丢弃重来。
  const prefetchedRef = useRef<{ state: WorldState; act: ActData; choiceId: string } | null>(null);
  const prefetchingRef = useRef(false);
  const prefetchingIdRef = useRef<string | null>(null);
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
        }),
      });
      // 仅当这次预热仍是最新目标时才采纳，避免旧目标结果覆盖
      if (res.ok && prefetchingIdRef.current === choice.id) {
        const data = await res.json() as { state: WorldState; act: ActData };
        prefetchedRef.current = { ...data, choiceId: choice.id };
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

    // 立即后台预加载
    setTimeout(() => prefetchNextAct(choice, currentAct, worldStateRef.current), 200);

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

  // 「继续」按钮：读 ref 不读 state，彻底避免闭包问题
  const handleContinue = useCallback(async () => {
    setWaitingForContinue(false);
    setIsTransitioning(true);

    // 直接用预加载结果（ref，永远是最新的）
    if (prefetchedRef.current) {
      const fetched = prefetchedRef.current as { state: WorldState; act: ActData };
      prefetchedRef.current = null;
      if (!fetched.act.shouldContinue || fetched.state.actNumber > fetched.state.maxActs) {
        onComplete(fetched.state); return;
      }
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
        const fetched = prefetchedRef.current as { state: WorldState; act: ActData };
        prefetchedRef.current = null;
        if (!fetched.act.shouldContinue || fetched.state.actNumber > fetched.state.maxActs) {
          onComplete(fetched.state); return;
        }
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
        }),
      });
      if (!res.ok) throw new Error("next-act failed");
      const data = await res.json();
      if (!data.act?.shouldContinue || data.state.actNumber > data.state.maxActs) {
        onComplete(data.state); return;
      }
      setWorldState(data.state);
      setCurrentAct(data.act);
    } catch (e) {
      console.error("handleContinue fetch failed:", e);
      setIsTransitioning(false);
      setWaitingForContinue(true); // 还原，让用户可以重试
    } finally {
      setNextActLoading(false);
    }
  }, [onComplete]);

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

        {/* 顶栏：返回 + 标题 + 分享（故事页用深色古香态，与内容页统一） */}
        <PageTopbar
          title={currentAct.title}
          subtitle={`第${worldState.actNumber}幕 · ${worldState.storyPhase}${nextActLoading ? " · 生成中…" : ""}${intensifyMode ? " 🔥" : ""}`}
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

        {/* 消息流 */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ scrollBehavior: "smooth" }}>
          {displayedMsgs.map(msg => (
            <SceneMessage key={msg.key} message={msg as any} />
          ))}

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
                <span style={{ fontSize: 12, color: "rgba(1,1,1,.4)" }}>推演中…</span>
              </div>
            </div>
          )}

          {showChoices && !choiceDone && (
            <div ref={choicesAnchorRef} className="anim-ink" style={{ scrollMarginTop: 12 }}>
              <ChoicePanel
                choices={currentAct.choices as any}
                lockedIds={lockedIds}
                onChoice={handleChoice as any}
              />
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
