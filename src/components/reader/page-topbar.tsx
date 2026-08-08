"use client";
// src/components/reader/page-topbar.tsx
// 通用顶栏：左返回、中标题、右分享
import { useCallback, useState } from "react";

interface PageTopbarProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onShare?: () => void;      // 执行分享逻辑（通常是复制链接）
  shareLabel?: string;
  darkMode?: boolean;
}

// 返回图标 — iOS 风格 chevron
function IconBack({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M11 4L6 9l5 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// 分享图标 — 方块+向上箭头（iOS 系统分享图标语义）
function IconShare({ color }: { color: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
      <rect x="3" y="7" width="11" height="8" rx="1.5" stroke={color} strokeWidth="1.5"/>
      <path d="M8.5 1v8M5.5 4l3-3 3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function PageTopbar({
  title, subtitle,
  onBack, onShare, shareLabel = "分享",
  darkMode = false,
}: PageTopbarProps) {
  const [shareFlash, setShareFlash] = useState(false);

  const bg = darkMode ? "rgba(5,4,3,.94)" : "rgba(239,230,201,.97)";
  const textColor = darkMode ? "rgba(239,230,201,.92)" : "rgba(1,1,1,.82)";
  const iconBg = darkMode ? "rgba(255,255,255,.1)" : "rgba(1,1,1,.07)";
  const iconColor = darkMode ? "#EFE6C9" : "#010101";
  const iconBorder = darkMode ? "rgba(255,255,255,.13)" : "rgba(1,1,1,.15)";
  const borderBottom = darkMode ? "rgba(255,255,255,.08)" : "rgba(1,1,1,.1)";

  const handleShare = useCallback(() => {
    if (!onShare) return;
    onShare();
    // 视觉闪烁反馈
    setShareFlash(true);
    setTimeout(() => setShareFlash(false), 600);
  }, [onShare]);

  return (
    <div
      className="relative z-30 flex items-center gap-2 px-3 py-2 border-b sticky top-0"
      style={{ background: bg, backdropFilter: "blur(12px)", borderColor: borderBottom }}
    >
      {/* 左：返回 */}
      {onBack ? (
        <button
          onClick={onBack}
          aria-label="返回"
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{ background: iconBg, border: `1px solid ${iconBorder}` }}
        >
          <IconBack color={iconColor} />
        </button>
      ) : <div className="w-8 flex-shrink-0" />}

      {/* 中：标题 */}
      <div className="flex-1 min-w-0 text-center">
        {title && (
          <div className="text-[13px] font-black leading-tight truncate"
            style={{ color: textColor, fontFamily: "'Ma Shan Zheng', serif" }}>
            {title}
          </div>
        )}
        {subtitle && (
          <div className="text-[10px] leading-tight truncate"
            style={{ color: darkMode ? "rgba(239,230,201,.42)" : "rgba(1,1,1,.36)" }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* 右：分享 */}
      {onShare ? (
        <button
          onClick={handleShare}
          aria-label={shareLabel}
          title={shareLabel}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{
            background: shareFlash ? (darkMode ? "rgba(255,255,255,.2)" : "rgba(1,1,1,.12)") : iconBg,
            border: `1px solid ${shareFlash ? (darkMode ? "rgba(255,255,255,.3)" : "rgba(1,1,1,.25)") : iconBorder}`,
            transition: "background 150ms ease, border-color 150ms ease",
          }}
        >
          <IconShare color={shareFlash ? (darkMode ? "#EFE6C9" : "#010101") : iconColor} />
        </button>
      ) : <div className="w-8 flex-shrink-0" />}
    </div>
  );
}
