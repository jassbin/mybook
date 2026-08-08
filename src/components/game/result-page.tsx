"use client";
// src/components/game/result-page.tsx
import { useState } from "react";
import type { GameState } from "@/lib/game/story-data";
import { computeEnding, computePenalties, ENDINGS } from "@/lib/game/story-data";
import { RadarChart } from "./radar-chart";

interface ResultPageProps {
  state: GameState;
  onRestart: () => void;
}

const SCORE_LABELS = {
  authority:    { label: "权威服从度", desc: "你在多大程度上优先维护领导意志、权威叙事", color: "#C34A28" },
  professional: { label: "专业信任度", desc: "你在多大程度上基于事实和专业信用做判断", color: "#626C58" },
  action:       { label: "行动奋斗值", desc: "你在多大程度上选择主动出击、燃烧自己", color: "#010101" },
  sincerity:    { label: "情感坦诚度", desc: "你在多大程度上选择非交易化的真诚沟通", color: "#8B6A3E" },
} as const;

const PENALTY_TEXTS: Record<string, string> = {
  "authority-extreme": "你全程站在师父一边打压悟空——花果山时，悟空用石头砸你旧伤，拖延了一刻钟才答应救援。你在山洞外多流了一刻钟的血。",
  "professional-low":  "你全程否定悟空的判断——逃跑时犹豫不决，被白骨精的阴风削掉左耳一小块（永久标记）。",
  "action-low":        "你触发了躺平死亡结局——观音虽然复活你，但收走了你的「定风丹」，此后三回逢风系妖怪必被吹翻，额外挨打累计两次。",
  "sincerity-low":     "你全程拒绝坦诚——悟空救回人后，故意用缩地法让你的行李变重三倍，你挑断了一根扁担，累得三天直不起腰。",
};

export function ResultPage({ state, onRestart }: ResultPageProps) {
  const [aiNarration, setAiNarration] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const ending = computeEnding(state.scores, state.choiceHistory);
  const penalties = computePenalties(state.scores, state.choiceHistory);

  const fetchAiNarration = async () => {
    if (aiNarration || loadingAI) return;
    setLoadingAI(true);
    try {
      const res = await fetch("/api/game/narration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: state.scores, ending: ending.type }),
      });
      if (!res.ok) throw new Error("failed");
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setAiNarration(text);
      }
    } catch {
      setAiNarration("取经路漫漫，你已经走完了属于你的白虎岭一程。");
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#050403", paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
    >
      {/* Poster shell */}
      <div className="paper-surface relative w-full max-w-sm mx-auto flex-1 flex flex-col border border-[rgba(239,230,201,.5)] animate-fade-up"
        style={{ boxShadow: "0 0 0 6px #050403, 0 28px 80px rgba(0,0,0,.55)", margin: "16px auto" }}>
        <div className="relative z-10 flex flex-col flex-1 overflow-y-auto">

          {/* Header */}
          <div className="px-5 pt-5 pb-3 border-b border-[rgba(1,1,1,.15)]">
            <div
              className="text-3xl font-black leading-none tracking-tight mb-1"
              style={{ fontFamily: "'Ma Shan Zheng', serif", color: "#C34A28" }}
            >
              {ending.title}
            </div>
            <p className="text-xs text-[rgba(1,1,1,.5)] tracking-wide">白虎岭惊魂 · 八戒的取经路</p>
          </div>

          {/* Radar chart */}
          <div className="flex flex-col items-center py-5 border-b border-[rgba(1,1,1,.12)]">
            <p className="text-xs tracking-widest text-[rgba(1,1,1,.4)] mb-3 font-semibold">决策价值统计</p>
            <RadarChart values={state.scores} size={200} />
            <p className="text-[10px] text-[rgba(1,1,1,.35)] mt-2 italic">价值观无好坏，只是你是谁的镜子</p>
          </div>

          {/* Score bars */}
          <div className="px-5 py-4 border-b border-[rgba(1,1,1,.12)]">
            {(Object.keys(SCORE_LABELS) as (keyof typeof SCORE_LABELS)[]).map((key) => {
              const { label, desc, color } = SCORE_LABELS[key];
              const val = state.scores[key];
              return (
                <div key={key} className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold" style={{ color }}>{label}</span>
                    <span className="text-xs font-bold" style={{ color }}>{val}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[rgba(1,1,1,.1)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${val}%`, background: color }}
                    />
                  </div>
                  <p className="text-xs text-[rgba(1,1,1,.45)] mt-1">{desc}</p>
                </div>
              );
            })}
          </div>

          {/* Ending narration */}
          <div className="px-5 py-4 border-b border-[rgba(1,1,1,.12)]">
            <p className="text-xs tracking-widest text-[rgba(1,1,1,.4)] mb-2 font-semibold">故事结语</p>
            <p className="text-sm leading-relaxed text-[rgba(1,1,1,.8)]">{ending.narration}</p>
          </div>

          {/* AI narration */}
          <div className="px-5 py-4 border-b border-[rgba(1,1,1,.12)]">
            <button
              onClick={fetchAiNarration}
              disabled={loadingAI || !!aiNarration}
              className="w-full py-2.5 text-sm font-semibold rounded-xl border border-[rgba(1,1,1,.25)] transition-all duration-200 disabled:opacity-50 active:scale-95"
              style={{ background: "rgba(239,230,201,.7)", color: "#010101" }}
            >
              {loadingAI ? "AI 正在执笔……" : aiNarration ? "专属旁白已生成" : "✨ 生成你的专属旁白"}
            </button>
            {aiNarration && (
              <div className="mt-3 animate-ink-in">
                <div className="chat-bubble inner-voice text-sm leading-relaxed">{aiNarration}</div>
              </div>
            )}
          </div>

          {/* Penalties */}
          {penalties.length > 0 && (
            <div className="px-5 py-4 border-b border-[rgba(1,1,1,.12)]">
              <p className="text-xs tracking-widest text-[#C34A28] mb-2 font-semibold">⚠ 极端倾向·故事内代价</p>
              <div className="flex flex-col gap-2">
                {penalties.map((p) => (
                  <div key={p} className="text-xs leading-relaxed text-[rgba(1,1,1,.65)] border-l-2 border-[#C34A28] pl-3 py-1">
                    {PENALTY_TEXTS[p]}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Restart */}
          <div className="px-5 py-5">
            <button
              onClick={onRestart}
              className="w-full py-3.5 text-[#EFE6C9] font-bold text-sm tracking-widest rounded-xl transition-all duration-200 active:scale-95"
              style={{ background: "#010101", fontFamily: "'Noto Serif SC', serif" }}
            >
              换一种活法，重走一遍
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
