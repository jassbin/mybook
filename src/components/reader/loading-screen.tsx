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

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s < ACTIVE_STEPS.length - 1 ? s + 1 : s));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-8"
      style={{
        background: "#050403",
        paddingTop: "var(--safe-top)",
        paddingBottom: "var(--safe-bottom)",
      }}
    >
      {/* Animated ink circle */}
      <div className="relative w-24 h-24 mb-8">
        <svg viewBox="0 0 96 96" className="w-full h-full" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(239,230,201,.15)" strokeWidth="2" />
          <circle
            cx="48" cy="48" r="40"
            fill="none"
            stroke="#C34A28"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="251.2"
            strokeDashoffset={251.2 * (1 - (step + 1) / ACTIVE_STEPS.length)}
            style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(.2,.8,.2,1)" }}
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center text-2xl font-black"
          style={{ fontFamily: "'Ma Shan Zheng', serif", color: "#EFE6C9" }}
        >
          读
        </div>
      </div>

      {/* Book title */}
      <div
        className="text-2xl font-black mb-6 text-[#EFE6C9] tracking-tight"
        style={{ fontFamily: "'Ma Shan Zheng', serif" }}
      >
        《{bookTitle}》
      </div>

      {/* Step text */}
      <div className="text-sm text-[rgba(239,230,201,.7)] tracking-wide anim-ink" key={step}>
        {ACTIVE_STEPS[step]}
      </div>

      {/* Step dots */}
      <div className="flex gap-1.5 mt-6">
        {ACTIVE_STEPS.map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: i === step ? 20 : 6,
              background: i <= step ? "#C34A28" : "rgba(239,230,201,.2)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
