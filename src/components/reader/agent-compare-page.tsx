"use client";
// src/components/reader/agent-compare-page.tsx
// Agent 极压对比结算页 v2：双排对照 + 三合一视觉 + 价值锚点卡
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { BookMeta } from "@/lib/reader/types";
import type { WorldState } from "@/lib/agent/world-state";
import { buildAgentResultShareUrl, buildAgentStoryShareUrl } from "@/lib/reader/share-codec";
import { PageTopbar } from "./page-topbar";
import { ResultSection } from "./result-section";
import { Flame, Share2 } from "lucide-react";

interface AgentComparePageProps {
  bookMeta: BookMeta | null;
  normalState: WorldState;
  intensifyState: WorldState;
  onPlayAgain: () => void;
  onNewBook: () => void;
  onBack?: () => void;
}

interface ValueAnchor {
  type: string;
  image: string;
  question: string;
}

// 把流式全文按 ===SEP=== 分成四段
function parseSections(text: string): {
  evidence: string; mirror: string; anchorsJson: string | null;
} {
  const parts = text.split("===SEP===");
  const evidence   = (parts[0] ?? "").trim();
  // 护栏：过滤 prompt 泄漏
  const looksLikePromptLeak = (s: string) =>
    /题目|分隔符|严格按|按照格式|输出格式|输出中|不加任何标题|===SEP===|JSON|数组|字段/.test(s);
  const rawMirror  = (parts[1] ?? "").trim();
  const mirror     = looksLikePromptLeak(rawMirror) ? "" : rawMirror;
  const anchorRaw  = (parts[3] ?? "").trim();

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
  return { evidence, mirror, anchorsJson };
}


