"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import changelog from "@/data/changelog.json";
import autoLog from "@/data/auto-changelog.json";

type Entry = { date: string; title: string; items: string[] };

// 手写精编公告 + 构建时从 git 提交自动生成的公告，按日期合并
// （自动公告跳过手写已覆盖的日期，不会重复）
const manual = changelog as Entry[];
const auto = autoLog as Entry[];
const entries = [...manual, ...auto].sort((a, b) => b.date.localeCompare(a.date));

// 岛屿公告：每次打开"关于"页都会弹出的更新说明
export default function Announcements() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="notice"
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-void/80 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShow(false)}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="glass w-full max-w-md rounded-3xl p-6"
          >
            <p className="text-center text-xs tracking-[0.5em] text-moon">✦ 岛屿公告</p>
            <h2 className="gradient-text text-glow mt-3 text-center text-xl font-bold">
              {entries[0]?.title}
            </h2>
            <p className="mt-1 text-center text-xs text-moon/70">{entries[0]?.date}</p>

            <ul className="mt-4 space-y-2.5">
              {entries[0]?.items.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.07 }}
                  className="rounded-xl bg-white/5 px-3.5 py-2.5 text-sm leading-relaxed text-star/90 ring-1 ring-white/10"
                >
                  {item}
                </motion.li>
              ))}
            </ul>

            {entries.length > 1 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-center text-xs text-moon/70 hover:text-star">
                  查看往期更新
                </summary>
                <div className="mt-3 space-y-3">
                  {entries.slice(1).map((e) => (
                    <div key={e.date} className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                      <p className="text-xs text-star/80">
                        {e.title} <span className="text-moon/60">· {e.date}</span>
                      </p>
                      <ul className="mt-1.5 space-y-1 text-xs text-moon">
                        {e.items.map((it, j) => (
                          <li key={j}>· {it}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </details>
            )}

            <button
              onClick={() => setShow(false)}
              className="mt-5 w-full rounded-full bg-aurora py-2.5 text-sm font-medium text-void transition hover:brightness-110"
            >
              知道了，去逛逛
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
