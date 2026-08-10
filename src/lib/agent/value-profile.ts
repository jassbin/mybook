import type { ChoiceRecord } from "./world-state";

/**
 * 三类价值画像 —— 从普通局的选择轨迹里，识别用户「多元的、甚至不易察觉的」价值观。
 *
 * 【主流值】mainstream：高频一致、反复出现的主导价值（你最硬的那个）。
 * 【隐性值】hidden：低频但在关键节点（靠后幕 / 触发陷阱 / 极端选项）刷出，
 *          或与主流方向相反的隐藏价值（你以为不在乎、其实会痛的那个）。
 * 【矛盾/困惑值】conflicted：同一类处境下前后选择方向不一致、反复横跳的摇摆点。
 *
 * 这三类分别喂给极压三幕：第1幕砸主流、第2幕逃隐性、第3幕撞矛盾。
 */

export interface ValueProfile {
  mainstream: { tag: string; count: number; sample?: ChoiceRecord } | null;
  hidden: { tag: string; reason: string; sample?: ChoiceRecord } | null;
  conflicted: { tag: string; forA: ChoiceRecord; forC: ChoiceRecord } | null;
}

const isExtreme = (c: ChoiceRecord) => c.choiceId === "A" || c.choiceId === "C";
// A 与 C 视为方向相反的两极；B 为中间
const dir = (c: ChoiceRecord): "self" | "sacrifice" | "middle" =>
  c.choiceId === "A" ? "self" : c.choiceId === "C" ? "sacrifice" : "middle";

export function buildValueProfile(history: ChoiceRecord[]): ValueProfile {
  if (!history || history.length === 0) {
    return { mainstream: null, hidden: null, conflicted: null };
  }
  const maxAct = Math.max(...history.map(c => c.act));

  // 按 socialTag 归组
  const byTag: Record<string, ChoiceRecord[]> = {};
  for (const c of history) (byTag[c.socialTag] ??= []).push(c);

  // ── 主流值：出现次数最多的 tag（并列时取方向最一致的） ──
  const tagCounts = Object.entries(byTag)
    .map(([tag, recs]) => ({ tag, count: recs.length, recs }))
    .sort((a, b) => b.count - a.count);
  const top = tagCounts[0];
  const mainDir = top ? majorityDir(top.recs) : "middle";
  const mainstream = top
    ? { tag: top.tag, count: top.count, sample: pickRepresentative(top.recs, mainDir) }
    : null;

  // ── 隐性值：给每条选择打「暴露分」，挑出低频但关键 / 与主流相反的那次 ──
  // 关键 = 靠后的幕（越接近结尾越接近真实底色）+ 极端选项 + 方向与主流相反
  const score = (c: ChoiceRecord) => {
    let s = 0;
    s += (c.act / Math.max(maxAct, 1)) * 2;             // 越靠后越暴露
    if (isExtreme(c)) s += 1.5;                          // 极端选项
    if (mainstream && dir(c) !== mainDir && dir(c) !== "middle") s += 2.5; // 与主流相反
    if (mainstream && (byTag[c.socialTag]?.length ?? 0) <= 1) s += 1.5;    // 低频 tag
    return s;
  };
  const hiddenCand = [...history]
    .filter(c => !(mainstream && c.socialTag === mainstream.tag && dir(c) === mainDir))
    .sort((a, b) => score(b) - score(a))[0];
  const hidden = hiddenCand
    ? {
        tag: hiddenCand.socialTag,
        reason:
          mainstream && dir(hiddenCand) !== mainDir && dir(hiddenCand) !== "middle"
            ? "与主流相反的隐藏面"
            : hiddenCand.act >= maxAct
              ? "越到最后越藏不住的真实底色"
              : "低频但关键时刷出的一面",
        sample: hiddenCand,
      }
    : null;

  // ── 矛盾/困惑值：同一 tag 下既有 self 又有 sacrifice（反复横跳的摇摆点） ──
  let conflicted: ValueProfile["conflicted"] = null;
  for (const { tag, recs } of tagCounts) {
    const a = recs.find(r => dir(r) === "self");
    const c = recs.find(r => dir(r) === "sacrifice");
    if (a && c) { conflicted = { tag, forA: a, forC: c }; break; }
  }
  // 若单 tag 内无对撞，退而用全局：最硬的一次 self vs 最舍的一次 sacrifice
  if (!conflicted) {
    const selfs = history.filter(r => dir(r) === "self");
    const sacs = history.filter(r => dir(r) === "sacrifice");
    if (selfs.length && sacs.length) {
      conflicted = {
        tag: "自保 vs 成全",
        forA: selfs.sort((a, b) => b.act - a.act)[0],
        forC: sacs.sort((a, b) => b.act - a.act)[0],
      };
    }
  }

  return { mainstream, hidden, conflicted };
}

