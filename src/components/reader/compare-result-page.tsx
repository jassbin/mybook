"use client";
// src/components/reader/compare-result-page.tsx
// Shows side-by-side comparison of normal vs intensified runs
import { useCallback, useEffect, useRef, useState } from "react";
import type { AnalysisResult, BookMeta } from "@/lib/reader/types";
import type { RunSnapshot } from "@/app/page";
import { buildStoryShareUrl, buildResultShareUrl } from "@/lib/reader/share-codec";

interface CompareResultPageProps {
  bookMeta: BookMeta | null;
  normalSnapshot: RunSnapshot;
  intensifyAnalysis: AnalysisResult;
  intensifyScores: Record<string, number>;
  intensifyHistory: string[];
  intensifyChoiceLabels: string[];
  intensifyTrapSceneIdxs: number[];
  onPlayAgain: () => void;
  onNewBook: () => void;
}

export function CompareResultPage({
  bookMeta,
  normalSnapshot,
  intensifyAnalysis,
  intensifyScores,
  intensifyChoiceLabels,
  intensifyTrapSceneIdxs,
  onPlayAgain,
  onNewBook,
}: CompareResultPageProps) {
  const [aiText, setAiText] = useState("");
  const [aiDone, setAiDone] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const spineColor = bookMeta?.color ?? "#1A3A5C";
  const spineTextColor = bookMeta?.textColor ?? "#EFE6C9";
  const intensifyColor = "#C34A28";

  const normalAnalysis = normalSnapshot.analysis;
  const normalScores = normalSnapshot.scores;
  const normalChoiceLabels = normalSnapshot.choiceLabels;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }, []);

  // ── 5 share handlers ────────────────────────────────────────────────────
  const shareNormalStory = useCallback(() => {
    try {
      navigator.clipboard.writeText(buildStoryShareUrl(normalAnalysis)).then(
        () => showToast("普通版故事链接已复制 —— 朋友用同一角色做出自己的选择"),
        () => showToast("链接生成失败，请重试")
      );
    } catch { showToast("链接生成失败"); }
  }, [normalAnalysis, showToast]);

  const shareNormalResult = useCallback(() => {
    try {
      navigator.clipboard.writeText(
        buildResultShareUrl(normalAnalysis, normalSnapshot.history, normalChoiceLabels)
      ).then(
        () => showToast("普通版结果链接已复制 —— 朋友可看到你的选择路径"),
        () => showToast("链接生成失败，请重试")
      );
    } catch { showToast("链接生成失败"); }
  }, [normalAnalysis, normalSnapshot.history, normalChoiceLabels, showToast]);

  const shareIntensifyStory = useCallback(() => {
    try {
      navigator.clipboard.writeText(buildStoryShareUrl(intensifyAnalysis)).then(
        () => showToast("极压版故事链接已复制 —— 让朋友面对同一极端困境"),
        () => showToast("链接生成失败，请重试")
      );
    } catch { showToast("链接生成失败"); }
  }, [intensifyAnalysis, showToast]);

  const shareIntensifyResult = useCallback(() => {
    try {
      navigator.clipboard.writeText(
        buildResultShareUrl(intensifyAnalysis, normalSnapshot.history, intensifyChoiceLabels)
      ).then(
        () => showToast("极压版结果链接已复制 —— 展示你在生死关头的选择"),
        () => showToast("链接生成失败，请重试")
      );
    } catch { showToast("链接生成失败"); }
  }, [intensifyAnalysis, normalSnapshot.history, intensifyChoiceLabels, showToast]);

  const shareCompare = useCallback(() => {
    try {
      const url = buildStoryShareUrl(intensifyAnalysis);
      const msg = `我在《${normalAnalysis.bookTitle}》的极压测试中，发现自己在生死关头的选择和日常分岔——你呢？点链接试一下：${url}`;
      navigator.clipboard.writeText(msg).then(
        () => showToast("对比全景已复制（含引语 + 极压测试链接）"),
        () => showToast("复制失败，请重试")
      );
    } catch { showToast("复制失败"); }
  }, [normalAnalysis.bookTitle, intensifyAnalysis, showToast]);

  // Auto-fetch compare narration on mount
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/reader/compare-narration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({
            bookTitle: normalAnalysis.bookTitle,
            character: normalAnalysis.character,
            normalChoiceLabels,
            intensifyChoiceLabels,
            normalScenes: normalAnalysis.scenes.map((s) => s.title),
            intensifyScenes: intensifyAnalysis.scenes.map((s) => s.title),
            axisKeys: normalAnalysis.axes.map((a) => a.key),
            normalScores,
            intensifyScores,
          }),
        });
        if (!res.ok) throw new Error("failed");
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          setAiText((prev) => prev + decoder.decode(value, { stream: true }));
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setAiText("两次故事已经说明了一些东西。压力越大，真相越清晰。");
        }
      } finally {
        setAiDone(true);
      }
    })();
    return () => ctrl.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiText]);

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
        {/* Header — dual-tone */}
        <div
          className="relative z-10 px-5 pt-5 pb-4"
          style={{
            background: `linear-gradient(135deg, ${spineColor} 0%, ${intensifyColor} 100%)`,
          }}
        >
          <div className="text-[11px] tracking-widest mb-1.5" style={{ color: "rgba(239,230,201,.7)" }}>
            《{normalAnalysis.bookTitle}》· {normalAnalysis.character} · 压力对比
          </div>
          <div
            className="text-2xl font-black leading-none"
            style={{ fontFamily: "'Ma Shan Zheng', serif", color: "#EFE6C9" }}
          >
            你在极限时，变了吗？
          </div>
          <p className="text-sm leading-relaxed mt-2" style={{ color: "rgba(239,230,201,.82)" }}>
            同一个你，两套压力——对比你的两次价值排序
          </p>
        </div>

        {/* Four axes comparison */}
        <div className="relative z-10 px-5 pt-5 pb-4 border-b border-[rgba(1,1,1,.12)]">
          <p className="text-[11px] font-bold tracking-widest text-[rgba(1,1,1,.4)] mb-4 uppercase">
            四轴数值对比
          </p>
          <div className="flex flex-col gap-4">
            {normalAnalysis.axes.map((axis) => {
              const nVal = normalScores[axis.key] ?? 50;
              const iVal = intensifyScores[axis.key] ?? 50;
              const diff = iVal - nVal;
              const shifted = Math.abs(diff) > 8;
              const dir = diff > 0 ? "↑" : diff < 0 ? "↓" : "≈";
              const dirColor = diff > 8 ? intensifyColor : diff < -8 ? "#1A3A5C" : "rgba(1,1,1,.4)";

              return (
                <div key={axis.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="text-sm font-black"
                      style={{ color: shifted ? intensifyColor : spineColor }}
                    >
                      {axis.key}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px]" style={{ color: "rgba(1,1,1,.45)" }}>
                        {axis.low} ↔ {axis.high}
                      </span>
                      {shifted && (
                        <span
                          className="text-[10px] font-black px-1.5 py-0.5 rounded-sm"
                          style={{ background: intensifyColor, color: "#EFE6C9" }}
                        >
                          显著变化
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Normal bar */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-[rgba(1,1,1,.4)] w-8 shrink-0">普通</span>
                    <div className="flex-1 h-1.5 rounded-full bg-[rgba(1,1,1,.1)] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${nVal}%`,
                          background: spineColor,
                          transition: "width 0.8s cubic-bezier(.2,.8,.2,1)",
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-[rgba(1,1,1,.5)] w-6 text-right shrink-0">{nVal}</span>
                  </div>

                  {/* Intensify bar */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] w-8 shrink-0 font-bold" style={{ color: intensifyColor }}>极压</span>
                    <div className="flex-1 h-1.5 rounded-full bg-[rgba(1,1,1,.1)] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${iVal}%`,
                          background: intensifyColor,
                          transition: "width 0.8s cubic-bezier(.2,.8,.2,1) 0.15s",
                        }}
                      />
                    </div>
                    <span className="text-[10px] w-6 text-right shrink-0 font-bold" style={{ color: dirColor }}>
                      {dir}{Math.abs(diff)}
                    </span>
                  </div>

                  <p className="text-[11px] text-[rgba(1,1,1,.4)] mt-1">{axis.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side-by-side choice paths */}
        <div className="relative z-10 px-5 pt-4 pb-4 border-b border-[rgba(1,1,1,.12)]">
          <p className="text-[11px] font-bold tracking-widest text-[rgba(1,1,1,.4)] mb-3 uppercase">
            两次选择对照
          </p>
          <div className="flex flex-col gap-3">
            {normalChoiceLabels.map((label, i) => {
              const normalChoice = label.replace(/^第\d+次，你选择了——/, "");
              const intensifyLabel = intensifyChoiceLabels[i] ?? "";
              const intensifyChoice = intensifyLabel.replace(/^第\d+次，你选择了——/, "");
              const normalScene = normalAnalysis.scenes[i]?.title ?? `第${i + 1}幕`;
              const intensifyScene = intensifyAnalysis.scenes[i]?.title ?? `极压第${i + 1}幕`;
              const wasExtreme = intensifyTrapSceneIdxs.includes(i);

              return (
                <div key={i} className="anim-ink" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex gap-2">
                    {/* Normal */}
                    <div
                      className="flex-1 rounded-sm px-2.5 py-2"
                      style={{ background: `${spineColor}12`, borderLeft: `2px solid ${spineColor}` }}
                    >
                      <div className="text-[9px] text-[rgba(1,1,1,.38)] mb-1 tracking-wide">{normalScene}</div>
                      <div className="text-[12px] font-semibold text-[rgba(1,1,1,.82)] leading-snug">{normalChoice}</div>
                    </div>
                    {/* Intensify */}
                    <div
                      className="flex-1 rounded-sm px-2.5 py-2"
                      style={{
                        background: wasExtreme ? "rgba(195,74,40,.12)" : "rgba(195,74,40,.07)",
                        borderLeft: `2px solid ${intensifyColor}`,
                      }}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <div className="text-[9px] tracking-wide" style={{ color: "rgba(195,74,40,.6)" }}>{intensifyScene}</div>
                        {wasExtreme && (
                          <span
                            className="text-[8px] font-black px-1 py-0.5 rounded-sm"
                            style={{ background: intensifyColor, color: "#EFE6C9" }}
                          >
                            极端
                          </span>
                        )}
                      </div>
                      <div
                        className="text-[12px] font-semibold leading-snug"
                        style={{ color: wasExtreme ? intensifyColor : "rgba(195,74,40,.85)" }}
                      >
                        {intensifyChoice}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI comparison narration — streaming */}
        <div className="relative z-10 px-5 pt-5 pb-4 border-b border-[rgba(1,1,1,.12)]">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-[11px] font-bold tracking-widest text-[rgba(1,1,1,.4)] uppercase">
              对比结论
            </p>
            <div
              className="flex-1 h-px"
              style={{ background: `linear-gradient(90deg, ${spineColor}, ${intensifyColor})` }}
            />
          </div>

          {!aiDone && aiText === "" ? (
            <div className="flex items-center gap-2 text-sm text-[rgba(1,1,1,.45)] italic">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: intensifyColor }}
              />
              正在分析两次选择的差异……
            </div>
          ) : (
            <div className="bubble bubble-inner text-sm leading-[1.75]">
              {aiText}
              {!aiDone && (
                <span
                  className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
                  style={{ background: intensifyColor }}
                />
              )}
            </div>
          )}
        </div>

        {/* CTAs */}
        <div className="relative z-10 px-5 pt-4 pb-2 flex flex-col gap-2">
          <button
            onClick={onPlayAgain}
            className="w-full py-3 text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{ background: intensifyColor, color: "#EFE6C9", borderRadius: 0 }}
          >
            <span>⚡</span>再玩一次极压版
          </button>
          <button
            onClick={onNewBook}
            className="w-full py-3 text-sm font-bold border border-[rgba(1,1,1,.35)] transition-all active:scale-95"
            style={{ background: "transparent", color: "#010101", borderRadius: 0 }}
          >
            换一本书
          </button>
        </div>

        {/* 5 Share buttons */}
        <div className="relative z-10 px-5 pt-2 pb-5">
          <p className="text-[10px] font-bold tracking-widest text-[rgba(1,1,1,.35)] mb-2 uppercase">分享</p>
          <div className="grid grid-cols-2 gap-1.5 mb-1.5">
            <button
              onClick={shareNormalStory}
              className="py-2 text-[11px] font-bold border transition-all active:scale-95 flex items-center justify-center gap-1"
              style={{ background: `${spineColor}15`, borderColor: `${spineColor}50`, color: "#010101", borderRadius: 0 }}
            >
              <span>📖</span>普通版故事
            </button>
            <button
              onClick={shareNormalResult}
              className="py-2 text-[11px] font-bold border transition-all active:scale-95 flex items-center justify-center gap-1"
              style={{ background: `${spineColor}25`, borderColor: `${spineColor}70`, color: "#010101", borderRadius: 0 }}
            >
              <span>🔗</span>普通版结果
            </button>
            <button
              onClick={shareIntensifyStory}
              className="py-2 text-[11px] font-bold border transition-all active:scale-95 flex items-center justify-center gap-1"
              style={{ background: "rgba(195,74,40,.10)", borderColor: "rgba(195,74,40,.38)", color: intensifyColor, borderRadius: 0 }}
            >
              <span>⚡</span>极压版故事
            </button>
            <button
              onClick={shareIntensifyResult}
              className="py-2 text-[11px] font-bold border transition-all active:scale-95 flex items-center justify-center gap-1"
              style={{ background: "rgba(195,74,40,.18)", borderColor: "rgba(195,74,40,.55)", color: intensifyColor, borderRadius: 0 }}
            >
              <span>🔥</span>极压版结果
            </button>
          </div>
          <button
            onClick={shareCompare}
            className="w-full py-2.5 text-[11px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
            style={{
              background: `linear-gradient(135deg, ${spineColor}, ${intensifyColor})`,
              color: "#EFE6C9",
              borderRadius: 0,
            }}
          >
            <span>🌟</span>分享对比全景（含引语 + 极压测试链接）
          </button>
          <p className="text-[10px] text-center text-[rgba(1,1,1,.35)] mt-1.5 leading-snug">
            共 5 个分享选项 · 复制后发送给朋友
          </p>
        </div>

        <div ref={bottomRef} />
      </div>

      {/* Toast */}
      <div
        className="fixed bottom-8 left-1/2 z-[100] pointer-events-none"
        style={{ transform: "translateX(-50%)", opacity: toast ? 1 : 0, transition: "opacity 0.3s ease" }}
      >
        <div
          className="px-5 py-3 text-sm font-bold rounded-full max-w-[300px] text-center leading-snug"
          style={{ background: "#010101", color: "#EFE6C9", boxShadow: "0 4px 20px rgba(0,0,0,.4)" }}
        >
          {toast}
        </div>
      </div>
    </div>
  );
}
