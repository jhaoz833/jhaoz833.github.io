"use client";

import { useState, useSyncExternalStore } from "react";
import { motion } from "motion/react";
import type { Post, PostComment, PostThread } from "@/lib/types";
import { GISCUS } from "@/lib/giscus";
import {
  authReady,
  getAuthSnapshot,
  recordMyLike,
  subscribeAuth,
  unrecordMyLike,
} from "@/lib/gh-auth";
import { postComment, toggleHeart } from "@/lib/gh-api";
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
  const [open, setOpen] = useState(false);
  const [likeDelta, setLikeDelta] = useState(0);
  const [likeBusy, setLikeBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [extra, setExtra] = useState<PostComment[]>([]);
  const [likeError, setLikeError] = useState("");
  const auth = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthSnapshot);
  const loggedIn = authReady() && Boolean(auth.token);

  // 真实点赞数 = 数据基线 + 讨论帖表情数（每小时同步）+ 本次会话的即时变化
  const likeCount = post.likes + (thread?.likes ?? 0) + likeDelta;
  const likeUrl = thread
    ? `https://github.com/${GISCUS.repo}/discussions/${thread.number}`
    : `https://github.com/${GISCUS.repo}/discussions`;
  const allComments = [...extra, ...(thread?.comments ?? [])];

  const onLike = async () => {
    setSpark((v) => v + 1);
    if (!authReady() || !thread?.nodeId) {
      window.open(likeUrl, "_blank");
      return;
    }
    if (!auth.token) {
      window.location.href = "/island";
      return;
    }
    if (likeBusy) return;
    setLikeBusy(true);
    setLikeError("");
    try {
      const r = await toggleHeart(auth.token, thread.nodeId, thread.number);
      if (r === "liked") {
        setLikeDelta((v) => v + 1);
        recordMyLike(post.id);
      } else {
        setLikeDelta((v) => v - 1);
        unrecordMyLike(post.id);
      }
    } catch (e) {
      // 不再静默跳转：把真实原因亮出来
      setLikeError(
        (e instanceof Error ? e.message : "点赞失败") +
          "（可去讨论帖手动点亮）"
      );
    } finally {
      setLikeBusy(false);
    }
  };

  const submitComment = async () => {
    const body = draft.trim();
    if (!body || !thread?.nodeId || posting || !auth.token) return;
    setPosting(true);
    try {
      const c = await postComment(auth.token, thread.nodeId, body);
      setExtra((prev) => [c, ...prev]);
      setDraft("");
      setLikeError("");
    } catch (e) {
      setLikeError(
        (e instanceof Error ? e.message : "评论失败") +
          "（你的令牌可能缺少互动权限，可退出后用 ghp_ 经典令牌重新登录）"
      );
    } finally {
      setPosting(false);
    }
  };

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
            <button
              onClick={onLike}
              disabled={likeBusy}
              className="relative flex items-center gap-1.5 transition-colors hover:text-gold disabled:opacity-60"
              title={loggedIn ? "点亮 / 取消 ❤️" : "登陆后可一键点亮"}
              aria-label="点赞"
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
            </button>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1 transition-colors hover:text-aurora"
              aria-expanded={open}
            >
              💬 {allComments.length || post.comments}
            </button>
          </div>
        </div>
        {open && (
          <div className="mt-4 border-t border-white/10 pt-4">
            {likeError && (
              <p className="mb-3 rounded-xl bg-red-500/10 p-3 text-xs leading-relaxed text-red-300 ring-1 ring-red-400/30">
                ⚠ {likeError}
              </p>
            )}
            <p className="mb-3 text-xs text-moon">
              ✦ 评论{allComments.length ? ` · ${allComments.length} 条` : ""}
            </p>
            {/* 登录后可原地评论 */}
            {loggedIn && thread?.nodeId ? (
              <div className="mb-4 flex gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={2}
                  placeholder={`以 ${auth.me?.name ?? "岛民"} 的身份说点什么…`}
                  className="flex-1 resize-none rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-star placeholder:text-moon/50 focus:border-aurora/50 focus:outline-none"
                />
                <button
                  onClick={submitComment}
                  disabled={posting || !draft.trim()}
                  className="self-end rounded-full bg-aurora px-4 py-2 text-xs font-medium text-void disabled:opacity-50"
                >
                  {posting ? "发送中…" : "发表"}
                </button>
              </div>
            ) : (
              <p className="mb-4 text-xs text-moon/70">
                {authReady() ? (
                  <>
                    <a href="/island" className="text-aurora underline underline-offset-2">
                      登陆上岛
                    </a>{" "}
                    后可以直接在这里评论、一键点赞
                  </>
                ) : (
                  <a
                    href={likeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-aurora underline underline-offset-2"
                  >
                    去 GitHub 评论 →
                  </a>
                )}
              </p>
            )}
            {allComments.length > 0 ? (
              <ul className="space-y-3">
                {allComments.map((c, i) => (
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
