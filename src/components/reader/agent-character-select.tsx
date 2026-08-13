"use client";

// Agent 模式「角色列表页」：点书后先到这里，展示本书所有角色（钩子+场域标签），
// 默认高亮第一个，点某个才进角色介绍页；底部保留「其他角色」自填。
import { useState } from "react";
import type { BookMeta } from "@/lib/reader/types";

interface AgentCharacterSelectProps {
  bookTitle: string;
  bookMeta: BookMeta | null;
  onPick: (name: string, domains?: string[]) => void;
  onBack: () => void;
}

export function AgentCharacterSelect({
  bookTitle,
  bookMeta,
  onPick,
  onBack,
}: AgentCharacterSelectProps) {
  const candidates = bookMeta?.candidates ?? [];
  const [customName, setCustomName] = useState("");

  const handleEnter = (name: string, domains?: string[]) => {
    if (!name.trim()) return;
    onPick(name.trim(), domains);
  };

  return (
    <div
      className="fresh-backdrop flex flex-col min-h-screen w-full max-w-md mx-auto"
      style={{ paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
    >
      {/* 顶部 */}
      <div className="shrink-0 px-5 pt-4 pb-3">
        <button
          onClick={onBack}
          className="text-sm font-bold mb-3"
          style={{ color: "rgba(11,74,63,.6)" }}
        >
          ← 换本书
        </button>
        <h1 className="text-2xl font-black leading-tight" style={{ color: "#06463c" }}>
          《{bookTitle}》
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(12,60,58,.6)" }}>
          选一个人，走进他的处境——你会怎么选？
        </p>
      </div>

      {/* 角色列表（可滚动）：点卡片直接进入 */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-3">
        <div className="flex flex-col gap-2.5">
          {candidates.map((c) => (
            <button
              key={c.name}
              onClick={() => handleEnter(c.name, c.dominantDomains)}
              className="text-left px-4 py-3.5 rounded-2xl border transition-all active:scale-[.98]"
              style={{
                background: "rgba(255,255,255,.6)",
                borderColor: "rgba(56,189,168,.28)",
              }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-black" style={{ color: "#0a3a30" }}>{c.name}</span>
                {c.dominantDomains?.slice(0, 2).map((d) => (
                  <span
                    key={d}
                    className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#10b981,#2dd4bf)" }}
                  >{d}</span>
                ))}
              </div>
              <div className="text-[12px] mt-1 leading-snug" style={{ color: "rgba(10,58,48,.72)" }}>
                {c.hook}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 底部：其他角色自填 */}
      <div
        className="shrink-0 px-5 pt-3 pb-5 border-t"
        style={{ borderColor: "rgba(56,189,168,.2)", background: "rgba(255,255,255,.35)" }}
      >
        <div className="text-xs mb-2" style={{ color: "rgba(12,60,58,.55)" }}>
          没有想要的？输入这本书里的其他角色
        </div>
        <div className="flex gap-2">
          <input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleEnter(customName); }}
            placeholder="输入角色名"
            className="flex-1 min-w-0 border rounded-full px-4 py-2.5 text-sm font-semibold focus:outline-none"
            style={{ borderColor: "rgba(56,189,168,.3)", background: "rgba(255,255,255,.7)", color: "#0c3c3a" }}
          />
          <button
            onClick={() => handleEnter(customName)}
            disabled={!customName.trim()}
            className="shrink-0 w-11 h-11 flex items-center justify-center font-bold text-white rounded-full active:scale-95 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#14b8a6,#0ea5b7)", fontSize: 20 }}
            aria-label="进入"
          >→</button>
        </div>
      </div>
    </div>
  );
}
