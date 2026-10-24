"use client";

import { useMemo } from "react";
import { useStars } from "@/lib/use-stars";

// 岛主看到访客留下的星
export default function IslandVisitors({ login }: { login: string }) {
  const ids = useMemo(() => [`island:${login.toLowerCase()}`], [login]);
  const { stars } = useStars(ids);
  const count = stars[ids[0]] ?? 0;

  return (
    <section className="glass mt-6 flex items-center justify-between rounded-3xl p-5">
      <div>
        <p className="text-sm text-star">✦ 岛上来客</p>
        <p className="mt-1 text-[11px] leading-relaxed text-moon/70">
          {count > 0 ? "朋友把星星留在你的岛上了" : "还没有人来串门，把访客链接分享出去吧"}
        </p>
      </div>
      <p className="shrink-0 text-2xl font-semibold text-gold">
        {count}
        <span className="ml-1 text-xs font-normal text-moon">颗星</span>
      </p>
    </section>
  );
}
