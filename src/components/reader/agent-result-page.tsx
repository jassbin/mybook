"use client";
// src/components/reader/agent-result-page.tsx
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { BookMeta } from "@/lib/reader/types";
import type { WorldState } from "@/lib/agent/world-state";
import {
  buildAgentResultShareUrl,
  buildAgentStoryShareUrl,
} from "@/lib/reader/share-codec";
import { PageTopbar } from "./page-topbar";
import { Flame, Share2, Drama } from "lucide-react";

interface AgentResultPageProps {
  worldState: WorldState;
  bookMeta: BookMeta | null;
  onRestart: () => void;
  onNewBook: () => void;
  onIntensify?: () => void;
  onBack?: () => void;
}

// 价值锚点 JSON 结构（第四段，数组）
interface ValueAnchor {
  type: string;       // 维度标签
  image: string;      // 画面感陈述（20字内）
  question: string;   // 自省问题（25字内）
}

// 价值轴成因（第三段，数组）
interface AxisReason {
  key: string;
  reason: string;
}

// 把流式全文按 ===SEP=== 分成四段
function parseSections(text: string): {
  evidence: string;
  mirror: string;
  axisReasonsJson: string | null;   // 第三段：价值倾向成因数组
  anchorsJson: string | null;       // 第四段：价值锚点数组
} {
  const parts = text.split("===SEP===");
  const evidence   = (parts[0] ?? "").trim();
  const mirror     = (parts[1] ?? "").trim();
  const reasonRaw  = (parts[2] ?? "").trim();
  const anchorRaw  = (parts[3] ?? "").trim();

  const grabArray = (raw: string): string | null => {
    if (!raw) return null;
    const arrMatch = raw.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      try { JSON.parse(arrMatch[0]); return arrMatch[0]; } catch { /* fall through */ }
    }
    return null;
  };

  const axisReasonsJson = grabArray(reasonRaw);

  // 解析价值锚点数组
  let anchorsJson: string | null = grabArray(anchorRaw);
  // 兼容旧版单对象
  if (!anchorsJson && anchorRaw) {
    const objMatch = anchorRaw.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        const obj = JSON.parse(objMatch[0]);
        anchorsJson = JSON.stringify([obj]);
      } catch { anchorsJson = null; }
    }
  }

  return { evidence, mirror, axisReasonsJson, anchorsJson };
}


