"use client";

import { useEffect, useState } from "react";

// 在线人数 Worker 地址：部署 worker/online.mjs 后填入（如 https://online.xxx.workers.dev），
// 或在构建环境设置 NEXT_PUBLIC_ONLINE_WORKER_URL。留空时导航栏不显示该标识。
const WORKER_URL = process.env.NEXT_PUBLIC_ONLINE_WORKER_URL || "";

const HEARTBEAT_MS = 60_000; // 心跳间隔
const POLL_MS = 30_000; // 拉取人数间隔

function getVisitorId(): string {
  let id = localStorage.getItem("fd-visitor");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("fd-visitor", id);
  }
  return id;
}

export function useOnlineCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!WORKER_URL) return;
    const id = getVisitorId();

    const beat = () =>
      fetch(`${WORKER_URL}/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        keepalive: true,
      }).catch(() => {});

    const poll = async () => {
      try {
        const res = await fetch(`${WORKER_URL}/count`);
        const data = await res.json();
        if (typeof data.n === "number") setCount(data.n);
      } catch {
        // 网络异常时保持上次人数
      }
    };

    beat();
    poll();
    const hb = setInterval(beat, HEARTBEAT_MS);
    const pc = setInterval(poll, POLL_MS);
    return () => {
      clearInterval(hb);
      clearInterval(pc);
    };
  }, []);

  return count;
}
