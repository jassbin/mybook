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