export function AgentComparePage({
  bookMeta, normalState, intensifyState, onPlayAgain, onNewBook, onBack,
}: AgentComparePageProps) {
  const [aiText, setAiText]   = useState("");
  const [aiDone, setAiDone]   = useState(false);
  const [toast, setToast]     = useState<string | null>(null);
  const bottomRef             = useRef<HTMLDivElement>(null);

  // 普通版统一绿色主色（与首页深绿体系一致）；极压版保留红色以形成语义对比
  const spineColor    = "#0b6b57";
  const spineText     = "#EFE6C9";
  const intensifyColor = "#a83c2a";

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

  // ── 解析四段 ─────────────────────────────────────────────────────────────
  const { evidence, mirror, anchorsJson } = useMemo(
    () => parseSections(aiText),
    [aiText],
  );
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

  return (
    <div
      className="fresh-backdrop flex flex-col min-h-screen"
      style={{ paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
    >
      {/* 中层：浅绿卡（边框内浅绿，与边框外深绿区分） */}
      <div
        className="result-mid relative w-full max-w-sm mx-auto flex flex-col anim-up overflow-hidden rounded-2xl"
        style={{
          margin: "8px auto",
          padding: "7px",
          minHeight: "calc(100dvh - var(--safe-top) - var(--safe-bottom) - 16px)",
          boxShadow: "0 0 0 1.5px rgba(11,107,87,.45), 0 24px 70px rgba(2,30,28,.5)",
        }}
      >
      {/* 内层：白色内容卡 */}
      <div className="relative flex flex-col flex-1 min-h-0 overflow-y-auto rounded-xl"
        style={{ background: "#ffffff", border: "1px solid rgba(11,107,87,.18)" }}>
        {/* 顶栏 */}
        <PageTopbar
          title={`${normalState.character} · 极压对比`}
          subtitle={`《${normalState.book}》· 两次选择`}
          onBack={onBack}
          onShare={handleShareStory}
          shareLabel="分享故事"
        />

        {/* 内容区：分层错落入场 */}
        <div className="stagger-in flex flex-col">
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

        {/* ── 块1：逐幕对照（新字段：桥段名 + 今天困境；只列两边都有的幕）── */}
        <ResultSection index="1" title="逐幕对照">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="text-[10px] font-bold text-center py-1 px-2 rounded-sm"
              style={{ background: spineColor, color: "#EFE6C9" }}>普通版</div>
            <div className="text-[10px] font-bold text-center py-1 px-2 rounded-sm flex items-center justify-center gap-1"
              style={{ background: intensifyColor, color: "#EFE6C9" }}><Flame size={11} strokeWidth={2.4} /> 极压版</div>
          </div>
          {Array.from({ length: Math.min(normalState.choiceHistory.length, intensifyState.choiceHistory.length) }).map((_, i) => {
            const n = normalState.choiceHistory[i];
            const x = intensifyState.choiceHistory[i];
            const isFlipped = (n.choiceId === "A" && x.choiceId === "C") || (n.choiceId === "C" && x.choiceId === "A");
            return (
              <div key={i} className="grid grid-cols-2 gap-2 mb-2.5">
                {/* 普通 */}
                <div className="text-[11px] leading-snug p-2"
                  style={{ background: `${spineColor}0f`, borderLeft: `2px solid ${spineColor}70` }}>
                  <div className="text-[13px] font-black leading-snug"
                    style={{ fontFamily: "'Ma Shan Zheng', serif", color: "rgba(1,1,1,.88)" }}>
                    {n.sceneName || n.choiceText}
                  </div>
                  <div className="text-[10px] mt-1 leading-relaxed" style={{ color: spineColor }}>
                    → {n.modernTension || n.socialTag}
                  </div>
                </div>
                {/* 极压 */}
                <div className="text-[11px] leading-snug p-2 relative"
                  style={{ background: "rgba(195,74,40,.07)", borderLeft: `2px solid ${intensifyColor}70` }}>
                  {isFlipped && (
                    <span className="absolute top-1 right-1 text-[8px] px-1 py-0.5 font-black"
                      style={{ background: intensifyColor, color: "#EFE6C9" }}>翻转</span>
                  )}
                  <div className="text-[13px] font-black leading-snug"
                    style={{ fontFamily: "'Ma Shan Zheng', serif", color: isFlipped ? intensifyColor : "rgba(1,1,1,.85)" }}>
                    {x.sceneName || x.choiceText}
                  </div>
                  <div className="text-[10px] mt-1 leading-relaxed"
                    style={{ color: isFlipped ? intensifyColor : "rgba(195,74,40,.7)" }}>
                    → {x.modernTension || x.socialTag}
                  </div>
                </div>
              </div>
            );
          })}
        </ResultSection>

        {/* ── 块2：价值轴对比 ───────────────────────────────────── */}
        <ResultSection index="2" title="价值轴对比">
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
                    <span className="text-[11px] font-semibold text-[rgba(1,1,1,.6)]">{axis.low} ↔ {axis.high}</span>
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
                    style={{ color: diff > 8 ? intensifyColor : diff < -8 ? spineColor : "rgba(1,1,1,.55)" }}>
                    {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : "≈"}
                  </span>
                </div>
                <p className="text-[10px] text-[rgba(1,1,1,.6)] mt-1">{axis.description}</p>
              </div>
            );
          })}
        </ResultSection>

        {/* ── 块3：照见自己（对比洞察 + 点破 + 清爽序号列表，合为一块）── */}
        {(hasEvidence || hasMirror || hasAnchors || isStreaming) && (
          <ResultSection index="3" title="照见自己">
            {/* 对比洞察：两次选择路径的差异 */}
            {hasEvidence ? (
              <div className="text-sm leading-[1.75] text-[rgba(1,1,1,.82)] mb-4">
                {evidence}
              </div>
            ) : isStreaming && !hasMirror && !hasAnchors ? (
              <div className="flex items-center gap-2 text-sm text-[rgba(1,1,1,.45)] italic mb-4">
                <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: intensifyColor }} />
                正在比较两个你……
              </div>
            ) : null}

            {/* 一句点破两次选择的差异 */}
            {hasMirror && (
              <div
                className="text-sm leading-relaxed font-bold px-4 py-3 rounded-sm mb-4"
                style={{
                  background: `linear-gradient(135deg, ${spineColor}12, ${intensifyColor}10)`,
                  borderLeft: `3px solid ${intensifyColor}`,
                  color: "rgba(1,1,1,.88)",
                }}
              >
                {mirror}
              </div>
            )}

            {/* 序号列表 */}
            {hasAnchors && (
              <div className="flex flex-col">
                {anchors.map((a, i) => (
                  <div key={i}
                    className="flex gap-3 py-3"
                    style={{ borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,.1)" }}>
                    <span
                      className="flex items-center justify-center text-[12px] font-black rounded-md flex-shrink-0 mt-0.5"
                      style={{ width: 22, height: 22, background: intensifyColor, color: "#EFE6C9" }}>
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="text-[10px] font-black tracking-[0.15em] uppercase mb-1" style={{ color: `${intensifyColor}cc` }}>
                        {a.type}
                      </div>
                      <p className="text-[15px] font-bold leading-snug mb-1.5"
                        style={{ fontFamily: "'Noto Serif SC', serif", color: "rgba(1,1,1,.86)" }}>
                        {a.image}
                      </p>
                      <p className="text-[12px] leading-relaxed italic" style={{ color: `${intensifyColor}c0` }}>
                        {a.question}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ResultSection>
        )}

        {/* ── 分享 + 操作 ──────────────────────────────────────────── */}
        <div className="relative z-10 px-5 pb-4 pt-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <button onClick={handleShareNormalResult}
              className="btn btn-paper flex-1 flex-col gap-0.5 py-2.5 rounded-xl text-[10px]">
              <span className="font-bold flex items-center gap-1"><Share2 size={12} strokeWidth={2} /> 分享普通结果</span>
              <span className="text-[9px] font-normal opacity-55">别人看普通版轨迹</span>
            </button>
            <button onClick={handleShareIntensifyResult}
              className="btn btn-paper flex-1 flex-col gap-0.5 py-2.5 rounded-xl text-[10px]"
              style={{ borderColor: "rgba(195,74,40,.3)" }}>
              <span className="font-bold flex items-center gap-1" style={{ color: intensifyColor }}><Flame size={12} strokeWidth={2.2} /> 分享极压结果</span>
              <span className="text-[9px] font-normal opacity-55">别人看极压版轨迹</span>
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={onNewBook} className="btn btn-ghost flex-1 rounded-xl py-2.5 text-[12px]">换一本书</button>
            <button onClick={onPlayAgain} className="btn btn-seal flex-1 rounded-xl py-2.5 text-[12px] flex items-center justify-center gap-1.5"><Flame size={14} strokeWidth={2.2} /> 再来极压</button>
          </div>
        </div>
        </div>

        <div ref={bottomRef} className="pb-2" />
      </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 z-[100] pointer-events-none"
          style={{ transform: "translateX(-50%)" }}>
          <div className="px-5 py-3 text-sm font-bold rounded-full"
            style={{ background: "linear-gradient(135deg,#0c5a52,#0d6b57)", color: "#ffffff", boxShadow: "0 6px 24px rgba(12,90,82,.45)" }}>
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

