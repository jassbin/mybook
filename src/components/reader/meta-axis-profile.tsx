"use client";
// src/components/reader/meta-axis-profile.tsx
// 元价值底色：把每局都在算、却从未展示的 6 维元价值轴画出来。
// 数据来自 mapToMetaAxes(worldState.axes)，后端零新增。
import { useMemo } from "react";
import type { WorldState } from "@/lib/agent/world-state";
import { META_AXES, mapToMetaAxes } from "@/lib/agent/world-state";

// 给每条元轴补一对「低端 ↔ 高端」短词（world-state 里只有 description，没有两端标签）
const AXIS_POLES: Record<string, { low: string; high: string }> = {
  rule_vs_self:   { low: "信自己", high: "守规则" },
  self_vs_others: { low: "先自保", high: "为他人" },
  connection:     { low: "独立", high: "依恋" },
  risk_tolerance: { low: "保守", high: "冒险" },
  identity_anchor:{ low: "看内心", high: "看评价" },
  truth_vs_peace: { low: "求平静", high: "要真实" },
};

interface Props {
  worldState: WorldState;
  accent?: string;
}

export function MetaAxisProfile({ worldState, accent = "#0c5a52" }: Props) {
  const scores = useMemo(() => mapToMetaAxes(worldState.axes), [worldState.axes]);

  // 找出偏离中性(50)最远的一条，作为「一句话底色」
  const dominant = useMemo(() => {
    let best = META_AXES[0], bestDev = -1;
    for (const m of META_AXES) {
      const dev = Math.abs((scores[m.id] ?? 50) - 50);
      if (dev > bestDev) { bestDev = dev; best = m; }
    }
    const s = scores[best.id] ?? 50;
    const pole = AXIS_POLES[best.id];
    if (bestDev < 8 || !pole) return `你的价值底色很均衡，没有一端被推到极端。`;
    const side = s > 50 ? pole.high : pole.low;
    return `跨越这一局，你的价值底色最偏向「${side}」——${best.description}。`;
  }, [scores]);

  return (
    <div className="relative z-10 px-5 pt-4 pb-4 border-b border-[rgba(1,1,1,.12)]">
      <p className="text-[11px] font-bold tracking-widest text-[rgba(1,1,1,.4)] mb-1 uppercase">
        你的价值底色
      </p>
      <p className="text-[11px] text-[rgba(1,1,1,.5)] mb-3 leading-relaxed">
        这是把你这一局的选择，投射到 6 条跨角色通用维度上的画像——不同角色玩下来，可以放在一起比较。
      </p>

      <div className="flex flex-col gap-2.5">
        {META_AXES.map((m, i) => {
          const s = scores[m.id] ?? 50;
          const pole = AXIS_POLES[m.id] ?? { low: "低", high: "高" };
          const dev = s - 50;                 // -50 ~ +50
          const half = Math.abs(dev);         // 0 ~ 50
          const toHigh = dev >= 0;
          return (
            <div key={m.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[rgba(1,1,1,.5)] w-14 text-left">{pole.low}</span>
                <span className="text-[11px] font-bold" style={{ color: accent }}>{m.label}</span>
                <span className="text-[10px] text-[rgba(1,1,1,.5)] w-14 text-right">{pole.high}</span>
              </div>
              {/* 双向条：中点为 50，向偏离方向伸展 */}
              <div className="relative h-2 rounded-full bg-[rgba(1,1,1,.08)] overflow-hidden">
                {/* 中线 */}
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[rgba(1,1,1,.18)]" />
                <div
                  className="absolute top-0 bottom-0 rounded-full"
                  style={{
                    left: toHigh ? "50%" : `${50 - half}%`,
                    width: `${half}%`,
                    background: `linear-gradient(90deg, ${accent}cc, ${accent})`,
                    transition: `width .8s cubic-bezier(.2,.8,.2,1) ${i * 60}ms, left .8s cubic-bezier(.2,.8,.2,1) ${i * 60}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[12px] mt-3 leading-relaxed" style={{ color: accent }}>
        {dominant}
      </p>
    </div>
  );
}
