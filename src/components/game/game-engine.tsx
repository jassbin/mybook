"use client";
// src/components/game/game-engine.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import type { Choice, StoryMessage } from "@/lib/game/story-data";
import {
  STORY_SCENES,
  INITIAL_GAME_STATE,
  applyScores,
  type GameState,
} from "@/lib/game/story-data";
import { ChatMessage } from "./chat-message";
import { ChoicePanel } from "./choice-panel";
import { SceneHeader } from "./scene-header";
import { DeathScreen } from "./death-screen";
import { ResultPage } from "./result-page";

interface GameEngineProps {
  onRestart: () => void;
}

type DisplayMessage = StoryMessage & { key: string };

export function GameEngine({ onRestart }: GameEngineProps) {
  const [gameState, setGameState] = useState<GameState>({ ...INITIAL_GAME_STATE });
  const [displayedMessages, setDisplayedMessages] = useState<DisplayMessage[]>([]);
  const [showChoices, setShowChoices] = useState(false);
  const [choicesDone, setChoicesDone] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [isRevived, setIsRevived] = useState(false); // locked out of丙 in scene3
  const [isComplete, setIsComplete] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentScene = STORY_SCENES[gameState.currentScene];

  // Auto-scroll to bottom as messages appear
  useEffect(() => {
    const t = setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    return () => clearTimeout(t);
  }, [displayedMessages.length, showChoices]);

  // Launch story messages for current scene
  useEffect(() => {
    if (gameState.isComplete) return;

    setDisplayedMessages([]);
    setShowChoices(false);
    setChoicesDone(false);

    const messages = currentScene.messages;
    let elapsed = 0;

    const timers: ReturnType<typeof setTimeout>[] = [];

    messages.forEach((msg, i) => {
      elapsed += (msg.delay ?? 0) + (i === 0 ? 0 : 500);
      timers.push(
        setTimeout(() => {
          setDisplayedMessages((prev) => [...prev, { ...msg, key: `${gameState.currentScene}-${msg.id}` }]);
          if (i === messages.length - 1) {
            setTimeout(() => setShowChoices(true), 600);
          }
        }, elapsed),
      );
    });

    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.currentScene]);

  const handleChoice = useCallback((choice: Choice) => {
    // Scene 3 death path
    if (gameState.currentScene === 2 && choice.id === "s3-C" && !isRevived) {
      setIsDead(true);
      return;
    }

    const newScores = applyScores(gameState.scores, choice.scores);
    const newHistory = [...gameState.choiceHistory, choice.id];

    // Show consequence messages
    const consequenceMsgs = currentScene.consequences[choice.id] ?? [];
    const forcedMsgs = currentScene.forcedContinue;
    const allConseq: DisplayMessage[] = [
      ...consequenceMsgs.map((m, i) => ({ ...m, key: `conseq-${i}-${m.id}` })),
      ...forcedMsgs.map((m, i) => ({ ...m, key: `forced-${i}-${m.id}` })),
    ];

    setChoicesDone(true);

    // Append consequence messages one by one
    allConseq.forEach((msg, i) => {
      setTimeout(() => {
        setDisplayedMessages((prev) => [...prev, msg]);
        if (i === allConseq.length - 1) {
          // Move to next scene or end
          setTimeout(() => {
            const isLastScene = gameState.currentScene >= STORY_SCENES.length - 1;
            if (isLastScene) {
              setGameState((prev) => ({
                ...prev,
                scores: newScores,
                choiceHistory: newHistory,
                selectedChoice: choice.id,
                isComplete: true,
              }));
              setIsComplete(true);
            } else {
              setGameState((prev) => ({
                ...prev,
                currentScene: prev.currentScene + 1,
                scores: newScores,
                choiceHistory: newHistory,
                selectedChoice: choice.id,
              }));
            }
          }, 800);
        }
      }, (i + 1) * 700);
    });
  }, [gameState, currentScene, isRevived]);

  const handleRevive = useCallback(() => {
    setIsDead(false);
    setIsRevived(true);
    // Apply heavy penalty to action score
    setGameState((prev) => ({
      ...prev,
      scores: { ...prev.scores, action: Math.max(0, prev.scores.action - 30) },
    }));
    // Re-show choices without the death option
    setShowChoices(true);
    setChoicesDone(false);
  }, []);

  if (isComplete) {
    return <ResultPage state={gameState} onRestart={onRestart} />;
  }

  if (isDead) {
    return <DeathScreen onRevive={handleRevive} />;
  }

  // Filter out death choice if revived in scene 3
  const availableChoices = isRevived && gameState.currentScene === 2
    ? currentScene.choices.filter((c) => c.id !== "s3-C")
    : currentScene.choices;

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "#050403", paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
    >
      <div
        className="paper-surface relative w-full max-w-sm mx-auto flex flex-col flex-1 border border-[rgba(239,230,201,.5)] overflow-hidden"
        style={{ boxShadow: "0 0 0 6px #050403, 0 28px 80px rgba(0,0,0,.55)", margin: "8px auto" }}
      >
        <SceneHeader
          scene={currentScene.scene}
          sceneIndex={gameState.currentScene}
          totalScenes={STORY_SCENES.length}
        />

        {/* Score mini-bar */}
        <div className="relative z-10 flex gap-1 px-4 py-2 border-b border-[rgba(1,1,1,.1)]">
          {(["authority", "professional", "action", "sincerity"] as const).map((key) => (
            <div key={key} className="flex-1">
              <div className="h-1 rounded-full bg-[rgba(1,1,1,.1)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${gameState.scores[key]}%`,
                    background: { authority: "#C34A28", professional: "#626C58", action: "#010101", sincerity: "#8B6A3E" }[key],
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Chat area */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 pt-4 pb-2">
          {displayedMessages.map((msg) => (
            <ChatMessage key={msg.key} message={msg} />
          ))}

          {/* Choices */}
          {showChoices && !choicesDone && (
            <ChoicePanel choices={availableChoices} onChoice={handleChoice} />
          )}

          {/* Revived notice */}
          {isRevived && gameState.currentScene === 2 && showChoices && !choicesDone && (
            <div className="chat-bubble narrator mb-3 animate-ink-in text-[#C34A28] text-xs">
              ✦ 心魔已破，丙项已锁，只剩甲乙可选
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
