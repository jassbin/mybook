"use client";
// src/components/reader/agent-character-intro.tsx
// Agent 模式角色介绍页：展示角色 DNA，支持进入故事 / 换一个角色
import { useState } from "react";
import type { BookMeta } from "@/lib/reader/types";
import type { WorldState } from "@/lib/agent/world-state";
import { getCharacterDNA } from "@/lib/agent/character-dna";
import { darkenForCard, withAlpha } from "@/lib/reader/color";

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
  // 角色专属强调色：取书脊色并压深到可读，呼应首页书卡「每书一色」
  const accent = darkenForCard(bookMeta?.color ?? "#0b6b57");

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
          style={{ background: withAlpha(accent, 0.1), borderBottom: `1px solid ${withAlpha(accent, 0.25)}`, paddingLeft: 56 }}
        >
          <div className="text-xs tracking-widest mb-2" style={{ color: "rgba(11,74,63,.65)" }}>
            《{initData.state.book}》· 今日角色
          </div>
          <div
            className="text-4xl font-black leading-none mb-2"
            style={{
              fontFamily: "'Ma Shan Zheng', serif",
              color: accent,
              letterSpacing: "3px",
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
                  style={{ background: accent }}
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
              <div className="shrink-0 w-16 text-xs font-black pt-0.5 tracking-wide" style={{ color: accent }}>
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
                style={{ background: "#ffffff", border: `1.5px solid ${withAlpha(accent, 0.3)}` }}
              >
                <div className="text-xs font-black" style={{ color: accent }}>
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
              background: accent,
              fontFamily: "'Noto Serif SC', serif",
              boxShadow: `0 6px 20px ${withAlpha(accent, 0.4)}`,
            }}
          >
            进入{initData.character}的身体
          </button>

          {/* 次按钮：选择角色（打开候选列表，而非盲盒随机） */}
          <button
            onClick={() => setShowPicker(true)}
            disabled={switching || !canSwitch}
            className="w-full py-3 text-sm font-bold rounded-full transition-all active:scale-95 disabled:opacity-35"
            style={{ background: "transparent", color: accent, border: `2px solid ${withAlpha(accent, 0.5)}` }}
          >
            {switching ? "正在换角色……" : "选择其他角色"}
          </button>
        </div>
      </div>

      {/* 角色选择面板：列出本书候选 + 「其他」自填 */}
      {showPicker && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-end"
          style={{ background: "rgba(6,40,34,.45)", backdropFilter: "blur(2px)" }}
          onClick={() => setShowPicker(false)}
        >
          <div
            className="glass-panel w-full max-w-sm mx-auto rounded-t-3xl p-5 pb-8"
            style={{ maxHeight: "80dvh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-base font-black mb-1" style={{ color: "#06463c" }}>选择一位角色</div>
            <div className="text-xs mb-4" style={{ color: "rgba(12,60,58,.55)" }}>点选你想成为的人，或在下方自己输入</div>

            <div className="flex flex-col gap-2">
              {(bookMeta?.candidates ?? []).map((c) => {
                const active = c.name === initData.character;
                return (
                  <button
                    key={c.name}
                    onClick={() => handlePick(c.name, c.dominantDomains)}
                    disabled={active}
                    className="text-left px-4 py-3 rounded-2xl border transition-all active:scale-[.98] disabled:opacity-50"
                    style={{
                      background: active ? "rgba(16,185,129,.12)" : "rgba(255,255,255,.6)",
                      borderColor: active ? "rgba(16,185,129,.5)" : "rgba(56,189,168,.28)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black" style={{ color: "#0a3a30" }}>{c.name}</span>
                      {active && <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ background: "#10b981" }}>当前</span>}
                      {c.dominantDomains?.[0] && !active && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ background: "linear-gradient(135deg,#10b981,#2dd4bf)" }}>{c.dominantDomains[0]}</span>
                      )}
                    </div>
                    <div className="text-[11px] mt-0.5 leading-snug" style={{ color: "rgba(10,58,48,.7)" }}>{c.hook}</div>
                  </button>
                );
              })}
            </div>

            {/* 其他：自填角色 */}
            <div className="mt-4 pt-4 border-t" style={{ borderColor: "rgba(56,189,168,.2)" }}>
              <div className="text-xs mb-2" style={{ color: "rgba(12,60,58,.55)" }}>没有想要的？输入这本书里的其他角色</div>
              <div className="flex gap-2">
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handlePick(customName); }}
                  placeholder="输入角色名，如「虎妞」"
                  className="flex-1 min-w-0 border rounded-full px-4 py-2.5 text-sm font-semibold focus:outline-none"
                  style={{ borderColor: "rgba(56,189,168,.3)", background: "rgba(255,255,255,.6)", color: "#0c3c3a" }}
                />
                <button
                  onClick={() => handlePick(customName)}
                  disabled={!customName.trim()}
                  className="shrink-0 w-10 h-10 flex items-center justify-center font-bold text-white rounded-full active:scale-95 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#14b8a6,#0ea5b7)", fontSize: 20 }}
                  aria-label="进入"
                >→</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
