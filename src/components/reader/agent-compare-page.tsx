"use client";
// src/components/reader/agent-compare-page.tsx
// Agent 极压对比结算页 v2：双排对照 + 三合一视觉 + 价值锚点卡
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { BookMeta } from "@/lib/reader/types";
import type { WorldState } from "@/lib/agent/world-state";
import { buildAgentResultShareUrl, buildAgentStoryShareUrl } from "@/lib/reader/share-codec";
import { PageTopbar } from "./page-topbar";
import { Flame, Share2, MoveHorizontal } from "lucide-react";

interface AgentComparePageProps {
  bookMeta: BookMeta | null;
  normalState: WorldState;
  intensifyState: WorldState;
  onPlayAgain: () => void;
  onNewBook: () => void;
  onBack?: () => void;
}

interface SpacetimeFold {
  ancientScene: string;
  modernScene: string;
  bridge: string;
}

interface ValueAnchor {
  type: string;
  image: string;
  question: string;
}

// 把流式全文按 ===SEP=== 分成四段
function parseSections(text: string): {
  evidence: string; mirror: string; foldJson: string | null; anchorsJson: string | null;
} {
  const parts = text.split("===SEP===");
  const evidence   = (parts[0] ?? "").trim();
  const mirror     = (parts[1] ?? "").trim();
  const foldRaw    = (parts[2] ?? "").trim();
  const anchorRaw  = (parts[3] ?? "").trim();

  let foldJson: string | null = null;
  if (foldRaw) {
    const m = foldRaw.match(/\{[\s\S]*\}/);
    if (m) { try { JSON.parse(m[0]); foldJson = m[0]; } catch { foldJson = null; } }
  }
  let anchorsJson: string | null = null;
  if (anchorRaw) {
    // 先尝试数组
    const arr = anchorRaw.match(/\[[\s\S]*\]/);
    if (arr) { try { JSON.parse(arr[0]); anchorsJson = arr[0]; } catch { anchorsJson = null; } }
    // 兼容旧版单对象
    if (!anchorsJson) {
      const obj = anchorRaw.match(/\{[\s\S]*\}/);
      if (obj) { try { anchorsJson = JSON.stringify([JSON.parse(obj[0])]); } catch { anchorsJson = null; } }
    }
  }
  return { evidence, mirror, foldJson, anchorsJson };
}


