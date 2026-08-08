"use client";
// src/components/game/choice-panel.tsx
import { useState } from "react";
import type { Choice } from "@/lib/game/story-data";

interface ChoicePanelProps {
  choices: Choice[];
  onChoice: (choice: Choice) => void;
  disabled?: boolean;
}

export function ChoicePanel({ choices, onChoice, disabled }: ChoicePanelProps) {
  const [expandedInnerVoice, setExpandedInnerVoice] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (choice: Choice) => {
    if (disabled || selected) return;
    setSelected(choice.id);
    setTimeout(() => onChoice(choice), 400);
  };

  return (
    <div className="px-4 pb-4 pt-2 animate-fade-up">
      {/* Section label */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="text-xs tracking-widest font-bold"
          style={{ color: "#C34A28", fontFamily: "'Ma Shan Zheng', serif", fontSize: 16 }}
        >
          抉择
        </div>
        <div className="flex-1 h-px bg-[rgba(1,1,1,.15)]" />
        <div className="text-xs text-[rgba(1,1,1,.4)] tracking-wide">展开内心独白 ↓</div>
      </div>

      <div className="flex flex-col gap-2.5">
        {choices.map((choice) => {
          const isExpanded = expandedInnerVoice === choice.id;
          const isSelected = selected === choice.id;

          return (
            <div key={choice.id} className="flex flex-col gap-1">
              <button
                className={`choice-card ${isSelected ? "border-[#C34A28] bg-[#F7EFD4] translate-x-1" : ""}`}
                onClick={() => handleSelect(choice)}
                disabled={disabled || !!selected}
              >
                <div className="flex items-start gap-2">
                  <span className="choice-label shrink-0">{choice.label}</span>
                  <span className="flex-1 text-[rgba(1,1,1,.85)] font-semibold">{choice.text}</span>
                  {isSelected && (
                    <span className="text-[#C34A28] text-sm font-bold shrink-0">✓</span>
                  )}
                </div>
                {/* Social tag */}
                <div className="mt-1.5 ml-7 text-xs text-[rgba(1,1,1,.4)] italic">
                  🏷 {choice.socialTag}
                </div>
              </button>

              {/* Inner voice toggle */}
              <button
                className="text-left ml-7 text-xs text-[rgba(1,1,1,.45)] hover:text-[rgba(1,1,1,.7)] transition-colors flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedInnerVoice(isExpanded ? null : choice.id);
                }}
              >
                <span>{isExpanded ? "▲" : "▼"}</span>
                <span className="italic">内心独白</span>
              </button>

              {isExpanded && (
                <div className="ml-7 animate-ink-in">
                  <div className="chat-bubble inner-voice text-xs leading-relaxed">
                    {choice.innerVoice}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
