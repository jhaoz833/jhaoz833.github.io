"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  authReady,
  pollDeviceLogin,
  startDeviceLogin,
  type DeviceSession,
} from "@/lib/gh-auth";

// GitHub 设备流登录组件：显示 8 位代码 → 用户在 github.com 输码 → 自动完成
export default function LoginPanel({ onDone }: { onDone?: () => void }) {
  const [session, setSession] = useState<DeviceSession | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!authReady()) {
    return (
      <p className="text-xs text-moon/70">
        登录功能即将开放，敬请期待 ✦
      </p>
    );
  }

  const begin = async () => {
    setBusy(true);
    setError("");
    try {
      const s = await startDeviceLogin();
      setSession(s);
      window.open(s.verificationUri, "_blank");
    } catch (e) {
      setError(e instanceof Error ? e.message : "发起登录失败");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!session) return;
    const stop = pollDeviceLogin(session, () => {
      setSession(null);
      onDone?.();
    });
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.deviceCode]);

  if (session) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5 text-center"
      >
        <p className="text-xs text-moon">在打开的 GitHub 页面输入这个代码</p>
        <p className="gradient-text text-glow my-3 text-3xl font-bold tracking-[0.35em]">
          {session.userCode}
        </p>
        <p className="text-xs text-moon/70">
          没自动打开？{" "}
          <a
            href={session.verificationUri}
            target="_blank"
            rel="noreferrer"
            className="text-aurora underline underline-offset-2"
          >
            github.com/login/device
          </a>
        </p>
        <p className="mt-2 animate-pulse text-xs text-gold">等待授权中…</p>
      </motion.div>
    );
  }

  return (
    <div className="text-center">
      <button
        onClick={begin}
        disabled={busy}
        className="rounded-full bg-aurora px-7 py-3 text-sm font-semibold text-void shadow-[0_0_30px_-6px_rgba(142,162,255,0.8)] transition hover:brightness-110 disabled:opacity-50"
      >
        {busy ? "正在发起…" : "✦ 用 GitHub 登陆上岛"}
      </button>
      {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
    </div>
  );
}
