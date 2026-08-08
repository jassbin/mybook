"use client";
// src/components/reader/agent-character-intro.tsx
// Agent 模式角色介绍页：展示角色 DNA，支持进入故事 / 换一个角色
import { useState } from "react";
import type { BookMeta } from "@/lib/reader/types";
import type { WorldState } from "@/lib/agent/world-state";

export interface AgentCharInitData {
  state: WorldState;
  character: string;
  characterTagline: string;
  driveAnalysis: string[];
  act: unknown;
}

interface AgentCharacterIntroProps {
  initData: AgentCharInitData;
  bookMeta: BookMeta | null;
  /** 是否还有可换角色（page 层决定） */
  canSwitch: boolean;
  onEnter: () => void;
  /** 无参数：让 page 层自动选下一个 */
  onSwitchCharacter: () => void;
  onBack: () => void;
}

export function AgentCharacterIntro({
  initData,
  bookMeta,
  canSwitch,
  onEnter,
  onSwitchCharacter,
  onBack,
}: AgentCharacterIntroProps) {
  const [switching, setSwitching] = useState(false);
  const spineColor = bookMeta?.color ?? "#1A3A5C";
  const spineText  = bookMeta?.textColor ?? "#EFE6C9";

  const labels = ["愤怒来自", "守护什么", "最怕失去"];

  // 场域标签
  const currentCandidate = bookMeta?.candidates.find(c => c.name === initData.character);
  const domainTags = currentCandidate?.dominantDomains ?? [];

  const handleSwitch = () => {
    if (switching) return;
    setSwitching(true);
    onSwitchCharacter();
    // 切换完成后组件会被重新 key 渲染，无需手动 reset
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen"
      style={{ background: "#050403", paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
    >
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${spineColor}33, transparent 55%), #050403`,
          transition: "background 0.5s",
        }}
      />

      <div
        className="paper-surface relative w-full max-w-sm flex flex-col overflow-hidden border border-[rgba(239,230,201,.6)] anim-up"
        style={{
          boxShadow: "0 0 0 8px #050403, 0 28px 80px rgba(0,0,0,.55)",
          margin: "9px auto",
          minHeight: "calc(100dvh - var(--safe-top) - var(--safe-bottom) - 18px)",
        }}
      >
        {/* ── 顶部色块：书名 + 角色名 + tagline ── */}
        <div className="relative z-10 px-5 pt-6 pb-5" style={{ background: spineColor }}>
          {/* 返回 */}
          <button
            onClick={onBack}
            className="absolute top-4 left-4 flex items-center gap-1 text-[11px] font-bold opacity-60 hover:opacity-90 transition-opacity active:scale-95"
            style={{ color: spineText }}
          >
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9l5 5" stroke={spineText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            返回
          </button>

          <div className="text-xs tracking-widest mb-2 mt-2" style={{ color: spineText, opacity: 0.65 }}>
            《{initData.state.book}》· 今日角色
          </div>
          <div
            className="text-4xl font-black leading-none mb-2"
            style={{ fontFamily: "'Ma Shan Zheng', serif", color: spineText, letterSpacing: "3px" }}
          >
            {initData.character}
          </div>
          <div className="text-sm leading-snug mb-3" style={{ color: spineText, opacity: 0.88, fontStyle: "italic" }}>
            {initData.characterTagline}
          </div>

          {/* 场域标签 */}
          {domainTags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {domainTags.map(tag => (
                <span
                  key={tag}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-sm"
                  style={{ background: "rgba(0,0,0,.22)", color: spineText, opacity: 0.9 }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── 角色 DNA 三问 ── */}
        <div className="relative z-10 flex-1 px-5 pt-5 pb-2">
          <div className="text-xs font-bold tracking-widest text-[rgba(1,1,1,.38)] mb-4 uppercase">
            他是怎样一个人
          </div>

          {initData.driveAnalysis.slice(0, 3).map((line, i) => (
            <div
              key={i}
              className="flex gap-3 items-start mb-4 anim-ink"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="shrink-0 w-16 text-xs font-black pt-0.5 tracking-wide" style={{ color: spineColor }}>
                {labels[i]}
              </div>
              <div className="text-sm leading-relaxed text-[rgba(1,1,1,.82)] font-medium">
                {line}
              </div>
            </div>
          ))}

          <div className="border-t border-[rgba(1,1,1,.12)] my-4" />

          {/* 四轴预览 */}
          <div className="text-xs font-bold tracking-widest text-[rgba(1,1,1,.38)] mb-3 uppercase">
            你将在这四个维度上被照见
          </div>
          <div className="grid grid-cols-2 gap-2">
            {initData.state.axes.slice(0, 4).map(axis => (
              <div
                key={axis.key}
                className="flex flex-col gap-0.5 p-3 border border-[rgba(1,1,1,.12)] rounded-sm bg-[rgba(239,230,201,.5)]"
              >
                <div className="text-xs font-black" style={{ color: spineColor }}>
                  {axis.key}
                </div>
                <div className="text-[10px] text-[rgba(1,1,1,.48)]">
                  {axis.low} ↔ {axis.high}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-center text-[rgba(1,1,1,.32)] mt-4 italic tracking-wide">
            进入之后，你的每一次选择都会移动这四根指针
          </p>
        </div>

        {/* ── 底部：仅两个按钮 ── */}
        <div className="relative z-10 px-5 pb-6 pt-3 flex flex-col gap-2.5">
          {/* 主按钮：进入角色 */}
          <button
            onClick={onEnter}
            className="w-full py-3.5 font-bold tracking-widest text-sm transition-all active:scale-95"
            style={{
              background: spineColor,
              color: spineText,
              fontFamily: "'Noto Serif SC', serif",
              boxShadow: "0 4px 16px rgba(0,0,0,.28)",
            }}
          >
            进入{initData.character}的身体
          </button>

          {/* 次按钮：换一个角色 */}
          <button
            onClick={handleSwitch}
            disabled={switching || !canSwitch}
            className="w-full py-3 text-sm font-bold border border-[rgba(1,1,1,.22)] transition-all active:scale-95 disabled:opacity-35"
            style={{ background: "transparent", color: "rgba(1,1,1,.62)" }}
          >
            {switching ? "正在换角色……" : "换一个角色"}
          </button>
        </div>
      </div>
    </div>
  );
}
