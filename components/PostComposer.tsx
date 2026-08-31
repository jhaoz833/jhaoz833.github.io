"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { authReady, getAuthSnapshot, subscribeAuth } from "@/lib/gh-auth";
import { communityReady } from "@/lib/site";
import { createCommunityPost } from "@/lib/gh-api";
import { useSyncExternalStore } from "react";

// 社区动态发布框：登录者可在动态流顶部直接发言
export default function PostComposer() {
  const auth = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthSnapshot);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");

  if (!communityReady()) return null;

  if (!authReady() || !auth.token) {
    return (
      <div className="glass mb-6 rounded-2xl p-4 text-center text-sm text-moon">
        <a href="/island" className="text-aurora underline underline-offset-2">
          登陆上岛
        </a>{" "}
        后可以在这里发动态，和大家分享你的瞬间 ✦
      </div>
    );
  }

  const submit = async () => {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setError("");
    try {
      await createCommunityPost(auth.token, body);
      setText("");
      setOk(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "发布失败";
      setError(
        msg.includes("scope") || msg.includes("granted")
          ? "令牌缺少发帖权限：去 github.com/settings/tokens 给它勾上 public_repo"
          : msg
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass mb-8 rounded-2xl p-4"
    >
      <div className="flex gap-3">
        {auth.me?.avatar && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={auth.me.avatar}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full ring-1 ring-aurora/30"
          />
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder={`${auth.me?.name ?? "岛民"}，分享点什么给岛上的人吧…（图片可贴 markdown 链接）`}
          className="flex-1 resize-none rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm leading-relaxed text-star placeholder:text-moon/50 focus:border-aurora/50 focus:outline-none"
        />
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <p className="text-xs text-moon/60">
          {ok ? "已发布！同步后出现在下方动态流（≤1 小时，可去 Actions 手动触发立即生效）" : "发布后自动同步进动态流，同步期间所有人可见"}
        </p>
        <button
          onClick={submit}
          disabled={busy || !text.trim()}
          className="rounded-full bg-aurora px-5 py-1.5 text-sm font-medium text-void shadow-[0_0_24px_-8px_rgba(142,162,255,0.8)] transition hover:brightness-110 disabled:opacity-50"
        >
          {busy ? "发布中…" : "✦ 发个动态"}
        </button>
      </div>
      {error && (
        <p className="mt-2 rounded-lg bg-red-500/10 p-2.5 text-xs text-red-300 ring-1 ring-red-400/30">
          ⚠ {error}
        </p>
      )}
    </motion.div>
  );
}
