"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import IslandAvatar from "@/components/IslandAvatar";
import {
  decodeIslandCode,
  defaultIslandConfig,
  loadIslandConfig,
  type IslandConfig,
} from "@/lib/island-store";
import { getAuthSnapshot, subscribeAuth } from "@/lib/gh-auth";
import { useOnlineCount } from "@/lib/use-online";
import { useStars } from "@/lib/use-stars";

export default function VisitorIsland({
  login,
  code,
  name,
}: {
  login?: string;
  code?: string;
  name?: string;
}) {
  const online = useOnlineCount();
  const auth = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthSnapshot);
  const isOwner = Boolean(
    login && auth.me?.login?.toLowerCase() === login.toLowerCase()
  );

  const [cfg] = useState<IslandConfig>(() => {
    const decoded = code ? decodeIslandCode(code) : null;
    return decoded ?? loadIslandConfig(login) ?? defaultIslandConfig(login || code || "visitor");
  });
  const [justStarred, setJustStarred] = useState(false);

  const starKey = useMemo(
    () => (login ? `island:${login.toLowerCase()}` : code ? `island:${code}` : ""),
    [login, code]
  );
  const ids = useMemo(() => (starKey ? [starKey] : []), [starKey]);
  const { stars, mine, giveStar } = useStars(ids);
  const received = starKey ? stars[starKey] ?? 0 : 0;

  const owner = name?.trim() || (login ? `${login} 的小岛` : "一座路过的小岛");

  const onStar = async () => {
    if (!starKey || mine.has(starKey) || isOwner) return;
    const ok = await giveStar(starKey);
    if (!ok) return;
    setJustStarred(true);
    window.setTimeout(() => setJustStarred(false), 2200);
  };

  return (
    <div className="mx-auto max-w-2xl px-5 pb-16 pt-24 sm:pt-28">
      <header className="mb-6 text-center sm:mb-8">
        <p className="text-xs tracking-[0.5em] text-moon">✦ 访客 · 串门</p>
        <h1 className="gradient-text mt-3 text-3xl font-bold">{owner}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-moon/80">
          这座岛只能看和摸。点亮一颗星，岛主下次上岛会看见。
        </p>
      </header>

      <section className="glass float-isle rounded-3xl p-5 sm:p-6">
        <div className="mx-auto w-40 sm:w-64">
          <IslandAvatar
            config={cfg}
            mood={isOwner ? "happy" : "dazed"}
            trackPointer
            visitors={online}
          />
        </div>
        <p className="mt-2 text-center text-[11px] tracking-widest text-moon/60">
          {code ? `${code} · ` : ""}岛上的星会记得你来过
        </p>

        <div className="mt-4 flex flex-col items-center gap-3">
          {isOwner ? (
            <Link
              href="/island"
              className="rounded-full bg-gold/90 px-6 py-2 text-sm font-semibold text-[#0a0e1f] transition hover:bg-gold"
            >
              这是你的岛 · 去装修
            </Link>
          ) : (
            <button
              type="button"
              onClick={onStar}
              disabled={mine.has(starKey)}
              className="relative rounded-full bg-gold/90 px-6 py-2 text-sm font-semibold text-[#0a0e1f] transition hover:bg-gold disabled:cursor-default disabled:opacity-60"
            >
              {mine.has(starKey) ? "已献星 ✓" : "为 TA 献一颗星"}
              {justStarred && (
                <motion.span
                  className="pointer-events-none absolute -top-3 left-1/2 text-sm text-gold"
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -24 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                >
                  ✦
                </motion.span>
              )}
            </button>
          )}
          <p className="text-xs text-moon/70">
            岛上已收到 <span className="text-gold">{received}</span> 颗星
          </p>
        </div>
      </section>

      <div className="mt-6 flex items-center justify-center gap-5 text-sm">
        <Link href="/island" className="text-moon transition hover:text-aurora">
          ← 回到我的岛
        </Link>
        <Link href="/moments" className="text-moon transition hover:text-aurora">
          去动态看看
        </Link>
      </div>
    </div>
  );
}