function majorityDir(recs: ChoiceRecord[]): "self" | "sacrifice" | "middle" {
  const tally: Record<string, number> = { self: 0, sacrifice: 0, middle: 0 };
  for (const r of recs) tally[dir(r)]++;
  return (Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "middle") as
    "self" | "sacrifice" | "middle";
}

function pickRepresentative(recs: ChoiceRecord[], d: string): ChoiceRecord {
  return recs.filter(r => dir(r) === d).sort((a, b) => b.act - a.act)[0] ?? recs[recs.length - 1];
}

const fmt = (c?: ChoiceRecord) =>
  c ? `第${c.act}幕选「${c.choiceText}」——${c.revealText}${c.consequenceText ? `（后果：${c.consequenceText}）` : ""}` : "";

/**
 * 把三类画像组装成极压三幕的分型施压指令。
 * 第1幕砸主流 → 第2幕逃隐性 → 第3幕撞矛盾。
 */
export function buildIntensifyDirective(p: ValueProfile): string {
  const lines: string[] = [];
  lines.push("【极压·分型施压——多元价值验证 · 必须执行】");
  lines.push("普通局暴露出这个人三层价值，极压三幕要分别把每一层推到极限，逐幕对准，不许泛泛出生死题：");

  if (p.mainstream) {
    lines.push(
      `\n· 第1幕【砸·主流值】他最硬、反复坚持的价值是「${p.mainstream.tag}」（出现${p.mainstream.count}次）。代表选择：${fmt(p.mainstream.sample)}。` +
      `\n  第1幕要用一个不可逆的新情境，让他这份最坚持的价值直接反噬——越坚持，越快失去他最在乎的东西，逼他看清坚持的真实代价。`
    );
  }
  if (p.hidden) {
    lines.push(
      `\n· 第2幕【逃·隐性值】他有一面自己都未必察觉的价值：「${p.hidden.tag}」（${p.hidden.reason}）。露出这一面的时刻：${fmt(p.hidden.sample)}。` +
      `\n  第2幕要专门戳这份「他以为自己不在乎、其实会痛」的隐性价值——制造一个只有触到这根隐线才会痛的处境，让他猝不及防地发现自己原来在乎。`
    );
  }
  if (p.conflicted) {
    lines.push(
      `\n· 第3幕【撞·矛盾值】他在「${p.conflicted.tag}」上反复横跳、自相矛盾：一次是${fmt(p.conflicted.forA)}；另一次却是${fmt(p.conflicted.forC)}。` +
      `\n  第3幕要把这对矛盾直接对撞——设计一个必须二选一、无法再骑墙的终局，逼他亲手裁决"到底哪个才是真正的我"，把困惑逼成答案。`
    );
  }
  lines.push(
    "\n【硬要求】每一幕都要明确"回指"上面对应的那一层，用与他原选择呼应的细节（同类处境、同样被他牺牲/保全的东西），但不得复述原文，一律升级成不可逆版本。三幕合起来，是对他多元价值的一次完整极限验证。"
  );
  return "\n" + lines.join("\n");
}
