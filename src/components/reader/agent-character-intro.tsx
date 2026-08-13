"use client";
// src/components/reader/agent-character-intro.tsx
// Agent 模式角色介绍页：展示角色 DNA，支持进入故事 / 换一个角色
import { useState } from "react";
import type { BookMeta } from "@/lib/reader/types";
import type { WorldState } from "@/lib/agent/world-state";
import { getCharacterDNA } from "@/lib/agent/character-dna";

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
  /** 传入指定角色名+场域则用该角色；不传则 page 层自动选下一个 */
  onSwitchCharacter: (pickName?: string, pickDomains?: string[]) => void;
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
  const [showPicker, setShowPicker] = useState(false);
  const [customName, setCustomName] = useState("");
  const accentGreen = "#0b6b57";

  const labels = ["愤怒来自", "守护什么", "最怕失去"];

  // 场域标签：优先取「角色 DNA」里实际驱动困境的 dominantDomains，
  // 保证「页面展示 = 引擎实际使用」，避免两套数据不一致导致的所见非所得；
  // DNA 未收录（自定义/冷门书）时才回退到书库候选。
  const dnaForDisplay = getCharacterDNA(initData.character, initData.state.book);
  const currentCandidate = bookMeta?.candidates.find(c => c.name === initData.character);
  const domainTags = (dnaForDisplay?.dominantDomains?.length
    ? dnaForDisplay.dominantDomains
    : currentCandidate?.dominantDomains) ?? [];

  const handlePick = (name: string, domains?: string[]) => {
    if (switching || !name.trim()) return;
    setShowPicker(false);
    setSwitching(true);
    onSwitchCharacter(name.trim(), domains);
    // 切换完成后组件会被重新 key 渲染，无需手动 reset
  };

  return (
    <div
      className="fresh-backdrop flex flex-col items-center justify-center min-h-screen"
      style={{ paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
    >
      <div
        className="glass-panel relative w-full max-w-sm flex flex-col overflow-hidden rounded-2xl anim-up"
        style={{
          margin: "9px auto",
          minHeight: "calc(100dvh - var(--safe-top) - var(--safe-bottom) - 18px)",
        }}
      >
        {/* 返回：圆形箭头图标按钮，浮在左上角，不遮挡内容 */}
        <button
          onClick={onBack}
          aria-label="返回"
          className="absolute top-3 left-3 z-30 w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{
            background: "rgba(255,255,255,.75)",
            border: "1px solid rgba(16,185,129,.35)",
            boxShadow: "0 2px 10px rgba(6,60,50,.15)",
            backdropFilter: "blur(8px)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="#0b4a3f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* ── 顶部：书名 + 角色名 + tagline（薄荷绿玻璃头，书脊色点缀）── */}
        <div
          className="relative z-10 px-5 pt-6 pb-5"
          style={{ background: "linear-gradient(135deg, rgba(16,185,129,.16), rgba(45,212,191,.07))", paddingLeft: 56 }}
        >
          <div className="text-xs tracking-widest mb-2" style={{ color: "rgba(11,74,63,.65)" }}>
            《{initData.state.book}》· 今日角色
          </div>
          <div
            className="text-4xl font-black leading-none mb-2"
            style={{
              fontFamily: "'Ma Shan Zheng', serif",
              color: accentGreen,
              letterSpacing: "3px",
              textShadow: "0 1px 0 rgba(255,255,255,.95), 0 0 2px rgba(255,255,255,.8), 0 2px 4px rgba(4,55,50,.26)",
            }}
          >
            {initData.character}
          </div>
          <div className="text-sm leading-snug mb-3" style={{ color: "rgba(10,58,48,.8)", fontStyle: "italic" }}>
            {initData.characterTagline}
          </div>

          {/* 场域标签 */}
          {domainTags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {domainTags.map(tag => (
                <span
                  key={tag}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: "linear-gradient(135deg,#10b981,#2dd4bf)" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── 角色 DNA 三问 ── */}
        <div className="relative z-10 flex-1 px-5 pt-5 pb-2">
          <div className="text-xs font-bold tracking-widest text-[rgba(10,58,48,.42)] mb-4 uppercase">
            他是怎样一个人
          </div>

          {initData.driveAnalysis.slice(0, 3).map((line, i) => (
            <div
              key={i}
              className="flex gap-3 items-start mb-4 anim-ink"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="shrink-0 w-16 text-xs font-black pt-0.5 tracking-wide" style={{ color: accentGreen }}>
                {labels[i]}
              </div>
              <div className="text-sm leading-relaxed text-[#0a3a30] font-medium">
                {line}
              </div>
            </div>
          ))}

          <div className="border-t border-[rgba(16,185,129,.2)] my-4" />

          {/* 四轴预览 */}
          <div className="text-xs font-bold tracking-widest text-[rgba(10,58,48,.42)] mb-3 uppercase">
            你将在这四个维度上被照见
          </div>
          <div className="grid grid-cols-2 gap-2">
            {initData.state.axes.slice(0, 4).map(axis => (
              <div
                key={axis.key}
                className="flex flex-col gap-0.5 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,.6)", border: "1px solid rgba(16,185,129,.22)" }}
              >
                <div className="text-xs font-black" style={{ color: accentGreen }}>
                  {axis.key}
                </div>
                <div className="text-[10px] text-[rgba(10,58,48,.55)]">
                  {axis.low} ↔ {axis.high}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-center text-[rgba(10,58,48,.4)] mt-4 italic tracking-wide">
            进入之后，你的每一次选择都会移动这四根指针
          </p>
        </div>

        {/* ── 底部：仅两个按钮 ── */}
        <div className="relative z-10 px-5 pb-6 pt-3 flex flex-col gap-2.5">
          {/* 主按钮：进入角色 */}
          <button
            onClick={onEnter}
            className="w-full py-3.5 font-bold tracking-widest text-sm text-white transition-all active:scale-95 rounded-full"
            style={{
              background: "linear-gradient(135deg,#10b981,#2dd4bf)",
              fontFamily: "'Noto Serif SC', serif",
              boxShadow: "0 6px 20px rgba(16,185,129,.4)",
            }}
          >
            进入{initData.character}的身体
          </button>

          {/* 次按钮：换一个角色 */}
          <button
            onClick={handleSwitch}
            disabled={switching || !canSwitch}
            className="w-full py-3 text-sm font-bold rounded-full transition-all active:scale-95 disabled:opacity-35"
            style={{ background: "transparent", color: "#0b4a3f", border: "1.5px solid rgba(16,185,129,.4)" }}
          >
            {switching ? "正在换角色……" : "换一个角色"}
          </button>
        </div>
      </div>
    </div>
  );
}
