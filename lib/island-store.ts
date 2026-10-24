// 小岛配置与状态：按 GitHub 账号隔离，旧版设备级数据在首次登录时迁移。
"use client";

import { getAuthSnapshot } from "@/lib/gh-auth";

const CONFIG_KEY = "fudao-island-config";
const FOLLOW_KEY = "fudao-island-follow";
const POS_KEY = "fudao-island-pos";
const MUSIC_KEY = "fudao-island-music";
const MEMORY_KEY = "fudao-island-memory";

export type IslandPersonality = "chatty" | "calm" | "tsundere";
export type FollowScope = "moments" | "all";
export type IslandMood = "happy" | "sad" | "dazed" | "sleepy";

export type IslandConfig = {
  version: 2;
  base: number; // 基底 0-3
  plant: number; // 植被 0-2
  building: number; // 建筑 0-2
  ring: number; // 环饰 0-2
  pet: number; // 天空伙伴 0-2
  name: string; // 岛名，空字符串表示「我的小岛」
  personality: IslandPersonality;
  quiet: boolean; // 静一静：不主动呢喃
  followScope: FollowScope; // 跟随范围
};

export type IslandPos = { x: number; y: number };

export type IslandMemory = {
  lastVisit: string; // 本地日期 YYYY-MM-DD
  lastStreakDay: string;
  streak: number;
  visits: number;
  pets: number;
};

export type IslandVisit = {
  daysSince: number;
  streak: number;
  isNewDay: boolean;
  visits: number;
  pets: number;
};

const LEGACY_KEYS: Array<[string, string]> = [
  [CONFIG_KEY, CONFIG_KEY],
  [FOLLOW_KEY, FOLLOW_KEY],
  [POS_KEY, POS_KEY],
  [MUSIC_KEY, MUSIC_KEY],
];

function hashName(s: string): number {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

function currentLogin(): string | null {
  return getAuthSnapshot().me?.login?.trim().toLowerCase() || null;
}

function scopeOf(login?: string | null): string | null {
  return login?.trim().toLowerCase() || currentLogin();
}

function scopedKey(base: string, login?: string | null): string {
  return `${base}:${scopeOf(login) ?? "guest"}`;
}

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function removeRaw(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

/** 把旧版设备级键迁到当前账号；只应在当前登录用户身上调用 */
export function migrateLegacyIslandStorage(login?: string | null) {
  const scope = scopeOf(login);
  if (!scope) return;
  for (const [legacy, base] of LEGACY_KEYS) {
    const raw = readRaw(legacy);
    if (raw == null) continue;
    const key = `${base}:${scope}`;
    if (readRaw(key) == null) writeRaw(key, raw);
    removeRaw(legacy);
  }
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, Math.round(v)));
}

function cleanName(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.replace(/[\u0000-\u001f]/g, "").trim().slice(0, 16);
}

function normalizeConfig(raw: unknown): IslandConfig {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<IslandConfig>;
  return {
    version: 2,
    base: clampInt(r.base, 0, 3, 0),
    plant: clampInt(r.plant, 0, 2, 0),
    building: clampInt(r.building, 0, 2, 0),
    ring: clampInt(r.ring, 0, 2, 0),
    pet: clampInt(r.pet, 0, 2, 1),
    name: cleanName(r.name),
    personality:
      r.personality === "calm" || r.personality === "tsundere" ? r.personality : "chatty",
    quiet: Boolean(r.quiet),
    followScope: r.followScope === "all" ? "all" : "moments",
  };
}

/** 按名字确定性生成一座默认小岛（没保存过配置时使用） */
export function defaultIslandConfig(seed: string): IslandConfig {
  const h = hashName(seed || "guest");
  return {
    version: 2,
    base: h % 4,
    plant: (h >> 2) % 3,
    building: (h >> 4) % 3,
    ring: (h >> 6) % 3,
    // 默认总有一位天空伙伴，但保留「无」可选
    pet: 1 + ((h >> 8) % 2),
    name: "",
    personality: "chatty",
    quiet: false,
    followScope: "moments",
  };
}

// ── 位置 ────────────────────────────────────────────────
export function loadIslandPos(login?: string | null): IslandPos | null {
  const raw = readRaw(scopedKey(POS_KEY, login));
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as IslandPos;
    if (Number.isFinite(p?.x) && Number.isFinite(p?.y)) return { x: p.x, y: p.y };
  } catch {}
  return null;
}

export function saveIslandPos(pos: IslandPos, login?: string | null) {
  writeRaw(scopedKey(POS_KEY, login), JSON.stringify(pos));
}

