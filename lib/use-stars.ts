"use client";

import { useCallback, useEffect, useState } from "react";

// 献星：访客向作品致敬（复用在线人数 Worker，D1 表 stars）
// 与动态"点赞"语义区分——点赞是交流，献星是仰望。
const WORKER_URL =
  process.env.NEXT_PUBLIC_ONLINE_WORKER_URL || "https://online.zojoho123456.workers.dev";

export function useStars(workIds: string[]) {
  // stars: slug -> 已献星数；mine: 当前访客已献过星的 slug 集合
  const [stars, setStars] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<Set<string>>(new Set());

  const key = "fd-stars-given";
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "[]");
      setMine(new Set(saved));
    } catch {}
  }, []);

  useEffect(() => {
    if (workIds.length === 0) return;
    let alive = true;
    fetch(`${WORKER_URL}/stars?ids=${encodeURIComponent(workIds.join(","))}`)
      .then((r) => r.json())
      .then((data: Record<string, number>) => {
        if (alive && data) setStars(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workIds.join(",")]);

  const giveStar = useCallback(async (slug: string) => {
    let id = localStorage.getItem("fd-visitor");
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `fd-${Date.now()}-${Math.random().toString(36).slice(2, 20)}`;
      localStorage.setItem("fd-visitor", id);
    }
    try {
      const res = await fetch(`${WORKER_URL}/star`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ work: slug, id }),
      });
      if (!res.ok) return;
      setStars((s) => ({ ...s, [slug]: (s[slug] || 0) + 1 }));
      setMine((m) => {
        const next = new Set(m);
        next.add(slug);
        localStorage.setItem(key, JSON.stringify([...next]));
        return next;
      });
    } catch {}
  }, []);

  return { stars, mine, giveStar };
}
