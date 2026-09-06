"use client";

// 安装状态的小型外部存储：beforeinstallprompt 全局只触发一次，
// 用模块级单例让 PWA 提示条与导航栏按钮共享同一个安装事件。
import { useSyncExternalStore } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** 在 beforeinstallprompt 监听器里调用（内部会 preventDefault） */
export function captureInstallPrompt(e: Event) {
  e.preventDefault();
  deferred = e as InstallPromptEvent;
  emit();
}

const snapshot = () => deferred !== null;
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

/** 浏览器当前是否可以唤起安装（Chromium 系） */
export function useCanInstall(): boolean {
  return useSyncExternalStore(
    subscribe,
    snapshot,
    () => false // SSR 时无安装能力
  );
}

export async function promptInstall(): Promise<void> {
  const p = deferred;
  if (!p || typeof p.prompt !== "function") return;
  await p.prompt();
  const choice = await p.userChoice;
  if (choice.outcome === "accepted") {
    deferred = null;
    emit();
  }
}