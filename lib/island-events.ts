// 岛屿互动事件总线：
// 动态卡片点赞成功 → 广播 → 跟随小岛欢呼；
// 小岛菜单"♪ 音乐" → 广播 → 播放器卡片挂靠/收起；
// 小岛拖动结束 → 广播位置 → 挂靠的播放器卡片跟随重排。
// （小岛未跟随/未挂载时事件无人监听，自动落空，无副作用）
"use client";

const CHEER_EVENT = "fudao:island-cheer";
const MUSIC_TOGGLE_EVENT = "fudao:island-music-toggle";
const MUSIC_VIS_EVENT = "fudao:island-music-vis";
const ISLAND_MOVED_EVENT = "fudao:island-moved";

export function cheerIsland() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CHEER_EVENT));
  }
}

export function onIslandCheer(cb: () => void) {
  window.addEventListener(CHEER_EVENT, cb);
  return () => window.removeEventListener(CHEER_EVENT, cb);
}

/** 小岛菜单点击"♪ 音乐"：让播放器挂靠/收起 */
export function toggleIslandMusic() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(MUSIC_TOGGLE_EVENT));
  }
}

export function onIslandMusicToggle(cb: () => void) {
  window.addEventListener(MUSIC_TOGGLE_EVENT, cb);
  return () => window.removeEventListener(MUSIC_TOGGLE_EVENT, cb);
}

/** 播放器广播挂靠卡片的可见性，供小岛菜单做高亮 */
export function broadcastMusicVisible(visible: boolean) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(MUSIC_VIS_EVENT, { detail: visible }));
  }
}

export function onIslandMusicVisible(cb: (visible: boolean) => void) {
  const handler = (e: Event) => cb(Boolean((e as CustomEvent).detail));
  window.addEventListener(MUSIC_VIS_EVENT, handler);
  return () => window.removeEventListener(MUSIC_VIS_EVENT, handler);
}

/** 小岛拖动结束：广播新位置（视口内偏移），挂靠的播放器跟着重排 */
export function broadcastIslandMoved(pos: { x: number; y: number }) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ISLAND_MOVED_EVENT, { detail: pos }));
  }
}

export function onIslandMoved(cb: (pos: { x: number; y: number }) => void) {
  const handler = (e: Event) => cb((e as CustomEvent).detail as { x: number; y: number });
  window.addEventListener(ISLAND_MOVED_EVENT, handler);
  return () => window.removeEventListener(ISLAND_MOVED_EVENT, handler);
}
