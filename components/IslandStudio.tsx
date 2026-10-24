"use client";

import { useRef, useState } from "react";
import IslandAvatar from "@/components/IslandAvatar";
import {
  defaultIslandConfig,
  encodeIslandCode,
  loadFollow,
  loadIslandConfig,
  loadIslandMusic,
  migrateLegacyIslandStorage,
  recordIslandVisit,
  saveFollow,
  saveIslandConfig,
  saveIslandMusic,
  type IslandConfig,
  type IslandPersonality,
} from "@/lib/island-store";
import { getMyComments, getMyLikes } from "@/lib/gh-auth";
import { useOnlineCount } from "@/lib/use-online";

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

const PERSONALITIES: Array<{ key: IslandPersonality; label: string; hint: string }> = [
  { key: "chatty", label: "话痨", hint: "一句话接一句话" },
  { key: "calm", label: "安静", hint: "偶尔才开口" },
  { key: "tsundere", label: "傲娇", hint: "嘴上不承认" },
];

const SCOPE_LABEL = { moments: "动态页", all: "全站" } as const;

export default function IslandStudio({ seed }: { seed: string }) {
  const online = useOnlineCount();
  // 此组件只在登录后的客户端挂载（父页有 mounted 守卫），可直接读本机存储
  const [cfg, setCfg] = useState<IslandConfig>(() => {
    migrateLegacyIslandStorage(seed);
    return loadIslandConfig(seed) ?? defaultIslandConfig(seed);
  });
  const [follow, setFollow] = useState(() => loadFollow(seed));
  const [music, setMusic] = useState(() => loadIslandMusic(seed));
  const [likes] = useState(() => getMyLikes().length);
  const [comments] = useState(() => getMyComments().length);
  const [streak] = useState(() => recordIslandVisit(seed).streak);
  const [copied, setCopied] = useState<"code" | "link" | "">("");
  const [posterBusy, setPosterBusy] = useState(false);
  const posterRef = useRef<SVGSVGElement | null>(null);

  const update = (next: IslandConfig) => {
    setCfg(next);
    saveIslandConfig(next, seed);
  };

  const toggleFollow = () => {
    const next = !follow;
    setFollow(next);
    saveFollow(next, seed);
    if (next && !loadIslandConfig(seed)) saveIslandConfig(cfg, seed);
  };

  const toggleMusic = () => {
    const next = !music;
    setMusic(next);
    saveIslandMusic(next, seed);
  };

  const randomize = () => {
    update({
      ...cfg,
      base: Math.floor(Math.random() * 4),
      plant: Math.floor(Math.random() * 3),
      building: Math.floor(Math.random() * 3),
      ring: Math.floor(Math.random() * 3),
      pet: Math.floor(Math.random() * 3),
    });
  };

  const code = encodeIslandCode(cfg);

  const copyText = async (text: string, kind: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      /* 剪贴板不可用时忽略 */
    }
  };

  const shareUrl = () => {
    const url = new URL("/island", window.location.origin);
    url.searchParams.set("code", code);
    if (cfg.name) url.searchParams.set("n", cfg.name);
    if (seed) url.searchParams.set("u", seed);
    return url.toString();
  };

  const downloadPostcard = async () => {
    const svg = posterRef.current;
    if (!svg || posterBusy) return;
    setPosterBusy(true);
    try {
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.setAttribute("width", "960");
      clone.setAttribute("height", "720");
      const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bg.setAttribute("width", "320");
      bg.setAttribute("height", "240");
      bg.setAttribute("fill", "#04050d");
      clone.insertBefore(bg, clone.firstChild);

      const xml = new XMLSerializer().serializeToString(clone);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("poster"));
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
      });

      const canvas = document.createElement("canvas");
      canvas.width = 960;
      canvas.height = 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const grad = ctx.createLinearGradient(0, 0, 960, 720);
      grad.addColorStop(0, "#0a0f24");
      grad.addColorStop(1, "#04050d");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 960, 720);
      ctx.drawImage(img, 0, 0, 960, 720);
      ctx.textAlign = "center";
      ctx.fillStyle = "#e9ecff";
      ctx.font = '600 38px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(cfg.name || "我的小岛", 480, 654);
      ctx.fillStyle = "#9aa3c7";
      ctx.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(`浮岛 · Floating Island    ${code}`, 480, 692);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return;
      const a = document.createElement("a");
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = `${(cfg.name || "我的小岛").replace(/[\\/:*?"<>|]/g, "")}-浮岛.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      /* 生成失败时保持静默，按钮可重试 */
    } finally {
      setPosterBusy(false);
    }
  };

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold tracking-widest text-star">✦ 我的小岛</h2>
      <div className="glass rounded-3xl p-5">
        <div className="animate-float-slow">
          <IslandAvatar
            config={cfg}
            mood="happy"
            trackPointer
            visitors={online}
            likes={likes}
            comments={comments}
            streak={streak}
            svgRef={posterRef}
          />
        </div>

        <label className="mt-4 block">
          <span className="text-xs text-moon/80">岛名</span>
          <input
            value={cfg.name}
            onChange={(e) => update({ ...cfg, name: e.target.value.slice(0, 16) })}
            placeholder="我的小岛"
            maxLength={16}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-star placeholder:text-moon/40 focus:border-aurora/50 focus:outline-none focus:ring-1 focus:ring-aurora/40"
          />
        </label>

        <div className="mt-4 space-y-3">
          {ROWS.map((row) => (
            <div key={row.key} className="flex items-center gap-2.5">
              <span className="w-8 shrink-0 text-xs text-moon/80">{row.label}</span>
              <div className="flex flex-wrap gap-1.5">
                {row.opts.map((opt, i) => (
                  <button
                    key={opt.n}
                    type="button"
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

          <div className="flex items-center gap-2.5">
            <span className="w-8 shrink-0 text-xs text-moon/80">性格</span>
            <div className="flex flex-wrap gap-1.5">
              {PERSONALITIES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  title={p.hint}
                  onClick={() => update({ ...cfg, personality: p.key })}
                  className={`rounded-full px-3 py-1 text-xs ring-1 transition ${
                    cfg.personality === p.key
                      ? "bg-aurora/15 text-aurora ring-aurora/40"
                      : "bg-white/5 text-moon ring-white/10 hover:text-star"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10">
            <div>
              <p className="text-sm text-star">🪐 一键跟随</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-moon/70">
                {follow
                  ? `小岛正漂在${SCOPE_LABEL[cfg.followScope]}里`
                  : "开启后，小岛会漂进你浏览的页面"}
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

          {follow && (
            <div className="flex items-center justify-between rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10">
              <div>
                <p className="text-sm text-star">跟随范围</p>
                <p className="mt-0.5 text-[11px] text-moon/70">岛屿页与发布器里始终隐藏</p>
              </div>
              <div className="flex shrink-0 gap-1">
                {(["moments", "all"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => update({ ...cfg, followScope: s })}
                    className={`rounded-full px-3 py-1 text-[11px] ring-1 transition ${
                      cfg.followScope === s
                        ? "bg-gold/15 text-gold ring-gold/40"
                        : "bg-white/5 text-moon ring-white/10 hover:text-star"
                    }`}
                  >
                    {SCOPE_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10">
            <div>
              <p className="text-sm text-star">◌ 安静模式</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-moon/70">
                关闭随机呢喃，只在你主动互动时说话
              </p>
            </div>
            <button
              role="switch"
              aria-checked={cfg.quiet}
              aria-label="安静模式"
              onClick={() => update({ ...cfg, quiet: !cfg.quiet })}
              className={`relative h-7 w-[3.25rem] shrink-0 rounded-full ring-1 transition ${
                cfg.quiet ? "bg-aurora/25 ring-aurora/50" : "bg-white/5 ring-white/15"
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-star shadow transition-all ${
                  cfg.quiet ? "left-[1.6rem] bg-aurora" : "left-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10">
            <div>
              <p className="text-sm text-star">♪ 岛上音乐</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-moon/70">
                {music
                  ? "点小岛菜单里的 ♪ 音乐，音乐卡片会飘在小岛旁边"
                  : "开启后，小岛的功能菜单会出现音乐项"}
              </p>
            </div>
            <button
              role="switch"
              aria-checked={music}
              aria-label="岛上音乐开关"
              onClick={toggleMusic}
              className={`relative h-7 w-[3.25rem] shrink-0 rounded-full ring-1 transition ${
                music ? "bg-aurora/25 ring-aurora/50" : "bg-white/5 ring-white/15"
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-star shadow transition-all ${
                  music ? "left-[1.6rem] bg-aurora" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-star">✦ 把岛带走</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-moon/70">
                岛码 {code} · 朋友打开只能看和摸
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-gold/10 px-2.5 py-1 text-[10px] text-gold ring-1 ring-gold/25">
              连续 {streak} 天
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => copyText(code, "code")}
              className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] text-moon transition hover:border-gold/40 hover:text-gold"
            >
              {copied === "code" ? "已复制 ✓" : "复制岛码"}
            </button>
            <button
              type="button"
              onClick={() => copyText(shareUrl(), "link")}
              className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] text-moon transition hover:border-aurora/40 hover:text-aurora"
            >
              {copied === "link" ? "已复制 ✓" : "复制访客链接"}
            </button>
            <button
              type="button"
              onClick={downloadPostcard}
              disabled={posterBusy}
              className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] text-moon transition hover:border-gold/40 hover:text-gold disabled:opacity-50"
            >
              {posterBusy ? "生成中…" : "下载明信片"}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={randomize}
            className="rounded-full border border-white/15 px-4 py-1.5 text-xs text-moon transition hover:border-gold/40 hover:text-gold"
          >
            🎲 随机换一座
          </button>
          <p className="text-[11px] text-moon/60">装修保存在本机浏览器 · 按账号隔离</p>
        </div>
      </div>
    </section>
  );
}
