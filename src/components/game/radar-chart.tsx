"use client";
// src/components/game/radar-chart.tsx

interface RadarChartProps {
  values: {
    authority: number;
    professional: number;
    action: number;
    sincerity: number;
  };
  size?: number;
}

const AXES = [
  { key: "authority", label: "权威服从", angle: -90 },
  { key: "professional", label: "专业信任", angle: 0 },
  { key: "action", label: "行动奋斗", angle: 90 },
  { key: "sincerity", label: "情感坦诚", angle: 180 },
] as const;

function polarToCart(angle: number, r: number, cx: number, cy: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function RadarChart({ values, size = 220 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;

  // Build polygon points
  const points = AXES.map(({ key, angle }) => {
    const r = (values[key] / 100) * maxR;
    return polarToCart(angle, r, cx, cy);
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid rings */}
      {rings.map((r, i) => {
        const rPts = AXES.map(({ angle }) => polarToCart(angle, r * maxR, cx, cy));
        const rPoly = rPts.map((p) => `${p.x},${p.y}`).join(" ");
        return (
          <polygon
            key={i}
            points={rPoly}
            fill="none"
            stroke="rgba(1,1,1,.12)"
            strokeWidth="1"
          />
        );
      })}

      {/* Axis lines */}
      {AXES.map(({ angle }) => {
        const end = polarToCart(angle, maxR, cx, cy);
        return (
          <line
            key={angle}
            x1={cx} y1={cy}
            x2={end.x} y2={end.y}
            stroke="rgba(1,1,1,.15)"
            strokeWidth="1"
          />
        );
      })}

      {/* Filled polygon */}
      <polygon
        points={polyline}
        fill="rgba(195,74,40,.18)"
        stroke="#C34A28"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="#C34A28" />
      ))}

      {/* Labels */}
      {AXES.map(({ key, label, angle }) => {
        const labelR = maxR + 22;
        const lp = polarToCart(angle, labelR, cx, cy);
        const textAnchor =
          Math.abs(angle) === 0 || Math.abs(angle) === 180
            ? angle === 0 ? "start" : "end"
            : "middle";
        return (
          <text
            key={key}
            x={lp.x}
            y={lp.y}
            textAnchor={textAnchor}
            dominantBaseline="middle"
            fontSize="11"
            fill="rgba(1,1,1,.7)"
            fontFamily="'Noto Serif SC', serif"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
