"use client";

import { useEffect, useState } from "react";
import IslandAvatar, { type IslandConfig } from "@/components/IslandAvatar";
import { loadFollow, loadIslandConfig, saveFollow, saveIslandConfig } from "@/lib/island-store";

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
  const saved = loadIslandConfig();
  if (saved) return saved;
  return defaultConfig(seed);
}

export default function IslandStudio({ seed }: { seed: string }) {
  const [cfg, setCfg] = useState<IslandConfig>(() => defaultConfig(seed));
  const [follow, setFollow] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCfg(loadConfig(seed));
    setFollow(loadFollow());
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const update = (next: IslandConfig) => {
    setCfg(next);
    saveIslandConfig(next);
  };

  const toggleFollow = () => {
    const next = !follow;
    setFollow(next);
    saveFollow(next);
    // 开启跟随时，若本机还没有保存过小岛配置，把当前展示的这座一并存下
    if (next && !loadIslandConfig()) saveIslandConfig(cfg);
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

        <div className="mt-5 rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-star">🪐 一键跟随</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-moon/70">
                {follow ? "小岛正漂在你浏览的动态页里" : "开启后，小岛会漂进你浏览的动态页"}
              </p>
            </div>
            <button
              role="switch"
              aria-checked={follow}
              aria-label="一键跟随小岛"
              onClick={toggleFollow}
              className={`relative h-7 w-[3.25rem] shrink-0 rounded-full ring-1 transition ${
                follow ? "bg-gold/25 ring-gold/50" : "bg-white/5 ring-white/15"
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-star shadow transition-all ${
                  follow ? "left-[1.6rem] bg-gold" : "left-0.5"
                }`}
              />
            </button>
          </div>
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
