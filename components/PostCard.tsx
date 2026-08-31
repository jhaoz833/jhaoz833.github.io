"use client";

import { useState } from "react";
import { motion } from "motion/react";
import type { Post, PostThread } from "@/lib/types";
import { GISCUS } from "@/lib/giscus";
import {
  POST_ANIMATIONS,
  cardVariants,
  resolveAnimation,
  textCharVariants,
} from "@/lib/animations";
import Comments from "@/components/Comments";

export default function PostCard({
  post,
  thread,
}: {
  post: Post;
  thread?: PostThread;
}) {
  const anim = resolveAnimation(post.animation);
  const [spark, setSpark] = useState(0);
  // 真实点赞数 = 数据里记录的 + 讨论帖表情数（每小时同步）
  const likeCount = post.likes + (thread?.likes ?? 0);
  const likeUrl = thread
    ? `https://github.com/${GISCUS.repo}/discussions/${thread.number}`
    : `https://github.com/${GISCUS.repo}/discussions`;

  return (
    <motion.article
      variants={cardVariants[anim]}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      <div className="glass card-glow float-isle overflow-hidden rounded-2xl">
      {post.images.length > 0 && (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.images[0]}
            alt=""
            className="h-52 w-full object-cover sm:h-64"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-mist/80 via-transparent to-transparent" />
        </div>
      )}

      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-aurora/20 text-xs text-aurora ring-1 ring-aurora/30">
              ✦
            </span>
            <span className="text-star/90">{post.author}</span>
            <span className="text-moon/70">· {post.createdAt}</span>
          </div>
          <span
            className="shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-moon ring-1 ring-white/10"
            title="发布者选定的入场动画"
          >
            ✦ {POST_ANIMATIONS[anim].label}
          </span>
        </div>

        {anim === "typewriter" ? (
          <motion.p
            className="mt-3 leading-relaxed text-star/90"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.035 } } }}
          >
            {post.text.split("").map((ch, i) => (
              <motion.span key={i} variants={textCharVariants} className="inline-block whitespace-pre">
                {ch}
              </motion.span>
            ))}
          </motion.p>
        ) : (
          <p className="mt-3 leading-relaxed text-star/90">{post.text}</p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <span key={t} className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-moon">
                #{t}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 text-sm text-moon">
            <a
              href={likeUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => setSpark((v) => v + 1)}
              className="relative flex items-center gap-1.5 transition-colors hover:text-gold"
              title="用 GitHub 账号点亮 ❤️（跳转到这条动态的讨论帖）"
              aria-label="点赞（GitHub 账号）"
            >
              {spark > 0 && (
                <motion.span
                  key={spark}
                  className="pointer-events-none absolute -top-2 left-1/2"
                  initial={{ opacity: 1 }}
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <motion.span
                      key={i}
                      className="absolute text-[10px] text-gold"
                      initial={{ x: 0, y: 0, opacity: 1 }}
                      animate={{
                        x: Math.cos((i / 6) * Math.PI * 2) * 24,
                        y: Math.sin((i / 6) * Math.PI * 2) * 24,
                        opacity: 0,
                      }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                    >
                      ✦
                    </motion.span>
                  ))}
                </motion.span>
              )}
              <span>♡</span>
              {likeCount}
            </a>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1 transition-colors hover:text-aurora"
              aria-expanded={open}
            >
              💬 {thread ? thread.comments.length : post.comments}
            </button>
          </div>
        </div>
        {open && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="mb-3 text-xs text-moon">
              ✦ 评论{thread ? ` · ${thread.comments.length} 条` : ""}
            </p>
            {thread && thread.comments.length > 0 ? (
              <ul className="space-y-3">
                {thread.comments.map((c, i) => (
                  <li key={i} className="flex gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {c.avatar ? (
                      <img
                        src={c.avatar}
                        alt=""
                        className="h-7 w-7 shrink-0 rounded-full ring-1 ring-white/15"
                      />
                    ) : (
                      <span className="h-7 w-7 shrink-0 rounded-full bg-aurora/20 ring-1 ring-aurora/30" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-moon">
                        <span className="text-star/90">{c.login}</span> · {c.createdAt}
                        {c.likes > 0 && <span className="ml-1.5">❤ {c.likes}</span>}
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-star/85">
                        {c.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-moon/60">还没有评论，来抢沙发～</p>
            )}
            <Comments
              term={post.id}
              discussionUrl={
                thread
                  ? `https://github.com/${GISCUS.repo}/discussions/${thread.number}`
                  : undefined
              }
            />
          </div>
        )}
      </div>
      </div>
    </motion.article>
  );
}
