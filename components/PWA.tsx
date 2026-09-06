"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "fudao-pwa-dismiss";

/**
 * PWA 装配：注册 Service Worker；捕获安装事件弹出"安装浮岛"提示；
 * iOS 无安装事件，改引导"添加到主屏幕"。均可关闭并记住。
 */
export default function PWA() {
  const [installEvt, setInstallEvt] = useState<InstallPromptEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      /* ignore */
    }

    const onInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as InstallPromptEvent);
      if (!dismissed) setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onInstallPrompt);

    // iOS：没有安装事件，检测未安装状态给一次性引导
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isIOS && !standalone && !dismissed) {
      const t = setTimeout(() => setShowIOS(true), 4000);
      return () => {
        window.removeEventListener("beforeinstallprompt", onInstallPrompt);
        clearTimeout(t);
      };
    }
    return () => window.removeEventListener("beforeinstallprompt", onInstallPrompt);
  }, []);

  const close = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    if (!installEvt) return;
    await installEvt.prompt();
    await installEvt.userChoice;
    setVisible(false);
  };

  if (!visible || process.env.NODE_ENV !== "production") return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4 sm:bottom-6">
      <div className="glass pointer-events-auto flex items-center gap-3 rounded-full py-2 pl-4 pr-2 shadow-xl">
        {installEvt ? (
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