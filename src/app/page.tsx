"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import type { AnalysisResult, BookMeta } from "@/lib/reader/types";
import { getCandidatesForBook } from "@/lib/reader/types";
import { AgentCharacterIntro, type AgentCharInitData } from "@/components/reader/agent-character-intro";
import type { WorldState } from "@/lib/agent/world-state";
import { BookSelect, CharacterIntro, GameEngine, LoadingScreen, ResultPage } from "@/components/reader";
import { AgentGameEngine } from "@/components/reader/agent-game-engine";
import { AgentResultPage } from "@/components/reader/agent-result-page";
import { AgentComparePage } from "@/components/reader/agent-compare-page";
import { CompareResultPage } from "@/components/reader/compare-result-page";
import { decodeShare } from "@/lib/reader/share-codec";

type Phase = "select" | "loading" | "character" | "game" | "result"
           | "agent-loading" | "agent-character" | "agent-game" | "agent-result"
           | "agent-intensify-loading" | "agent-intensify-game" | "agent-compare"
           | "intensify-loading" | "intensify-character" | "intensify-game" | "compare";

export interface RunSnapshot {
  analysis: AnalysisResult;
  scores: Record<string, number>;
  history: string[];
  choiceLabels: string[];
  trapSceneIdxs: number[];
}

// Agent 模式的初始化数据
interface AgentInitData {
  state: WorldState;
  character: string;
  characterTagline: string;
  driveAnalysis: string[];
  act: unknown;
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("select");
  const [bookTitle, setBookTitle] = useState("");
  const [bookMeta, setBookMeta] = useState<BookMeta | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 角色切换：记录已展示过的角色名（避免重复）
  const shownCharactersRef = useRef<string[]>([]);
  // 主题偏好（选书时选定，传给 init 用于加重对应困境场域）
  const themeRef = useRef<import("@/lib/reader/types").ThemeKey>("any");

  // 旧版 run（保留，用于极压对比）
  const [finalScores, setFinalScores] = useState<Record<string, number>>({});
  const [finalHistory, setFinalHistory] = useState<string[]>([]);
  const [finalChoiceLabels, setFinalChoiceLabels] = useState<string[]>([]);
  const [finalTrapScenes, setFinalTrapScenes] = useState<number[]>([]);
  const [gameKey, setGameKey] = useState(0);

  // Agent 模式状态
  const [agentInitData, setAgentInitData] = useState<AgentInitData | null>(null);
  const [agentFinalState, setAgentFinalState] = useState<WorldState | null>(null);
  // Agent 极压
  const [agentNormalState, setAgentNormalState] = useState<WorldState | null>(null);
  const [agentIntensifyInitData, setAgentIntensifyInitData] = useState<AgentInitData | null>(null);
  const [agentIntensifyFinalState, setAgentIntensifyFinalState] = useState<WorldState | null>(null);

  // Intensify
  const [intensifiedAnalysis, setIntensifiedAnalysis] = useState<AnalysisResult | null>(null);
  const [normalSnapshot, setNormalSnapshot] = useState<RunSnapshot | null>(null);
  const [intensifyScores, setIntensifyScores] = useState<Record<string, number>>({});
  const [intensifyHistory, setIntensifyHistory] = useState<string[]>([]);
  const [intensifyChoiceLabels, setIntensifyChoiceLabels] = useState<string[]>([]);
  const [intensifyTrapScenes, setIntensifyTrapScenes] = useState<number[]>([]);
  const [intensifyGameKey, setIntensifyGameKey] = useState(100);

