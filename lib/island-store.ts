// 小岛配置与"一键跟随/岛上音乐"状态：均保存在本机浏览器 localStorage
import type { IslandConfig } from "@/components/IslandAvatar";

const CONFIG_KEY = "fudao-island-config";
const FOLLOW_KEY = "fudao-island-follow";
const POS_KEY = "fudao-island-pos";
const MUSIC_KEY = "fudao-island-music";

export type IslandPos = { x: number; y: number };

function hashName(s: string): number {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/** 按名字确定性生成一座默认小岛（没保存过配置时使用） */
export function defaultIslandConfig(seed: string): IslandConfig {
  const h = hashName(seed || "guest");
  return {
    base: h % 4,
    plant: (h >> 2) % 3,
    building: (h >> 4) % 3,
    ring: (h >> 6) % 3,
    pet: (h >> 8) % 3,
  };
}

export function loadIslandPos(): IslandPos | null {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as IslandPos;
      if (typeof p.x === "number" && typeof p.y === "number") return p;
    }
  } catch {}
  return null;
}

export function saveIslandPos(pos: IslandPos) {
  try {
    localStorage.setItem(POS_KEY, JSON.stringify(pos));
  } catch {}
}

export function loadIslandConfig(): IslandConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      const c = JSON.parse(raw) as IslandConfig;
      if (typeof c.base === "number") return c;
    }
  } catch {}
  return null;
}

export function saveIslandConfig(config: IslandConfig) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {}
}

export function loadFollow(): boolean {
  try {
    return localStorage.getItem(FOLLOW_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveFollow(on: boolean) {
  try {
    localStorage.setItem(FOLLOW_KEY, on ? "1" : "0");
  } catch {}
}

// "岛上音乐"开关：开启后，点击跟随小岛的"♪ 音乐"会唤起播放器卡片
export function loadIslandMusic(): boolean {
  try {
    return localStorage.getItem(MUSIC_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveIslandMusic(on: boolean) {
  try {
    localStorage.setItem(MUSIC_KEY, on ? "1" : "0");
  } catch {}
}
