"use client";
// src/components/reader/result-section.tsx
// 结果页/对比页统一分区卡：实心深绿标题条（白字）+ 序号 + 圆角黑框卡片。
// 用清晰的「块」边界划分内容，块与块之间用外间距分开。
import type { ReactNode } from "react";

interface ResultSectionProps {
  /** 序号，如 "1" / "2" / "3"；留空则不显示 */
  index?: string;
  /** 分区标题 */
  title: string;
  /** 标题条右侧的补充说明（可选，小字） */
  hint?: string;
  /** 标题条底色，默认深绿；极压页可传红色系 */
  accent?: string;
  /** 标题条文字色，默认米白 */
  accentText?: string;
  /** 卡片正文 */
  children: ReactNode;
  /** 正文内边距，默认 px-4 py-4 */
  bodyClassName?: string;
}

export function ResultSection({
  index,
  title,
  hint,
  accent = "#0b6b57",
  accentText = "#EFE6C9",
  children,
  bodyClassName = "px-4 py-4",
}: ResultSectionProps) {
  return (
    <section
      className="relative z-10 mx-4 my-3 rounded-xl overflow-hidden"
      style={{ border: "1.5px solid rgba(0,0,0,.9)", background: "#ffffff" }}
    >
      {/* 深绿标题条 */}
      <div
        className="flex items-center gap-2.5 px-3.5 py-2.5"
        style={{ background: accent }}
      >
        {index && (
          <span
            className="flex items-center justify-center text-[13px] font-black rounded-md flex-shrink-0"
            style={{
              width: 24,
              height: 24,
              background: "rgba(0,0,0,.9)",
              color: accentText,
              fontFamily: "'Ma Shan Zheng', serif",
            }}
          >
            {index}
          </span>
        )}
        <span
          className="text-[15px] font-black tracking-wide"
          style={{ color: accentText }}
        >
          {title}
        </span>
        {hint && (
          <span
            className="ml-auto text-[10px] font-semibold"
            style={{ color: `${accentText}b0` }}
          >
            {hint}
          </span>
        )}
      </div>
      {/* 卡片正文 */}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
