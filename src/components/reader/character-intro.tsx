"use client";
// src/components/reader/character-intro.tsx
import { type AnalysisResult, type BookMeta } from "@/lib/reader/types";

interface CharacterIntroProps {
  analysis: AnalysisResult;
  bookMeta: BookMeta | null;
  onEnter: () => void;
  intensifyMode?: boolean;
}

export function CharacterIntro({ analysis, bookMeta, onEnter, intensifyMode }: CharacterIntroProps) {
  const spineColor = bookMeta?.color ?? "#1A3A5C";
  const spineText = bookMeta?.textColor ?? "#EFE6C9";

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen"
      style={{
        background: "#050403",
        paddingTop: "var(--safe-top)",
        paddingBottom: "var(--safe-bottom)",
      }}
    >
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${spineColor}33, transparent 55%), #050403`,
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
        {/* Colored header band */}
        <div
          className="relative z-10 px-5 pt-6 pb-5"
          style={{ background: spineColor }}
        >
          <div className="text-xs tracking-widest mb-2" style={{ color: spineText, opacity: 0.7 }}>
            《{analysis.bookTitle}》· AI解读
          </div>
          <div
            className="text-4xl font-black leading-none mb-2"
            style={{ fontFamily: "'Ma Shan Zheng', serif", color: spineText, letterSpacing: "3px" }}
          >
            {analysis.character}
          </div>
          <div
            className="text-sm leading-snug"
            style={{ color: spineText, opacity: 0.88, fontStyle: "italic" }}
          >
            {analysis.characterTagline}
          </div>
        </div>

        {/* Drive analysis — 3 questions */}
        <div className="relative z-10 flex-1 px-5 pt-5 pb-2">
          <div className="text-xs font-bold tracking-widest text-[rgba(1,1,1,.4)] mb-4 uppercase">
            他是怎样一个人
          </div>

          {analysis.driveAnalysis.map((line, i) => {
            const labels = ["愤怒来自", "守护什么", "最怕失去"];
            return (
              <div
                key={i}
                className="flex gap-3 items-start mb-4 anim-ink"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div
                  className="shrink-0 w-16 text-xs font-black pt-0.5 tracking-wide"
                  style={{ color: "#C34A28" }}
                >
                  {labels[i]}
                </div>
                <div className="text-sm leading-relaxed text-[rgba(1,1,1,.82)] font-medium">
                  {line}
                </div>
              </div>
            );
          })}

          {/* Divider */}
          <div className="border-t border-[rgba(1,1,1,.15)] my-4" />

          {/* Axes preview */}
          <div className="text-xs font-bold tracking-widest text-[rgba(1,1,1,.4)] mb-3 uppercase">
            你将在这四个维度上被照见
          </div>
          <div className="grid grid-cols-2 gap-2">
            {analysis.axes.slice(0, 4).map((axis) => (
              <div
                key={axis.key}
                className="flex flex-col gap-0.5 p-3 border border-[rgba(1,1,1,.15)] rounded-sm bg-[rgba(239,230,201,.5)]"
              >
                <div className="text-xs font-black" style={{ color: "#010101" }}>
                  {axis.key}
                </div>
                <div className="text-[11px] text-[rgba(1,1,1,.5)]">
                  {axis.low} ↔ {axis.high}
                </div>
              </div>
            ))}
          </div>

          {/* Hint */}
          <p className="text-[11px] text-center text-[rgba(1,1,1,.35)] mt-4 italic tracking-wide">
            进入之后，你的每一次选择都会移动这四根指针
          </p>
        </div>

        {/* CTA */}
        <div className="relative z-10 px-5 pb-5 pt-3">
          <button
            onClick={onEnter}
            className="w-full py-3.5 font-bold tracking-widest text-sm transition-all active:scale-95"
            style={{
              background: intensifyMode ? "#C34A28" : "#010101",
              color: "#EFE6C9",
              fontFamily: "'Noto Serif SC', serif",
              boxShadow: "0 4px 16px rgba(0,0,0,.3)",
            }}
          >
            {intensifyMode ? `⚡ 进入极压版 · ${analysis.character}` : `进入${analysis.character}的身体`}
          </button>
        </div>
      </div>
    </div>
  );
}
