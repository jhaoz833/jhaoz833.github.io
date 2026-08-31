// 岛屿互动事件总线：动态卡片点赞成功 → 广播 → 跟随小岛欢呼
// （小岛未跟随/未挂载时事件无人监听，自动落空，无副作用）
"use client";

const CHEER_EVENT = "fudao:island-cheer";

export function cheerIsland() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CHEER_EVENT));
  }
}

export function onIslandCheer(cb: () => void) {
  window.addEventListener(CHEER_EVENT, cb);
  return () => window.removeEventListener(CHEER_EVENT, cb);
}
