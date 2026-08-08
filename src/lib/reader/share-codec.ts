// src/lib/reader/share-codec.ts
// Encode/decode AnalysisResult + user history into a URL-safe string.
// Uses base64url encoding (no external deps) — URL length ~2-4KB for a full game script.

import type { AnalysisResult } from "./types";

export interface SharePayload {
  /** The full AI-generated game script */
  analysis: AnalysisResult;
  /** Optional: replay the sharer's exact path (for "share result") */
  history?: string[];
  /** Optional: human-readable labels for result replay */
  choiceLabels?: string[];
}

/** Encode a SharePayload into a URL-safe base64 string */
export function encodeShare(payload: SharePayload): string {
  const json = JSON.stringify(payload);
  // TextEncoder → Uint8Array → binary string → base64url
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Decode a URL-safe base64 string back into a SharePayload, or null on error */
export function decodeShare(encoded: string): SharePayload | null {
  try {
    // Restore standard base64
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as SharePayload;
  } catch {
    return null;
  }
}

/** Build a shareable URL for a story (others play the same script) */
export function buildStoryShareUrl(analysis: AnalysisResult): string {
  const encoded = encodeShare({ analysis });
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("s", encoded);
  return url.toString();
}

/** Build a shareable URL that also carries the sharer's result */
export function buildResultShareUrl(
  analysis: AnalysisResult,
  history: string[],
  choiceLabels: string[]
): string {
  const encoded = encodeShare({ analysis, history, choiceLabels });
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("s", encoded);
  url.searchParams.set("mode", "result");
  return url.toString();
}

// ── Agent 版分享 ─────────────────────────────────────────────────────────
// WorldState 体积小（~2KB），可以直接塞进 URL 参数

/** 把 WorldState 编码为 URL-safe base64 */
export function encodeAgentState(state: object): string {
  const json = JSON.stringify(state);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** 解码 AgentState，失败返回 null */
export function decodeAgentState<T>(encoded: string): T | null {
  try {
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch { return null; }
}

/** 分享结果 URL（带 WorldState，别人打开看结果页） */
export function buildAgentResultShareUrl(state: object): string {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("ag", encodeAgentState(state));
  url.searchParams.set("mode", "agent-result");
  return url.toString();
}

/** 分享故事 URL（只带 book+character，别人打开从头玩同角色） */
export function buildAgentStoryShareUrl(book: string, character: string): string {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("ag-book", encodeURIComponent(book));
  url.searchParams.set("ag-char", encodeURIComponent(character));
  url.searchParams.set("mode", "agent-story");
  return url.toString();
}
