"use client";
// src/components/reader/radar-chart.tsx
interface RadarChartProps {
  axes: Array<{ key: string; low: string; high: string }>;
  scores: Record<string, number>;
  color?: string;
  size?: number;
}

function polar(angleDeg: number, r: number, cx: number, cy: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function RadarChart({ axes, scores, color = "#1A3A5C", size = 200 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36;
  const n = axes.length;
  const step = 360 / n;

  const dataPoints = axes.map((a, i) => {
    const r = ((scores[a.key] ?? 50) / 100) * maxR;
    return polar(i * step, r, cx, cy);
  });

  const gridPoints = (fraction: number) =>
    axes.map((_, i) => polar(i * step, fraction * maxR, cx, cy));

  const toPolyline = (pts: { x: number; y: number }[]) =>
    pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} overflow="visible">
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((f, i) => (
        <polygon
          key={i}
          points={toPolyline(gridPoints(f))}
          fill="none"
          stroke="rgba(1,1,1,.1)"
          strokeWidth="1"
        />
      ))}
      {/* Axis lines */}
      {axes.map((_, i) => {
        const end = polar(i * step, maxR, cx, cy);
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={end.x} y2={end.y}
            stroke="rgba(1,1,1,.12)"
            strokeWidth="1"
          />
        );
      })}
      {/* Data polygon */}
      <polygon
        points={toPolyline(dataPoints)}
        fill={`${color}22`}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        className="radar-draw"
      />
      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={color} />
      ))}
      {/* Labels */}
      {axes.map((a, i) => {
        const labelR = maxR + 22;
        const lp = polar(i * step, labelR, cx, cy);
        const angle = i * step;
        const anchor = angle === 0 || angle === 180 ? "middle"
          : angle < 180 ? "start" : "end";
        return (
          <text
            key={a.key}
            x={lp.x}
            y={lp.y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize="11"
            fill="rgba(1,1,1,.65)"
            fontFamily="'Noto Serif SC', serif"
          >
            {a.key}
          </text>
        );
      })}
    </svg>
  );
}
