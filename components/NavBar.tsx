"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useOnlineCount } from "@/lib/use-online";
import { promptInstall, useCanInstall } from "@/lib/use-install";

const LINKS = [
  { href: "/", label: "首页" },
  { href: "/moments", label: "动态" },
  { href: "/works", label: "宝库" },
  { href: "/island", label: "岛屿" },
  { href: "/about", label: "关于" },
];

export default function NavBar() {
  const pathname = usePathname();
  const online = useOnlineCount();
  const canInstall = useCanInstall();
  const [isIOS, setIsIOS] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setStandalone(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  // 常驻安装入口：未安装时始终显示（点击按平台给引导），装好即隐藏
  const showInstallBtn = !standalone;

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-40"
    >
      <nav className="glass glass-airy mx-auto mt-4 flex max-w-4xl items-center justify-between rounded-full px-5 py-2.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-widest">
          <span className="text-gold">✦</span>
          <span className="font-display hidden text-base font-black tracking-[0.2em] sm:inline">浮岛</span>
        </Link>
        {online > 0 && (
          <div
            className="flex items-center gap-1.5 text-xs text-moon/80"
            title="此刻正在岛上的旅人"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>
            {/* 手机显示极简版（光点+数字），桌面显示完整文字 */}
            <span className="sm:hidden">{online}</span>
            <span className="hidden sm:inline">{online} 位旅人在岛上</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {showInstallBtn && (
            <div className="relative">
              <button
                type="button"
                aria-label="安装浮岛 App"
                title={canInstall ? "安装浮岛 App" : "iPhone 添加到主屏幕"}
                onClick={() => (canInstall ? promptInstall() : setShowGuide((v) => !v))}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/10 ${
                  canInstall ? "text-aurora hover:text-aurora" : "text-moon hover:text-star"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 3v11m0 0l-4-4m4 4l4-4" />
                  <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
                </svg>
              </button>
              {showGuide && !canInstall && (
                <div className="glass absolute right-0 top-full mt-2 w-64 rounded-xl p-3 text-[11px] leading-relaxed text-star/90">
                  {isIOS ? (
                    <>在 Safari 底部分享菜单中选择「添加到主屏幕」，即可把浮岛装进手机。</>
                  ) : (
                    <>
                      用 <b>Chrome / Edge</b> 打开浮岛，地址栏右侧会出现安装图标，点击即可装成桌面应用；
                      iPhone 用户请在 Safari 分享菜单中选择「添加到主屏幕」。
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          <ul className="flex items-center gap-0.5 text-sm sm:gap-1">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <li key={l.href} className="relative">
                <Link
                  href={l.href}
                  className={`relative block rounded-full px-3 py-1.5 transition-colors sm:px-3.5 ${
                    active ? "text-star" : "text-moon hover:text-star"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-white/10 ring-1 ring-white/15"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative">{l.label}</span>
                </Link>
              </li>
            );
          })}
          </ul>
        </div>
      </nav>
    </motion.header>
  );
}
