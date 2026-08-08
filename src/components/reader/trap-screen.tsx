"use client";
// src/components/reader/trap-screen.tsx
import { useEffect, useState } from "react";

interface TrapScreenProps {
  endingText: string;
  revivalText: string;
  onRevive: () => void;
}

export function TrapScreen({ endingText, revivalText, onRevive }: TrapScreenProps) {
  // Natural fade: overlay fades in, then content reveals sequentially
  const [visible, setVisible] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showRevival, setShowRevival] = useState(false);
  const [showBtn, setShowBtn] = useState(false);

  useEffect(() => {
    // Slight delay so the parent render settles first, then fade in naturally
    const t0 = setTimeout(() => setVisible(true), 40);
    const t1 = setTimeout(() => setShowText(true), 480);
    const t2 = setTimeout(() => setShowRevival(true), 2400);
    const t3 = setTimeout(() => setShowBtn(true), 3800);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8 text-center"
      style={{
        background: "#000",
        color: "#EFE6C9",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.55s cubic-bezier(.2,.8,.2,1)",
      }}
    >
      {/* Ambient red glow — no white flash */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 30%, rgba(195,74,40,.22) 0%, transparent 65%)",
          opacity: showText ? 1 : 0,
          transition: "opacity 1.2s ease",
        }}
      />

      {/* Ending text */}
      <div
        className="relative z-10 max-w-sm"
        style={{
          opacity: showText ? 1 : 0,
          transform: showText ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.6s cubic-bezier(.2,.8,.2,1), transform 0.6s cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <div
          className="text-2xl font-black mb-4 tracking-widest"
          style={{ fontFamily: "'Ma Shan Zheng', serif", color: "#C34A28" }}
        >
          走岔了
        </div>
        <p className="text-sm leading-relaxed text-[rgba(239,230,201,.8)] mb-8">
          {endingText}
        </p>
      </div>

      {/* Revival quote */}
      <div
        className="relative z-10 max-w-sm w-full"
        style={{
          opacity: showRevival ? 1 : 0,
          transform: showRevival ? "translateY(0)" : "translateY(14px)",
          transition: "opacity 0.6s cubic-bezier(.2,.8,.2,1), transform 0.6s cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <div
          className="text-base italic leading-relaxed mb-6 p-4 border border-[rgba(239,230,201,.3)] rounded-xl"
          style={{ color: "#EFE6C9", background: "rgba(239,230,201,.08)" }}
        >
          <span
            className="block text-xs tracking-widest mb-2"
            style={{ fontFamily: "'Ma Shan Zheng', serif", color: "rgba(239,230,201,.5)" }}
          >
            命运发话
          </span>
          「{revivalText}」
        </div>
      </div>

      {/* Revive button */}
      <div
        className="relative z-10"
        style={{
          opacity: showBtn ? 1 : 0,
          transform: showBtn ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.5s cubic-bezier(.2,.8,.2,1), transform 0.5s cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <button
          onClick={onRevive}
          className="px-8 py-3 font-bold tracking-widest text-sm transition-all active:scale-95"
          style={{
            background: "#EFE6C9",
            color: "#010101",
            fontFamily: "'Noto Serif SC', serif",
            borderRadius: 0,
            boxShadow: "0 0 20px rgba(239,230,201,.25)",
          }}
        >
          重选此刻
        </button>
        <p className="mt-3 text-xs text-[rgba(239,230,201,.4)]">此路已锁，重新选择</p>
      </div>
    </div>
  );
}
