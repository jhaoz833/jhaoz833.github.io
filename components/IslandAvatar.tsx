"use client";

// 可个性化的小岛渲染器：按配置绘制 SVG，悬浮在岛屿个人中心
export type IslandConfig = {
  base: number; // 基底配色 0-3
  plant: number; // 植被 0-2
  building: number; // 建筑 0-2
  ring: number; // 环饰 0-2
  pet: number; // 天空伙伴 0-2
};

const PALETTES = [
  { top1: "#4a5da8", top2: "#2a3560", rock1: "#232a52", rock2: "#0e1228", glow: "#8ea2ff", accent: "#f5d9a0" },
  { top1: "#3b7ec2", top2: "#1f4a78", rock1: "#1c3a5e", rock2: "#0a1626", glow: "#6fd3ff", accent: "#e9ecff" },
  { top1: "#c9a35c", top2: "#8a6a30", rock1: "#5e4a26", rock2: "#241a0c", glow: "#f5d9a0", accent: "#fff3d6" },
  { top1: "#4fae8e", top2: "#2a6a56", rock1: "#23453a", rock2: "#0d1f19", glow: "#7fe0bd", accent: "#f5d9a0" },
];

function Sparkle({ x, y, s, fill, op = 1 }: { x: number; y: number; s: number; fill: string; op?: number }) {
  const d =
    `M${x} ${y - s} C ${x + s * 0.08} ${y - s * 0.25}, ${x + s * 0.25} ${y - s * 0.08}, ${x + s} ${y} ` +
    `C ${x + s * 0.25} ${y + s * 0.08}, ${x + s * 0.08} ${y + s * 0.25}, ${x} ${y + s} ` +
    `C ${x - s * 0.08} ${y + s * 0.25}, ${x - s * 0.25} ${y + s * 0.08}, ${x - s} ${y} ` +
    `C ${x - s * 0.25} ${y - s * 0.08}, ${x - s * 0.08} ${y - s * 0.25}, ${x} ${y - s} Z`;
  return <path d={d} fill={fill} opacity={op} />;
}

export default function IslandAvatar({ config }: { config: IslandConfig }) {
  const p = PALETTES[config.base % PALETTES.length];

  return (
    <svg viewBox="0 0 320 240" className="mx-auto h-auto w-full max-w-sm" role="img" aria-label="我的小岛">
      <defs>
        <linearGradient id="isleTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.top1} />
          <stop offset="1" stopColor={p.top2} />
        </linearGradient>
        <linearGradient id="isleRock" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.rock1} />
          <stop offset="1" stopColor={p.rock2} />
        </linearGradient>
        <radialGradient id="isleHalo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={p.glow} stopOpacity="0.4" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 底部光晕 */}
      <ellipse cx="160" cy="128" rx="132" ry="66" fill="url(#isleHalo)" />

      {/* 环饰 */}
      {config.ring === 1 && (
        <ellipse
          className="isle-orbit"
          cx="160"
          cy="116"
          rx="118"
          ry="34"
          fill="none"
          stroke={p.glow}
          strokeWidth="1.5"
          strokeDasharray="3 10"
          opacity="0.65"
        />
      )}
      {config.ring === 2 && (
        <>
          <g className="isle-cloud" opacity="0.4">
            <ellipse cx="52" cy="66" rx="26" ry="10" fill="#c9d4f5" opacity="0.5" />
            <ellipse cx="72" cy="58" rx="16" ry="8" fill="#c9d4f5" opacity="0.4" />
          </g>
          <g className="isle-cloud" style={{ animationDelay: "2.5s" }} opacity="0.35">
            <ellipse cx="262" cy="158" rx="24" ry="9" fill="#c9d4f5" opacity="0.45" />
            <ellipse cx="246" cy="152" rx="14" ry="7" fill="#c9d4f5" opacity="0.35" />
          </g>
        </>
      )}

      {/* 浮岩与岛顶 */}
      <path d="M74 122 Q160 152 246 122 L160 214 Z" fill="url(#isleRock)" />
      <path d="M68 118 Q160 80 252 118 Q160 148 68 118 Z" fill="url(#isleTop)" />

      {/* 植被 */}
      {config.plant === 1 && (
        <>
          <rect x="117" y="96" width="6" height="18" rx="2" fill={p.rock2} />
          <Sparkle x={120} y={84} s={19} fill={p.accent} />
          <Sparkle x={120} y={84} s={8} fill="#e9ecff" op={0.9} />
        </>
      )}
      {config.plant === 2 && (
        <>
          <rect x="107" y="102" width="5" height="13" rx="2" fill={p.rock2} />
          <Sparkle x={109.5} y={94} s={13} fill={p.accent} />
          <rect x="133" y="106" width="4" height="10" rx="2" fill={p.rock2} />
          <Sparkle x={135} y={99} s={10} fill="#e9ecff" />
        </>
      )}
      {config.plant === 3 && (
        <>
          <Sparkle x={132} y={106} s={7} fill={p.accent} />
          <Sparkle x={146} y={100} s={8} fill="#f5a0c0" />
          <Sparkle x={158} y={107} s={6} fill="#a0d8f5" />
        </>
      )}

      {/* 建筑 */}
      {config.building === 1 && (
        <g>
          <rect x="196" y="92" width="26" height="20" rx="2" fill="#0f1530" stroke="#39406b" />
          <polygon points="193,92 209,79 225,92" fill={p.top1} />
          <rect className="isle-window" x="205" y="98" width="8" height="8" fill={p.accent} />
        </g>
      )}
      {config.building === 2 && (
        <g>
          <polygon points="204,112 218,112 222,78 200,78" fill="#0f1530" stroke="#39406b" />
          <rect x="202" y="100" width="18" height="5" fill={p.accent} opacity="0.7" />
          <circle cx="211" cy="74" r="5" fill={p.accent} />
          <polygon className="isle-beam" points="216,70 268,56 268,90" fill={p.accent} opacity="0.2" />
        </g>
      )}

      {/* 岛上点缀星 */}
      <Sparkle x={82} y={104} s={5} fill="#e9ecff" op={0.8} />
      <Sparkle x={236} y={112} s={4} fill={p.accent} op={0.7} />

      {/* 天空伙伴 */}
      {config.pet === 1 && (
        <g className="isle-pet">
          <Sparkle x={282} y={118} s={9} fill={p.accent} />
          <Sparkle x={276} y={112} s={4} fill="#e9ecff" op={0.8} />
        </g>
      )}
      {config.pet === 2 && (
        <g>
          <path
            d="M246 46 a16 16 0 1 0 13 28 a13 13 0 1 1 -13 -28"
            fill="#f5d9a0"
            opacity="0.95"
          />
          <Sparkle x={236} y={40} s={4} fill="#e9ecff" op={0.8} />
        </g>
      )}
    </svg>
  );
}
