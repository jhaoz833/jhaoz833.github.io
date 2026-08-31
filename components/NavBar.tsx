"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

const LINKS = [
  { href: "/", label: "首页" },
  { href: "/moments", label: "动态" },
  { href: "/works", label: "作品" },
  { href: "/island", label: "岛屿" },
  { href: "/about", label: "关于" },
];

export default function NavBar() {
  const pathname = usePathname();

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
