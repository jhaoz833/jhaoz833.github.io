"use client";

// 评论区/群岛用的迷你岛徽章：按 GitHub 登录名确定性生成，同一人永远同一座岛。
import { defaultIslandConfig } from "@/lib/island-store";

const PALETTES = [
  { top: "#4a5da8", rock: "#232a52", glow: "#8ea2ff", accent: "#f5d9a0" },
  { top: "#3b7ec2", rock: "#1c3a5e", glow: "#6fd3ff", accent: "#e9ecff" },
  { top: "#c9a35c", rock: "#5e4a26", glow: "#f5d9a0", accent: "#fff3d6" },
  { top: "#4fae8e", rock: "#23453a", glow: "#7fe0bd", accent: "#f5d9a0" },
];

export default function IslandBadge({
  login,
  size = 24,
}: {
  login: string;
  size?: number;
}) {
  // 只用登录名确定性生成，保证服务端/客户端渲染一致，也让所有人看到同一座徽章岛
  const cfg = defaultIslandConfig(login);
  const p = PALETTES[cfg.base % PALETTES.length] ?? PALETTES[0];

  return (
    <svg
      viewBox="0 0 32 24"
      width={size}
      height={(size * 24) / 32}
      aria-hidden
      className="inline-block shrink-0 align-middle"
    >
      <ellipse cx="16" cy="13" rx="14" ry="8" fill={p.glow} opacity="0.13" />
      <path d="M7 12 Q16 16 25 12 L16 23 Z" fill={p.rock} />
      <path d="M6 12 Q16 7 26 12 Q16 16 6 12 Z" fill={p.top} />
      {cfg.plant === 1 && (
        <>
          <rect x="10" y="8" width="1.2" height="4" fill={p.rock} />
          <circle cx="10.6" cy="7" r="2.2" fill={p.accent} />
        </>
      )}
      {cfg.plant === 2 && (
        <>
          <circle cx="10" cy="9" r="1.5" fill={p.accent} />
          <circle cx="13" cy="8" r="1.2" fill="#f5a0c0" />
        </>
      )}
      {cfg.plant === 3 && (
        <>
          <circle cx="11" cy="9" r="1.1" fill={p.accent} />
          <circle cx="14" cy="8" r="1" fill="#f5a0c0" />
          <circle cx="17" cy="9" r="0.9" fill="#a0d8f5" />
        </>
      )}
      {cfg.building === 1 && (
        <>
          <rect x="19" y="8" width="4" height="4" fill="#0f1530" stroke="#39406b" strokeWidth="0.6" />
          <polygon points="18.5,8 21,6.5 23.5,8" fill={p.top} />
          <rect x="20.5" y="9.2" width="1.2" height="1.2" fill={p.accent} />
        </>
      )}
      {cfg.building === 2 && (
        <>
          <polygon points="19,12 23,12 24,6 18,6" fill="#0f1530" stroke="#39406b" strokeWidth="0.6" />
          <circle cx="21" cy="5" r="1.2" fill={p.accent} />
          <polygon points="22,4.4 28,3 28,7" fill={p.accent} opacity="0.22" />
        </>
      )}
      <circle cx="15.5" cy="11" r="1.6" fill={p.glow} opacity="0.9" />
      <circle cx="15" cy="10.7" r="0.5" fill="#0e1228" />
      <circle cx="16.2" cy="10.7" r="0.5" fill="#0e1228" />
      {cfg.pet === 1 && <path d="M27 5 l1 2 2 1 -2 1 -1 2 -1 -2 -2 -1 2 -1 Z" fill={p.accent} opacity="0.9" />}
      {cfg.pet === 2 && (
        <path d="M26 3 a3.4 3.4 0 1 0 2.6 6 a2.8 2.8 0 1 1 -2.6 -6" fill={p.accent} opacity="0.9" />
      )}
    </svg>
  );
}