  // ── URL 分享还原 ────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("s");
    if (!encoded) return;
    const payload = decodeShare(encoded);
    if (!payload?.analysis) return;
    const mode = params.get("mode");
    const clean = new URL(window.location.href);
    clean.searchParams.delete("s");
    clean.searchParams.delete("mode");
    window.history.replaceState({}, "", clean.toString());
    setAnalysis(payload.analysis);
    setBookTitle(payload.analysis.bookTitle);
    if (mode === "result" && payload.history && payload.choiceLabels) {
      setFinalHistory(payload.history);
      setFinalChoiceLabels(payload.choiceLabels);
      import("@/lib/reader/types").then(({ applyScores, initScores }) => {
        let sc = initScores(payload.analysis.axes);
        payload.history!.forEach(h => {
          const m = h.match(/^scene(\d+):(.+)$/);
          if (!m) return;
          const scene = payload.analysis.scenes[parseInt(m[1])];
          const choice = scene?.choices.find(c => c.id === m[2]);
          if (choice) sc = applyScores(sc, payload.analysis.axes, choice.scores);
        });
        setFinalScores(sc);
        setFinalTrapScenes([]);
        setPhase("result");
      });
    } else {
      setPhase("character");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 选书：init 后先进角色介绍页 ────────────────────────────────────────
  const handleBookSelect = useCallback(async (title: string, meta: BookMeta | null, theme?: import("@/lib/reader/types").ThemeKey) => {
    setBookTitle(title); setBookMeta(meta); setError(null);
    themeRef.current = theme ?? "any";
    // 重置已展示角色记录
    shownCharactersRef.current = [];
    setPhase("agent-loading");
    try {
      const { getThemeDomains } = await import("@/lib/reader/types");
      const res = await fetch("/api/narrative/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookTitle: title,
          character: meta?.recommendedChar,
          characterDomains: meta?.charDomains ?? [],
          themeDomains: getThemeDomains(themeRef.current),
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "初始化失败");
      const data = await res.json();
      // 诚实回退：AI 不认识这本书/角色 → 友好提示，回选书页
      if (data.error) {
        setError(data.message ?? "我们暂时找不到这本书的可靠原著资料，换一本更知名的经典试试？");
        setPhase("select");
        return;
      }
      setAgentInitData(data);
      // 记录已展示的角色
      shownCharactersRef.current = [data.character];
      setPhase("agent-character"); // ← 先进角色介绍页
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
      setPhase("select");
    }
  }, []);

  // ── 换一个角色：自动选下一个候选，循环不重样 ──────────────────────────
  const handleSwitchCharacter = useCallback(async (pickName?: string, pickDomains?: string[]) => {
    if (!bookTitle) return;
    const title = bookTitle;
    setError(null);
    setPhase("agent-loading");

    let chosenName: string;
    let chosenDomains: string[] | undefined;
    if (pickName) {
      chosenName = pickName;
      chosenDomains = pickDomains;
    } else {
      let candidates = getCandidatesForBook(title, shownCharactersRef.current);
      if (candidates.length === 0) {
        shownCharactersRef.current = agentInitData ? [agentInitData.character] : [];
        candidates = getCandidatesForBook(title, shownCharactersRef.current);
      }
      const next = candidates[0];
      if (!next) { setPhase("agent-character"); return; }
      chosenName = next.name;
      chosenDomains = next.dominantDomains;
    }

    try {
      const { getThemeDomains } = await import("@/lib/reader/types");
      const res = await fetch("/api/narrative/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookTitle: title,
          character: chosenName,
          characterDomains: chosenDomains ?? [],
          themeDomains: getThemeDomains(themeRef.current),
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "初始化失败");
      const data = await res.json();
      if (data.error) {
        setError(data.message ?? "这个角色暂时无法可靠还原，换一个试试？");
        setPhase("agent-character");
        return;
      }
      setAgentInitData(data);
      // 追加已展示角色
      shownCharactersRef.current = [...shownCharactersRef.current, data.character];
      setPhase("agent-character");
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
      setPhase("agent-character");
    }
  }, [bookTitle, bookMeta, agentInitData]);

  // ── Agent 游戏完成 ──────────────────────────────────────────────────────
  const handleAgentComplete = useCallback((state: WorldState) => {
    setAgentFinalState(state);
    setPhase("agent-result");
  }, []);

  // ── Agent 极压：从结果页触发 ─────────────────────────────────────────────
  const handleAgentIntensify = useCallback(async () => {
    if (!agentFinalState) return;
    setAgentNormalState(agentFinalState);
    setError(null);
    setPhase("agent-intensify-loading");
    try {
      const res = await fetch("/api/narrative/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookTitle: agentFinalState.book,
          character: agentFinalState.character,
          intensify: true,
          // 把普通版完整选择历史传给极压 init，用于针对性施压
          normalChoiceHistory: agentFinalState.choiceHistory,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "极压初始化失败");
      const data = await res.json();
      if (data.error) {
        setError(data.message ?? "极压模式初始化失败，请重试。");
        setPhase("agent-result");
        return;
      }
      setAgentIntensifyInitData(data);
      setPhase("agent-intensify-game");
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
      setPhase("agent-result");
    }
  }, [agentFinalState]);

  const handleAgentIntensifyComplete = useCallback((state: WorldState) => {
    setAgentIntensifyFinalState(state);
    setPhase("agent-compare");
  }, []);

  // ── 旧版流程（极压用） ──────────────────────────────────────────────────
  const handleComplete = useCallback(
    (scores: Record<string, number>, history: string[], choiceLabels: string[], trapSceneIdxs: number[]) => {
      setFinalScores(scores); setFinalHistory(history);
      setFinalChoiceLabels(choiceLabels); setFinalTrapScenes(trapSceneIdxs);
      setPhase("result");
    }, []
  );

  const handleIntensify = useCallback(async () => {
    if (!analysis) return;
    setNormalSnapshot({ analysis, scores: finalScores, history: finalHistory, choiceLabels: finalChoiceLabels, trapSceneIdxs: finalTrapScenes });
    setPhase("intensify-loading"); setError(null);
    try {
      const res = await fetch("/api/reader/intensify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "极压版生成失败");
      setIntensifiedAnalysis(await res.json());
      setPhase("intensify-character");
    } catch (e) { setError(e instanceof Error ? e.message : "未知错误"); setPhase("result"); }
  }, [analysis, finalScores, finalHistory, finalChoiceLabels, finalTrapScenes]);

  const handleIntensifyComplete = useCallback(
    (scores: Record<string, number>, history: string[], choiceLabels: string[], trapSceneIdxs: number[]) => {
      setIntensifyScores(scores); setIntensifyHistory(history);
      setIntensifyChoiceLabels(choiceLabels); setIntensifyTrapScenes(trapSceneIdxs);
      setPhase("compare");
    }, []
  );

  // ── 错误页 ──────────────────────────────────────────────────────────────
  if (error) return (
    <div className="fresh-backdrop flex flex-col items-center justify-center min-h-screen gap-4 px-8 text-center">
      <div className="relative z-10 text-2xl font-black" style={{ fontFamily: "'Ma Shan Zheng',serif", color: "#0c5a52" }}>出了点问题</div>
      <p className="relative z-10 text-sm text-[rgba(12,90,82,.65)]">{error}</p>
      <button onClick={() => { setError(null); setPhase("select"); }} className="relative z-10 px-6 py-2.5 text-sm font-bold text-white rounded-full" style={{ background: "linear-gradient(135deg,#14b8a6,#0ea5b7)", boxShadow: "0 4px 16px rgba(20,184,166,.35)" }}>重新选书</button>
    </div>
  );

  // ── 路由 ────────────────────────────────────────────────────────────────
  if (phase === "select") return <BookSelect onSelect={handleBookSelect} />;

  if (phase === "agent-loading") return <LoadingScreen bookTitle={bookTitle} />;

  // ── 角色介绍页（新增）────────────────────────────────────────────────────
  if (phase === "agent-character" && agentInitData) {
    const remaining = getCandidatesForBook(
      agentInitData.state.book,
      shownCharactersRef.current
    );
    // canSwitch: 还有未展示过的候选，或者本书有多个角色（可循环）
    const totalCandidates = bookMeta?.candidates.length ?? 0;
    const canSwitch = totalCandidates > 1;
    return (
      <AgentCharacterIntro
        key={`char-intro-${agentInitData.character}`}
        initData={agentInitData as AgentCharInitData}
        bookMeta={bookMeta}
        canSwitch={canSwitch}
        onEnter={() => setPhase("agent-game")}
        onSwitchCharacter={handleSwitchCharacter}
        onBack={() => { shownCharactersRef.current = []; setAgentInitData(null); setPhase("select"); }}
      />
    );
  }

  if (phase === "agent-game" && agentInitData) return (
    <AgentGameEngine
      key={`agent-${bookTitle}-${agentInitData.character}`}
      bookTitle={agentInitData.state.book}
      character={agentInitData.character}
      characterTagline={agentInitData.characterTagline}
      driveAnalysis={agentInitData.driveAnalysis}
      initialState={agentInitData.state}
      initialAct={agentInitData.act as any}
      bookMeta={bookMeta}
      onComplete={handleAgentComplete}
      onBack={() => { setPhase("agent-character"); }}
    />
  );

  if (phase === "agent-result" && agentFinalState) return (
    <AgentResultPage
      worldState={agentFinalState}
      bookMeta={bookMeta}
      onIntensify={handleAgentIntensify}
      onBack={() => { setAgentInitData(null); setPhase("select"); }}
      onRestart={() => { setAgentInitData(null); setPhase("select"); }}
      onNewBook={() => { setAgentInitData(null); setPhase("select"); }}
    />
  );

  if (phase === "agent-intensify-loading") return <LoadingScreen bookTitle={bookTitle} intensifyMode />;

  if (phase === "agent-intensify-game" && agentIntensifyInitData) return (
    <AgentGameEngine
      key={`agent-intensify-${bookTitle}`}
      bookTitle={agentIntensifyInitData.state.book}
      character={agentIntensifyInitData.character}
      characterTagline={agentIntensifyInitData.characterTagline}
      driveAnalysis={agentIntensifyInitData.driveAnalysis}
      initialState={agentIntensifyInitData.state}
      initialAct={agentIntensifyInitData.act as any}
      bookMeta={bookMeta}
      onComplete={handleAgentIntensifyComplete}
      onBack={() => setPhase("agent-result")}
      intensifyMode
      normalChoiceHistory={agentNormalState?.choiceHistory ?? agentFinalState?.choiceHistory}
    />
  );

  if (phase === "agent-compare" && agentNormalState && agentIntensifyFinalState) return (
    <AgentComparePage
      bookMeta={bookMeta}
      normalState={agentNormalState}
      intensifyState={agentIntensifyFinalState}
      onPlayAgain={() => { setAgentIntensifyInitData(null); setPhase("agent-intensify-loading"); handleAgentIntensify(); }}
      onNewBook={() => { setAgentInitData(null); setPhase("select"); }}
      onBack={() => setPhase("agent-result")}
    />
  );

  // 旧版流程（保留，供极压使用）
  if (phase === "loading") return <LoadingScreen bookTitle={bookTitle} />;
  if (phase === "character" && analysis) return <CharacterIntro analysis={analysis} bookMeta={bookMeta} onEnter={() => setPhase("game")} />;
  if (phase === "game" && analysis) return <GameEngine key={gameKey} analysis={analysis} bookMeta={bookMeta} onComplete={handleComplete} />;
  if (phase === "result" && analysis) return (
    <ResultPage analysis={analysis} bookMeta={bookMeta} scores={finalScores} history={finalHistory}
      choiceLabels={finalChoiceLabels} trapSceneIdxs={finalTrapScenes}
      onRestart={() => { setGameKey(k => k + 1); setPhase("character"); }}
      onNewBook={() => { setAnalysis(null); setPhase("select"); }}
      onIntensify={handleIntensify} />
  );
  if (phase === "intensify-loading") return <LoadingScreen bookTitle={bookTitle} intensifyMode />;
  if (phase === "intensify-character" && intensifiedAnalysis) return (
    <CharacterIntro analysis={intensifiedAnalysis} bookMeta={bookMeta} onEnter={() => setPhase("intensify-game")} intensifyMode />
  );
  if (phase === "intensify-game" && intensifiedAnalysis) return (
    <GameEngine key={intensifyGameKey} analysis={intensifiedAnalysis} bookMeta={bookMeta} onComplete={handleIntensifyComplete} intensifyMode />
  );
  if (phase === "compare" && normalSnapshot && intensifiedAnalysis) return (
    <CompareResultPage bookMeta={bookMeta} normalSnapshot={normalSnapshot}
      intensifyAnalysis={intensifiedAnalysis} intensifyScores={intensifyScores}
      intensifyHistory={intensifyHistory} intensifyChoiceLabels={intensifyChoiceLabels}
      intensifyTrapSceneIdxs={intensifyTrapScenes}
      onPlayAgain={() => { setIntensifyGameKey(k => k + 1); setPhase("intensify-character"); }}
      onNewBook={() => { setAnalysis(null); setPhase("select"); }} />
  );
  return null;
}