// ── 配置 ────────────────────────────────────────────────
export function loadIslandConfig(login?: string | null): IslandConfig | null {
  const raw = readRaw(scopedKey(CONFIG_KEY, login));
  if (!raw) return null;
  try {
    return normalizeConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveIslandConfig(config: IslandConfig, login?: string | null) {
  writeRaw(scopedKey(CONFIG_KEY, login), JSON.stringify(normalizeConfig(config)));
}

// ── 跟随 / 岛上音乐 ─────────────────────────────────────
export function loadFollow(login?: string | null): boolean {
  return readRaw(scopedKey(FOLLOW_KEY, login)) === "1";
}

export function saveFollow(on: boolean, login?: string | null) {
  writeRaw(scopedKey(FOLLOW_KEY, login), on ? "1" : "0");
}

export function loadIslandMusic(login?: string | null): boolean {
  return readRaw(scopedKey(MUSIC_KEY, login)) === "1";
}

export function saveIslandMusic(on: boolean, login?: string | null) {
  writeRaw(scopedKey(MUSIC_KEY, login), on ? "1" : "0");
}

// ── 岛码：把五维配置压成 FI2-XX ──────────────────────────
const CODE_VERSION = "2";
const CODE_SPACE = 4 * 3 * 3 * 3 * 3;

export function encodeIslandCode(config: IslandConfig): string {
  const n =
    config.base +
    4 *
      (config.plant +
        3 * (config.building + 3 * (config.ring + 3 * config.pet)));
  return `FI${CODE_VERSION}-${n.toString(36).toUpperCase().padStart(2, "0")}`;
}

export function decodeIslandCode(code: string): IslandConfig | null {
  const m = /^FI2-([0-9A-Z]{1,3})$/i.exec(code.trim());
  if (!m) return null;
  let n = parseInt(m[1], 36);
  if (!Number.isFinite(n) || n < 0 || n >= CODE_SPACE) return null;
  const base = n % 4;
  n = Math.floor(n / 4);
  const plant = n % 3;
  n = Math.floor(n / 3);
  const building = n % 3;
  n = Math.floor(n / 3);
  const ring = n % 3;
  const pet = n % 3;
  return {
    ...defaultIslandConfig("visitor"),
    base,
    plant,
    building,
    ring,
    pet,
  };
}

// ── 来访记忆 / 连续上岛 ──────────────────────────────────
function dateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayDistance(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T00:00:00`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

function emptyMemory(): IslandMemory {
  return { lastVisit: "", lastStreakDay: "", streak: 0, visits: 0, pets: 0 };
}

export function loadIslandMemory(login?: string | null): IslandMemory {
  const raw = readRaw(scopedKey(MEMORY_KEY, login));
  if (!raw) return emptyMemory();
  try {
    const m = JSON.parse(raw) as Partial<IslandMemory>;
    return {
      lastVisit: typeof m.lastVisit === "string" ? m.lastVisit : "",
      lastStreakDay: typeof m.lastStreakDay === "string" ? m.lastStreakDay : "",
      streak: clampInt(m.streak, 0, 100_000, 0),
      visits: clampInt(m.visits, 0, 100_000_000, 0),
      pets: clampInt(m.pets, 0, 100_000_000, 0),
    };
  } catch {
    return emptyMemory();
  }
}

function saveIslandMemory(memory: IslandMemory, login?: string | null) {
  writeRaw(scopedKey(MEMORY_KEY, login), JSON.stringify(memory));
}

export function recordIslandVisit(login?: string | null): IslandVisit {
  const today = dateKey();
  const memory = loadIslandMemory(login);
  const previous = memory.lastVisit;
  const isNewDay = previous !== today;

  if (isNewDay) {
    const yesterday = dateKey(new Date(Date.now() - 86_400_000));
    memory.streak = previous === yesterday ? memory.streak + 1 : 1;
    memory.visits += 1;
    memory.lastVisit = today;
    memory.lastStreakDay = today;
    saveIslandMemory(memory, login);
  }

  return {
    daysSince: previous ? dayDistance(previous, today) : 0,
    streak: memory.streak,
    isNewDay,
    visits: memory.visits,
    pets: memory.pets,
  };
}

export function recordIslandPet(login?: string | null): number {
  const memory = loadIslandMemory(login);
  memory.pets += 1;
  if (!memory.lastVisit) memory.lastVisit = dateKey();
  saveIslandMemory(memory, login);
  return memory.pets;
}
