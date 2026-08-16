"use client";
// src/components/reader/book-select.tsx
import { useEffect, useRef, useState, useMemo } from "react";
import { buildBooksByChannel, lookupBook, ALL_BOOKS, CHANNELS, type ChannelKey, type ThemeKey, type BookMeta } from "@/lib/reader/types";
import { darkenForCard } from "@/lib/reader/color";

interface BookSelectProps {
  onSelect: (bookTitle: string, meta: BookMeta | null, theme?: ThemeKey) => void;
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
  // 频道分类（一行芯片）：默认「不限」=全库随机 4 本，无四大名著硬置顶
  const [channel, setChannel] = useState<ChannelKey>("any");
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // 是否已经播过首屏入场动画：切换频道重建书架时不再重播，避免书名"跳一下"
  const didAnimate = useRef(false);

  useEffect(() => { setBooks(buildBooksByChannel("any")); }, []);

  // 首屏书架渲染后，标记入场动画已完成（延迟到动画结束）
  useEffect(() => {
    if (books.length && !didAnimate.current) {
      const t = setTimeout(() => { didAnimate.current = true; }, 900);
      return () => clearTimeout(t);
    }
  }, [books.length]);

  // 切换频道：展示该频道精选 4 本（再次点同一频道=重新随机换一批）
  const handleChannelChange = (next: ChannelKey) => {
    setChannel(next);
    setBooks(buildBooksByChannel(next));
  };

  // 实时模糊候选
  const suggestions = useMemo(() => fuzzySearch(query), [query]);

