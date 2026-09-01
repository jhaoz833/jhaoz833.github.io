"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue } from "motion/react";
import IslandAvatar, { type IslandConfig } from "@/components/IslandAvatar";
import {
  defaultIslandConfig,
  loadFollow,
  loadIslandConfig,
  loadIslandMusic,
  loadIslandPos,
  saveIslandPos,
} from "@/lib/island-store";
import {
  broadcastIslandMoved,
  onIslandCheer,
  onIslandMusicVisible,
  toggleIslandMusic,
} from "@/lib/island-events";

const BURST_STARS = 10;

// ── 心情系统 ──────────────────────────────────────────────
type Mood = "happy" | "sad" | "dazed";
const MOODS: Mood[] = ["happy", "sad", "dazed"];
const MOOD_LABEL: Record<Mood, string> = { happy: "开心", sad: "难过", dazed: "发呆" };

// 小岛呢喃话术库（闲聊按心情分池；夜话全心情共用）
const MURMURS = {
  idle: {
    happy: [
      "今天心情好，飘得都轻了些",
      "星星在给岛打拍子呢 ✦",
      "嘿，今天的风也顺路",
      "一切都刚刚好的样子",
    ],
    sad: [
      "云有点重，压得岛低低的",
      "今天的星光淡了些…",
      "岛有点想以前的事了",
      "飘得慢一点，也没关系吧",
    ],
    dazed: [
      "咦……刚才想到哪了？",
      "风把思路吹跑了",
      "发呆中，勿扰 zzZ",
      "底下那颗星叫什么来着",
    ],
  },
  poke: [
    "痒痒的！",
    "再摸就要飘走啦",
    "嘿嘿，星星送你 ✦",
    "岛身一晃～",
  ],
  cheer: [
    "哇，被点亮了！",
    "心跳…扑通扑通",
    "这座岛为你欢呼 ✦",
    "喜欢就多点亮几个嘛",
  ],
  night: [
    "这么晚还醒着呀…",
    "星星都困得眨眼睛了",
    "夜里的小岛最安静",
    "早点休息，岛替你守夜",
    "月光刚好，盖好被子",
  ],
} as const;

// 深夜时段（0-5 点）说夜话
function isNight(): boolean {
  const h = new Date().getHours();
  return h < 5;
}

function pick<T>(arr: readonly T[], not?: unknown): T {
  if (arr.length === 1) return arr[0];
  let v = arr[Math.floor(Math.random() * arr.length)];
  while (not !== undefined && v === not) v = arr[Math.floor(Math.random() * arr.length)];
  return v;
}

// 把拖拽位置限制在视口内（小岛锚点在右下角，x/y 为偏移量）
function clampPos(x: number, y: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    x: Math.min(16, Math.max(-(vw - 180), x)),
    y: Math.min(16, Math.max(-(vh - 250), y)),
  };
}

