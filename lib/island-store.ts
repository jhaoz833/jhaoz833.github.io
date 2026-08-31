// 小岛配置与"一键跟随"状态：均保存在本机浏览器 localStorage
import type { IslandConfig } from "@/components/IslandAvatar";

const CONFIG_KEY = "fudao-island-config";
const FOLLOW_KEY = "fudao-island-follow";
const POS_KEY = "fudao-island-pos";

export type IslandPos = { x: number; y: number };

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
