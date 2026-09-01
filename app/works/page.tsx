"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import worksData from "@/data/works.json";
import type { Work } from "@/lib/types";
import { useStars } from "@/lib/use-stars";

const works = worksData as Work[];

function Plate({ w }: { w: Work }) {
  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-xl font-semibold text-star">{w.title}</h3>
        <span className="shrink-0 text-sm text-moon/70">{w.year}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {w.tags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-aurora/10 px-2.5 py-1 text-[11px] text-aurora ring-1 ring-aurora/20"
          >
            {t}
          </span>
        ))}
      </div>
      <p className="mt-4 leading-relaxed text-moon">{w.description}</p>
      {w.acquired && (
        <p className="mt-3 text-[11px] tracking-widest text-moon/50">
          入藏于 {w.acquired}
        </p>
      )}
    </>
  );
}

export default function WorksPage() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("全部");

  const allTags = useMemo(
    () => ["全部", ...Array.from(new Set(works.flatMap((w) => w.tags)))],
    []
  );
  const filtered = useMemo(
    () => (filter === "全部" ? works : works.filter((w) => w.tags.includes(filter))),
    [filter]
  );
  const years = useMemo(
    () => Array.from(new Set(filtered.map((w) => w.year))).sort((a, b) => b.localeCompare(a)),
    [filtered]
  );

  const featured = filtered.find((w) => w.featured);
  const rest = filtered.filter((w) => w !== featured);

  const ids = useMemo(() => works.map((w) => w.slug), []);
  const { stars, mine, giveStar } = useStars(ids);

  // 灯箱内键盘翻页
  useEffect(() => {
    if (activeIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveIdx(null);
      if (e.key === "ArrowRight") setActiveIdx((i) => (i === null ? null : (i + 1) % filtered.length));
      if (e.key === "ArrowLeft")
        setActiveIdx((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIdx, filtered.length]);

  const active = activeIdx !== null ? filtered[activeIdx] : null;

  return (
    <div className="mx-auto max-w-6xl px-5 pb-10 pt-28">
      <header className="mb-10 text-center">
        <p className="text-xs tracking-[0.5em] text-moon">✦ TREASURY</p>
        <h1 className="gradient-text mt-3 text-3xl font-bold">宝库</h1>
        <p className="mt-3 text-sm text-moon/80">
          白天做设计，晚上收集星光——岛所珍视的，都在这里
        </p>
        <p className="mt-1 text-xs text-moon/50">{works.length} 件藏品</p>
      </header>

      {/* 巡展路线（标签筛选） */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {allTags.map((t) => (
          <button
            key={t}
            onClick={() => {
              setFilter(t);
              setActiveIdx(null);
            }}
            className={`rounded-full px-3.5 py-1.5 text-xs transition ${
              filter === t
                ? "bg-gold/90 font-medium text-[#0a0e1f]"
                : "bg-white/5 text-moon ring-1 ring-white/10 hover:text-star"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-20 text-center text-sm text-moon/60">宝藏还在路上 ✦</p>
      ) : (
        <div className="relative">
          {/* 年代轴（桌面端） */}
          <div className="pointer-events-none absolute -left-14 top-0 hidden select-none flex-col gap-4 text-xs tracking-widest text-moon/40 xl:flex">
            {years.map((y) => (
              <span key={y}>— {y}</span>
            ))}
          </div>

          {/* 策展区：精选大卡 */}
          {featured && (
            <motion.button
              layout
              onClick={() => setActiveIdx(filtered.indexOf(featured))}
              className="group relative mb-6 block w-full overflow-hidden rounded-3xl text-left ring-1 ring-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={featured.image}
                alt={featured.title}
                className="h-72 w-full object-cover transition duration-700 group-hover:scale-105 sm:h-96"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-void/90 via-void/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-6">
                <div>
                  <p className="text-[10px] tracking-[0.4em] text-gold">FEATURED · 策展</p>
                  <h2 className="mt-1.5 text-2xl font-bold text-star">{featured.title}</h2>
                  <p className="mt-1 max-w-lg text-sm text-moon/90">{featured.description}</p>
                </div>
                <span className="glass rounded-full px-3 py-1 text-xs text-moon">
                  ✦ 被献星 {stars[featured.slug] || 0} 次
                </span>
              </div>
            </motion.button>
          )}

          {/* 巡展区：大小混排 */}
          <motion.div
            layout
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {rest.map((w, i) => (
              <motion.button
                layout
                key={w.slug}
                onClick={() => setActiveIdx(filtered.indexOf(w))}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                className={`group relative overflow-hidden rounded-3xl ring-1 ring-white/10 ${
                  i === 0 && !featured ? "sm:col-span-2 lg:col-span-2 lg:row-span-2" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={w.image}
                  alt={w.title}
                  className={`w-full object-cover transition duration-700 group-hover:scale-105 ${
                    i === 0 && !featured ? "h-72 sm:h-full sm:min-h-[28rem]" : "h-56"
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-void/85 via-transparent to-transparent opacity-80 transition group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-semibold text-star">{w.title}</h3>
                  <p className="mt-0.5 text-xs text-moon/80">
                    {w.year} · ✦ {stars[w.slug] || 0}
                  </p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>
      )}

      <p className="mt-10 text-center text-[11px] tracking-widest text-moon/40">
        ✦ 部分藏品为示意，正式入藏后将陆续替换
      </p>

      {/* 灯箱：聚光展台 */}
      <AnimatePresence>
        {active && (
          <motion.div
            key="overlay"
            className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-void/95 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveIdx(null)}
          >
            {/* 左右翻页 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveIdx((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length));
              }}
              aria-label="上一件藏品"
              className="glass absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full px-3 py-2 text-moon transition hover:text-star"
            >
              ←
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveIdx((i) => (i === null ? null : (i + 1) % filtered.length));
              }}
              aria-label="下一件藏品"
              className="glass absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full px-3 py-2 text-moon transition hover:text-star"
            >
              →
            </button>

            <motion.div
              key={active.slug}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 34, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="glass relative w-full max-w-3xl overflow-hidden rounded-3xl shadow-[0_0_80px_-20px_rgba(142,162,255,0.35)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.image}
                alt={active.title}
                className="max-h-[52vh] w-full object-cover"
              />
              <div className="flex flex-wrap items-start justify-between gap-4 p-6 sm:flex-nowrap">
                <div className="min-w-0 flex-1">
                  <Plate w={active} />
                </div>
                <div className="flex shrink-0 flex-col items-center gap-2 border-white/10 pt-1 sm:border-l sm:pl-5">
                  <button
                    onClick={() => !mine.has(active.slug) && giveStar(active.slug)}
                    aria-label="献上一颗星"
                    className={`flex flex-col items-center gap-1 rounded-2xl px-5 py-3 transition ${
                      mine.has(active.slug)
                        ? "bg-gold/15 text-gold ring-1 ring-gold/40"
                        : "bg-white/5 text-moon ring-1 ring-white/15 hover:bg-gold/10 hover:text-gold"
                    }`}
                  >
                    <span className={`text-2xl ${mine.has(active.slug) ? "animate-pulse" : ""}`}>
                      ✦
                    </span>
                    <span className="text-xs">{mine.has(active.slug) ? "已献星" : "献星"}</span>
                  </button>
                  <span className="text-xs text-moon/60">被献星 {stars[active.slug] || 0} 次</span>
                </div>
              </div>
            </motion.div>

            <button
              onClick={() => setActiveIdx(null)}
              className="glass absolute right-4 top-4 rounded-full px-4 py-2 text-xs text-moon transition hover:text-star"
            >
              关闭 ESC
            </button>
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] tracking-widest text-moon/40">
              ← → 切换藏品
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
