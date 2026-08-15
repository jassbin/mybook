"use client";
// src/components/reader/scene-message.tsx
import { useEffect, useState } from "react";
import type { StoryMessage } from "@/lib/reader/types";

interface SceneMessageProps {
  message: StoryMessage;
  onShown?: () => void;
}

export function SceneMessage({ message, onShown }: SceneMessageProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(true);
      onShown?.();
    }, message.delay ?? 0);
    return () => clearTimeout(t);
  }, [message.delay, onShown]);

  if (!visible) return null;

  // 陷阱「重大代价」块：琥珀警示左边条，和普通叙述区分但不打断阅读
  if (message.type === "trapcost") {
    return (
      <div className="anim-ink mb-3 max-w-full">
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

  return (
    <div className={`anim-ink mb-3 ${message.type === "dialog" ? "max-w-[88%]" : "max-w-full"}`}>
      <div className={cls}>{message.text}</div>
    </div>
  );
}
