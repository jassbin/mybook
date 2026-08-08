"use client";
// src/components/game/death-screen.tsx
import { useEffect, useState } from "react";
import { BAD_ENDING } from "@/lib/game/story-data";

interface DeathScreenProps {
  onRevive: () => void;
}

export function DeathScreen({ onRevive }: DeathScreenProps) {
  const [phase, setPhase] = useState<"black" | "text" | "guanyin" | "button">("black");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("text"), 600);
    const t2 = setTimeout(() => setPhase("guanyin"), 2800);
    const t3 = setTimeout(() => setPhase("button"), 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-8 transition-all duration-1000"
      style={{ background: "#000", color: "#EFE6C9" }}
    >
      {/* Flash overlay */}
      <div
        className="absolute inset-0 bg-white pointer-events-none animate-flash"
        style={{ animationDelay: "0.1s" }}
      />

      {/* God ray from top */}
      {(phase === "guanyin" || phase === "button") && (
        <div
          className="absolute top-0 left-1/2 w-32 h-full pointer-events-none animate-god-ray"
          style={{
            background: "linear-gradient(180deg, rgba(239,230,201,.6) 0%, transparent 100%)",
            transform: "translateX(-50%)",
            filter: "blur(24px)",
          }}
        />
      )}

      {phase !== "black" && (
        <div className="relative z-10 animate-fade-up">
          <div
            className="text-2xl font-black mb-4 tracking-widest"
            style={{ fontFamily: "'Ma Shan Zheng', serif", color: "#C34A28" }}
          >
            {BAD_ENDING.title}
          </div>
          <p className="text-sm leading-relaxed text-[rgba(239,230,201,.8)] mb-8 max-w-sm">
            {BAD_ENDING.description}
          </p>
        </div>
      )}

      {(phase === "guanyin" || phase === "button") && (
        <div className="relative z-10 animate-fade-up max-w-sm">
          <div
            className="text-base italic leading-relaxed mb-6 p-4 border border-[rgba(239,230,201,.3)] rounded-xl"
            style={{ color: "#EFE6C9", background: "rgba(239,230,201,.08)" }}
          >
            <span
              className="block text-xs tracking-widest mb-2"
              style={{ fontFamily: "'Ma Shan Zheng', serif", color: "rgba(239,230,201,.5)" }}
            >
              观世音菩萨曰
            </span>
            「{BAD_ENDING.guanyin}」
          </div>
        </div>
      )}

      {phase === "button" && (
        <div className="relative z-10 animate-fade-up">
          <button
            onClick={onRevive}
            className="px-8 py-3 font-bold tracking-widest text-sm rounded-xl transition-all duration-200 active:scale-95"
            style={{
              background: "#EFE6C9",
              color: "#010101",
              fontFamily: "'Noto Serif SC', serif",
              boxShadow: "0 0 20px rgba(239,230,201,.3)",
            }}
          >
            重选此刻
          </button>
          <p className="mt-3 text-xs text-[rgba(239,230,201,.4)]">
            心魔已破，丙项已锁
          </p>
        </div>
      )}
    </div>
  );
}