// 跟随小岛：开启"一键跟随"后漂浮在动态页右下角。
// 心情（开心/难过/发呆）各有专属漂浮动画与话术；
// 可任意拖拽摆放，位置记在本机；点击冒星星，点赞时欢呼。
export default function FollowIsland() {
  const [cfg, setCfg] = useState<IslandConfig | null>(null);
  const [burst, setBurst] = useState(0);
  const [cheer, setCheer] = useState(0);
  const [murmur, setMurmur] = useState<string | null>(null);
  const [mood, setMood] = useState<Mood>("happy");
  const [menuOpen, setMenuOpen] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [musicVisible, setMusicVisible] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const moodRef = useRef<Mood>("happy");
  const draggingRef = useRef(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const changeMood = (m: Mood) => {
    moodRef.current = m;
    setMood(m);
  };

  useEffect(() => {
    if (!loadFollow()) return;
    const saved = loadIslandConfig();
    setCfg(saved ?? defaultIslandConfig("guest"));
    const p = loadIslandPos();
    if (p) {
      const c = clampPos(p.x, p.y);
      x.set(c.x);
      y.set(c.y);
    }
    setMusicEnabled(loadIslandMusic());
    changeMood(pick(MOODS));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 播放器挂靠卡片可见性 → 菜单"♪ 音乐"高亮
  useEffect(() => onIslandMusicVisible(setMusicVisible), []);

  // 点小岛外部关闭菜单
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (rootRef.current && !rootRef.current.contains(t)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [menuOpen]);

  // 监听点赞成功事件 → 开心欢呼 + 说句应景的话
  useEffect(
    () =>
      onIslandCheer(() => {
        changeMood("happy");
        setCheer((v) => v + 1);
        setMurmur(pick(MURMURS.cheer));
      }),
    []
  );

  // 心情随机流转 + 呢喃轮换（互动话术优先展示满一轮再回归）
  useEffect(() => {
    if (!cfg) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = (delay: number) => {
      timer = setTimeout(() => {
        if (Math.random() < 0.3) changeMood(pick(MOODS));
        const pool = isNight() ? MURMURS.night : MURMURS.idle[moodRef.current];
        setMurmur((cur) => {
          const said = (arr: readonly string[]) => arr.includes(cur ?? "");
          return cur === null || said(MURMURS.poke) || said(MURMURS.cheer)
            ? pick(pool)
            : pick(pool, cur);
        });
        schedule(9000);
      }, delay);
    };
    schedule(3000);
    return () => clearTimeout(timer);
  }, [cfg]);

  // 点击小岛：切换功能菜单
  const onPoke = () => {
    if (draggingRef.current) return; // 刚拖完不算点击
    setMenuOpen((v) => !v);
  };

  // 菜单里的"摸摸小岛"：冒星星 + 被摸到发呆（保留原有点击趣味）
  const onPet = () => {
    setBurst((v) => v + 1);
    setMenuOpen(false);
    changeMood("dazed");
    setMurmur(pick(MURMURS.poke));
  };

  // 菜单里的"♪ 音乐"：唤起/收起挂靠的播放器卡片
  const onMusic = () => {
    setMenuOpen(false);
    toggleIslandMusic();
  };

  // 心情专属漂浮动画
  const moodFloat =
    mood === "happy"
      ? { animate: { y: [0, -9, 0] }, transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" as const } }
      : mood === "sad"
        ? { animate: { y: [0, -3, 0], rotate: [0, 1.2, 0] }, transition: { duration: 4.2, repeat: Infinity, ease: "easeInOut" as const } }
        : { animate: { rotate: [-2.2, 2.2, -2.2] }, transition: { duration: 3.6, repeat: Infinity, ease: "easeInOut" as const } };

  return (
    <AnimatePresence>
      {cfg && (
        <motion.div
          ref={rootRef}
          key="follow-island"
          initial={{ opacity: 0, y: 48, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 48, scale: 0.85 }}
          transition={{ type: "spring", stiffness: 140, damping: 16 }}
          className="group fixed bottom-5 right-4 z-30 sm:bottom-8 sm:right-8"
        >
          {/* 功能菜单：点小岛弹出，飘在小岛上方 */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                key="isle-menu"
                initial={{ opacity: 0, y: 10, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="glass absolute bottom-full right-1 mb-3 w-44 rounded-2xl p-1.5 shadow-xl"
              >
                <button
                  type="button"
                  onClick={onPet}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-moon transition hover:bg-white/10 hover:text-star"
                >
                  <span>✦</span> 摸摸小岛
                </button>
                {musicEnabled ? (
                  <button
                    type="button"
                    onClick={onMusic}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs transition hover:bg-white/10 ${
                      musicVisible ? "text-gold" : "text-moon hover:text-star"
                    }`}
                  >
                    <span>♪</span> 音乐
                    {musicVisible && <span className="ml-auto text-[9px] text-gold">播放中</span>}
                  </button>
                ) : (
                  <Link
                    href="/island"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-moon/45 transition hover:bg-white/10 hover:text-moon"
                  >
                    <span>♪</span> 音乐 <span className="ml-auto text-[9px]">去开启 →</span>
                  </Link>
                )}
                <Link
                  href="/island"
                  className="mt-0.5 flex w-full items-center gap-2 rounded-xl border-t border-white/10 px-3 py-2 text-left text-xs text-moon transition hover:bg-white/10 hover:text-star"
                >
                  <span>🏝</span> 装修我的小岛
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            drag
            dragMomentum={false}
            style={{ x, y }}
            onDragStart={() => {
              draggingRef.current = true;
            }}
            onDragEnd={() => {
              const c = clampPos(x.get(), y.get());
              x.set(c.x);
              y.set(c.y);
              saveIslandPos(c);
              broadcastIslandMoved(c);
              // click 在 dragEnd 之后同步触发，延后复位以吞掉误触的点击
              setTimeout(() => {
                draggingRef.current = false;
              }, 50);
            }}
            className="cursor-grab touch-none select-none active:cursor-grabbing"
          >
            <button
              type="button"
              onClick={onPoke}
              aria-label={`摸摸小岛（${MOOD_LABEL[mood]}中），冒星星`}
              className="relative block cursor-pointer"
            >
              {/* 欢呼：蹦跳两下 + 左右摇摆 */}
              <motion.div
                key={cheer}
                animate={
                  cheer > 0
                    ? { y: [0, -18, 0, -10, 0], rotate: [0, 5, -5, 2, 0] }
                    : undefined
                }
                transition={{ duration: 0.9, ease: "easeOut" }}
              >
                {/* 心情专属漂浮 */}
                <motion.div animate={moodFloat.animate} transition={moodFloat.transition}>
                  <div className="w-24 transition-transform duration-500 group-hover:scale-110 sm:w-32">
                    <IslandAvatar config={cfg} />
                  </div>
                </motion.div>
              </motion.div>

              {/* 点击冒星星：一圈星屑向外散开 */}
              {burst > 0 && (
                <span key={burst} className="pointer-events-none absolute inset-x-0 top-2">
                  {Array.from({ length: BURST_STARS }).map((_, i) => {
                    const angle = (i / BURST_STARS) * Math.PI * 2 + (burst % 4) * 0.5;
                    const dist = 34 + (i % 3) * 14;
                    return (
                      <motion.span
                        key={i}
                        className="absolute left-1/2 text-xs text-gold"
                        initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
                        animate={{
                          x: Math.cos(angle) * dist,
                          y: Math.sin(angle) * dist - 12,
                          opacity: 0,
                          scale: 1.25,
                        }}
                        transition={{ duration: 0.85, ease: "easeOut" }}
                      >
                        ✦
                      </motion.span>
                    );
                  })}
                </span>
              )}

              {/* 欢呼时头顶冒小心心 */}
              {cheer > 0 && (
                <span key={`cheer-${cheer}`} className="pointer-events-none absolute inset-x-0 top-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.span
                      key={i}
                      className="absolute left-1/2 text-sm text-gold"
                      initial={{ x: (i - 2) * 10, y: 0, opacity: 1 }}
                      animate={{ x: (i - 2) * 22, y: -46 - (i % 2) * 12, opacity: 0 }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    >
                      ❤
                    </motion.span>
                  ))}
                </span>
              )}
            </button>

            {/* 呢喃气泡：漂在小岛左上角，带当前心情标签 */}
            <div className="pointer-events-none absolute bottom-[55%] right-[62%] w-36 sm:w-44">
              <AnimatePresence mode="wait">
                {murmur && (
                  <motion.p
                    key={murmur}
                    initial={{ opacity: 0, y: 6, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="glass relative rounded-xl px-3 py-1.5 text-[11px] leading-relaxed text-star/90"
                  >
                    <span className="mr-1.5 text-[9px] tracking-widest text-gold/70">
                      {MOOD_LABEL[mood]}
                    </span>
                    {murmur}
                    <span className="absolute -bottom-1 right-5 h-2.5 w-2.5 rotate-45 bg-white/10" />
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <Link
              href="/island"
              className="mt-1 block text-center text-[10px] tracking-widest text-moon/60 transition-colors duration-300 hover:text-moon"
            >
              我的小岛 ✦
            </Link>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
