"use client";
// src/components/reader/book-select.tsx
import { useEffect, useRef, useState, useMemo } from "react";
import { buildPresetBooks, buildPresetBooksByTheme, lookupBook, ALL_BOOKS, THEMES, type ThemeKey, type BookMeta } from "@/lib/reader/types";

interface BookSelectProps {
  onSelect: (bookTitle: string, meta: BookMeta | null, theme?: ThemeKey) => void;
}

/**
 * 把书脊色压成"白底上清晰可读"的深色：
 * 有些书的 book.color 本身很浅（淡粉、灰粉等），放在白卡上会发白发糊。
 * 这里按感知亮度判断，凡是偏亮/偏灰的都统一压深，保证对比度，去掉"白蒙蒙"。
 */
function darkenForCard(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  let r = parseInt(m[1].slice(0, 2), 16);
  let g = parseInt(m[1].slice(2, 4), 16);
  let b = parseInt(m[1].slice(4, 6), 16);
  // 感知亮度 0-255
  const lum = 0.299 * r + 0.587 * g + 0.714 * b;
  // 只要亮度超过安全阈值就整体压深，越亮压得越多
  if (lum > 120) {
    const factor = 120 / lum; // <1
    r = Math.round(r * factor);
    g = Math.round(g * factor);
    b = Math.round(b * factor);
  }
  const to2 = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`;
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
  const [theme, setTheme] = useState<ThemeKey>("any");
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setBooks(buildPresetBooks()); }, []);

  // 切换主题偏好：重建书架（优先推荐命中主题的书与角色）
  const handleThemeChange = (next: ThemeKey) => {
    setTheme(next);
    setBooks(next === "any" ? buildPresetBooks() : buildPresetBooksByTheme(next));
  };

  // 实时模糊候选
  const suggestions = useMemo(() => fuzzySearch(query), [query]);

  const handlePresetClick = (book: BookMeta) => {
    onSelect(book.title, book, theme);
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
    onSelect(book.title, book, theme);
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
    onSelect(t, null, theme);
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
        {/* Header：标题 + 副标题同一行，紧凑 */}
        <header className="relative z-10 flex items-baseline justify-between gap-3 px-5 pt-4 pb-2.5">
          <div
            className="text-[38px] font-black leading-none tracking-tight shrink-0"
            style={{
              fontFamily: "'Ma Shan Zheng', serif",
              color: "#06463c",
              letterSpacing: "-2px",
            }}
          >
            你想成为谁
          </div>
          <div
            className="text-[12px] font-bold leading-snug text-right"
            style={{ fontFamily: "'Noto Serif SC', serif", color: "#0a4a3e" }}
          >
            选一本书，附身角色<br />感受风雪，照见自己
          </div>
        </header>

        {/* 主题偏好：说明 + 芯片同一行，横向滑动，不换行 */}
        <div className="relative z-10 px-4 pt-1 pb-1.5">
          <div
            className="flex items-center gap-2 overflow-x-auto no-scrollbar"
            style={{ scrollbarWidth: "none" }}
          >
            {THEMES.map((tdef) => {
              const active = theme === tdef.key;
              return (
                <button
                  key={tdef.key}
                  onClick={() => handleThemeChange(tdef.key)}
                  className="shrink-0 px-3.5 py-1.5 text-[13px] font-bold rounded-full border-2 transition-all active:scale-95 whitespace-nowrap"
                  style={{
                    background: active ? "linear-gradient(135deg,#0f766e,#0d9488)" : "rgba(255,255,255,.65)",
                    color: active ? "#ffffff" : "#0f5c52",
                    borderColor: active ? "#0f766e" : "rgba(15,118,110,.55)",
                    boxShadow: active ? "0 4px 14px rgba(13,148,136,.35)" : "none",
                    fontFamily: "'Noto Serif SC', serif",
                  }}
                >
                  {tdef.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Book shelf：书少时按内容高度、不强行撑满（避免与搜索区之间出现大片空白）；书多时可滚动 */}
        <div className="relative z-10 flex-none min-h-0 overflow-y-auto grid grid-cols-2 gap-2 px-4 pb-2 content-start" style={{ maxHeight: "calc(100dvh - 320px)" }}>
          {books.map((book, i) => (
            <button
              key={book.key}
              onClick={() => handlePresetClick(book)}
              onMouseEnter={() => setHovered(book.key)}
              onMouseLeave={() => setHovered(null)}
              className="relative overflow-hidden text-left transition-all duration-[220ms] active:scale-[.985] hover:-translate-y-1 anim-spine flex flex-col rounded-2xl"
              style={{
                background: "#ffffff",
                border: "1.5px solid rgba(16,185,129,.4)",
                animationDelay: `${i * 70}ms`,
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
