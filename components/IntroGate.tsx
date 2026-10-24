"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

// 上线入场动画：星光汇聚 → 站名浮现 → 淡出进入全站。
// 每次会话只播一次（sessionStorage），点击可跳过。
export default function IntroGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const played = window.sessionStorage.getItem("fudao-intro");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (played || reduced) return;
    window.sessionStorage.setItem("fudao-intro", "1");
    setShow(true);
    const t = setTimeout(() => setShow(false), 4600);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-void"
          onClick={() => setShow(false)}
          exit={{ opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          <motion.div
            className="absolute h-2 w-2 rounded-full bg-star"
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{
              scale: [0.2, 1.8, 1],
              opacity: [0, 1, 1],
              boxShadow: [
                "0 0 0px rgba(142,162,255,0)",
                "0 0 70px 22px rgba(142,162,255,0.8)",
                "0 0 44px 10px rgba(142,162,255,0.55)",
              ],
            }}
            transition={{ duration: 1.4, times: [0, 0.55, 1], ease: "easeOut" }}
          />
          <motion.h1
            className="gradient-text text-glow text-6xl font-bold tracking-[0.3em] sm:text-7xl"
            initial="hidden"
            animate="show"
            variants={{
              show: { transition: { delayChildren: 1.1, staggerChildren: 0.16 } },
            }}
          >
            {"浮岛".split("").map((ch, i) => (
              <motion.span
                key={i}
                className="inline-block"
                variants={{
                  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
                  show: {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    transition: { duration: 0.7, ease: [0.2, 0.7, 0.2, 1] },
                  },
                }}
              >
                {ch}
              </motion.span>
            ))}
          </motion.h1>
          <motion.p
            className="mt-5 text-xs tracking-[0.6em] text-moon"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.9, duration: 0.8 }}
          >
            FLOATING ISLAND
          </motion.p>
          <motion.span
            className="absolute bottom-12 text-xs tracking-widest text-moon/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.4, duration: 0.6 }}
          >
            点击任意处进入 ✦
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
