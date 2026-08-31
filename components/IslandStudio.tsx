"use client";

import { useEffect, useState } from "react";
import IslandAvatar, { type IslandConfig } from "@/components/IslandAvatar";

// 小岛装修工作台：自由搭配专属小岛，配置保存在本机浏览器
const KEY = "fudao-island-config";

const BASES = [
  { e: "🟣", n: "紫夜" },
  { e: "🔵", n: "蓝调" },
  { e: "🟡", n: "金辉" },
  { e: "🟢", n: "翠晓" },
];
const PLANTS = [
  { e: "⬜", n: "空地" },
  { e: "🌲", n: "星光树" },
  { e: "🌸", n: "小花园" },
];
const BUILDINGS = [
  { e: "⬜", n: "无" },
  { e: "🏠", n: "小屋" },
  { e: "🗼", n: "灯塔" },
];
const RINGS = [
  { e: "⬜", n: "无" },
  { e: "💫", n: "星环" },
  { e: "☁️", n: "飘云" },
];
const PETS = [
  { e: "⬜", n: "无" },
  { e: "✨", n: "星灵" },
  { e: "🌙", n: "弯月" },
];

const ROWS = [
  { label: "基底", key: "base" as const, opts: BASES },
  { label: "植被", key: "plant" as const, opts: PLANTS },
  { label: "建筑", key: "building" as const, opts: BUILDINGS },
  { label: "环饰", key: "ring" as const, opts: RINGS },
  { label: "伙伴", key: "pet" as const, opts: PETS },
];

function hashName(s: string): number {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

function defaultConfig(seed: string): IslandConfig {
  const h = hashName(seed || "guest");
  return {
    base: h % 4,
    plant: (h >> 2) % 3,
    building: (h >> 4) % 3,
    ring: (h >> 6) % 3,
    pet: (h >> 8) % 3,
  };
}

function loadConfig(seed: string): IslandConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const c = JSON.parse(raw) as IslandConfig;
      if (typeof c.base === "number") return c;
    }
  } catch {}
  return defaultConfig(seed);
}

export default function IslandStudio({ seed }: { seed: string }) {
  const [cfg, setCfg] = useState<IslandConfig>(() => defaultConfig(seed));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCfg(loadConfig(seed));
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const update = (next: IslandConfig) => {
    setCfg(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  const randomize = () => {
    update({
      base: Math.floor(Math.random() * 4),
      plant: Math.floor(Math.random() * 3),
      building: Math.floor(Math.random() * 3),
      ring: Math.floor(Math.random() * 3),
      pet: Math.floor(Math.random() * 3),
    });
  };

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold tracking-widest text-star">✦ 我的小岛</h2>
      <div className="glass rounded-3xl p-5">
        <div className="animate-float-slow">
          <IslandAvatar config={cfg} />
        </div>

        <div className="mt-4 space-y-3">
          {ROWS.map((row) => (
            <div key={row.key} className="flex items-center gap-2.5">
              <span className="w-8 shrink-0 text-xs text-moon/80">{row.label}</span>
              <div className="flex flex-wrap gap-1.5">
                {row.opts.map((opt, i) => (
                  <button
                    key={opt.n}
                    onClick={() => update({ ...cfg, [row.key]: i })}
                    className={`rounded-full px-3 py-1 text-xs ring-1 transition ${
                      cfg[row.key] === i
                        ? "bg-gold/15 text-gold ring-gold/40"
                        : "bg-white/5 text-moon ring-white/10 hover:text-star"
                    }`}
                  >
                    {opt.e} {opt.n}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={randomize}
            className="rounded-full border border-white/15 px-4 py-1.5 text-xs text-moon transition hover:border-gold/40 hover:text-gold"
          >
            🎲 随机换一座
          </button>
          <p className="text-[11px] text-moon/60">装修保存在本机浏览器</p>
        </div>
      </div>
    </section>
  );
}
