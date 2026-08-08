"use client";
// src/components/reader/book-select.tsx
import { useEffect, useRef, useState, useMemo } from "react";
import { buildPresetBooks, lookupBook, ALL_BOOKS, type BookMeta } from "@/lib/reader/types";

interface BookSelectProps {
  onSelect: (bookTitle: string, meta: BookMeta | null) => void;
}

/** 模糊搜索：只要输入中有任意字符出现在书名里，就纳入候选，按覆盖率排序 */
function fuzzySearch(query: string, n = 6): BookMeta[] {
  const q = query.replace(/[《》\s]/g, "").toLowerCase();
  if (!q) return [];
  const scored = ALL_BOOKS.map((b) => {
    const title = b.title.toLowerCase();
    let hits = 0;
    for (const ch of q) if (title.includes(ch)) hits++;
    return { book: b, score: hits / Math.max(q.length, title.length) };
  }).filter((x) => x.score > 0);
  return scored.sort((a, b) => b.score - a.score).slice(0, n).map((x) => x.book);
}

export function BookSelect({ onSelect }: BookSelectProps) {
  const [books, setBooks] = useState<BookMeta[]>([]);
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setBooks(buildPresetBooks()); }, []);

  // 实时模糊候选
  const suggestions = useMemo(() => fuzzySearch(query), [query]);

  const handlePresetClick = (book: BookMeta) => {
    onSelect(book.title, book);
  };

  const handleQueryChange = (v: string) => {
    setQuery(v);
    setNotFound(false);
    setShowDropdown(v.trim().length > 0);
  };

  const handleSelect = (book: BookMeta) => {
    setQuery("");
    setShowDropdown(false);
    setNotFound(false);
    onSelect(book.title, book);
  };

  const handleSubmit = () => {
    const t = query.trim();
    if (!t) return;
    // 命中预设书库 → 带 meta（含随机角色）进入
    const exact = lookupBook(t);
    if (exact) { handleSelect(exact); return; }
    // 不在预设书库也没关系，直接把书名交给 AI 处理
    setQuery("");
    setShowDropdown(false);
    setNotFound(false);
    onSelect(t, null);
  };

  // 点击外部关闭下拉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ambient color
  const [hovered, setHovered] = useState<string | null>(null);
  const ambientBook = hovered ? books.find((b) => b.key === hovered) : books[0];
  const ambientColor = ambientBook?.color ?? "#1A3A5C";

  if (books.length === 0) return <div style={{ background: "#050403", minHeight: "100dvh" }} />;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-0"
      style={{ background: "#050403", paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
    >
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 25% 18%, ${ambientColor}2e, transparent 42%), radial-gradient(circle at 80% 82%, ${ambientColor}18, transparent 44%), #050403`,
          transition: "background 0.45s cubic-bezier(.2,.8,.2,1)",
        }}
      />

      {/* Poster card */}
      <div
        className="paper-surface relative w-full max-w-sm flex flex-col overflow-hidden border border-[rgba(239,230,201,.62)]"
        style={{
          boxShadow: "0 0 0 8px #050403, 0 28px 80px rgba(0,0,0,.55)",
          minHeight: "calc(100dvh - var(--safe-top) - var(--safe-bottom) - 18px)",
          margin: "9px auto",
        }}
      >
        {/* Header */}
        <header className="relative z-10 flex items-end justify-between px-5 pt-5 pb-2">
          <div>
            <div
              className="text-[44px] font-black leading-none tracking-tight"
              style={{ fontFamily: "'Ma Shan Zheng', serif", color: "#010101", letterSpacing: "-2px" }}
            >
              你想成为谁
            </div>
            <div
              className="text-base font-semibold leading-snug mt-1.5 text-[rgba(1,1,1,.55)]"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              选一本书，附身其中的角色
            </div>
          </div>
          <div className="text-right text-[11px] leading-relaxed border-l border-[rgba(1,1,1,.24)] pl-3 text-[rgba(1,1,1,.5)] shrink-0 ml-3">
            感受风雪<br />照见自己
          </div>
        </header>

        <div className="relative z-10 mx-5 h-px bg-[rgba(1,1,1,.1)] mt-3 mb-2" />

        {/* Book shelf */}
        <div className="relative z-10 flex-1 grid grid-cols-2 gap-2 px-4 pb-2">
          {books.map((book, i) => (
            <button
              key={book.key}
              onClick={() => handlePresetClick(book)}
              onMouseEnter={() => setHovered(book.key)}
              onMouseLeave={() => setHovered(null)}
              className="relative overflow-hidden text-left border transition-all duration-[220ms] active:scale-[.985] anim-spine flex flex-col"
              style={{
                background: "rgba(239,230,201,.72)",
                borderColor: "rgba(1,1,1,.22)",
                borderRadius: "0px",
                animationDelay: `${i * 70}ms`,
                boxShadow: "0 2px 8px rgba(0,0,0,.06)",
              }}
            >
              <div
                className="relative flex items-center justify-center overflow-hidden shrink-0"
                style={{ background: book.color, minHeight: 56, height: "auto", paddingTop: 8, paddingBottom: 8 }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,.14), transparent 40%, rgba(0,0,0,.18))",
                    mixBlendMode: "soft-light",
                  }}
                />
                <span
                  className="relative z-10 text-center px-2 w-full"
                  style={{
                    fontFamily: "'Ma Shan Zheng', serif",
                    fontSize: book.title.length > 4 ? 15 : 22,
                    lineHeight: 1.25,
                    letterSpacing: book.title.length > 4 ? 2 : 4,
                    color: book.textColor,
                    textShadow: "0 1px 0 rgba(0,0,0,.2)",
                    wordBreak: "break-all",
                    whiteSpace: "normal",
                  }}
                >
                  {book.title}
                </span>
              </div>
              <div
                className="flex flex-col flex-1 gap-1.5 px-3 py-3"
                style={{ background: "linear-gradient(180deg, rgba(255,255,255,.16), rgba(239,230,201,.28))" }}
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black tracking-wide" style={{ color: book.color }}>
                    {book.recommendedChar}
                  </span>
                  <span className="text-[9px] text-[rgba(1,1,1,.35)] border border-[rgba(1,1,1,.18)] px-1 py-0.5 rounded-sm">
                    今日角色
                  </span>
                </div>
                <div className="text-[13px] font-bold leading-snug text-[rgba(1,1,1,.88)]">
                  {book.charHook}
                </div>
                <div className="text-[11px] leading-snug text-[rgba(1,1,1,.5)] mt-auto pt-1">
                  {book.tagline}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* ── 搜索输入区 ── */}
        <div className="relative z-20 px-4 pb-5 pt-3 border-t border-[rgba(1,1,1,.15)]">
          <p className="text-xs text-[rgba(1,1,1,.45)] mb-2 tracking-wide">
            没有喜欢的？搜索书库里的书 ↓
          </p>

          {/* 输入框 + 按钮 */}
          <div className="flex gap-2 items-center relative">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => query.trim() && setShowDropdown(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
                if (e.key === "Escape") setShowDropdown(false);
              }}
              placeholder="输入书名，如「骆驼祥子」「悲惨世界」……"
              className="flex-1 min-w-0 border bg-[rgba(239,230,201,.78)] rounded-full px-4 py-2.5 text-sm font-semibold text-[#010101] focus:outline-none transition-all"
              style={{
                fontFamily: "'Noto Serif SC', serif",
                borderColor: "rgba(1,1,1,.28)",
              }}
              autoComplete="off"
            />
            <button
              onClick={handleSubmit}
              disabled={!query.trim()}
              className="shrink-0 w-10 h-10 flex items-center justify-center font-bold text-[#EFE6C9] rounded-full transition-all active:scale-95 disabled:opacity-40"
              style={{ background: "#010101", fontSize: 20, lineHeight: 1 }}
              aria-label="进入"
            >
              →
            </button>

            {/* ── 下拉候选列表 ── */}
            {showDropdown && suggestions.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute left-0 right-12 bottom-full mb-1.5 border border-[rgba(1,1,1,.18)] overflow-hidden"
                style={{
                  background: "rgba(239,230,201,.98)",
                  boxShadow: "0 -6px 24px rgba(0,0,0,.12)",
                  zIndex: 50,
                }}
              >
                {suggestions.map((b, idx) => (
                  <button
                    key={b.key}
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(b); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[rgba(1,1,1,.05)] active:bg-[rgba(1,1,1,.08)]"
                    style={{ borderTop: idx > 0 ? "1px solid rgba(1,1,1,.08)" : "none" }}
                  >
                    {/* 书脊色条 */}
                    <div className="shrink-0 w-1 self-stretch rounded-[1px]" style={{ background: b.color }} />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span
                        className="text-xs font-black leading-tight"
                        style={{ fontFamily: "'Ma Shan Zheng', serif", color: b.color, letterSpacing: 1 }}
                      >
                        《{b.title}》
                      </span>
                      <span className="text-[10px] text-[rgba(1,1,1,.5)] truncate leading-snug">
                        {b.tagline}
                      </span>
                    </div>
                    <span className="shrink-0 text-[10px] text-[rgba(1,1,1,.28)]">↵</span>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
