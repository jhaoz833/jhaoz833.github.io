"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import IslandAvatar, { type IslandConfig } from "@/components/IslandAvatar";
import { loadFollow, loadIslandConfig } from "@/lib/island-store";

// 跟随小岛：开启"一键跟随"后，你的专属小岛漂浮在动态页右下角
export default function FollowIsland() {
  const [cfg, setCfg] = useState<IslandConfig | null>(null);

  useEffect(() => {
    if (!loadFollow()) return;
    const saved = loadIslandConfig();
    if (saved) setCfg(saved);
  }, []);

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
          <Link href="/island" aria-label="回到我的小岛" className="block">
            <div className="animate-float-slow w-24 transition-transform duration-500 group-hover:scale-110 sm:w-32">
              <IslandAvatar config={cfg} />
            </div>
            <span className="pointer-events-none mt-1 block text-center text-[10px] tracking-widest text-moon/0 transition-colors duration-300 group-hover:text-moon/80">
              我的小岛 ✦
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
