"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useOnlineCount } from "@/lib/use-online";

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

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-40"
    >
      <nav className="glass mx-auto mt-4 flex max-w-4xl items-center justify-between rounded-full px-5 py-2.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-widest">
          <span className="text-gold">✦</span>
          <span className="hidden sm:inline">浮岛</span>
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
      </nav>
    </motion.header>
  );
}