export function AgentComparePage({
  bookMeta, normalState, intensifyState, onPlayAgain, onNewBook, onBack,
}: AgentComparePageProps) {
  const [aiText, setAiText]   = useState("");
  const [aiDone, setAiDone]   = useState(false);
  const [toast, setToast]     = useState<string | null>(null);
  const bottomRef             = useRef<HTMLDivElement>(null);

  const spineColor    = bookMeta?.color    ?? "#1A3A5C";
  const spineText     = bookMeta?.textColor ?? "#EFE6C9";
  const intensifyColor = "#C34A28";

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const copyUrl = useCallback((url: string, label: string) => {
    navigator.clipboard.writeText(url).then(
      () => showToast(`${label}已复制`),
      () => showToast("复制失败"),
    );
  }, [showToast]);

  const handleShareNormalResult   = useCallback(() => copyUrl(buildAgentResultShareUrl(normalState),    "普通版结果"), [normalState, copyUrl]);
  const handleShareIntensifyResult = useCallback(() => copyUrl(buildAgentResultShareUrl(intensifyState), "极压版结果"), [intensifyState, copyUrl]);
  const handleShareStory           = useCallback(() => copyUrl(buildAgentStoryShareUrl(normalState.book, normalState.character), "故事链接"), [normalState, copyUrl]);

  // ── 选择模式统计（普通 + 极压分别算）────────────────────────────────────
  const normalStats = useMemo(() => {
    const h = normalState.choiceHistory;
    const total = h.length;
    return {
      total,
      aCount: h.filter(c => c.choiceId === "A").length,
      bCount: h.filter(c => c.choiceId === "B").length,
      cCount: h.filter(c => c.choiceId === "C").length,
    };
  }, [normalState.choiceHistory]);

  const intensifyStats = useMemo(() => {
    const h = intensifyState.choiceHistory;
    const total = h.length;
    return {
      total,
      aCount: h.filter(c => c.choiceId === "A").length,
      bCount: h.filter(c => c.choiceId === "B").length,
      cCount: h.filter(c => c.choiceId === "C").length,
    };
  }, [intensifyState.choiceHistory]);

  // ── 解析四段 ─────────────────────────────────────────────────────────────
  const { evidence, mirror, foldJson, anchorsJson } = useMemo(
    () => parseSections(aiText),
    [aiText],
  );
  const fold: SpacetimeFold | null = useMemo(() => {
    if (!foldJson) return null;
    try { return JSON.parse(foldJson); } catch { return null; }
  }, [foldJson]);
  const anchors: ValueAnchor[] = useMemo(() => {
    if (!anchorsJson) return [];
    try {
      const p = JSON.parse(anchorsJson);
      return Array.isArray(p) ? p.filter((a: ValueAnchor) => a.type && a.image && a.question) : [];
    } catch { return []; }
  }, [anchorsJson]);

  const isStreaming = !aiDone;
  const hasEvidence = evidence.length > 0;
  const hasMirror   = mirror.length > 0;
  const hasFold     = fold !== null;
  const hasAnchors  = anchors.length > 0;

  // ── 流式对比旁白（走四段协议）─────────────────────────────────────────────
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/narrative/compare-narration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({ normalState, intensifyState }),
        });
        if (!res.ok) throw new Error("failed");
        const reader  = res.body!.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          setAiText(prev => prev + decoder.decode(value, { stream: true }));
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setAiText("两次选择，两种你。普通版本里你保护的，极压版本里你放弃了。这之间的距离，就是你的底线。");
        }
      } finally {
        setAiDone(true);
      }
    })();
    return () => ctrl.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (aiDone) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiDone]);

  // ── 渲染占比条辅助 ─────────────────────────────────────────────────────────
  function ChoiceBar({
    stats, color, textColor, label,
  }: { stats: typeof normalStats; color: string; textColor: string; label: string }) {
    if (stats.total === 0) return null;
    return (
      <div>
        <p className="text-[10px] font-bold mb-1.5" style={{ color: `${color}cc` }}>{label}</p>
        <div className="flex gap-0.5 h-5 rounded-sm overflow-hidden mb-1.5">
          {stats.aCount > 0 && (
            <div
              className="flex items-center justify-center text-[9px] font-bold transition-all duration-700"
              style={{ width: `${(stats.aCount / stats.total) * 100}%`, background: color, color: textColor, opacity: 0.7 }}
            >
              {stats.aCount > 1 ? `甲×${stats.aCount}` : "甲"}
            </div>
          )}
          {stats.bCount > 0 && (
            <div
              className="flex items-center justify-center text-[9px] font-bold transition-all duration-700"
              style={{ width: `${(stats.bCount / stats.total) * 100}%`, background: color, color: textColor, opacity: 0.45 }}
            >
              {stats.bCount > 1 ? `乙×${stats.bCount}` : "乙"}
            </div>
          )}
          {stats.cCount > 0 && (
            <div
              className="flex items-center justify-center text-[9px] font-bold transition-all duration-700"
              style={{ width: `${(stats.cCount / stats.total) * 100}%`, background: color, color: textColor, opacity: 0.92 }}
            >
              {stats.cCount > 1 ? `丙×${stats.cCount}` : "丙"}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fresh-backdrop flex flex-col min-h-screen"
      style={{ paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
    >
      <div
        className="glass-panel relative w-full max-w-sm mx-auto flex flex-col anim-up overflow-y-auto rounded-2xl"
        style={{
          margin: "8px auto",
          minHeight: "calc(100dvh - var(--safe-top) - var(--safe-bottom) - 16px)",
        }}
      >
        {/* 顶栏 */}
        <PageTopbar
          title={`${normalState.character} · 极压对比`}
          subtitle={`《${normalState.book}》· 两次选择`}
          darkMode
          onBack={onBack}
          onShare={handleShareStory}
          shareLabel="分享故事"
        />

        {/* 标题色块 — 双色渐变 */}
        <div
          className="relative z-10 px-5 pt-4 pb-4"
          style={{ background: `linear-gradient(135deg, ${spineColor} 0%, ${intensifyColor} 100%)` }}
        >
          <div className="text-2xl font-black leading-none" style={{ fontFamily: "'Ma Shan Zheng', serif", color: "#EFE6C9" }}>
            两个你，同一个名字
          </div>
          <p className="text-sm mt-1.5" style={{ color: "rgba(239,230,201,.7)" }}>
            普通时的你 vs 极压时的你——看见那条底线
          </p>
        </div>

        {/* ── 选择模式对比条 ──────────────────────────────────────── */}
        <div className="relative z-10 px-5 pt-4 pb-4 border-b border-[rgba(1,1,1,.1)]">
          <p className="text-[11px] font-bold tracking-widest text-[rgba(1,1,1,.38)] mb-3 uppercase">选择模式对比</p>
          <ChoiceBar stats={normalStats}    color={spineColor}    textColor={spineText}   label="普通版" />
          <ChoiceBar stats={intensifyStats} color={intensifyColor} textColor="#EFE6C9" label="极压版 🔥" />
          <div className="flex justify-between text-[10px] text-[rgba(1,1,1,.38)] mt-1">
            <span>甲 = 保全优先</span>
            <span>乙 = 中间路线</span>
            <span>丙 = 代价更重</span>
          </div>
        </div>

        {/* ── 双排选择对照 ─────────────────────────────────────────── */}
        <div className="relative z-10 px-5 pt-4 pb-4 border-b border-[rgba(1,1,1,.12)]">
          <p className="text-[11px] font-bold tracking-widest text-[rgba(1,1,1,.4)] mb-4 uppercase">逐幕对照</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="text-[10px] font-bold text-center py-1 px-2 rounded-sm"
              style={{ background: spineColor, color: "#EFE6C9" }}>普通版</div>
            <div className="text-[10px] font-bold text-center py-1 px-2 rounded-sm"
              style={{ background: intensifyColor, color: "#EFE6C9" }}>极压版 🔥</div>
          </div>
          {Array.from({ length: Math.max(normalState.choiceHistory.length, intensifyState.choiceHistory.length) }).map((_, i) => {
            const n = normalState.choiceHistory[i];
            const x = intensifyState.choiceHistory[i];
            const isFlipped = n && x && ((n.choiceId === "A" && x.choiceId === "C") || (n.choiceId === "C" && x.choiceId === "A"));
            return (
              <div key={i} className="grid grid-cols-2 gap-2 mb-2.5">
                {/* 普通 */}
                <div
                  className="text-[11px] leading-snug p-2"
                  style={{
                    background: n ? `${spineColor}0f` : "transparent",
                    borderLeft: n ? `2px solid ${spineColor}70` : "none",
                  }}
                >
                  {n ? (
                    <>
                      <div className="text-[9px] text-[rgba(1,1,1,.35)] mb-0.5">第{n.act}幕</div>
                      <div className="font-semibold text-[rgba(1,1,1,.8)]">{n.choiceText}</div>
                      <div className="text-[10px] text-[rgba(1,1,1,.45)] mt-0.5">{n.socialTag}</div>
                    </>
                  ) : <span className="text-[rgba(1,1,1,.2)]">—</span>}
                </div>
                {/* 极压 */}
                <div
                  className="text-[11px] leading-snug p-2 relative"
                  style={{
                    background: x ? "rgba(195,74,40,.07)" : "transparent",
                    borderLeft: x ? `2px solid ${intensifyColor}70` : "none",
                  }}
                >
                  {isFlipped && (
                    <span
                      className="absolute top-1 right-1 text-[8px] px-1 py-0.5 font-black"
                      style={{ background: intensifyColor, color: "#EFE6C9" }}
                    >
                      翻转
                    </span>
                  )}
                  {x ? (
                    <>
                      <div className="text-[9px] text-[rgba(195,74,40,.5)] mb-0.5">第{x.act}幕</div>
                      <div className="font-semibold" style={{ color: isFlipped ? intensifyColor : "rgba(1,1,1,.8)" }}>{x.choiceText}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: isFlipped ? `${intensifyColor}bb` : "rgba(195,74,40,.55)" }}>{x.socialTag}</div>
                    </>
                  ) : <span className="text-[rgba(1,1,1,.2)]">—</span>}
                </div>
              </div>
            );
          })}

          {/* ── 结构性张力汇总：本局触碰过的底层问题 ── */}
          {(() => {
            const allRecords = [
              ...normalState.choiceHistory,
              ...intensifyState.choiceHistory,
            ];
            const tensions = [...new Set(
              allRecords.map(c => c.modernTension).filter((t): t is string => !!t)
            )].slice(0, 4);
            if (!tensions.length) return null;
            return (
              <div
                className="mt-4 px-3 py-3 rounded-sm"
                style={{ background: "rgba(195,74,40,.06)", borderLeft: "3px solid rgba(195,74,40,.35)" }}
              >
                <p
                  className="text-[10px] font-bold tracking-widest uppercase mb-2.5"
                  style={{ color: "rgba(195,74,40,.75)" }}
                >
                  这两局触碰的底层问题
                </p>
                <div className="flex flex-col gap-2">
                  {tensions.map((t, idx) => (
                    <p
                      key={idx}
                      className="text-[11px] leading-relaxed"
                      style={{ color: "rgba(1,1,1,.62)" }}
                    >
                      {t}
                    </p>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── 价值轴对比 ───────────────────────────────────────────── */}
        <div className="relative z-10 px-5 pt-4 pb-4 border-b border-[rgba(1,1,1,.12)]">
          <p className="text-[11px] font-bold tracking-widest text-[rgba(1,1,1,.4)] mb-3 uppercase">价值轴对比</p>
          {normalState.axes.map(axis => {
            const ia    = intensifyState.axes.find(a => a.key === axis.key);
            const nScore = axis.score;
            const xScore = ia?.score ?? axis.score;
            const diff   = xScore - nScore;
            const shifted = Math.abs(diff) > 8;
            return (
              <div key={axis.key} className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-[rgba(1,1,1,.8)]">{axis.key}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[rgba(1,1,1,.4)]">{axis.low} ↔ {axis.high}</span>
                    {shifted && (
                      <span
                        className="text-[9px] font-black px-1.5 py-0.5 rounded-sm"
                        style={{ background: intensifyColor, color: "#EFE6C9" }}
                      >
                        显著变化
                      </span>
                    )}
                  </div>
                </div>
                {/* 普通轴 */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] w-7 shrink-0" style={{ color: `${spineColor}cc` }}>普通</span>
                  <div className="flex-1 h-1.5 rounded-full bg-[rgba(1,1,1,.08)] overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{ width: `${nScore}%`, background: spineColor, transition: "width 0.8s cubic-bezier(.2,.8,.2,1)" }} />
                  </div>
                  <span className="text-[9px] w-5 text-right shrink-0" style={{ color: spineColor }}>{nScore}</span>
                </div>
                {/* 极压轴 */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] w-7 shrink-0 font-bold" style={{ color: intensifyColor }}>极压</span>
                  <div className="flex-1 h-1.5 rounded-full bg-[rgba(1,1,1,.08)] overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{ width: `${xScore}%`, background: intensifyColor, opacity: 0.75, transition: "width 0.8s cubic-bezier(.2,.8,.2,1) 0.15s" }} />
                  </div>
                  <span className="text-[9px] w-5 text-right shrink-0 font-bold"
                    style={{ color: diff > 8 ? intensifyColor : diff < -8 ? spineColor : "rgba(1,1,1,.4)" }}>
                    {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : "≈"}
                  </span>
                </div>
                <p className="text-[10px] text-[rgba(1,1,1,.38)] mt-1">{axis.description}</p>
              </div>
            );
          })}
        </div>

        {/* ── 对比证据链（段一）──────────────────────────────────────── */}
        <div className="relative z-10 px-5 pt-5 pb-4 border-b border-[rgba(1,1,1,.12)]">
          <p className="text-[11px] font-bold tracking-widest text-[rgba(1,1,1,.4)] mb-3 uppercase">对比洞察</p>
          {!hasEvidence && isStreaming ? (
            <div className="flex items-center gap-2 text-sm text-[rgba(1,1,1,.45)] italic">
              <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: intensifyColor }} />
              正在比较两次选择路径……
            </div>
          ) : (
            <div className="text-sm leading-[1.75] text-[rgba(1,1,1,.82)]">
              {evidence}
              {isStreaming && !hasMirror && (
                <span className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
                  style={{ background: intensifyColor }} />
              )}
            </div>
          )}
        </div>

        {/* ── 模式镜像（段二）─────────────────────────────────────────── */}
        {(hasMirror || (isStreaming && hasEvidence)) && (
          <div className="relative z-10 px-5 pt-4 pb-4 border-b border-[rgba(1,1,1,.12)]">
            <p className="text-[11px] font-bold tracking-widest text-[rgba(1,1,1,.4)] mb-3 uppercase">你的模式</p>
            {hasMirror ? (
              <div
                className="text-sm leading-relaxed font-semibold px-4 py-3 rounded-sm"
                style={{
                  background: `linear-gradient(135deg, ${spineColor}12, ${intensifyColor}10)`,
                  borderLeft: `3px solid ${intensifyColor}`,
                  color: "rgba(1,1,1,.78)",
                }}
              >
                {mirror}
                {isStreaming && !hasFold && (
                  <span className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
                    style={{ background: intensifyColor }} />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-[rgba(1,1,1,.35)] italic">
                <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: intensifyColor }} />
              </div>
            )}
          </div>
        )}

        {/* ── 时空折叠卡（段三）──────────────────────────────────────── */}
        {(hasFold || (isStreaming && hasMirror)) && (
          <div className="relative z-10 px-4 pt-4 pb-4 border-b border-[rgba(1,1,1,.12)]">
            <p className="text-[11px] font-bold tracking-widest text-[rgba(1,1,1,.4)] mb-3 uppercase px-1">时空折叠</p>
            {hasFold && fold ? (
              <div
                className="rounded-sm overflow-hidden"
                style={{ border: `1px solid ${spineColor}40`, boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}
              >
                <div className="grid grid-cols-2">
                  {/* 左：角色/书中 */}
                  <div className="px-3 py-4 flex flex-col gap-1.5"
                    style={{ background: `linear-gradient(135deg, ${spineColor} 0%, ${intensifyColor} 100%)` }}>
                    <span className="text-[9px] font-bold tracking-widest" style={{ color: "rgba(239,230,201,.7)" }}>
                      {normalState.character} · 书中
                    </span>
                    <p className="text-sm font-bold leading-snug" style={{ color: "#EFE6C9" }}>
                      {fold.ancientScene}
                    </p>
                  </div>
                  {/* 右：你/今天 */}
                  <div className="px-3 py-4 flex flex-col gap-1.5 bg-[rgba(255,255,255,.6)]">
                    <span className="text-[9px] font-bold tracking-widest text-[rgba(1,1,1,.4)]">
                      你 · 今天
                    </span>
                    <p className="text-sm font-bold leading-snug text-[rgba(1,1,1,.82)]">
                      {fold.modernScene}
                    </p>
                  </div>
                </div>
                {/* 打通语 */}
                <div
                  className="px-4 py-3 flex items-center gap-2"
                  style={{ background: `${spineColor}18`, borderTop: `1px solid ${spineColor}28` }}
                >
                  <span style={{ color: intensifyColor, fontSize: 14 }}>⟷</span>
                  <p className="text-sm font-bold leading-snug" style={{ color: intensifyColor }}>
                    {fold.bridge}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-[rgba(1,1,1,.35)] italic">
                <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: intensifyColor }} />
              </div>
            )}
          </div>
        )}

        {/* ── 多维价值锚点（段四）──────────────────────────────── */}
        {(hasAnchors || (isStreaming && hasFold)) && (
          <div className="relative z-10 px-4 pt-4 pb-4 border-b border-[rgba(1,1,1,.1)]">
            <p className="text-[11px] font-bold tracking-widest text-[rgba(1,1,1,.38)] mb-4 uppercase px-1">照见自己</p>
            {hasAnchors ? (
              <div className="flex flex-col gap-3">
                {anchors.map((a, i) => (
                  <AnchorCard key={i} anchor={a} index={i} />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-[rgba(1,1,1,.35)] italic px-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: intensifyColor }} />
              </div>
            )}
          </div>
        )}

        {/* ── 分享 + 操作 ──────────────────────────────────────────── */}
        <div className="relative z-10 px-5 pb-4 pt-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <button onClick={handleShareNormalResult}
              className="btn btn-paper flex-1 flex-col gap-0.5 py-2.5 rounded-none text-[10px]">
              <span className="font-bold">📊 分享普通结果</span>
              <span className="text-[9px] font-normal opacity-55">别人看普通版轨迹</span>
            </button>
            <button onClick={handleShareIntensifyResult}
              className="btn btn-paper flex-1 flex-col gap-0.5 py-2.5 rounded-none text-[10px]"
              style={{ borderColor: "rgba(195,74,40,.3)" }}>
              <span className="font-bold" style={{ color: intensifyColor }}>🔥 分享极压结果</span>
              <span className="text-[9px] font-normal opacity-55">别人看极压版轨迹</span>
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={onNewBook} className="btn btn-ghost flex-1 rounded-none py-2.5 text-[12px]">换一本书</button>
            <button onClick={onPlayAgain} className="btn btn-seal flex-1 rounded-none py-2.5 text-[12px]">🔥 再来极压</button>
          </div>
        </div>

        <div ref={bottomRef} className="pb-2" />
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 z-[100] pointer-events-none"
          style={{ transform: "translateX(-50%)" }}>
          <div className="px-5 py-3 text-sm font-bold rounded-full"
            style={{ background: "linear-gradient(135deg,#0c5a52,#0ea5b7)", color: "#ffffff", boxShadow: "0 6px 24px rgba(20,184,166,.4)" }}>
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 价值锚点卡（极压版：多维，红色系）──────────────────────────────────────
function AnchorCard({ anchor, index = 0 }: { anchor: ValueAnchor; index?: number }) {
  const lineColor = "#C34A28";
  return (
    <div
      className="relative px-3 py-4"
      style={{
        background: index === 0 ? "rgba(195,74,40,.07)" : index === 1 ? "rgba(1,1,1,.025)" : "rgba(195,74,40,.04)",
        borderLeft: `2px solid rgba(195,74,40,${index === 0 ? ".55" : index === 1 ? ".28" : ".18"})`,
      }}
    >
      <span
        className="text-[10px] font-black tracking-[0.18em] uppercase block mb-3"
        style={{ color: `rgba(195,74,40,${index === 0 ? ".85" : ".55"})` }}
      >
        {anchor.type}
      </span>
      <p
        className="leading-[1.85] mb-3"
        style={{
          fontFamily: "'Noto Serif SC', serif",
          fontSize: index === 0 ? "16px" : "15px",
          fontWeight: 700,
          color: index === 0 ? "rgba(1,1,1,.86)" : "rgba(1,1,1,.76)",
          letterSpacing: "0.02em",
        }}
      >
        {anchor.image}
      </p>
      <p
        className="leading-[1.75]"
        style={{
          fontSize: "12px",
          fontWeight: 500,
          color: `rgba(195,74,40,${index === 0 ? ".75" : ".6"})`,
          fontStyle: "italic",
          letterSpacing: "0.015em",
        }}
      >
        {anchor.question}
      </p>
    </div>
  );
}
