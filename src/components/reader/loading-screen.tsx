"use client";
// src/components/reader/loading-screen.tsx
import { useEffect, useState } from "react";

interface LoadingScreenProps {
  bookTitle: string;
  intensifyMode?: boolean;
}

const STEPS = [
  "AI 正在阅读全书……",
  "寻找困境最密集的角色……",
  "用现代视角重新拆解动机……",
  "提炼三到五个决策节点……",
  "即将进入他的身体……",
];

const INTENSIFY_STEPS = [
  "正在将压力拉到极限……",
  "重新设计每一个生死节点……",
  "把两难升级为不可逆的抉择……",
  "极压版剧本即将就绪……",
  "准备好面对极端的自己……",
];

export function LoadingScreen({ bookTitle, intensifyMode }: LoadingScreenProps) {
  const ACTIVE_STEPS = intensifyMode ? INTENSIFY_STEPS : STEPS;
  const [step, setStep] = useState(0);

  // 主题色：普通=青绿系，极压=暖橙保留区分
  const accent = intensifyMode ? "#f97316" : "#2dd4bf";
  const accent2 = intensifyMode ? "#fb923c" : "#5ed6c5";
  const inkColor = "#eafdf9";

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s < ACTIVE_STEPS.length - 1 ? s + 1 : s));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fresh-backdrop flex flex-col items-center justify-center min-h-screen px-8"
      style={{
        paddingTop: "var(--safe-top)",
        paddingBottom: "var(--safe-bottom)",
      }}
    >
      {/* 发光脉冲圆环 */}
      <div className="relative w-28 h-28 mb-8 z-10">
        {/* 柔光晕 */}
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{ background: `radial-gradient(circle, ${accent}33, transparent 70%)`, animationDuration: "2.4s" }}
        />
        <svg viewBox="0 0 96 96" className="relative w-full h-full" style={{ transform: "rotate(-90deg)" }}>
          <defs>
            <linearGradient id="ls-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={accent} />
              <stop offset="100%" stopColor={accent2} />
            </linearGradient>
          </defs>
          <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(20,184,166,.16)" strokeWidth="3" />
          <circle
            cx="48" cy="48" r="40"
            fill="none"
            stroke="url(#ls-grad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="251.2"
            strokeDashoffset={251.2 * (1 - (step + 1) / ACTIVE_STEPS.length)}
            style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(.2,.8,.2,1)", filter: `drop-shadow(0 0 6px ${accent}88)` }}
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center text-3xl font-black"
          style={{ fontFamily: "'Ma Shan Zheng', serif", color: inkColor }}
        >
          {intensifyMode ? "压" : "读"}
        </div>
      </div>

      {/* Book title */}
      <div
        className="relative z-10 text-2xl font-black mb-6 tracking-tight"
        style={{ fontFamily: "'Ma Shan Zheng', serif", color: inkColor }}
      >
        《{bookTitle}》
      </div>

      {/* Step text */}
      <div className="relative z-10 text-sm tracking-wide anim-ink" key={step} style={{ color: "rgba(12,90,82,.7)" }}>
        {ACTIVE_STEPS[step]}
      </div>

      {/* Step dots */}
      <div className="relative z-10 flex gap-1.5 mt-6">
        {ACTIVE_STEPS.map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: i === step ? 22 : 6,
              background: i <= step
                ? `linear-gradient(90deg, ${accent}, ${accent2})`
                : "rgba(20,184,166,.2)",
              boxShadow: i === step ? `0 0 10px ${accent}88` : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}