  const handlePresetClick = (book: BookMeta) => {
    onSelect(book.title, book, "any");
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
    onSelect(book.title, book, "any");
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
    onSelect(t, null, "any");
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

  if (books.length === 0) return <div className="fresh-backdrop" style={{ minHeight: "100dvh" }} />;

  return (
    <div
      className="fresh-backdrop flex flex-col items-center justify-center min-h-screen px-0"
      style={{ paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
    >
      {/* Ambient glow：跟随书脊色，冷调透气 */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 25% 14%, ${ambientColor}33, transparent 44%), radial-gradient(circle at 82% 84%, ${ambientColor}1c, transparent 46%)`,
          transition: "background 0.45s cubic-bezier(.2,.8,.2,1)",
        }}
      />

      {/* Poster card */}
      <div
        className="glass-panel relative w-full max-w-sm flex flex-col overflow-hidden rounded-2xl"
        style={{
          maxHeight: "calc(100dvh - var(--safe-top) - var(--safe-bottom) - 18px)",
          margin: "9px auto",
        }}
      >
        {/* Header：两行错位排布，营造节奏与呼吸 */}
        <header className="relative z-10 flex flex-col gap-1 px-6 pt-6 pb-4">
          <div
            className="font-black leading-none"
            style={{
              fontFamily: "'Ma Shan Zheng', serif",
              color: "#0f5c52",
              fontSize: 38,
              letterSpacing: "3px",
              marginLeft: 2,
            }}
          >
            附身角色
          </div>
          <div
            className="flex items-center gap-2"
            style={{ marginLeft: 84, marginTop: 2 }}
          >
            <span
              style={{
                display: "inline-block",
                width: 26,
                height: 2,
                borderRadius: 2,
                background: "linear-gradient(90deg, transparent, #2e8577)",
              }}
            />
            <span
              className="font-black leading-none"
              style={{
                fontFamily: "'Ma Shan Zheng', serif",
                color: "#2e8577",
                fontSize: 24,
                letterSpacing: "4px",
              }}
            >
              照亮你的价值观
            </span>
          </div>
        </header>

        {/* 频道分类（唯一一行芯片）：不限=全库随机；点频道→该频道精选 4 本，横向滑动 */}
        <div className="relative z-10 px-4 pt-2 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar" style={{ scrollbarWidth: "none" }}>
            {CHANNELS.map((cdef) => {
              const active = channel === cdef.key;
              return (
                <button
                  key={cdef.key}
                  onClick={() => handleChannelChange(cdef.key)}
                  className="shrink-0 px-3.5 py-1.5 text-[13px] font-bold rounded-full border-2 transition-all active:scale-95 whitespace-nowrap"
                  style={{
                    background: active ? "linear-gradient(135deg,#0f766e,#0d9488)" : "rgba(255,255,255,.65)",
                    color: active ? "#ffffff" : "#0f5c52",
                    borderColor: active ? "#0f766e" : "rgba(15,118,110,.55)",
                    boxShadow: active ? "0 4px 14px rgba(13,148,136,.35)" : "none",
                    fontFamily: "'Noto Serif SC', serif",
                  }}
                >
                  {cdef.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Book shelf：书少时按内容高度、不强行撑满（避免与搜索区之间出现大片空白）；书多时可滚动 */}
        <div className="relative z-10 flex-none min-h-0 overflow-y-auto grid grid-cols-2 gap-2 px-4 pt-3 pb-2 content-start" style={{ maxHeight: "calc(100dvh - 320px)" }}>
          {books.map((book, i) => (
            <button
              key={book.key}
              onClick={() => handlePresetClick(book)}
              onMouseEnter={() => setHovered(book.key)}
              onMouseLeave={() => setHovered(null)}
              className={`relative overflow-hidden text-left transition-all duration-[220ms] active:scale-[.985] hover:-translate-y-1 flex flex-col rounded-2xl${didAnimate.current ? "" : " anim-spine"}`}
              style={{
                background: "#ffffff",
                border: "1.5px solid rgba(16,185,129,.4)",
                animationDelay: didAnimate.current ? undefined : `${i * 70}ms`,
                boxShadow: hovered === book.key
                  ? "0 12px 28px rgba(16,185,129,.28), 0 0 0 1px rgba(16,185,129,.5)"
                  : "0 4px 16px rgba(6,60,50,.1)",
              }}
            >
              {/* 书名区：清爽实色浅绿底 + 书脊色大字书名（无厚重描边，颜色鲜明） */}
              <div
                className="relative flex items-center justify-center shrink-0 px-3"
                style={{ minHeight: 60, paddingTop: 10, paddingBottom: 10, background: "#d7f5ec", borderBottom: "1px solid rgba(16,185,129,.3)" }}
              >
                <span
                  className="relative z-10 text-center w-full"
                  style={{
                    fontFamily: "'Ma Shan Zheng', serif",
                    fontSize: book.title.length > 4 ? 17 : 24,
                    lineHeight: 1.2,
                    letterSpacing: book.title.length > 4 ? 2 : 4,
                    wordBreak: "break-all",
                    whiteSpace: "normal",
                    color: darkenForCard(book.color),
                  }}
                >
                  {book.title}
                </span>
              </div>
              <div
                className="flex flex-col flex-1 gap-1.5 px-4 pt-3 pb-4"
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className="text-xs font-black tracking-wide"
                    style={{ color: darkenForCard(book.color) }}
                  >
                    {book.recommendedChar}
                  </span>
                  {book.charDomains?.[0] && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white"
                      style={{ background: "linear-gradient(135deg,#10b981,#2dd4bf)" }}
                    >
                      {book.charDomains[0]}
                    </span>
                  )}
                </div>
                <div className="text-[13px] font-bold leading-snug text-[#0a3a30]">
                  {book.charHook}
                </div>
                <div className="text-[11px] leading-snug text-[rgba(10,58,48,.7)] pt-1">
                  {book.tagline}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* ── 搜索输入区 ── */}
        <div className="relative z-20 shrink-0 px-4 pb-5 pt-3 border-t border-[rgba(56,189,168,.2)]">
          <p className="text-xs text-[rgba(12,60,58,.5)] mb-2 tracking-wide">
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
              className="flex-1 min-w-0 border-2 bg-[rgba(255,255,255,.6)] rounded-full px-4 py-2.5 text-sm font-semibold text-[#0c3c3a] placeholder:text-[rgba(12,60,58,.4)] focus:outline-none focus:border-[#0f766e] transition-all"
              style={{
                fontFamily: "'Noto Serif SC', serif",
                borderColor: "rgba(15,118,110,.6)",
              }}
              autoComplete="off"
            />
            <button
              onClick={handleSubmit}
              disabled={!query.trim()}
              className="shrink-0 w-10 h-10 flex items-center justify-center font-bold text-white rounded-full transition-all active:scale-95 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#14b8a6,#0ea5b7)", boxShadow: "0 4px 14px rgba(20,184,166,.4)", fontSize: 20, lineHeight: 1 }}
              aria-label="进入"
            >
              →
            </button>

            {/* ── 下拉候选列表 ── */}
            {showDropdown && suggestions.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute left-0 right-12 bottom-full mb-1.5 border border-[rgba(56,189,168,.25)] overflow-hidden rounded-xl"
                style={{
                  background: "rgba(255,255,255,.92)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 -6px 24px rgba(30,90,90,.14)",
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
                    <div className="shrink-0 w-1 self-stretch rounded-[1px]" style={{ background: darkenForCard(b.color) }} />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span
                        className="text-xs font-black leading-tight"
                        style={{ fontFamily: "'Ma Shan Zheng', serif", color: darkenForCard(b.color), letterSpacing: 1 }}
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

          {/* 诚实身份声明：主动划定边界，避免被误解为「还原原著」 */}
          <p className="text-[10px] leading-snug text-center text-[rgba(12,60,58,.42)] mt-3 px-1">
            这是一次「假如你是TA」的代入演绎：情节锚点忠于原著，
            但抉择与内心由你和角色共同长出——它不复述原著，也不替代阅读，
            反而可能让你想真正翻开这本书。
            <br />
            <span className="opacity-80">本作品仅依据原著小说，可能与你熟悉的影视 / 游戏版本不同。</span>
          </p>

        </div>
      </div>
    </div>
  );
}
