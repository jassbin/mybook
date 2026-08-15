// src/lib/reader/color.ts
/**
 * 把书脊色压成"白底上清晰可读"的深色：
 * 有些书的 book.color 本身很浅（淡粉、灰粉等），放在白卡上会发白发糊。
 * 按感知亮度判断，凡是偏亮/偏灰的都统一压深，保证对比度，去掉"白蒙蒙"。
 */
export function darkenForCard(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex ?? "").trim());
  if (!m) return hex;
  let r = parseInt(m[1].slice(0, 2), 16);
  let g = parseInt(m[1].slice(2, 4), 16);
  let b = parseInt(m[1].slice(4, 6), 16);
  const lum = 0.299 * r + 0.587 * g + 0.714 * b;
  if (lum > 120) {
    const factor = 120 / lum;
    r = Math.round(r * factor);
    g = Math.round(g * factor);
    b = Math.round(b * factor);
  }
  const to2 = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

/** 在给定 hex 上叠一层透明度，返回 rgba 字符串 */
export function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex ?? "").trim());
  if (!m) return hex;
  const r = parseInt(m[1].slice(0, 2), 16);
  const g = parseInt(m[1].slice(2, 4), 16);
  const b = parseInt(m[1].slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
