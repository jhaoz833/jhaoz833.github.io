"use client";

// 可个性化的小岛渲染器：按配置绘制 SVG。
// 岛灵会看向指针、眨眼，表情随心情变化；天色/季节/月相与在线旅人让岛有呼吸。
import { useEffect, useId, useRef, useState } from "react";
import type { IslandConfig, IslandMood } from "@/lib/island-store";
import {
  getIslandPhase,
  getIslandSeason,
  getMoonPhase,
  mixHex,
  type IslandPhase,
  type IslandSeason,
} from "@/lib/island-atmosphere";

const PALETTES = [
  { top1: "#4a5da8", top2: "#2a3560", rock1: "#232a52", rock2: "#0e1228", glow: "#8ea2ff", accent: "#f5d9a0" },
  { top1: "#3b7ec2", top2: "#1f4a78", rock1: "#1c3a5e", rock2: "#0a1626", glow: "#6fd3ff", accent: "#e9ecff" },
  { top1: "#c9a35c", top2: "#8a6a30", rock1: "#5e4a26", rock2: "#241a0c", glow: "#f5d9a0", accent: "#fff3d6" },
  { top1: "#4fae8e", top2: "#2a6a56", rock1: "#23453a", rock2: "#0d1f19", glow: "#7fe0bd", accent: "#f5d9a0" },
];

type Atmosphere = { phase: IslandPhase; season: IslandSeason; moon: number };

const WEATHER: Record<IslandSeason, Array<{ x: number; y: number; delay: number; dur: number }>> = {
  winter: [
    { x: 38, y: 54, delay: 0, dur: 11 },
    { x: 92, y: 32, delay: 2.2, dur: 13 },
    { x: 148, y: 48, delay: 4.5, dur: 10 },
    { x: 206, y: 30, delay: 1.2, dur: 12.5 },
    { x: 268, y: 62, delay: 3.4, dur: 9.5 },
    { x: 300, y: 40, delay: 5.2, dur: 14 },
  ],
  spring: [
    { x: 46, y: 44, delay: 0.4, dur: 12 },
    { x: 106, y: 64, delay: 2.8, dur: 10.5 },
    { x: 164, y: 36, delay: 1.4, dur: 13.5 },
    { x: 224, y: 58, delay: 4.2, dur: 11 },
    { x: 286, y: 34, delay: 0.8, dur: 14.5 },
  ],
  summer: [
    { x: 54, y: 72, delay: 0, dur: 6 },
    { x: 118, y: 52, delay: 1.6, dur: 7.5 },
    { x: 196, y: 70, delay: 0.7, dur: 6.8 },
    { x: 264, y: 48, delay: 2.4, dur: 8 },
  ],
  autumn: [
    { x: 42, y: 60, delay: 0.6, dur: 12.5 },
    { x: 98, y: 40, delay: 3.1, dur: 11 },
    { x: 156, y: 66, delay: 1.2, dur: 14 },
    { x: 218, y: 38, delay: 4.8, dur: 10.5 },
    { x: 282, y: 58, delay: 2.2, dur: 13 },
  ],
};

function Sparkle({ x, y, s, fill, op = 1 }: { x: number; y: number; s: number; fill: string; op?: number }) {
  const d =
    `M${x} ${y - s} C ${x + s * 0.08} ${y - s * 0.25}, ${x + s * 0.25} ${y - s * 0.08}, ${x + s} ${y} ` +
    `C ${x + s * 0.25} ${y + s * 0.08}, ${x + s * 0.08} ${y + s * 0.25}, ${x} ${y + s} ` +
    `C ${x - s * 0.08} ${y + s * 0.25}, ${x - s * 0.25} ${y + s * 0.08}, ${x - s} ${y} ` +
    `C ${x - s * 0.25} ${y - s * 0.08}, ${x - s * 0.08} ${y - s * 0.25}, ${x} ${y - s} Z`;
  return <path d={d} fill={fill} opacity={op} />;
}

