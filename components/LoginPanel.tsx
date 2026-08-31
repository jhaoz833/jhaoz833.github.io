"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  authReady,
  pollDeviceLogin,
  saveManualToken,
  startDeviceLogin,
  type DeviceSession,
} from "@/lib/gh-auth";

// GitHub 设备流登录组件：显示 8 位代码 → 用户在 github.com 输码 → 自动完成
export default function LoginPanel({ onDone }: { onDone?: () => void }) {
  const [session, setSession] = useState<DeviceSession | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [manualBusy, setManualBusy] = useState(false);
  const [manualError, setManualError] = useState("");

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

      {/* 备用通道：新手教程 + 粘贴令牌 */}
      <details className="mt-5 text-left">
        <summary className="cursor-pointer text-center text-xs text-moon/70 hover:text-star">
          📖 第一次上岛？点我看 3 分钟登录教程
        </summary>
        <div className="glass mt-3 rounded-2xl p-4 text-xs leading-relaxed text-moon">
          <ol className="space-y-2.5">
            <li className="flex gap-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-aurora/20 text-[11px] font-bold text-aurora">1</span>
              <span>
                没有 GitHub 账号？先去{" "}
                <a
                  href="https://github.com/signup"
                  target="_blank"
                  rel="noreferrer"
                  className="text-aurora underline underline-offset-2"
                >
                  github.com/signup
                </a>{" "}
                免费注册（一分钟，有账号跳过这步）
              </span>
            </li>
            <li className="flex gap-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-aurora/20 text-[11px] font-bold text-aurora">2</span>
              <span>
                点{" "}
                <a
                  href="https://github.com/settings/tokens/new?scopes=public_repo&description=Floating%20Island"
                  target="_blank"
                  rel="noreferrer"
                  className="text-aurora underline underline-offset-2"
                >
                  这个链接
                </a>{" "}
                打开令牌生成页（权限 <b className="text-star/90">public_repo</b> 已自动帮你勾好，不用改）
              </span>
            </li>
            <li className="flex gap-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-aurora/20 text-[11px] font-bold text-aurora">3</span>
              <span>
                Note 栏随便填个名字（如 <code className="text-star/80">fudao</code>）；
                <b className="text-star/90"> Expiration 建议选 No expiration（永不过期）</b>
                ，省得以后每月重新生成
              </span>
            </li>
            <li className="flex gap-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-aurora/20 text-[11px] font-bold text-aurora">4</span>
              <span>拉到页面最底部，点绿色 <b className="text-star/90">Generate token</b> 按钮</span>
            </li>
            <li className="flex gap-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-aurora/20 text-[11px] font-bold text-aurora">5</span>
              <span>
                复制生成的令牌（<b className="text-gold">ghp_ 开头，只显示这一次</b>，离开页面就看不到了）
              </span>
            </li>
            <li className="flex gap-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-aurora/20 text-[11px] font-bold text-aurora">6</span>
              <span>回到本页粘贴进下面的框，点「登陆」——完成，钥匙只存在你自己的浏览器里</span>
            </li>
          </ol>

          <p className="mt-3 rounded-lg bg-white/5 p-2.5 text-[11px] text-moon/70 ring-1 ring-white/10">
            🔒 令牌只用于点赞和评论，不会经过任何第三方服务器；想作废随时去 github.com/settings/tokens 删除。
            注意 <b className="text-star/80">github_pat_</b> 开头的是发布器专用令牌，不能用来登录。
          </p>

          <div className="mt-3 flex gap-2">
            <input
              type="password"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="粘贴 ghp_ 开头的令牌"
              className="flex-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-star placeholder:text-moon/50 focus:border-aurora/50 focus:outline-none"
            />
            <button
              onClick={async () => {
                const t = manualToken.trim();
                if (t.startsWith("github_pat_")) {
                  setManualError(
                    "这是发布器的细粒度令牌，没有互动权限。请按上方教程生成经典令牌（ghp_ 开头）"
                  );
                  return;
                }
                setManualBusy(true);
                setManualError("");
                try {
                  await saveManualToken(t);
                  onDone?.();
                } catch (e) {
                  setManualError(e instanceof Error ? e.message : "保存失败");
                } finally {
                  setManualBusy(false);
                }
              }}
              disabled={manualBusy || manualToken.trim().length < 20}
              className="rounded-full bg-aurora px-4 py-1.5 text-xs font-medium text-void disabled:opacity-50"
            >
              {manualBusy ? "验证中…" : "登陆"}
            </button>
          </div>
          {manualError && <p className="mt-2 text-red-300">{manualError}</p>}
        </div>
      </details>
    </div>
  );
}
