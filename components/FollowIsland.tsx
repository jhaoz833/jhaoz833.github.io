"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import IslandAvatar, { type IslandConfig } from "@/components/IslandAvatar";
import { loadFollow, loadIslandConfig } from "@/lib/island-store";
import { onIslandCheer } from "@/lib/island-events";

const BURST_STARS = 10;

// 小岛呢喃话术库
const MURMURS = {
  idle: [
    "今晚的星星真亮呀 ✦",
    "风从星海那边吹来…",
    "飘着飘着，就到这里了",
    "云下面是什么样子呢",
    "岛上的灯塔又亮了",
    "听说流星今晚路过",
    "安静得能听见星光",
    "这里的时间走得很慢",
  ],
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
} as const;

function pick<T>(arr: readonly T[], not?: unknown): T {
  if (arr.length === 1) return arr[0];
  let v = arr[Math.floor(Math.random() * arr.length)];
  while (not !== undefined && v === not) v = arr[Math.floor(Math.random() * arr.length)];
  return v;
}

// 跟随小岛：开启"一键跟随"后，你的专属小岛漂浮在动态页右下角。
// 点击小岛冒星星；点赞动态成功时小岛欢呼（蹦跳 + 头顶冒小心心）。
export default function FollowIsland() {
  const [cfg, setCfg] = useState<IslandConfig | null>(null);
  const [burst, setBurst] = useState(0);
  const [cheer, setCheer] = useState(0);
  const [murmur, setMurmur] = useState<string | null>(null);

  useEffect(() => {
    if (!loadFollow()) return;
    const saved = loadIslandConfig();
    if (saved) setCfg(saved);
  }, []);

  // 监听点赞成功事件 → 欢呼 + 说句应景的话
  useEffect(
    () =>
      onIslandCheer(() => {
        setCheer((v) => v + 1);
        setMurmur(pick(MURMURS.cheer));
      }),
    []
  );

  // 平时每隔一会儿换一句呢喃（互动话语显示一段时间后回归闲聊）
  useEffect(() => {
    if (!cfg) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = (delay: number) => {
      timer = setTimeout(() => {
        setMurmur((cur) => {
          const said = (arr: readonly string[]) => arr.includes(cur ?? "");
          // 互动话术优先展示满一轮，再换回闲聊
          return cur === null || said(MURMURS.cheer) || said(MURMURS.poke)
            ? pick(MURMURS.idle)
            : pick(MURMURS.idle, cur);
        });
        schedule(9000);
      }, delay);
    };
    schedule(3000);
    return () => clearTimeout(timer);
  }, [cfg]);

  return (
    <AnimatePresence>
      {cfg && (
        <motion.div
          key="follow-island"
          initial={{ opacity: 0, y: 48, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 48, scale: 0.85 }}
          transition={{ type: "spring", stiffness: 140, damping: 16 }}
          className="group fixed bottom-5 right-4 z-30 sm:bottom-8 sm:right-8"
        >
          <button
            type="button"
            onClick={() => {
              setBurst((v) => v + 1);
              setMurmur(pick(MURMURS.poke));
            }}
            aria-label="摸摸小岛，冒星星"
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
              className="animate-float-slow w-24 transition-transform duration-500 group-hover:scale-110 sm:w-32"
            >
              <IslandAvatar config={cfg} />
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

          {/* 呢喃气泡：漂在小岛左上角，随话语轮换淡入淡出 */}
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
      )}
    </AnimatePresence>
  );
}
