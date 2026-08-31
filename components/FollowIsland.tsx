"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import IslandAvatar, { type IslandConfig } from "@/components/IslandAvatar";
import { loadFollow, loadIslandConfig } from "@/lib/island-store";
import { onIslandCheer } from "@/lib/island-events";

const BURST_STARS = 10;

// 跟随小岛：开启"一键跟随"后，你的专属小岛漂浮在动态页右下角。
// 点击小岛冒星星；点赞动态成功时小岛欢呼（蹦跳 + 头顶冒小心心）。
export default function FollowIsland() {
  const [cfg, setCfg] = useState<IslandConfig | null>(null);
  const [burst, setBurst] = useState(0);
  const [cheer, setCheer] = useState(0);

  useEffect(() => {
    if (!loadFollow()) return;
    const saved = loadIslandConfig();
    if (saved) setCfg(saved);
  }, []);

  // 监听点赞成功事件 → 欢呼
  useEffect(() => onIslandCheer(() => setCheer((v) => v + 1)), []);

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
            onClick={() => setBurst((v) => v + 1)}
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
