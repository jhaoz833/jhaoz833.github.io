"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import LoginPanel from "@/components/LoginPanel";
import {
  authReady,
  getAuthSnapshot,
  joinedAt,
  logout,
  subscribeAuth,
  getMyLikes,
} from "@/lib/gh-auth";
import postsData from "@/data/posts.json";
import commentsJson from "@/data/comments.json";
import type { Post, PostThread } from "@/lib/types";

const posts = postsData as Post[];
const threads = commentsJson as Record<string, PostThread>;

export default function IslandPage() {
  const auth = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthSnapshot);
  const [mounted, setMounted] = useState(false);
  const [likes, setLikes] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    setLikes(getMyLikes());
  }, [auth.token]);

  if (!mounted) return <div className="pt-32" />;

  const me = auth.me;

  return (
    <div className="mx-auto max-w-2xl px-5 pb-16 pt-28">
      <header className="mb-8 text-center">
        <p className="text-xs tracking-[0.5em] text-moon">✦ 岛屿</p>
        <h1 className="gradient-text mt-3 text-3xl font-bold">
          {me ? `${me.name} 的小岛` : "你的专属小岛"}
        </h1>
      </header>

      {!authReady() ? (
        <section className="glass rounded-3xl p-8 text-center">
          <p className="text-sm leading-relaxed text-moon">
            登陆系统正在铺设中。<br />开通后，你可以用 GitHub 账号上岛、一键点赞、原地评论。
          </p>
        </section>
      ) : !me ? (
        <section className="glass rounded-3xl p-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/floating-island.svg"
            alt=""
            className="mx-auto h-32 w-32 animate-float-slow"
          />
          <p className="mt-4 text-sm leading-relaxed text-moon">
            你还没有登陆上岛。<br />登陆后可以一键点赞、原地评论，并拥有这座专属小岛。
          </p>
          <div className="mt-6">
            <LoginPanel />
          </div>
        </section>
      ) : (
        <>
          {/* 身份卡 */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass float-isle rounded-3xl p-6 text-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={me.avatar}
              alt=""
              className="mx-auto h-20 w-20 rounded-full ring-2 ring-aurora/40"
            />
            <h2 className="mt-3 text-lg font-semibold text-star">{me.name}</h2>
            <p className="mt-1 text-xs text-moon">
              @{me.login} · {joinedAt() || "刚刚"} 登岛上岛
            </p>
            <button
              onClick={logout}
              className="mt-3 text-xs text-moon/70 underline-offset-2 hover:text-star hover:underline"
            >
              退出登陆
            </button>
          </motion.section>

          {/* 我赞过的 */}
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold tracking-widest text-star">✦ 我赞过的</h2>
            {likes.length === 0 ? (
              <p className="glass rounded-2xl p-4 text-xs text-moon/70">
                还没有点亮过动态，去 <Link href="/moments" className="text-aurora">动态页</Link> 逛逛吧
              </p>
            ) : (
              <ul className="space-y-2">
                {likes
                  .map((id) => posts.find((p) => p.id === id))
                  .filter((p): p is Post => Boolean(p))
                  .map((p) => (
                    <li key={p.id}>
                      <Link
                        href="/moments"
                        className="glass card-glow flex items-center justify-between rounded-2xl px-4 py-3 text-sm"
                      >
                        <span className="truncate text-star/90">❤️ {p.text.slice(0, 26)}</span>
                        <span className="ml-3 shrink-0 text-xs text-moon/70">{p.createdAt}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </section>

          {/* 我的评论 */}
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold tracking-widest text-star">✦ 我的评论</h2>
            {(() => {
              const mine = Object.values(threads)
                .flatMap((t) => t.comments)
                .filter((c) => c.login.toLowerCase() === me.login.toLowerCase());
              return mine.length === 0 ? (
                <p className="glass rounded-2xl p-4 text-xs text-moon/70">
                  还没有留下评论，去动态里打个招呼吧
                </p>
              ) : (
                <ul className="space-y-2">
                  {mine.map((c, i) => (
                    <li key={i} className="glass rounded-2xl px-4 py-3 text-sm text-star/85">
                      {c.body.slice(0, 60)}
                      <span className="mt-1 block text-xs text-moon/70">{c.createdAt}</span>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </section>
        </>
      )}
    </div>
  );
}
