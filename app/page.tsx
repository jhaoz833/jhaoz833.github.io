"use client";

import Link from "next/link";
import { motion } from "motion/react";
import PostCard from "@/components/PostCard";
import WorkCard from "@/components/WorkCard";
import IslandVideo from "@/components/IslandVideo";
import postsData from "@/data/posts.json";
import worksData from "@/data/works.json";
import commentsJson from "@/data/comments.json";
import type { Post, PostThread, Work } from "@/lib/types";

const posts = (postsData as Post[]).slice(0, 3);
const works = (worksData as Work[]).slice(0, 2);
const commentsData = commentsJson as Record<string, PostThread>;

const grid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        {/* 星海地平线：云海剪影 + 极光缘，撑起画面下部 */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-48">
          <svg viewBox="0 0 1440 192" preserveAspectRatio="none" className="h-full w-full">
            <defs>
              <linearGradient id="hz-glow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#8ea2ff" stopOpacity="0.16" />
                <stop offset="1" stopColor="#8ea2ff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="hz-mist" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#141a3a" stopOpacity="0.85" />
                <stop offset="1" stopColor="#04050d" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="hz-mist2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#0a0e24" stopOpacity="0.95" />
                <stop offset="1" stopColor="#04050d" stopOpacity="1" />
              </linearGradient>
            </defs>
            <ellipse cx="360" cy="196" rx="640" ry="86" fill="url(#hz-glow)" />
            <ellipse cx="1080" cy="200" rx="680" ry="94" fill="url(#hz-glow)" opacity="0.7" />
            <path
              d="M0 148 Q 170 122 350 140 T 710 132 T 1070 144 T 1440 128 L1440 192 L0 192 Z"
              fill="url(#hz-mist)"
            />
            <path
              d="M0 166 Q 220 148 440 160 T 880 154 T 1440 150 L1440 192 L0 192 Z"
              fill="url(#hz-mist2)"
            />
            <circle cx="250" cy="118" r="1.4" fill="#e9ecff" opacity="0.8" />
            <circle cx="520" cy="96" r="1.1" fill="#f5d9a0" opacity="0.7" />
            <circle cx="890" cy="108" r="1.3" fill="#e9ecff" opacity="0.75" />
            <circle cx="1210" cy="90" r="1.2" fill="#b39dff" opacity="0.7" />
          </svg>
        </div>
        <motion.span
          className="absolute left-[16%] top-[28%] text-lg text-gold/80"
          animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        >
          ✦
        </motion.span>
        <motion.span
          className="absolute right-[18%] top-[36%] text-sm text-aurora/70"
          animate={{ y: [0, 8, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        >
          ✦
        </motion.span>
        <motion.span
          className="absolute bottom-[26%] left-[26%] text-xs text-nebula/70"
          animate={{ y: [0, -6, 0], opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        >
          ✦
        </motion.span>

        <motion.p
          className="mb-5 text-xs tracking-[0.5em] text-moon"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          ✦ 欢迎登陆
        </motion.p>

        <motion.h1
          className="gradient-text text-glow font-display text-7xl font-black tracking-[0.22em] sm:text-8xl"
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.55, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          浮岛
        </motion.h1>

        <motion.p
          className="mt-6 max-w-md leading-relaxed text-moon"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          一座漂浮在星海里的小岛，
          <br />
          收藏我的图片、文字与心情。
        </motion.p>

        <motion.div
          className="mt-10 flex gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15, duration: 0.8 }}
        >
          <Link
            href="/moments"
            className="rounded-full bg-aurora px-6 py-2.5 text-sm font-medium text-void shadow-[0_0_30px_-6px_rgba(142,162,255,0.7)] transition hover:brightness-110"
          >
            进入动态
          </Link>
          <Link
            href="/works"
            className="glass rounded-full px-6 py-2.5 text-sm text-star transition hover:border-aurora/40"
          >
            看看作品
          </Link>
        </motion.div>

        <motion.span
          className="absolute bottom-10 animate-bob text-moon"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
          ↓
        </motion.span>
      </section>

      {/* 浮岛名片 */}
      <section className="mx-auto max-w-3xl px-5 pb-6 pt-14">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-lg font-semibold text-star">✦ 关于浮岛</h2>
          <Link href="/about" className="text-sm text-moon transition hover:text-aurora">
            了解岛主 →
          </Link>
        </div>
        <IslandVideo>
          <p className="text-sm leading-relaxed text-moon">
            一座漂浮在星海里的小岛。岛主把拍下的、画下的、想到的一切都存放在这里，
            每一条动态落岛时都带着自己选定的入场动画。欢迎在评论区留下你的脚印，做这座岛的第一批岛民。
          </p>
        </IslandVideo>
      </section>

      {/* 最新动态 */}
      <section className="mx-auto max-w-3xl px-5 pb-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-star">
            ✦ 最新动态
            <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-normal text-gold/80 ring-1 ring-gold/20">
              示例
            </span>
          </h2>
          <Link href="/moments" className="text-sm text-moon transition hover:text-aurora">
            全部动态 →
          </Link>
        </div>
        <div className="space-y-6 [perspective:1200px]">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} thread={commentsData[p.id]} />
          ))}
        </div>
      </section>

      {/* 精选作品 */}
      <section className="mx-auto max-w-6xl px-5 pb-10 pt-10">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-lg font-semibold text-star">✦ 精选作品</h2>
          <Link href="/works" className="text-sm text-moon transition hover:text-aurora">
            前往作品集 →
          </Link>
        </div>
        <motion.div
          variants={grid}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-5 sm:grid-cols-2"
        >
          {works.map((w) => (
            <WorkCard key={w.slug} work={w} />
          ))}
        </motion.div>
      </section>
    </div>
  );
}
