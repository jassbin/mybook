"use client";
// src/components/reader/result-page.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import type { AnalysisResult, BookMeta } from "@/lib/reader/types";
import { buildStoryShareUrl, buildResultShareUrl } from "@/lib/reader/share-codec";

interface ResultPageProps {
  analysis: AnalysisResult;
  bookMeta: BookMeta | null;
  scores: Record<string, number>;
  history: string[];
  choiceLabels: string[];  // human-readable choice labels
  trapSceneIdxs: number[]; // which scene indices had a trap triggered
  onRestart: () => void;
  onNewBook: () => void;
  onIntensify: () => void; // launch intensify flow
}

export function ResultPage({
  analysis, bookMeta, scores, history, choiceLabels, trapSceneIdxs, onRestart, onNewBook, onIntensify,
}: ResultPageProps) {
  const [aiText, setAiText] = useState("");
  const [aiDone, setAiDone] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const spineColor = bookMeta?.color ?? "#1A3A5C";
  const spineTextColor = bookMeta?.textColor ?? "#EFE6C9";

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const handleShareStory = useCallback(() => {
    try {
      const url = buildStoryShareUrl(analysis);
      navigator.clipboard.writeText(url).then(
        () => showToast("故事链接已复制，发给朋友一起体验同一个角色 →"),
        () => showToast("链接生成失败，请重试")
      );
    } catch { showToast("链接生成失败，请重试"); }
  }, [analysis, showToast]);

  const handleShareResult = useCallback(() => {
    try {
      const url = buildResultShareUrl(analysis, history, choiceLabels);
      navigator.clipboard.writeText(url).then(
        () => showToast("结果链接已复制，朋友可以看到你的完整选择路径 →"),
        () => showToast("链接生成失败，请重试")
      );
    } catch { showToast("链接生成失败，请重试"); }
  }, [analysis, history, choiceLabels, showToast]);

  // Auto-fetch narration on mount
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const sceneTitles = analysis.scenes.map((s) => s.title);
        const res = await fetch("/api/reader/narration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({
            bookTitle: analysis.bookTitle,
            character: analysis.character,
            choiceLabels,
            sceneTitles,
          }),
        });
        if (!res.ok) throw new Error("failed");
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const delta = decoder.decode(value, { stream: true });
          setAiText((prev) => prev + delta);
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setAiText("故事走完了。每一次选择，都是真实的你。");
        }
      } finally {
        setAiDone(true);
      }
    })();
    return () => ctrl.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // scroll as text streams in
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiText]);

  // Build ending label from ending types
  const rawEndings = analysis.endingTypes ?? [];
  const dominantAxis = analysis.axes.reduce(
    (prev, curr) => ((scores[curr.key] ?? 50) > (scores[prev.key] ?? 50) ? curr : prev),
    analysis.axes[0]
  );
  const val = scores[dominantAxis?.key] ?? 50;
  const endingIdx = Math.min(
    rawEndings.length > 0 ? (val > 65 ? 0 : val < 35 ? 1 : 2) : 0,
    rawEndings.length - 1
  );
  const ending = rawEndings[endingIdx] ?? { title: "你走完了这一段路", narration: "" };

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "#050403", paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
    >
      <div
        className="paper-surface relative w-full max-w-sm mx-auto flex flex-col border border-[rgba(239,230,201,.5)] anim-up overflow-y-auto"
        style={{
          boxShadow: "0 0 0 6px #050403, 0 28px 80px rgba(0,0,0,.55)",
          margin: "8px auto",
          minHeight: "calc(100dvh - var(--safe-top) - var(--safe-bottom) - 16px)",
        }}
      >
        {/* Colored header */}
        <div className="relative z-10 px-5 pt-5 pb-4" style={{ background: spineColor }}>
          <div className="text-[11px] tracking-widest mb-1.5" style={{ color: spineTextColor, opacity: 0.65 }}>
            《{analysis.bookTitle}》· {analysis.character} · 故事终章
          </div>
          <div
            className="text-2xl font-black leading-none"
            style={{ fontFamily: "'Ma Shan Zheng', serif", color: spineTextColor }}
          >
            {ending.title}
          </div>
          {ending.narration && (
            <p className="text-sm leading-relaxed mt-2" style={{ color: spineTextColor, opacity: 0.85 }}>
              {ending.narration}
            </p>
          )}
        </div>

        {/* Choice evidence chain */}
        <div className="relative z-10 px-5 pt-5 pb-4 border-b border-[rgba(1,1,1,.12)]">
          <p className="text-[11px] font-bold tracking-widest text-[rgba(1,1,1,.4)] mb-4 uppercase">
            你的选择证据
          </p>
          {/* Extreme moment banner — shown if any trap was triggered */}
          {trapSceneIdxs.length > 0 && (
            <div
              className="mb-4 flex items-start gap-2 rounded-sm px-3 py-2.5"
              style={{ background: "rgba(195,74,40,.10)", border: "1.5px solid rgba(195,74,40,.35)" }}
            >
              <span className="text-base mt-0.5 shrink-0">⚠️</span>
              <div>
                <div className="text-[12px] font-black tracking-wide" style={{ color: "#C34A28" }}>
                  你曾在极端时刻踩线
                </div>
                <div className="text-[11px] text-[rgba(1,1,1,.55)] mt-0.5 leading-snug">
                  第{trapSceneIdxs.map(i => ["一","二","三","四","五"][i] ?? String(i+1)).join("、")}幕中，你触发了极端抉择——
                  那一刻，你愿意走到最边缘的地方。这说明某种价值在你心里足够重，重到可以冒险。
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {choiceLabels.map((label, i) => {
              const sceneTitle = analysis.scenes[i]?.title ?? `第${i + 1}幕`;
              const choicePart = label.replace(/^第\d+次，你选择了——/, "");
              // This scene had a trap triggered → highlight this row
              const wasExtreme = trapSceneIdxs.includes(i);
              return (
                <div key={i} className="flex gap-3 items-start anim-ink" style={{ animationDelay: `${i * 120}ms` }}>
                  <div className="flex flex-col items-center shrink-0 mt-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: wasExtreme ? "#C34A28" : spineColor }}
                    />
                    {i < choiceLabels.length - 1 && (
                      <div className="w-px flex-1 min-h-[20px] mt-1" style={{ background: wasExtreme ? "rgba(195,74,40,.35)" : "rgba(1,1,1,.15)" }} />
                    )}
                  </div>
                  <div
                    className="flex-1 pb-1 rounded-sm px-2 py-1"
                    style={wasExtreme ? { background: "rgba(195,74,40,.07)", borderLeft: "2px solid rgba(195,74,40,.5)" } : {}}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div className="text-[10px] text-[rgba(1,1,1,.4)] tracking-wide">{sceneTitle}</div>
                      {wasExtreme && (
                        <span
                          className="text-[9px] font-black tracking-wide px-1 py-0.5 rounded-sm"
                          style={{ background: "#C34A28", color: "#EFE6C9" }}
                        >
                          极端时刻
                        </span>
                      )}
                    </div>
                    <div
                      className="text-sm font-semibold leading-snug"
                      style={{ color: wasExtreme ? "#C34A28" : "rgba(1,1,1,.85)" }}
                    >
                      {choicePart}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Value axes breakdown */}
        {analysis.axes.length > 0 && (
          <div className="relative z-10 px-5 pt-4 pb-4 border-b border-[rgba(1,1,1,.12)]">
            <p className="text-[11px] font-bold tracking-widest text-[rgba(1,1,1,.4)] mb-3 uppercase">
              价值倾向分析
            </p>
            <div className="flex flex-col gap-3">
              {analysis.axes.map((axis) => {
                const val = scores[axis.key] ?? 50;
                return (
                  <div key={axis.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold" style={{ color: spineColor }}>{axis.key}</span>
                      <span className="text-[11px] text-[rgba(1,1,1,.5)]">
                        {axis.low} ↔ {axis.high}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[rgba(1,1,1,.1)] overflow-hidden mb-1">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${val}%`,
                          background: spineColor,
                          animation: "barGrow 0.8s cubic-bezier(.2,.8,.2,1) forwards",
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-[rgba(1,1,1,.45)]">{axis.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI narration — streaming, auto-shown */}
        <div className="relative z-10 px-5 pt-5 pb-4 border-b border-[rgba(1,1,1,.12)]">
          <p className="text-[11px] font-bold tracking-widest text-[rgba(1,1,1,.4)] mb-3 uppercase">
            由此可见
          </p>

          {!aiDone && aiText === "" ? (
            // Loading state
            <div className="flex items-center gap-2 text-sm text-[rgba(1,1,1,.45)] italic">
              <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: spineColor }} />
              正在归纳你的选择轨迹……
            </div>
          ) : (
            <div className="bubble bubble-inner text-sm leading-[1.75]">
              {aiText}
              {!aiDone && (
                <span
                  className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
                  style={{ background: "#C34A28" }}
                />
              )}
            </div>
          )}
        </div>

        {/* Share + navigation CTAs */}
        <div className="relative z-10 px-5 pt-4 pb-2">
          {/* Share row */}
          <p className="text-[10px] font-bold tracking-widest text-[rgba(1,1,1,.35)] mb-2 uppercase">分享</p>
          <div className="flex gap-2 mb-3">
            <button
              onClick={handleShareStory}
              className="flex-1 py-2.5 text-sm font-bold border transition-all active:scale-95 flex items-center justify-center gap-1.5"
              style={{ background: "rgba(239,230,201,.72)", borderColor: "rgba(1,1,1,.28)", color: "#010101", borderRadius: 0 }}
            >
              <span>📖</span>
              <span>分享这个故事</span>
            </button>
            <button
              onClick={handleShareResult}
              className="flex-1 py-2.5 text-sm font-bold border transition-all active:scale-95 flex items-center justify-center gap-1.5"
              style={{ background: spineColor, borderColor: "transparent", color: spineTextColor, borderRadius: 0 }}
            >
              <span>🔗</span>
              <span>分享我的结果</span>
            </button>
          </div>
          {/* Sub-hints */}
          <div className="flex gap-2 mb-4">
            <p className="flex-1 text-[10px] text-center text-[rgba(1,1,1,.38)] leading-snug">
              朋友用同一角色同一故事<br />做出他们自己的选择
            </p>
            <p className="flex-1 text-[10px] text-center text-[rgba(1,1,1,.38)] leading-snug">
              朋友看到你的完整<br />选择路径与分析
            </p>
          </div>
        </div>

        {/* Navigation CTAs */}
        <div className="relative z-10 px-5 pb-2 flex gap-3">
          <button
            onClick={onNewBook}
            className="flex-1 py-3 text-sm font-bold border border-[rgba(1,1,1,.35)] transition-all active:scale-95"
            style={{ background: "transparent", color: "#010101", borderRadius: 0 }}
          >
            换一本书
          </button>
          <button
            onClick={onRestart}
            className="flex-1 py-3 text-sm font-bold text-[#EFE6C9] transition-all active:scale-95"
            style={{ background: "#010101", borderRadius: 0 }}
          >
            换种选法重来
          </button>
        </div>

        {/* Intensify CTA */}
        <div className="relative z-10 px-5 pb-5 pt-2">
          <button
            onClick={onIntensify}
            className="w-full py-3.5 text-sm font-bold tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, #C34A28, #8B1A1A)",
              color: "#EFE6C9",
              borderRadius: 0,
              boxShadow: "0 4px 16px rgba(195,74,40,.3)",
            }}
          >
            <span>⚡</span>
            <span>极压重测 · 看你在生死关头怎么选</span>
          </button>
          <p className="text-[10px] text-center text-[rgba(1,1,1,.38)] mt-1.5 leading-snug">
            同一故事，每个困境升级为生离死别——看你的价值观是否稳定
          </p>
        </div>

        <div ref={bottomRef} />
      </div>

      {/* Toast notification */}
      <div
        className="fixed bottom-8 left-1/2 z-[100] pointer-events-none"
        style={{
          transform: "translateX(-50%)",
          opacity: toast ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      >
        <div
          className="px-5 py-3 text-sm font-bold rounded-full max-w-[300px] text-center leading-snug"
          style={{
            background: "#010101",
            color: "#EFE6C9",
            boxShadow: "0 4px 20px rgba(0,0,0,.4)",
          }}
        >
          {toast}
        </div>
      </div>
    </div>
  );
}
