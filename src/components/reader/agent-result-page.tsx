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
import { ResultSection } from "./result-section";
import { Flame, Share2, Drama } from "lucide-react";
import { getThrillConfig, buildThrillProfile, pickRating } from "@/lib/agent/thrill";

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
  // 护栏：过滤 prompt 泄漏——若某段混进了格式指令/分隔符/题目字样，视为无效丢弃
  const looksLikePromptLeak = (s: string) =>
    /题目|分隔符|严格按|按照格式|输出格式|输出中|不加任何标题|===SEP===|JSON|数组|字段/.test(s);
  const rawMirror  = (parts[1] ?? "").trim();
  const mirror     = looksLikePromptLeak(rawMirror) ? "" : rawMirror;
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
  const { mirror, axisReasonsJson, anchorsJson } = useMemo(
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

        {/* ── 块1：选择轨迹（大框内轻分隔列表，不再逐条套框）──── */}
        <ResultSection index="1" title="选择轨迹" hint={`${worldState.choiceHistory.length} 幕`} bodyClassName="px-0 py-0">
          <div className="flex flex-col">
            {worldState.choiceHistory.map((record, i) => (
              <div key={i}
                className="flex gap-0 anim-ink"
                style={{
                  animationDelay: `${i * 60}ms`,
                  borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,.12)",
                }}>
                <div
                  className="flex flex-col items-center justify-center px-2.5 py-3 flex-shrink-0"
                  style={{ background: spineColor, minWidth: 40 }}>
                  <span className="text-[9px] font-bold leading-none" style={{ color: `${spineText}99` }}>幕</span>
                  <span className="text-lg font-black leading-none mt-0.5"
                    style={{ fontFamily: "'Ma Shan Zheng', serif", color: spineText }}>{record.act}</span>
                </div>
                <div className="flex-1 px-3.5 py-3">
                  {/* 大字：原著知名桥段名，一眼认出经历了什么 */}
                  <div className="text-base font-black text-[rgba(1,1,1,.9)] leading-snug"
                    style={{ fontFamily: "'Ma Shan Zheng', serif" }}>
                    {record.sceneName || record.choiceText}
                  </div>
                  {/* 我选择了什么 */}
                  <div className="text-[12px] mt-1 leading-snug text-[rgba(1,1,1,.72)]">
                    你选择了：{record.choiceText}
                  </div>
                  {/* 对应今天的困境（精炼） */}
                  {(record.modernTension || record.socialTag) && (
                    <div className="text-[11px] mt-1.5 leading-relaxed font-semibold"
                      style={{ color: "#0b6b57" }}>
                      → {record.modernTension || record.socialTag}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ResultSection>

        {/* ── 爽感结算：评级卡 + 爽点人格画像（先爽后照见）───────── */}
        {(() => {
          const tc = getThrillConfig((worldState.channel ?? undefined) as any);
          const meter = worldState.thrillMeter ?? 20;
          const rating = pickRating(meter, tc.ratingTiers);
          const profile = buildThrillProfile((worldState.thrillHistory ?? []) as any);
          return (
            <ResultSection index="✦" title="本局爽感" hint={`${tc.label} ${meter}/100`}>
              {/* 评级大卡 */}
              <div className="rounded-xl px-4 py-4 mb-3 text-center relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${tc.color}, ${tc.color}cc)` }}>
                <div className="text-[10px] font-black tracking-[.35em] mb-1" style={{ color: "rgba(255,255,255,.85)" }}>{tc.icon} 评级</div>
                <div className="text-[30px] font-black" style={{ fontFamily: "'Ma Shan Zheng', serif", color: "#fff", letterSpacing: "3px" }}>{rating}</div>
                <div className="flex items-center justify-center gap-4 mt-2 text-[11px] font-bold" style={{ color: "rgba(255,255,255,.92)" }}>
                  <span>{tc.label} {meter}</span>
                  <span>·</span>
                  <span>名场面 ×{profile.climaxCount}</span>
                  <span>·</span>
                  <span>{profile.riskAppetite}型</span>
                </div>
              </div>
              {/* 爽点人格画像 = 照见自己（爽感数据反哺） */}
              {profile.dominantPersona && (
                <div className="rounded-lg px-4 py-3" style={{ background: `${spineColor}12`, borderLeft: `3px solid ${spineColor}` }}>
                  <div className="text-[10px] font-black tracking-[.15em] mb-1" style={{ color: `${spineColor}cc` }}>
                    🪞 你追求的爽 · {profile.dominantPersona}
                  </div>
                  <p className="text-[13px] leading-relaxed font-bold" style={{ color: "rgba(1,1,1,.82)" }}>
                    {profile.insight}
                  </p>
                  {typeof profile.peakAct === "number" && profile.peakDelta > 0 && (
                    <p className="text-[11px] leading-relaxed mt-2 italic" style={{ color: `${spineColor}b0` }}>
                      你在第 {profile.peakAct} 幕爽点涨得最猛（+{profile.peakDelta}）——那一刻的情节，正是你最吃的那种刺激。
                    </p>
                  )}
                </div>
              )}
            </ResultSection>
          );
        })()}

        {/* ── 块2：价值倾向 ─────────────────────────────────────── */}
        <ResultSection index="2" title="价值倾向" hint="你为何在这">
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
        </ResultSection>

        {/* ── 块3：照见自己（点破 + 清爽序号自省列表）─────────── */}
        <ResultSection index="3" title="照见自己">
          {/* 开头一句狠话点破你的模式（原「由此可见」精华并入此处） */}
          {hasMirror ? (
            <div
              className="text-sm leading-relaxed font-bold px-4 py-3 rounded-sm mb-4"
              style={{ background: `${spineColor}14`, borderLeft: `3px solid ${spineColor}`, color: "rgba(1,1,1,.9)" }}
            >
              {mirror}
            </div>
          ) : isStreaming ? (
            <div className="flex items-center gap-2 text-sm text-[rgba(1,1,1,.6)] italic mb-4">
              <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: spineColor }} />
              正在看穿你……
            </div>
          ) : null}

          {/* 清爽序号列表：每条一针见血，界限分明 */}
          {hasAnchors ? (
            <div className="flex flex-col">
              {anchors.map((a, i) => (
                <div key={i}
                  className="flex gap-3 py-3"
                  style={{ borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,.1)" }}>
                  <span
                    className="flex items-center justify-center text-[12px] font-black rounded-md flex-shrink-0 mt-0.5"
                    style={{ width: 22, height: 22, background: spineColor, color: spineText }}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="text-[10px] font-black tracking-[0.15em] uppercase mb-1" style={{ color: `${spineColor}cc` }}>
                      {a.type}
                    </div>
                    <p className="text-[15px] font-bold leading-snug mb-1.5"
                      style={{ fontFamily: "'Noto Serif SC', serif", color: "rgba(1,1,1,.86)" }}>
                      {a.image}
                    </p>
                    <p className="text-[12px] leading-relaxed italic" style={{ color: `${spineColor}c0` }}>
                      {a.question}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !hasMirror && (
              <div className="flex items-center gap-2 text-sm text-[rgba(1,1,1,.35)] italic px-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: spineColor }} />
              </div>
            )
          )}
        </ResultSection>

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

