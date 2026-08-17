"use client";
// src/components/reader/choice-panel.tsx
import { useState } from "react";
import type { ChoiceOption } from "@/lib/reader/types";

interface ChoicePanelProps {
  choices: ChoiceOption[];
  lockedIds?: string[];
  onChoice: (choice: ChoiceOption) => void;
}

export function ChoicePanel({ choices, lockedIds = [], onChoice }: ChoicePanelProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (choice: ChoiceOption) => {
    if (selected || lockedIds.includes(choice.id)) return;
    setSelected(choice.id);
    setTimeout(() => onChoice(choice), 320);
  };

  return (
    <div className="px-0 pb-4 pt-2 anim-up">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 px-4">
        <span
          className="text-[18px] font-black tracking-wider"
          style={{ fontFamily: "'Ma Shan Zheng', serif", color: "#C34A28" }}
        >
          抉择
        </span>
        <div className="flex-1 h-px bg-[rgba(1,1,1,.15)]" />
      </div>

      <div className="flex flex-col gap-3 px-4">
        {choices.map((choice) => {
          const isLocked = lockedIds.includes(choice.id);
          const isSelected = selected === choice.id;
          const isThrill = choice.choiceKind === "thrill";
          const PINK = "#E85D9B";

          return (
            <button
              key={choice.id}
              className={`choice-card text-left w-full ${isSelected ? (isThrill ? "bg-[#FCEBF3]" : "border-[#C34A28] bg-[#F5EDD4]") : ""} ${isLocked ? "opacity-35 cursor-not-allowed" : ""}`}
              onClick={() => handleSelect(choice)}
              disabled={!!selected || isLocked}
              style={{
                transform: isSelected ? "translateX(4px)" : undefined,
                // 爽点选项：粉色边框区分
                ...(isThrill ? { borderColor: isSelected ? PINK : "rgba(232,93,155,.55)", boxShadow: isSelected ? "0 0 0 1px rgba(232,93,155,.4)" : undefined } : {}),
              }}
            >
              {/* Option label + text */}
              <div className="flex items-start gap-2 mb-2">
                <span className="choice-label shrink-0 mt-0.5"
                  style={isThrill ? { background: PINK, borderColor: PINK, color: "#fff" } : undefined}>{choice.label}</span>
                <span className="flex-1 text-sm font-bold text-[rgba(1,1,1,.88)] leading-snug">
                  {choice.text}
                </span>
                {isThrill && choice.strategy && (
                  <span className="text-[10px] font-black shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(232,93,155,.14)", color: PINK }}>爽·{choice.strategy}</span>
                )}
                {isLocked && <span className="text-[10px] text-[rgba(1,1,1,.35)] shrink-0 mt-0.5">已锁</span>}
                {isSelected && <span className="text-sm shrink-0 mt-0.5" style={{ color: isThrill ? PINK : "#C34A28" }}>✓</span>}
              </div>

              {/* Inner voice — always visible */}
              <div
                className="text-[12px] leading-relaxed italic border-l-2 pl-3 py-1"
                style={{
                  borderColor: isThrill ? "rgba(232,93,155,.4)" : "rgba(195,74,40,.35)",
                  color: "rgba(1,1,1,.62)",
                  background: isThrill ? "rgba(232,93,155,.05)" : "rgba(195,74,40,.04)",
                }}
              >
                {choice.innerVoice}
              </div>

              {/* Social tag */}
              <div className="mt-2 text-[11px] text-[rgba(1,1,1,.38)] italic">
                🏷 {choice.socialTag}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
