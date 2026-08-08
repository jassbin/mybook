"use client";
// src/components/reader/game-engine.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import type { AnalysisResult, BookMeta, ChoiceOption, StoryMessage } from "@/lib/reader/types";
import { applyScores, initScores } from "@/lib/reader/types";
import { SceneMessage } from "./scene-message";
import { ChoicePanel } from "./choice-panel";
import { TrapScreen } from "./trap-screen";

interface GameEngineProps {
  analysis: AnalysisResult;
  bookMeta: BookMeta | null;
  onComplete: (scores: Record<string, number>, history: string[], choiceLabels: string[], trapSceneIdxs: number[]) => void;
  intensifyMode?: boolean;
}

type DisplayMsg = StoryMessage & { key: string };

export function GameEngine({ analysis, bookMeta, onComplete, intensifyMode }: GameEngineProps) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>(() => initScores(analysis.axes));
  // history: "scene0:A" style ids
  const [history, setHistory] = useState<string[]>([]);
  // choiceLabels: human-readable e.g. "你选择了激将——说妖怪辱骂他"
  const [choiceLabels, setChoiceLabels] = useState<string[]>([]);
  const [displayedMsgs, setDisplayedMsgs] = useState<DisplayMsg[]>([]);
  const [showChoices, setShowChoices] = useState(false);
  const [choiceDone, setChoiceDone] = useState(false);
  // reveal + waiting for user to dismiss
  const [revealText, setRevealText] = useState<string | null>(null);
  const [waitingForContinue, setWaitingForContinue] = useState(false);
  const [pendingAdvance, setPendingAdvance] = useState<(() => void) | null>(null);
  // lockedIds: empty by default; only trap choice id added after revival
  const [lockedIds, setLockedIds] = useState<string[]>([]);
  // trapTriggeredScenes: records which scene indices had a trap triggered
  const [trapTriggeredScenes, setTrapTriggeredScenes] = useState<number[]>([]);
  const [showTrap, setShowTrap] = useState(false);
  const [trapData, setTrapData] = useState<{ ending: string; revival: string; trapChoiceId: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scene = analysis.scenes[sceneIdx];
  const spineColor = bookMeta?.color ?? "#1A3A5C";

  // Auto scroll
  useEffect(() => {
    const t = setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    return () => clearTimeout(t);
  }, [displayedMsgs.length, showChoices, revealText, waitingForContinue]);

  // Launch scene messages
  useEffect(() => {
    setDisplayedMsgs([]);
    setShowChoices(false);
    setChoiceDone(false);
    setRevealText(null);
    setWaitingForContinue(false);
    setPendingAdvance(null);
    // Always start a fresh scene with no locked choices;
    // lockedIds are only applied within the same scene after a trap revival.
    setLockedIds([]);

    const msgs = scene.messages;
    let elapsed = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    msgs.forEach((msg, i) => {
      elapsed += (msg.delay ?? 0) + (i === 0 ? 0 : 480);
      timers.push(
        setTimeout(() => {
          setDisplayedMsgs((prev) => [...prev, { ...msg, key: `${sceneIdx}-${msg.id}` }]);
          if (i === msgs.length - 1) {
            setTimeout(() => setShowChoices(true), 550);
          }
        }, elapsed)
      );
    });

    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneIdx]);

  // Advance to next scene — called after user clicks 继续
  // By this point consequence messages have already been appended
  const buildAdvance = useCallback((
    newScores: Record<string, number>,
    newHistory: string[],
    newChoiceLabels: string[],
    currentSceneIdx: number
  ) => {
    return () => {
      setWaitingForContinue(false);
      setPendingAdvance(null);
      const isLast = currentSceneIdx >= analysis.scenes.length - 1;
      if (isLast) onComplete(newScores, newHistory, newChoiceLabels, trapTriggeredScenes);
      else setSceneIdx(currentSceneIdx + 1);
    };
  }, [analysis.scenes.length, onComplete, trapTriggeredScenes]);

  const handleChoice = useCallback((choice: ChoiceOption) => {
    // Trap path
    if (choice.isTrap) {
      setTrapData({
        ending: scene.trapEndingText ?? "你的选择触发了极端结局……",
        revival: scene.trapRevivalText ?? "命运给了你重选的机会，但此路已锁。",
        trapChoiceId: choice.id,
      });
      setShowTrap(true);
      return;
    }

    const newScores = applyScores(scores, analysis.axes, choice.scores);
    const newHistory = [...history, `scene${sceneIdx}:${choice.id}`];
    const label = `第${sceneIdx + 1}次，你选择了——${choice.text}`;
    const newChoiceLabels = [...choiceLabels, label];

    setScores(newScores);
    setHistory(newHistory);
    setChoiceLabels(newChoiceLabels);
    setChoiceDone(true);

    // Build consequence + forced-continue messages
    const conseqMsgs: DisplayMsg[] = [
      ...(scene.consequenceMap[choice.id] ?? []).map((m, i) => ({
        ...m,
        key: `conseq-${sceneIdx}-${i}`,
      })),
      ...scene.forcedContinue.map((m, i) => ({
        ...m,
        key: `forced-${sceneIdx}-${i}`,
      })),
    ];

    // 1. Show reveal text immediately
    setTimeout(() => setRevealText(choice.revealText), 180);

    if (conseqMsgs.length === 0) {
      // No consequence messages: show 继续 after a short pause
      setTimeout(() => {
        setWaitingForContinue(true);
        setPendingAdvance(() => buildAdvance(newScores, newHistory, newChoiceLabels, sceneIdx));
      }, 600);
      return;
    }

    // 2. Stream consequence messages one-by-one
    conseqMsgs.forEach((msg, i) => {
      setTimeout(() => {
        setDisplayedMsgs((prev) => [...prev, msg]);
        // 3. After the LAST message is shown, reveal 继续 button
        if (i === conseqMsgs.length - 1) {
          setTimeout(() => {
            setWaitingForContinue(true);
            setPendingAdvance(() => buildAdvance(newScores, newHistory, newChoiceLabels, sceneIdx));
          }, 500);
        }
      }, (i + 1) * 600);
    });
  }, [scores, history, choiceLabels, sceneIdx, scene, analysis, buildAdvance]);

  const handleContinue = useCallback(() => {
    if (pendingAdvance) pendingAdvance();
  }, [pendingAdvance]);

  const handleRevive = useCallback(() => {
    setShowTrap(false);
    // Lock the trap choice and record the scene as having triggered a trap
    if (trapData) {
      setLockedIds((prev) => [...prev, trapData.trapChoiceId]);
      setTrapTriggeredScenes((prev) =>
        prev.includes(sceneIdx) ? prev : [...prev, sceneIdx]
      );
    }
    setTrapData(null);
    setShowChoices(true);
    setChoiceDone(false);
  }, [trapData, sceneIdx]);

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
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "#050403", paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
    >
      <div
        className="paper-surface relative w-full max-w-sm mx-auto flex flex-col flex-1 border border-[rgba(239,230,201,.5)] overflow-hidden"
        style={{ boxShadow: "0 0 0 6px #050403, 0 28px 80px rgba(0,0,0,.55)", margin: "8px auto" }}
      >
        {/* Scene header */}
        <div
          className="relative z-20 flex items-center justify-between px-4 py-3 border-b border-[rgba(1,1,1,.15)] sticky top-0"
          style={{ background: "rgba(239,230,201,.95)", backdropFilter: "blur(8px)" }}
        >
          <div className="flex items-center gap-2">
            {intensifyMode && (
              <span
                className="text-[9px] font-black px-1.5 py-0.5 rounded-sm"
                style={{ background: "#C34A28", color: "#EFE6C9" }}
              >
                ⚡极压
              </span>
            )}
            <span className="text-sm font-black tracking-wider" style={{ fontFamily: "'Ma Shan Zheng', serif", color: spineColor }}>
              {scene.title}
            </span>
            <span className="text-xs text-[rgba(1,1,1,.45)]">
              第{["一","二","三","四","五"][sceneIdx]}幕
            </span>
          </div>
          <div className="flex items-center gap-1">
            {analysis.scenes.map((_, i) => (
              <div key={i} className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: i === sceneIdx ? 18 : 7, background: i <= sceneIdx ? spineColor : "rgba(1,1,1,.18)" }} />
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 pt-4 pb-2">
          {displayedMsgs.map((msg) => (
            <SceneMessage key={msg.key} message={msg} />
          ))}

          {/* Choices */}
          {showChoices && !choiceDone && (
            <ChoicePanel choices={scene.choices} lockedIds={lockedIds} onChoice={handleChoice} />
          )}

          {/* Reveal text (点破语) + 继续 button */}
          {revealText && (
            <div className="mb-3 anim-ink">
              <div className="bubble-reveal">✦ {revealText}</div>
            </div>
          )}

          {waitingForContinue && (
            <div className="flex justify-center mb-4 mt-2 anim-ink">
              <button
                onClick={handleContinue}
                className="px-8 py-2.5 text-sm font-bold text-[#EFE6C9] tracking-widest transition-all active:scale-95"
                style={{ background: "#010101", fontFamily: "'Noto Serif SC', serif", borderRadius: 0 }}
              >
                继续 →
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