export function AgentResultPage({
  worldState, bookMeta, onRestart, onNewBook, onIntensify, onBack,
}: AgentResultPageProps) {
  const [aiText, setAiText] = useState("");
  const [aiDone, setAiDone] = useState(false);
  const [toast, setToast]   = useState<string | null>(null);
  const bottomRef           = useRef<HTMLDivElement>(null);

  // 结果页统一绿色主色（与首页深绿体系一致），不再随书脊色变化
  const spineColor = "#0b6b57";
  const spineText  = "#EFE6C9";

  // 解析各段
  const { evidence, mirror, axisReasonsJson, anchorsJson } = useMemo(
    () => parseSections(aiText),
    [aiText]
  );
  // 价值轴成因映射：轴名 → 「你为何在这」解释
  const axisReasonMap: Record<string, string> = useMemo(() => {
    if (!axisReasonsJson) return {};
    try {
      const parsed = JSON.parse(axisReasonsJson) as AxisReason[];
      const map: Record<string, string> = {};
      if (Array.isArray(parsed)) {
        parsed.forEach(r => { if (r?.key && r?.reason) map[r.key] = r.reason; });
      }
      return map;
    } catch { return {}; }
  }, [axisReasonsJson]);
  const anchors: ValueAnchor[] = useMemo(() => {
    if (!anchorsJson) return [];
    try {
      const parsed = JSON.parse(anchorsJson);
      return Array.isArray(parsed) ? parsed.filter(a => a.type && a.image && a.question) : [];
    } catch { return []; }
  }, [anchorsJson]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  // 流式旁白
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/narrative/ending-narration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({ state: worldState }),
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
          setAiText("故事走完了。每一次选择，都是真实的你。");
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

  const copyUrl = useCallback((url: string, label: string) => {
    navigator.clipboard.writeText(url).then(
      () => showToast(`${label}已复制`),
      () => showToast("复制失败，请手动复制")
    );
  }, [showToast]);

  const handleShareResult = useCallback(() => {
    copyUrl(buildAgentResultShareUrl(worldState), "结果链接");
  }, [worldState, copyUrl]);

  const handleShareStory = useCallback(() => {
    copyUrl(buildAgentStoryShareUrl(worldState.book, worldState.character), "故事链接");
  }, [worldState, copyUrl]);

  const isStreaming = !aiDone;
  const hasEvidence = evidence.length > 0;
  const hasMirror   = mirror.length > 0;
  const hasAnchors  = anchors.length > 0;

  return (
    <div className="fresh-backdrop flex flex-col min-h-screen"
      style={{ paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}>
      {/* 中层：浅绿卡（边框内浅绿，与边框外深绿区分） */}
      <div className="result-mid relative w-full max-w-sm mx-auto flex flex-col anim-up overflow-hidden rounded-2xl"
        style={{
          margin: "8px auto",
          padding: "7px",
          minHeight: "calc(100dvh - var(--safe-top) - var(--safe-bottom) - 16px)",
          boxShadow: "0 0 0 1.5px rgba(0,0,0,.9), 0 24px 70px rgba(2,30,28,.5)",
        }}>
      {/* 内层：白色内容卡 */}
      <div className="relative flex flex-col flex-1 min-h-0 overflow-y-auto rounded-xl"
        style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,.9)" }}>

        {/* 顶栏 */}
        <PageTopbar
          title={`${worldState.character} · 终局`}
          subtitle={`《${worldState.book}》· ${worldState.actNumber - 1}幕走完`}
          onBack={onBack}
          onShare={handleShareStory}
          shareLabel="分享故事"
        />

        {/* 内容区：分层错落入场 */}
        <div className="stagger-in flex flex-col">
        {/* 标题色块 */}
        <div className="relative z-10 px-5 pt-4 pb-4" style={{ background: spineColor }}>
          <div className="text-2xl font-black leading-none"
            style={{ fontFamily: "'Ma Shan Zheng', serif", color: spineText }}>
            {worldState.emotionalTone === "释然" ? "你看见了什么" : "你走到了这里"}
          </div>
          <p className="text-sm mt-1.5" style={{ color: `${spineText}d0` }}>
            {worldState.character}的故事，但照见的是你自己
          </p>
        </div>

        {/* ── 选择轨迹卡片 ─────────────────────────────────────── */}
        <div className="relative z-10 px-4 pt-4 pb-4 border-b border-[rgba(0,0,0,.9)]">
          <p className="text-[11px] font-black tracking-widest mb-3 uppercase px-1" style={{ color: "#0b6b57" }}>选择轨迹</p>
          <div className="flex flex-col gap-2">
            {worldState.choiceHistory.map((record, i) => (
              <div key={i}
                className="flex gap-0 overflow-hidden anim-ink"
                style={{ animationDelay: `${i * 70}ms`, boxShadow: "0 1px 4px rgba(0,0,0,.07)", border: "1px solid rgba(0,0,0,.9)" }}>
                <div
                  className="flex flex-col items-center justify-center px-2.5 py-3 flex-shrink-0"
                  style={{ background: spineColor, minWidth: 40 }}>
                  <span className="text-[9px] font-bold leading-none" style={{ color: `${spineText}99` }}>幕</span>
                  <span className="text-lg font-black leading-none mt-0.5"
                    style={{ fontFamily: "'Ma Shan Zheng', serif", color: spineText }}>{record.act}</span>
                </div>
                <div className="flex-1 bg-[rgba(255,255,255,.55)] px-3 py-2.5 relative">
                  {/* 大字：原著知名桥段名，一眼认出经历了什么 */}
                  <div className="text-base font-black text-[rgba(1,1,1,.9)] leading-snug"
                    style={{ fontFamily: "'Ma Shan Zheng', serif" }}>
                    {record.sceneName || record.choiceText}
                  </div>
                  {/* 我选择了什么 */}
                  <div className="text-[12px] mt-1 leading-snug text-[rgba(1,1,1,.72)]">
                    你选择了：{record.choiceText}
                  </div>
                  {/* 对应今天的困境 */}
                  {(record.modernTension || record.socialTag) && (
                    <div className="text-[11px] mt-1.5 leading-relaxed"
                      style={{ color: "#0b6b57", borderLeft: `2px solid ${spineColor}66`, paddingLeft: 6 }}>
                      {record.modernTension || record.socialTag}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* ── 价值轴 ───────────────────────────────────────────── */}
        <div className="relative z-10 px-5 pt-4 pb-4 border-b border-[rgba(0,0,0,.9)]">
          <p className="text-[11px] font-black tracking-widest mb-3 uppercase" style={{ color: "#0b6b57" }}>价值倾向</p>
          <div className="flex flex-col gap-3">
            {worldState.axes.map(axis => (
              <div key={axis.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold" style={{ color: spineColor }}>{axis.key}</span>
                  <span className="text-[11px] font-semibold text-[rgba(1,1,1,.6)]">{axis.low} ↔ {axis.high}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[rgba(1,1,1,.1)] overflow-hidden mb-1">
                  <div className="h-full rounded-full"
                    style={{ width: `${axis.score}%`, background: spineColor, transition: "width 0.8s cubic-bezier(.2,.8,.2,1)" }} />
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: "rgba(1,1,1,.72)" }}>
                  {axisReasonMap[axis.key] || axis.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── AI 点评：证据链 + 模式一句话，合并成一段 ────────── */}
        <div className="relative z-10 px-5 pt-5 pb-4 border-b border-[rgba(0,0,0,.9)]">
          <p className="text-[11px] font-black tracking-widest mb-3 uppercase" style={{ color: "#0b6b57" }}>由此可见</p>
          {!hasEvidence && isStreaming ? (
            <div className="flex items-center gap-2 text-sm text-[rgba(1,1,1,.6)] italic">
              <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: spineColor }} />
              正在归纳你的选择轨迹……
            </div>
          ) : (
            <>
              <div className="text-sm leading-[1.75] text-[rgba(1,1,1,.9)]">
                {evidence}
                {isStreaming && !hasMirror && (
                  <span className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
                    style={{ background: spineColor }} />
                )}
              </div>
              {hasMirror && (
                <div
                  className="mt-3 text-sm leading-relaxed font-semibold px-4 py-3 rounded-sm"
                  style={{ background: `${spineColor}14`, borderLeft: `3px solid ${spineColor}`, color: "rgba(1,1,1,.88)" }}
                >
                  {mirror}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── 多维价值锚点（照见自己）──────────────────────────── */}
        {(hasAnchors || (isStreaming && hasMirror)) && (
          <div className="relative z-10 px-4 pt-4 pb-4 border-b border-[rgba(0,0,0,.9)]">
            <p className="text-[11px] font-black tracking-widest mb-4 uppercase px-1" style={{ color: "#0b6b57" }}>照见自己</p>
            {hasAnchors ? (
              <div className="flex flex-col gap-3">
                {anchors.map((a, i) => (
                  <AnchorCard key={i} anchor={a} spineColor={spineColor} index={i} />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-[rgba(1,1,1,.35)] italic px-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: spineColor }} />
              </div>
            )}
          </div>
        )}

        {/* ── 极压入口 ─────────────────────────────────────────── */}
        {onIntensify && (
          <div className="relative z-10 px-5 pt-2 pb-2">
            <button onClick={onIntensify}
              className="btn btn-seal w-full py-3.5 rounded-xl font-black tracking-wider text-sm flex items-center justify-center gap-2">
              <Flame size={16} strokeWidth={2.2} /> 极压重测
            </button>
            <p className="text-[10px] text-[rgba(1,1,1,.42)] text-center mt-1.5">
              同一角色，每幕逼到生死绝境——看真正的你
            </p>
          </div>
        )}

        {/* ── 分享 + 操作 ──────────────────────────────────────── */}
        <div className="relative z-10 px-5 pb-4 pt-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <button onClick={handleShareResult} className="btn btn-paper flex-1 flex-col gap-0.5 py-3 rounded-xl text-[11px]">
              <span className="font-bold flex items-center gap-1"><Share2 size={13} strokeWidth={2} /> 分享结果</span>
              <span className="text-[9px] font-normal opacity-60">别人看你的选择轨迹</span>
            </button>
            <button onClick={handleShareStory} className="btn btn-paper flex-1 flex-col gap-0.5 py-3 rounded-xl text-[11px]">
              <span className="font-bold flex items-center gap-1"><Drama size={13} strokeWidth={2} /> 分享故事</span>
              <span className="text-[9px] font-normal opacity-60">别人进来自己玩</span>
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={onNewBook} className="btn btn-ghost flex-1 rounded-xl py-2.5 text-[12px]">换一本书</button>
            <button onClick={onRestart} className="btn btn-primary flex-1 rounded-xl py-2.5 text-[12px]">再来一局</button>
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

// ── 价值锚点卡（多维版，每个维度独立展示）──────────────────────────────────
function AnchorCard({
  anchor, spineColor, index = 0,
}: {
  anchor: ValueAnchor;
  spineColor: string;
  index?: number;
}) {
  // 交替左对齐/居中，增加节奏感
  const isCenter = index % 2 === 0;
  return (
    <div
      className="relative px-3 py-4"
      style={{
        background: index === 0
          ? `${spineColor}08`
          : index === 1
          ? "rgba(1,1,1,.025)"
          : `${spineColor}05`,
        borderLeft: `2px solid ${spineColor}${index === 0 ? "60" : index === 1 ? "30" : "20"}`,
      }}
    >
      {/* 维度标签 */}
      <span
        className="text-[10px] font-black tracking-[0.18em] uppercase block mb-3"
        style={{ color: `${spineColor}${index === 0 ? "cc" : "88"}` }}
      >
        {anchor.type}
      </span>

      {/* 画面陈述 */}
      <p
        className="leading-[1.85] mb-3"
        style={{
          fontFamily: "'Noto Serif SC', serif",
          fontSize: index === 0 ? "16px" : "15px",
          fontWeight: 700,
          color: index === 0 ? "rgba(1,1,1,.86)" : "rgba(1,1,1,.76)",
          letterSpacing: "0.02em",
          textAlign: isCenter ? "left" : "left",
        }}
      >
        {anchor.image}
      </p>

      {/* 自省问题 */}
      <p
        className="leading-[1.75]"
        style={{
          fontSize: "12px",
          fontWeight: 500,
          color: `${spineColor}90`,
          fontStyle: "italic",
          letterSpacing: "0.015em",
        }}
      >
        {anchor.question}
      </p>
    </div>
  );
}