function assignRef(ref: React.Ref<SVGSVGElement> | undefined, el: SVGSVGElement | null) {
  if (typeof ref === "function") ref(el);
  else if (ref) (ref as { current: SVGSVGElement | null }).current = el;
}

export default function IslandAvatar({
  config,
  mood = "happy",
  trackPointer = false,
  visitors = 0,
  likes = 0,
  comments = 0,
  streak = 0,
  wishes = 0,
  rare = false,
  svgRef,
}: {
  config: IslandConfig;
  mood?: IslandMood;
  trackPointer?: boolean;
  visitors?: number;
  likes?: number;
  comments?: number;
  streak?: number;
  wishes?: number;
  rare?: boolean;
  svgRef?: React.Ref<SVGSVGElement>;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const localRef = useRef<SVGSVGElement | null>(null);
  const [atmo, setAtmo] = useState<Atmosphere | null>(null);

  useEffect(() => {
    const update = () =>
      setAtmo({
        phase: getIslandPhase(),
        season: getIslandSeason(),
        moon: getMoonPhase(),
      });
    update();
    const timer = window.setInterval(update, 60_000);
    const onVisible = () => {
      if (!document.hidden) update();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    const el = localRef.current;
    if (!el) return;
    if (!trackPointer) {
      el.style.setProperty("--gaze-x", "0");
      el.style.setProperty("--gaze-y", "0");
      return;
    }
    let raf = 0;
    let last = 0;
    const reset = () => {
      el.style.setProperty("--gaze-x", "0");
      el.style.setProperty("--gaze-y", "0");
    };
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - last < 50) return;
      last = now;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        const nx = Math.max(-1, Math.min(1, ((e.clientX - (rect.left + rect.width / 2)) / rect.width) * 2));
        const ny = Math.max(-1, Math.min(1, ((e.clientY - (rect.top + rect.height / 2)) / rect.height) * 2));
        el.style.setProperty("--gaze-x", (nx * 4.2).toFixed(2));
        el.style.setProperty("--gaze-y", (ny * 3).toFixed(2));
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", reset);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", reset);
    };
  }, [trackPointer]);

  const p = PALETTES[config.base % PALETTES.length] ?? PALETTES[0];
  const phase = atmo?.phase ?? "night";
  const season = atmo?.season;
  const moon = atmo?.moon ?? 0.5;

  const top1 =
    phase === "night"
      ? p.top1
      : phase === "dusk"
        ? mixHex(p.top1, "#f5a0c0", 0.16)
        : phase === "dawn"
          ? mixHex(p.top1, "#f5d9a0", 0.14)
          : mixHex(p.top1, "#8ea2ff", 0.1);
  const top2 =
    phase === "night"
      ? p.top2
      : phase === "dusk"
        ? mixHex(p.top2, "#5a3a70", 0.22)
        : phase === "dawn"
          ? mixHex(p.top2, "#b39dff", 0.16)
          : mixHex(p.top2, "#2a3560", 0.08);
  const glow =
    phase === "night"
      ? p.glow
      : phase === "dusk"
        ? mixHex(p.glow, "#f5d9a0", 0.3)
        : phase === "dawn"
          ? mixHex(p.glow, "#f5a0c0", 0.22)
          : mixHex(p.glow, "#e9ecff", 0.12);
  const haloOpacity = phase === "night" ? 0.4 : phase === "dusk" ? 0.5 : phase === "dawn" ? 0.34 : 0.28;

  const lit = 1 - Math.abs(moon * 2 - 1);
  const moonDir = moon < 0.5 ? 1 : -1;
  const moonShadowX = 58 + moonDir * lit * 15.6;
  const moonMask = `isle-moon-${uid}`;
  const topGrad = `isle-top-${uid}`;
  const rockGrad = `isle-rock-${uid}`;
  const haloGrad = `isle-halo-${uid}`;
  const spiritGrad = `isle-spirit-${uid}`;
  const celestialGlow = `isle-celestial-${uid}`;

  const visitorCount = Math.min(5, Math.max(0, visitors));
  const starCount = Math.min(8, Math.max(0, likes));
  const flagCount = Math.min(3, Math.max(0, comments));
  const wishCount = Math.min(3, Math.max(0, wishes));

  return (
    <svg
      ref={(el) => {
        localRef.current = el;
        assignRef(svgRef, el);
      }}
      viewBox="0 0 320 240"
      className="mx-auto h-auto w-full max-w-sm"
      role="img"
      aria-label={config.name ? `${config.name}的小岛` : "我的小岛"}
    >
      <defs>
        <linearGradient id={topGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top1} />
          <stop offset="1" stopColor={top2} />
        </linearGradient>
        <linearGradient id={rockGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.rock1} />
          <stop offset="1" stopColor={p.rock2} />
        </linearGradient>
        <radialGradient id={haloGrad} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={glow} stopOpacity={haloOpacity} />
          <stop offset="1" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={spiritGrad} cx="0.36" cy="0.3" r="0.72">
          <stop offset="0" stopColor={p.accent} stopOpacity="0.95" />
          <stop offset="0.55" stopColor={glow} stopOpacity="0.9" />
          <stop offset="1" stopColor={p.top1} stopOpacity="0.95" />
        </radialGradient>
        <radialGradient id={celestialGlow} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={p.accent} stopOpacity="0.34" />
          <stop offset="1" stopColor={p.accent} stopOpacity="0" />
        </radialGradient>
        <mask id={moonMask} maskUnits="userSpaceOnUse" x="38" y="28" width="42" height="40">
          <circle cx="58" cy="48" r="7.8" fill="white" />
          <circle cx={moonShadowX} cy="48" r="8" fill="black" />
        </mask>
      </defs>

      {/* 底部光晕 */}
      <ellipse cx="160" cy="128" rx="132" ry="66" fill={`url(#${haloGrad})`} />

      {/* 天色：月亮 / 落日 / 星昼 */}
      {phase === "night" ? (
        <g className="isle-celestial" aria-hidden>
          <circle cx="58" cy="48" r="19" fill={`url(#${celestialGlow})`} />
          <circle cx="58" cy="48" r="7.5" fill={p.accent} opacity="0.92" mask={`url(#${moonMask})`} />
          <Sparkle x={68} y={38} s={2.4} fill={p.accent} op={0.75} />
        </g>
      ) : (
        <g className="isle-celestial" aria-hidden>
          <circle cx="62" cy={phase === "day" ? 50 : 84} r="24" fill={`url(#${celestialGlow})`} />
          <circle
            cx="62"
            cy={phase === "day" ? 50 : 84}
            r={phase === "day" ? 6.5 : 9}
            fill={phase === "dusk" ? "#f5a0c0" : "#f5d9a0"}
            opacity={phase === "day" ? 0.55 : 0.8}
          />
        </g>
      )}

      {/* 远处的旅人小岛：在线人数变成星海里的几盏灯 */}
      {visitorCount > 0 && (
        <g aria-hidden opacity="0.75">
          {Array.from({ length: visitorCount }).map((_, i) => {
            const x = 104 + i * 17;
            const y = 34 + (i % 2) * 7;
            return (
              <g key={i} style={{ opacity: 0.4 + (i % 3) * 0.12 }}>
                <path d={`M${x - 7} ${y} Q${x} ${y + 6} ${x + 7} ${y} L${x} ${y + 13} Z`} fill={p.rock1} opacity="0.8" />
                <path d={`M${x - 7} ${y} Q${x} ${y - 4} ${x + 7} ${y} Q${x} ${y + 3} ${x - 7} ${y} Z`} fill={glow} opacity="0.8" />
                <circle cx={x} cy={y + 16} r="1" fill={p.accent} opacity="0.7" />
              </g>
            );
          })}
          {visitors > 5 && (
            <text x="196" y="28" fontSize="7" fill={p.accent} opacity="0.7">
              +{visitors - 5}
            </text>
          )}
        </g>
      )}

      {/* 环饰 */}
      {config.ring === 1 && (
        <ellipse
          className="isle-orbit"
          cx="160"
          cy="116"
          rx="118"
          ry="34"
          fill="none"
          stroke={glow}
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
      <path d="M74 122 Q160 152 246 122 L160 214 Z" fill={`url(#${rockGrad})`} />
      <path d="M68 118 Q160 80 252 118 Q160 148 68 118 Z" fill={`url(#${topGrad})`} />

      {/* 季节粒子：雪 / 花瓣 / 萤火 / 落叶 */}
      {season && (
        <g className={`isle-weather isle-weather-${season}`} aria-hidden>
          {WEATHER[season].map((w, i) => (
            <ellipse
              key={i}
              cx={w.x}
              cy={w.y}
              rx={season === "winter" ? 1.2 : 2.1}
              ry={season === "winter" ? 1.2 : 1.1}
              fill={
                season === "winter"
                  ? "#e9ecff"
                  : season === "spring"
                    ? "#f5a0c0"
                    : season === "autumn"
                      ? "#f5d9a0"
                      : "#ffe9a8"
              }
              opacity={season === "summer" ? 0.7 : 0.55}
              className="isle-weather-bit"
              style={{ animationDelay: `${w.delay}s`, animationDuration: `${w.dur}s` }}
            />
          ))}
        </g>
      )}

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
          <polygon points="193,92 209,79 225,92" fill={top1} />
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

      {/* 活动装饰：赞过的小星星、评论小旗、连续上岛的光环 */}
      {Array.from({ length: starCount }).map((_, i) => (
        <Sparkle
          key={`star-${i}`}
          x={84 + i * 22}
          y={124 + (i % 2) * 7}
          s={3.4}
          fill={p.accent}
          op={0.62 + (i % 3) * 0.1}
        />
      ))}
      {Array.from({ length: flagCount }).map((_, i) => {
        const x = 88 + i * 11;
        return (
          <g key={`flag-${i}`} opacity="0.85">
            <line x1={x} y1="112" x2={x} y2="98" stroke={p.accent} strokeWidth="1.2" />
            <polygon points={`${x},98 ${x + 8},101 ${x},104`} fill={p.accent} />
          </g>
        );
      })}
      {streak >= 7 && (
        <g className="isle-streak" aria-hidden>
          <ellipse cx="160" cy="91" rx="17" ry="4" fill="none" stroke={p.accent} strokeWidth="1" strokeDasharray="2 4" opacity="0.55" />
          <Sparkle x={160} y={84} s={4.6} fill={p.accent} op={0.85} />
        </g>
      )}

      {/* 星愿：每许一个愿，岛上多一颗青蓝色的小星 */}
      {wishCount > 0 && (
        <g aria-hidden>
          {Array.from({ length: wishCount }).map((_, i) => (
            <g key={`wish-${i}`} className="isle-wish" style={{ animationDelay: `${i * 0.9}s` }}>
              <Sparkle x={88 + i * 15} y={72 - (i % 2) * 8} s={3.4} fill="#6fd3ff" op={0.9} />
              <circle cx={88 + i * 15} cy={72 - (i % 2) * 8} r={1} fill="#e9ecff" opacity={0.75} />
            </g>
          ))}
        </g>
      )}

      {/* 隐藏彩蛋：稀有极光形态 */}
      {rare && (
        <g className="isle-rare" aria-hidden>
          <ellipse cx="160" cy="116" rx="132" ry="73" fill="none" stroke={p.accent} strokeWidth="1" strokeDasharray="1 6" opacity="0.45" />
          <ellipse cx="160" cy="116" rx="143" ry="83" fill="none" stroke={glow} strokeWidth="1.4" opacity="0.38" />
          <path d="M282 60 Q300 48 314 58" fill="none" stroke={p.accent} strokeWidth="1.3" strokeLinecap="round" opacity="0.75" />
          <Sparkle x={314} y={58} s={4.2} fill={p.accent} op={0.9} />
          <Sparkle x={300} y={50} s={2} fill="#e9ecff" op={0.7} />
        </g>
      )}

      {/* 岛灵：会看人、会眨眼的小家伙 */}
      <g className="isle-spirit" aria-hidden>
        <ellipse cx="160" cy="123" rx="12" ry="3.2" fill={p.rock2} opacity="0.5" />
        <circle cx="160" cy="107" r="13" fill={`url(#${spiritGrad})`} stroke={p.accent} strokeOpacity="0.35" strokeWidth="0.8" />
        <g className="isle-gaze">
          <g
            className={mood === "sleepy" ? "isle-eyes-closed" : "isle-eyes"}
            style={{ animationDelay: `${(config.base * 1.3) % 6}s` }}
          >
            {mood === "sleepy" ? (
              <>
                <path d="M152.5 106 Q155.5 108.2 158.5 106" fill="none" stroke={p.rock2} strokeWidth="1.5" strokeLinecap="round" />
                <path d="M161.5 106 Q164.5 108.2 167.5 106" fill="none" stroke={p.rock2} strokeWidth="1.5" strokeLinecap="round" />
              </>
            ) : mood === "sad" ? (
              <>
                <ellipse cx="155.5" cy="107" rx="2.1" ry="1.5" fill={p.rock2} />
                <ellipse cx="164.5" cy="107" rx="2.1" ry="1.5" fill={p.rock2} />
                <path d="M152.5 102.5 L158 103.5" stroke={p.rock2} strokeWidth="1" strokeLinecap="round" opacity="0.7" />
                <path d="M167.5 102.5 L162 103.5" stroke={p.rock2} strokeWidth="1" strokeLinecap="round" opacity="0.7" />
              </>
            ) : mood === "dazed" ? (
              <>
                <ellipse cx="155.5" cy="107" rx="2.6" ry="2.1" fill={p.rock2} />
                <ellipse cx="164.5" cy="107" rx="2.6" ry="2.1" fill={p.rock2} />
                <circle cx="156.2" cy="106.3" r="0.7" fill="#fff" opacity="0.85" />
                <circle cx="165.2" cy="106.3" r="0.7" fill="#fff" opacity="0.85" />
              </>
            ) : (
              <>
                <circle cx="155.5" cy="107" r="2.2" fill={p.rock2} />
                <circle cx="164.5" cy="107" r="2.2" fill={p.rock2} />
                <circle cx="156.2" cy="106.2" r="0.7" fill="#fff" opacity="0.9" />
                <circle cx="165.2" cy="106.2" r="0.7" fill="#fff" opacity="0.9" />
              </>
            )}
          </g>
          {mood === "happy" ? (
            <path d="M156 113 Q160 116.5 164 113" fill="none" stroke={p.rock2} strokeWidth="1.2" strokeLinecap="round" />
          ) : mood === "sad" ? (
            <path d="M156 115 Q160 111.5 164 115" fill="none" stroke={p.rock2} strokeWidth="1.2" strokeLinecap="round" />
          ) : mood === "dazed" ? (
            <ellipse cx="160" cy="114" rx="1.4" ry="1.7" fill={p.rock2} />
          ) : (
            <path d="M157 114 Q160 115 163 114" fill="none" stroke={p.rock2} strokeWidth="1.1" strokeLinecap="round" />
          )}
        </g>
        {mood === "sleepy" && (
          <text x="174" y="98" fontSize="7" fill={p.accent} opacity="0.75" className="isle-zzz">
            z z
          </text>
        )}
      </g>

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
          <path d="M246 46 a16 16 0 1 0 13 28 a13 13 0 1 1 -13 -28" fill="#f5d9a0" opacity="0.95" />
          <Sparkle x={236} y={40} s={4} fill="#e9ecff" op={0.8} />
        </g>
      )}
    </svg>
  );
}
