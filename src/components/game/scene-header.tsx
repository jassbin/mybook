"use client";
// src/components/game/scene-header.tsx

interface SceneHeaderProps {
  scene: string;
  sceneIndex: number;
  totalScenes: number;
}

export function SceneHeader({ scene, sceneIndex, totalScenes }: SceneHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(1,1,1,.15)] bg-[rgba(239,230,201,.9)] backdrop-blur-sm sticky top-0 z-20">
      <div className="flex items-center gap-2">
        <span
          className="text-sm font-black tracking-wider"
          style={{ fontFamily: "'Ma Shan Zheng', serif", color: "#C34A28" }}
        >
          第{["一","二","三","四"][sceneIndex]}幕
        </span>
        <span className="text-sm text-[rgba(1,1,1,.6)] tracking-wide">{scene}</span>
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalScenes }).map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === sceneIndex ? 20 : 8,
              background: i <= sceneIndex ? "#C34A28" : "rgba(1,1,1,.2)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
