// 岛屿互动事件总线：
// 动态卡片点赞/评论成功 → 广播 → 跟随小岛欢呼；
// 小岛菜单"♪ 音乐" → 广播 → 播放器卡片挂靠/收起；
// 小岛拖动结束 → 广播位置 → 挂靠的播放器卡片跟随重排；
// 播放器 → 广播歌词/播放态/布局 → 小岛气泡与避让。
// （小岛未跟随/未挂载时事件无人监听，自动落空，无副作用）
"use client";

const CHEER_EVENT = "fudao:island-cheer";
const MUSIC_TOGGLE_EVENT = "fudao:island-music-toggle";
const MUSIC_VIS_EVENT = "fudao:island-music-vis";
const ISLAND_MOVED_EVENT = "fudao:island-moved";
const ISLAND_VISIBLE_EVENT = "fudao:island-visible";
const MUSIC_STATE_EVENT = "fudao:island-music-state";
const LYRIC_EVENT = "fudao:island-lyric";
const PLAYBACK_TOGGLE_EVENT = "fudao:island-playback-toggle";
const MUSIC_LAYOUT_EVENT = "fudao:island-music-layout";
const OPEN_WISH_EVENT = "fudao:island-wish-open";
const WISH_MADE_EVENT = "fudao:island-wish-made";
const EASTER_EGG_EVENT = "fudao:island-easter-egg";

export type IslandPresence = { visible: boolean; scope: "moments" | "all" };
export type IslandRect = {
  x: number;
  y: number;
  left: number;
  top: number;
  width: number;
  height: number;
};
export type IslandMusicState = {
  playing: boolean;
  companion: boolean;
  source: "track" | "companion" | null;
};
export type IslandLyric = {
  text: string;
  playing: boolean;
  companion: boolean;
  index: number;
  total: number;
};
export type MusicLayout = {
  mode: "bar" | "card" | "toggle" | "hidden";
  height: number;
};

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
let lastMusicVisible = false;

export function broadcastMusicVisible(visible: boolean) {
  lastMusicVisible = visible;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(MUSIC_VIS_EVENT, { detail: visible }));
  }
}

export function onIslandMusicVisible(cb: (visible: boolean) => void) {
  const handler = (e: Event) => cb(Boolean((e as CustomEvent).detail));
  window.addEventListener(MUSIC_VIS_EVENT, handler);
  // 小岛可能在播放器之后挂载，补发一次当前状态
  cb(lastMusicVisible);
  return () => window.removeEventListener(MUSIC_VIS_EVENT, handler);
}

/** 小岛拖动/避让结束：广播视口内的实际矩形，挂靠的播放器跟着重排 */
export function broadcastIslandMoved(rect: IslandRect) {
  lastIslandRect = rect;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ISLAND_MOVED_EVENT, { detail: rect }));
  }
}

let lastIslandRect: IslandRect | null = null;

export function onIslandMoved(cb: (rect: IslandRect) => void) {
  const handler = (e: Event) => cb((e as CustomEvent).detail as IslandRect);
  window.addEventListener(ISLAND_MOVED_EVENT, handler);
  if (lastIslandRect) cb(lastIslandRect);
  return () => window.removeEventListener(ISLAND_MOVED_EVENT, handler);
}

/** 小岛是否正在当前页面出现：播放器据此在离开动态页/隐藏岛时自动脱离 */
export function broadcastIslandPresence(presence: IslandPresence) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ISLAND_VISIBLE_EVENT, { detail: presence }));
  }
}

export function onIslandPresence(cb: (presence: IslandPresence) => void) {
  const handler = (e: Event) => cb((e as CustomEvent).detail as IslandPresence);
  window.addEventListener(ISLAND_VISIBLE_EVENT, handler);
  return () => window.removeEventListener(ISLAND_VISIBLE_EVENT, handler);
}

let lastMusicState: IslandMusicState = { playing: false, companion: false, source: null };

/** 播放器广播当前播放态，小岛据此呼吸/飘音符 */
export function broadcastIslandMusicState(state: IslandMusicState) {
  lastMusicState = state;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(MUSIC_STATE_EVENT, { detail: state }));
  }
}

export function onIslandMusicState(cb: (state: IslandMusicState) => void) {
  const handler = (e: Event) => cb((e as CustomEvent).detail as IslandMusicState);
  window.addEventListener(MUSIC_STATE_EVENT, handler);
  cb(lastMusicState);
  return () => window.removeEventListener(MUSIC_STATE_EVENT, handler);
}

let lastLyric: IslandLyric | null = null;

/** 播放器广播当前歌词行；小岛把气泡变成歌词灯牌 */
export function broadcastIslandLyric(lyric: IslandLyric | null) {
  lastLyric = lyric;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LYRIC_EVENT, { detail: lyric }));
  }
}

export function onIslandLyric(cb: (lyric: IslandLyric | null) => void) {
  const handler = (e: Event) => cb((e as CustomEvent).detail as IslandLyric | null);
  window.addEventListener(LYRIC_EVENT, handler);
  cb(lastLyric);
  return () => window.removeEventListener(LYRIC_EVENT, handler);
}

/** 点击小岛歌词气泡：播放/暂停 */
export function toggleIslandPlayback() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PLAYBACK_TOGGLE_EVENT));
  }
}

export function onIslandPlaybackToggle(cb: () => void) {
  window.addEventListener(PLAYBACK_TOGGLE_EVENT, cb);
  return () => window.removeEventListener(PLAYBACK_TOGGLE_EVENT, cb);
}

export type WishMade = { text: string; count: number };

/** 打开星愿弹层（跟随岛菜单/装修面板共用） */
export function openIslandWish() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_WISH_EVENT));
  }
}

export function onOpenIslandWish(cb: () => void) {
  window.addEventListener(OPEN_WISH_EVENT, cb);
  return () => window.removeEventListener(OPEN_WISH_EVENT, cb);
}

/** 愿望已写入本机 → 岛灵回应、岛上许愿星更新 */
export function broadcastWishMade(payload: WishMade) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(WISH_MADE_EVENT, { detail: payload }));
  }
}

export function onWishMade(cb: (payload: WishMade) => void) {
  const handler = (e: Event) => cb((e as CustomEvent).detail as WishMade);
  window.addEventListener(WISH_MADE_EVENT, handler);
  return () => window.removeEventListener(WISH_MADE_EVENT, handler);
}

/** 隐藏彩蛋：让跟随岛进入稀有形态 */
export function triggerIslandEasterEgg() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EASTER_EGG_EVENT));
  }
}

export function onIslandEasterEgg(cb: () => void) {
  window.addEventListener(EASTER_EGG_EVENT, cb);
  return () => window.removeEventListener(EASTER_EGG_EVENT, cb);
}

let lastMusicLayout: MusicLayout = { mode: "hidden", height: 0 };

/** 播放器广播底部占位高度，小岛据此抬高，避免被手机播放条/歌词浮层盖住 */
export function broadcastMusicLayout(layout: MusicLayout) {
  lastMusicLayout = layout;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(MUSIC_LAYOUT_EVENT, { detail: layout }));
  }
}

export function onMusicLayout(cb: (layout: MusicLayout) => void) {
  const handler = (e: Event) => cb((e as CustomEvent).detail as MusicLayout);
  window.addEventListener(MUSIC_LAYOUT_EVENT, handler);
  cb(lastMusicLayout);
  return () => window.removeEventListener(MUSIC_LAYOUT_EVENT, handler);
}
