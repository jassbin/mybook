"use client";
// src/components/game/chat-message.tsx
import { useEffect, useState } from "react";
import type { StoryMessage } from "@/lib/game/story-data";

interface ChatMessageProps {
  message: StoryMessage;
  onShown?: () => void;
}

export function ChatMessage({ message, onShown }: ChatMessageProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(true);
      onShown?.();
    }, message.delay ?? 0);
    return () => clearTimeout(t);
  }, [message.delay, onShown]);

  if (!visible) return null;

  const bubbleClass = {
    narrator: "chat-bubble narrator",
    dialog: "chat-bubble",
    "inner-voice": "chat-bubble inner-voice",
    system: "chat-bubble narrator text-center text-xs italic",
  }[message.type];

  return (
    <div className={`animate-ink-in mb-3 ${message.type === "dialog" ? "max-w-[88%]" : "max-w-full"}`}>
      <div className={bubbleClass}>{message.text}</div>
    </div>
  );
}
