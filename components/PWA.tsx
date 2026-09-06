"use client";

import { useEffect, useState } from "react";
import { captureInstallPrompt, promptInstall, useCanInstall } from "@/lib/use-install";

const DISMISS_KEY = "fudao-pwa-dismiss";

/**
 * PWA 装配：注册 Service Worker；捕获安装事件弹出"安装浮岛"提示；
 * iOS 无安装事件，改引导"添加到主屏幕"。均可关闭并记住。
 * 导航栏的 📲 按钮与本条提示共享同一个安装事件（lib/use-install.ts）。
 */
export default function PWA() {
  const canInstall = useCanInstall();
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    setReady(true);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    let dismissedSaved = false;
    try {
      dismissedSaved = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      /* ignore */
    }
    setDismissed(dismissedSaved);

    const onPrompt = (e: Event) => captureInstallPrompt(e);
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS：没有安装事件，检测未安装状态给一次性引导
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isIOS && !standalone && !dismissedSaved) {
      timer = setTimeout(() => setShowIOS(true), 4000);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const close = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    await promptInstall();
    setDismissed(true);
  };

  const showChip = ready && !dismissed && (canInstall || showIOS);
  if (!showChip) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4 sm:bottom-6">
      <div className="glass pointer-events-auto flex items-center gap-3 rounded-full py-2 pl-4 pr-2 shadow-xl">
        {canInstall ? (
          <>
            <span className="text-sm text-star">📲 把浮岛安装到桌面，离线也能听歌</span>
            <button
              type="button"
              onClick={install}
              className="rounded-full bg-aurora px-4 py-1.5 text-xs font-medium text-void transition hover:brightness-110"
            >
              安装
            </button>
          </>
        ) : (
          <span className="text-xs text-moon">
            📱 在 Safari 分享菜单中选择「添加到主屏幕」，把浮岛装进手机
          </span>
        )}
        <button
          type="button"
          aria-label="关闭安装提示"
          onClick={close}
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs text-moon transition hover:bg-white/10 hover:text-star"
        >
          ✕
        </button>
      </div>
    </div>
  );
}