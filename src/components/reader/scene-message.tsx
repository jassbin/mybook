"use client";
// src/components/reader/scene-message.tsx
import { useEffect } from "react";
import type { StoryMessage } from "@/lib/reader/types";

interface SceneMessageProps {
  message: StoryMessage;
  onShown?: () => void;
}

export function SceneMessage({ message, onShown }: SceneMessageProps) {
  // 一口气展示：不再逐条延迟、不再淡入闪烁，挂载即显示
  useEffect(() => {
    onShown?.();
  }, [onShown]);

  // 陷阱「重大代价」块：琥珀警示左边条，和普通叙述区分但不打断阅读
  if ((message.type as string) === "trapcost") {
    return (
      <div className="mb-3 max-w-full">
        <div
          className="text-sm leading-relaxed pl-3 py-2 pr-3 rounded-r-md"
          style={{
            borderLeft: "4px solid #b45309",
            background: "rgba(180,83,9,.08)",
            color: "rgba(60,30,4,.9)",
            fontWeight: 600,
          }}
        >
          {message.text}
        </div>
      </div>
    );
  }

  const cls = {
    narrator: "bubble bubble-narrator",
    dialog:   "bubble",
    inner:    "bubble bubble-inner",
    system:   "bubble bubble-narrator text-center text-xs italic",
  }[message.type];

  // 叙述文字占满整行（除非换段落），不再限宽留白
  return (
    <div className="mb-3 max-w-full">
      <div className={cls}>{message.text}</div>
    </div>
  );
}
