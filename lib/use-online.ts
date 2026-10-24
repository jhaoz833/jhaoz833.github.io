"use client";

import { useEffect, useState } from "react";

// 在线人数 Worker 地址（Cloudflare Worker + D1），也可用环境变量 NEXT_PUBLIC_ONLINE_WORKER_URL 覆盖
const WORKER_URL =
  process.env.NEXT_PUBLIC_ONLINE_WORKER_URL || "https://online.zojoho123456.workers.dev";

const HEARTBEAT_MS = 60_000; // 心跳间隔
const POLL_MS = 30_000; // 拉取人数间隔

function getVisitorId(): string {
  let id = localStorage.getItem("fd-visitor");
  if (!id) {
    // 兼容不支持 crypto.randomUUID 的旧浏览器（如 iOS 15.3 以下）
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `fd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${Math.random()
            .toString(36)
            .slice(2, 10)}`;
    localStorage.setItem("fd-visitor", id);
  }
  return id;
}

// 多个组件（导航栏 + 小岛）共享同一份心跳与人数，避免重复请求
let count = 0;
const listeners = new Set<(n: number) => void>();
let mounted = 0;
let started = false;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

function publish(n: number) {
  count = n;
  listeners.forEach((l) => l(n));
}

function start() {
  if (started || !WORKER_URL) return;
  started = true;
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
      if (typeof data.n === "number") publish(data.n);
    } catch {
      // 网络异常时保持上次人数
    }
  };

  beat();
  poll();
  heartbeatTimer = setInterval(beat, HEARTBEAT_MS);
  pollTimer = setInterval(poll, POLL_MS);
}

function stop() {
  started = false;
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  if (pollTimer) clearInterval(pollTimer);
  heartbeatTimer = null;
  pollTimer = null;
}

export function useOnlineCount() {
  const [n, setN] = useState(count);

  useEffect(() => {
    listeners.add(setN);
    mounted += 1;
    start();
    return () => {
      listeners.delete(setN);
      mounted -= 1;
      if (mounted <= 0) stop();
    };
  }, []);

  return n;
}
