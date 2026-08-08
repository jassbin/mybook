"use client";
// src/components/game/cover-page.tsx
import { useState, useEffect } from "react";
import Image from "next/image";

interface CoverPageProps {
  onStart: () => void;
}

export function CoverPage({ onStart }: CoverPageProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="relative flex flex-col items-center justify-between min-h-screen overflow-hidden"
      style={{ background: "#050403", paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 30% 20%, rgba(195,74,40,.14), transparent 50%), radial-gradient(circle at 80% 80%, rgba(98,108,88,.12), transparent 50%)",
        }}
      />

      {/* Main poster card */}
      <div
        className={`paper-surface relative w-full max-w-sm mx-4 flex-1 flex flex-col overflow-hidden border border-[rgba(239,230,201,.5)] transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        style={{ boxShadow: "0 0 0 6px #050403, 0 28px 80px rgba(0,0,0,.55)", marginTop: 16, marginBottom: 16 }}
      >
        {/* All content above paper texture */}
        <div className="relative z-10 flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-end justify-between px-5 pt-5 pb-2">
            <div>
              <div
                className="text-5xl font-black leading-none tracking-tighter"
                style={{ fontFamily: "'Ma Shan Zheng', serif", color: "#010101" }}
              >
                八戒的
              </div>
              <div
                className="text-5xl font-black leading-none tracking-tighter"
                style={{ fontFamily: "'Ma Shan Zheng', serif", color: "#C34A28" }}
              >
                抉择
              </div>
            </div>
            <div className="text-right text-xs leading-relaxed border-l border-[rgba(1,1,1,.22)] pl-3 text-[rgba(1,1,1,.6)]">
              <div>第二十七回</div>
              <div>白虎岭惊魂</div>
              <div>八戒视角</div>
            </div>
          </div>

          {/* Hero image — shadow puppet silhouette */}
          <div className="relative flex-1 min-h-[200px] mx-4 border border-[rgba(1,1,1,.15)] overflow-hidden"
            style={{ background: "linear-gradient(180deg, rgba(148,169,166,.35), rgba(239,230,201,.25))" }}>
            {/* Puppet strings */}
            <div className="absolute top-0 left-[40%] w-px h-1/2 bg-[rgba(1,1,1,.2)]" style={{ transformOrigin: "top", animation: "sway 5s infinite alternate" }} />
            <div className="absolute top-0 left-[58%] w-px h-1/2 bg-[rgba(1,1,1,.18)]" style={{ transformOrigin: "top", animation: "sway 4.5s .4s infinite alternate-reverse" }} />
            <Image
              src="https://cdn.eazo.ai/user-contents/design-variant-subjects/20524e3e370f4b318511a8dd75aa8a28.png"
              alt="猪八戒皮影剪影"
              fill
              className="object-contain object-bottom animate-puppet"
              style={{ filter: "sepia(.2) contrast(1.1) saturate(.85)", mixBlendMode: "multiply" }}
              priority
            />
            {/* Scene label */}
            <div
              className="absolute bottom-2 right-3 text-xs tracking-widest"
              style={{ writingMode: "vertical-rl", color: "rgba(1,1,1,.45)", fontFamily: "serif" }}
            >
              皮影剧场
            </div>
          </div>

          {/* Description */}
          <div className="px-5 py-4 border-t border-[rgba(1,1,1,.15)]">
            <p className="text-sm leading-relaxed text-[rgba(1,1,1,.7)]">
              以猪八戒视角，重走《三打白骨精》四大抉择。
              每次选择，都是你自己的价值观在说话。
            </p>
            <p className="text-xs mt-2 text-[rgba(1,1,1,.45)] tracking-wide">
              价值观无好坏，结局只反映你是谁。
            </p>
          </div>

          {/* CTA */}
          <div className="px-5 pb-5">
            <button
              onClick={onStart}
              className="w-full py-3.5 text-[#EFE6C9] font-bold text-base tracking-widest rounded-xl transition-all duration-200 active:scale-95"
              style={{
                background: "#010101",
                fontFamily: "'Noto Serif SC', serif",
                boxShadow: "0 4px 16px rgba(0,0,0,.3)",
              }}
            >
              进入八戒的身体
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
