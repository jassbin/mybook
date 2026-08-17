import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, Languages, LoaderCircle, RotateCcw, Sparkles, Wind } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { copy, type Book } from "@/lib/i18n";
import type { CharacterBrief, Comparison, Locale, Portrait, StoryAct, StoryChoice, StoryMode, StoryState } from "../../../shared/narrative";
import { bookCatalog } from "../../../shared/books";

type Screen = "shelf" | "loading" | "character" | "story" | "portrait" | "compare";

const channelKeys = ["any", "classic", "women", "world", "modern"] as const;
const clamp = (value: number) => Math.max(0, Math.min(100, value));

function GlassOrb({ className = "" }: { className?: string }) { return <span aria-hidden className={`glass-orb ${className}`} />; }

function Loading({ title, text }: { title: string; text: string }) {
  return <main className="page-shell flex min-h-dvh items-center justify-center px-5"><div className="loading-card glass-card"><div className="ink-ripple"><Wind size={30} /></div><p className="eyebrow">MYBOOK</p><h1>{title}</h1><p>{text}</p><div className="progress-line"><span /></div></div></main>;
}

export default function Home() {
  const [locale, setLocale] = useState<Locale>("zh-CN");
  const [screen, setScreen] = useState<Screen>("shelf");
  const [channel, setChannel] = useState<(typeof channelKeys)[number]>("any");
  const [query, setQuery] = useState("");
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [character, setCharacter] = useState("");
  const [mode, setMode] = useState<StoryMode>("normal");
  const [brief, setBrief] = useState<CharacterBrief | null>(null);
  const [storyState, setStoryState] = useState<StoryState | null>(null);
  const [act, setAct] = useState<StoryAct | null>(null);
  const [chosen, setChosen] = useState<StoryChoice | null>(null);
  const [choiceReady, setChoiceReady] = useState(false);
  const [portrait, setPortrait] = useState<Portrait | null>(null);
  const [normalState, setNormalState] = useState<StoryState | null>(null);
  const [extremeState, setExtremeState] = useState<StoryState | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [error, setError] = useState("");
  const t = copy[locale];
  const catalog = bookCatalog[locale];

  const begin = trpc.narrative.begin.useMutation();
  const choices = trpc.narrative.choices.useMutation();
  const proceed = trpc.narrative.continue.useMutation();
  const portraitMutation = trpc.narrative.portrait.useMutation();
  const comparisonMutation = trpc.narrative.comparison.useMutation();

  const visibleBooks = useMemo(() => {
    const term = query.trim().toLowerCase();
    return catalog.filter(book => (channel === "any" || book.channel === channel) && (!term || `${book.title}${book.character}${book.hook}`.toLowerCase().includes(term)));
  }, [catalog, channel, query]);

  const openBook = async (book: Book, chosenCharacter = book.character, selectedMode: StoryMode = "normal") => {
    setError(""); setActiveBook(book); setCharacter(chosenCharacter); setMode(selectedMode); setScreen("loading");
    try {
      const data = await begin.mutateAsync({ bookTitle: book.title, character: chosenCharacter, locale, mode: selectedMode });
      setBrief(data.character); setStoryState(data.state); setAct(data.act); setChoiceReady(false); setChosen(null); setScreen("character");
    } catch { setError(locale === "zh-CN" ? "故事暂时没有回应，请再试一次。" : "The story is quiet for a moment. Please try again."); setScreen("shelf"); }
  };

  const resolveChoices = (nextState: StoryState, nextAct: StoryAct) => {
    setChoiceReady(false);
    void choices.mutateAsync({ state: nextState, act: nextAct })
      .then(completed => { setAct(completed); setChoiceReady(true); })
      .catch(() => setError(locale === "zh-CN" ? "选项尚未浮现，请稍后重试。" : "The choices have not surfaced yet. Please retry."));
  };

  const enterStory = () => {
    if (!storyState || !act) return;
    setScreen("story");
    resolveChoices(storyState, act);
  };

  const selectChoice = (choice: StoryChoice) => setChosen(choice);

  const continueStory = async () => {
    if (!storyState || !chosen) return;
    try {
      const data = await proceed.mutateAsync({ state: storyState, choice: chosen });
      if (data.complete) {
        const finalState = data.state;
        const image = await portraitMutation.mutateAsync(finalState);
        setPortrait(image);
        if (mode === "normal") setNormalState(finalState); else setExtremeState(finalState);
        if (mode === "extreme" && normalState) {
          const dual = await comparisonMutation.mutateAsync({ normal: normalState, extreme: finalState }); setComparison(dual); setScreen("compare");
        } else setScreen("portrait");
        return;
      }
      setStoryState(data.state); setAct(data.act); setChosen(null); setChoiceReady(false);
      resolveChoices(data.state, data.act);
    } catch { setError(locale === "zh-CN" ? "这条岔路暂时走不通，请重试。" : "This path is blocked for now. Please retry."); }
  };

  const switchLocale = () => setLocale(current => current === "zh-CN" ? "en-US" : "zh-CN");
  const reset = () => { setScreen("shelf"); setActiveBook(null); setBrief(null); setStoryState(null); setAct(null); setPortrait(null); setChosen(null); setError(""); };
  const launchExtreme = () => activeBook && openBook(activeBook, character, "extreme");

  if (screen === "loading") return <Loading title={t.loadingTitle} text={t.loadingText} />;

  if (screen === "shelf") return <main className="page-shell shelf-page"><GlassOrb className="orb-a" /><GlassOrb className="orb-b" /><section className="shelf-card glass-card">
    <header className="shelf-header"><button className="language-button" onClick={switchLocale} aria-label="Change language"><Languages size={16} />{locale === "zh-CN" ? "EN" : "中"}</button><p className="eyebrow">{t.appName}</p><h1>{t.brandTop}</h1><div className="title-line"><span />{t.brandBottom}</div></header>
    <nav className="capsule-row" aria-label="Themes">{channelKeys.map(key => <button key={key} onClick={() => setChannel(key)} className={`capsule ${channel === key ? "active" : ""}`}>{t.channels[key]}</button>)}</nav>
    <section className="book-grid">{visibleBooks.map((book, index) => <button className="book-card" style={{ "--book": book.color, animationDelay: `${index * 55}ms` } as React.CSSProperties} key={book.id} onClick={() => openBook(book)}><div className="book-cover"><span>{book.title}</span><i /></div><div className="book-meta"><div><b>{book.character}</b><em>{book.domain}</em></div><p>{book.hook}</p><small>{book.subtitle}</small></div></button>)}</section>
    <footer className="shelf-footer"><label htmlFor="book-search">{t.searchHint}</label><div className="search-row"><input id="book-search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t.searchPlaceholder} /><button onClick={() => visibleBooks[0] && openBook(visibleBooks[0])} aria-label={t.start}><ArrowRight size={18} /></button></div>{query && !visibleBooks.length ? <p className="search-empty">{t.searchEmpty}</p> : null}<p className="honesty">{t.intro}</p>{error ? <p className="error-copy" role="status" aria-live="polite">{error}</p> : null}</footer>
  </section></main>;

  if (screen === "character" && brief && storyState && activeBook) return <main className="page-shell character-page"><GlassOrb className="orb-a" /><section className="character-card glass-card"><button className="back-button" onClick={reset}><ArrowLeft size={17} /></button><button className="language-button inline" onClick={switchLocale}><Languages size={16} />{locale === "zh-CN" ? "EN" : "中"}</button><header><p className="eyebrow">《{activeBook.title}》 · {t.todayRole}</p><h1>{brief.name}</h1><p className="character-tagline">{brief.tagline}</p><div className="domain-row">{brief.domains.map(domain => <span key={domain}>{domain}</span>)}</div></header><section className="dna-section"><p className="section-label">{t.dna}</p>{brief.dna.map((item, index) => <div className="dna-line" key={item}><b>{t.DNA_LABELS[index]}</b><p>{item}</p></div>)}</section><section className="axes-section"><p className="section-label">{t.axes}</p><div className="axis-grid">{storyState.axes.map(axis => <div className="axis-preview" key={axis.key}><b>{axis.key}</b><span>{axis.low} <i /> {axis.high}</span></div>)}</div></section><p className="character-foot">{t.characterFoot}</p><div className="character-actions"><button className="primary-button" onClick={enterStory}>{t.body.replace("{name}", brief.name)} <ChevronRight size={18} /></button><button className="secondary-button" onClick={() => { const next = activeBook.characters[(activeBook.characters.indexOf(character) + 1) % activeBook.characters.length]; openBook(activeBook, next, mode); }}>{t.chooseCharacter}</button></div></section></main>;

  if (screen === "story" && act && storyState) return <main className="page-shell story-page"><GlassOrb className="orb-b" /><section className="story-card glass-card"><header className="story-head"><button className="back-button" onClick={() => setScreen("character")} aria-label={t.back}><ArrowLeft size={17} /></button><p className="eyebrow">{activeBook?.title} · {mode === "extreme" ? t.modeExtreme : t.modeNormal}</p><h1>{act.title}</h1><span>{act.number} / {storyState.maxActs}</span></header><article className="narrative-flow" aria-live="polite">{act.messages.map((message, index) => <div className="story-paragraph" key={message.id} style={{ animationDelay: `${index * 120}ms` }}><p>{message.text}</p>{message.innerVoice ? <em>“{message.innerVoice}”</em> : null}</div>)}</article>{!choiceReady ? <div className="choice-wait" role="status"><LoaderCircle className="spin" size={18} />{t.choicesLoading}</div> : !chosen ? <section className="choice-section" aria-label={t.choose}><p className="section-label">{t.choose}</p>{act.choices.map(choice => <button key={choice.id} className="choice-card" onClick={() => selectChoice(choice)}><b>{choice.id}</b><span>{choice.text}</span><ChevronRight size={17} /></button>)}</section> : <section className="consequence-section"><p className="section-label">{t.consequence}</p><p>{act.consequences.find(item => item.choiceId === chosen.id)?.text}</p><em>{chosen.revealText}</em>{act.forceContinue ? <p className="force-continue">{act.forceContinue}</p> : null}<button className="primary-button" disabled={proceed.isPending || portraitMutation.isPending} onClick={continueStory}>{proceed.isPending || portraitMutation.isPending ? <><LoaderCircle className="spin" size={17} />{t.nextLoading}</> : <>{t.continue}<ArrowRight size={17} /></>}</button></section>}{error ? <div className="error-copy" role="status" aria-live="polite">{error}<button className="retry-button" onClick={() => resolveChoices(storyState, act)}>{locale === "zh-CN" ? "重试" : "Retry"}</button></div> : null}</section></main>;

  if (screen === "portrait" && portrait && storyState) return <main className="page-shell portrait-page"><GlassOrb className="orb-a" /><section className="portrait-card glass-card"><p className="eyebrow">{t.reflectEyebrow}</p><h1>{portrait.title || t.reflectTitle}</h1><p className="reflection">{portrait.reflection}</p><section className="trait-list">{portrait.traits.map((trait, index) => <div key={trait}><span>0{index + 1}</span>{trait}</div>)}</section><section className="axis-readout"><p className="section-label">{t.axesNow}</p>{storyState.axes.map(axis => <div className="meter" key={axis.key}><div><b>{axis.key}</b><span>{axis.value}</span></div><i><em style={{ width: `${clamp(axis.value)}%` }} /></i><small>{axis.low} — {axis.high}</small></div>)}</section><p className="closing">{portrait.closing}</p><div className="character-actions">{mode === "normal" ? <button className="primary-button" onClick={launchExtreme}><Sparkles size={17} />{t.extremeButton}</button> : null}<button className="secondary-button" onClick={reset}><RotateCcw size={16} />{t.restart}</button></div></section></main>;

  if (screen === "compare" && comparison) return <main className="page-shell compare-page"><GlassOrb className="orb-b" /><section className="compare-card glass-card"><p className="eyebrow">{t.compareEyebrow}</p><h1>{comparison.title || t.compareTitle}</h1><p className="compare-summary">{comparison.summary}</p><div className="comparison-table"><div className="comparison-head"><span>{t.normal}</span><span>{t.extreme}</span></div>{comparison.differences.map(row => <div className="comparison-row" key={row.label}><b>{row.label}</b><p>{row.normal}</p><p>{row.extreme}</p></div>)}</div><button className="primary-button" onClick={reset}><BookOpen size={17} />{t.tryAgain}</button></section></main>;

  return null;
}
