"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import tracksData from "@/data/music.json";
import { formatTime, parseLrc } from "@/lib/music";
import {
  broadcastMusicVisible,
  onIslandMoved,
  onIslandMusicToggle,
} from "@/lib/island-events";
import { loadIslandPos } from "@/lib/island-store";
import type { LrcLine, Track } from "@/lib/music";

const tracks = (tracksData as { tracks: Track[] }).tracks;
const POS_KEY = "fudao.music.pos";
const COLLAPSED_KEY = "fudao.music.collapsed";

const CARD_W = 288;
const CARD_H = 176;

/** 进度条：整条可点击跳转，阻止冒泡避免拖动整卡 */
function ProgressBar({
  time,
  dur,
  onSeek,
}: {
  time: number;
  dur: number;
  onSeek: (ratio: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const ratio = dur > 0 ? Math.min(1, time / dur) : 0;

  return (
    <div
      ref={ref}
      role="slider"
      aria-label="播放进度"
      aria-valuemin={0}
      aria-valuemax={Math.floor(dur)}
      aria-valuenow={Math.floor(time)}
      tabIndex={0}
      onPointerDown={(e) => {
        e.stopPropagation();
        const rect = ref.current?.getBoundingClientRect();
        if (!rect || rect.width <= 0) return;
        onSeek(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)));
      }}
      onKeyDown={(e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        e.stopPropagation();
        const delta = dur > 0 ? dur / 20 : 5;
        const nt = e.key === "ArrowRight" ? time + delta : Math.max(0, time - delta);
        if (dur > 0) onSeek(Math.min(1, nt / dur));
      }}
      className="h-1.5 w-full cursor-pointer rounded-full bg-white/10"
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-aurora/80 to-nebula/80 shadow-[0_0_10px_-2px_rgba(142,162,255,0.8)]"
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const idxRef = useRef(0);
  const posRef = useRef<{ x: number; y: number } | null>(null);

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [muted, setMuted] = useState(false);
  const [lines, setLines] = useState<LrcLine[]>([]);
  const [lyOpen, setLyOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  // 挂靠小岛模式：跟随小岛菜单唤起，卡片停在小岛旁边
  const [attached, setAttached] = useState(false);
  const [attachedOpen, setAttachedOpen] = useState(false);
  const [islePos, setIslePos] = useState<{ x: number; y: number } | null>(null);
  const attachedRef = useRef(false);
  const attachedOpenRef = useRef(false);
  useEffect(() => {
    attachedRef.current = attached;
  }, [attached]);
  useEffect(() => {
    attachedOpenRef.current = attachedOpen;
  }, [attachedOpen]);

  const track = tracks[idx] ?? tracks[0];

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const a = new Audio();
      a.preload = "none";
      a.volume = 0.85;
      audioRef.current = a;
    }
    return audioRef.current;
  }, []);

  const loadTrack = useCallback((i: number, autoplay: boolean) => {
    const t = tracks[i];
    if (!t) return;
    if (!t.src) {
      setPlaying(false);
      return;
    }
    const a = getAudio();
    a.src = t.src;
    setIdx(i);
    idxRef.current = i;
    setTime(0);
    setDur(0);
    if (autoplay) {
      a.play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    } else {
      a.pause();
      setPlaying(false);
    }
  }, [getAudio]);

  const loadTrackRef = useRef(loadTrack);
  useEffect(() => {
    loadTrackRef.current = loadTrack;
  }, [loadTrack]);

  // 音频事件只挂一次；读完闭包里最新的 ref
  useEffect(() => {
    const a = getAudio();
    const onTime = () => {
      setTime(a.currentTime);
      if (Number.isFinite(a.duration)) setDur(a.duration);
    };
    const onEnded = () => {
      loadTrackRef.current((idxRef.current + 1) % tracks.length, true);
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("durationchange", onTime);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("durationchange", onTime);
      a.removeEventListener("ended", onEnded);
      a.pause();
    };
  }, [getAudio]);

  // 打开网站后的第一次点击（进岛门/页面任意处）即开始播放第一首。
// 浏览器不允许无手势自动播放，这个手势正好是最自然的时机。
const autostartDoneRef = useRef(false);
  useEffect(() => {
    const start = (e: PointerEvent) => {
      if (autostartDoneRef.current) return;
      const t = e.target as HTMLElement | null;
      if (t && t.closest("[data-music-player]")) return; // 用户在直接操作播放器
      autostartDoneRef.current = true;
      const a = audioRef.current;
      if (a && a.src && !a.paused) return; // 已经在播
      loadTrackRef.current(0, true);
    };
    document.addEventListener("pointerdown", start, true);
    return () => document.removeEventListener("pointerdown", start, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 静音同步
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  // 歌词：切歌时重新拉取
  useEffect(() => {
    if (!track.lrc) {
      setLines([]);
      return;
    }
    let alive = true;
    fetch(track.lrc)
      .then((r) => r.text())
      .then((txt) => {
        if (alive) setLines(parseLrc(txt));
      })
      .catch(() => {
        if (alive) setLines([]);
      });
    return () => {
      alive = false;
    };
  }, [track.id, track.lrc]);

  // 拖动边界：随视口变化
  const [constraints, setConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 });
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setConstraints({
        left: -CARD_W + 40,
        right: Math.max(40, w - CARD_W - 64),
        top: -(h - CARD_H - 120),
        bottom: -8,
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // 记住拖动位置；归位时清除
  useEffect(() => {
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { x: number; y: number };
        posRef.current = p;
        setPos(p);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const togglePlay = () => {
    const a = audioRef.current;
    if (a && a.src) {
      if (a.paused) {
        a.play()
          .then(() => setPlaying(true))
          .catch(() => setPlaying(false));
      } else {
        a.pause();
        setPlaying(false);
      }
      return;
    }
    loadTrackRef.current(idxRef.current, true);
  };

  const onSeek = (ratio: number) => {
    const a = audioRef.current;
    const d = a?.duration;
    if (a && d && Number.isFinite(d)) {
      a.currentTime = ratio * d;
      setTime(a.currentTime);
    }
  };

  const dockLeft = () => {
    posRef.current = null;
    setPos(null);
    try {
      localStorage.removeItem(POS_KEY);
    } catch {
      /* ignore */
    }
  };

  const openPlayer = () => {
    setCollapsed(false);
    try {
      localStorage.removeItem(COLLAPSED_KEY);
    } catch {
      /* ignore */
    }
  };

  const closePlayer = () => {
    setCollapsed(true);
    try {
      localStorage.setItem(COLLAPSED_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  // 记住收起状态
  useEffect(() => {
    try {
      if (localStorage.getItem(COLLAPSED_KEY) === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  // 小岛菜单"♪ 音乐"：挂靠/收起挂靠卡片
  useEffect(
    () =>
      onIslandMusicToggle(() => {
        if (!attachedRef.current) {
          setAttached(true);
          setAttachedOpen(true);
          setIslePos(loadIslandPos());
          broadcastMusicVisible(true);
        } else if (attachedOpenRef.current) {
          setAttachedOpen(false);
          broadcastMusicVisible(false);
        } else {
          setAttachedOpen(true);
          setIslePos(loadIslandPos());
          broadcastMusicVisible(true);
        }
      }),
    []
  );

  // 小岛被拖走 → 挂靠卡片跟着重排
  useEffect(
    () =>
      onIslandMoved((p) => {
        if (attachedRef.current && attachedOpenRef.current) setIslePos(p);
      }),
    []
  );

  const unAttach = () => {
    setAttached(false);
    setAttachedOpen(false);
    broadcastMusicVisible(false);
  };

  const activeLine = useMemo(() => {
    let last = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= time + 0.3) last = i;
      else break;
    }
    return last;
  }, [lines, time]);

  const activeRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeLine]);

  // 移动端适配
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    setIsDesktop(mq.matches);
    const fn = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  if (tracks.length === 0) return null;

  const info = (
    <div className="flex min-w-0 items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={track.cover}
        alt=""
        className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
      />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13px] font-medium leading-tight text-star">{track.title}</p>
        <p className="mt-0.5 truncate text-[11px] text-moon/80">{track.artist}</p>
      </div>
    </div>
  );

  const controls = (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        aria-label="上一首"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => loadTrack((idxRef.current - 1 + tracks.length) % tracks.length, true)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-moon transition hover:bg-white/10 hover:text-star"
      >
        ⏮
      </button>
      <button
        type="button"
        aria-label={playing ? "暂停" : "播放"}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={togglePlay}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-aurora text-base text-void shadow-[0_0_24px_-4px_rgba(142,162,255,0.8)] transition hover:brightness-110"
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <button
        type="button"
        aria-label="下一首"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => loadTrack((idxRef.current + 1) % tracks.length, true)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-moon transition hover:bg-white/10 hover:text-star"
      >
        ⏭
      </button>
    </div>
  );

  const progress = (
    <div className="flex items-center gap-2 text-[10px] tabular-nums text-moon/80">
      <span>{formatTime(time)}</span>
      <ProgressBar time={time} dur={dur} onSeek={onSeek} />
      <span>-{formatTime(Math.max(0, dur - time))}</span>
    </div>
  );

  // 衬线小按钮：歌词 / 歌单 / 归位
  const tinyBtn =
    "flex h-7 w-7 items-center justify-center rounded-full text-xs text-moon transition hover:bg-white/10 hover:text-star";

  // 歌单：内嵌进卡片（带轻底色便于辨认）；歌词：透明浮层，直接透出星海背景
  const listPanel = listOpen && (
    <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-mist/60 p-1.5">
      {tracks.map((t, i) => (
        <button
          key={t.id}
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => {
            loadTrack(i, true);
            setListOpen(false);
          }}
          className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/10 ${
            i === idx ? "text-aurora" : "text-moon"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={t.cover} alt="" className="h-7 w-7 rounded object-cover" />
          <span className="min-w-0 flex-1 truncate text-xs">
            {t.title} · {t.artist}
          </span>
          {i === idx && <span className="text-[10px] text-gold">✦ 播放中</span>}
        </button>
      ))}
    </div>
  );

  const lyricPanel = lyOpen && (
    <div className="animate-music-float absolute bottom-full left-0 right-0 z-10 mb-4 max-h-64 overflow-y-auto">
      {lines.length === 0 ? (
        <p className="py-4 text-center text-xs text-moon/70">这首还没有歌词</p>
      ) : (
        <div className="space-y-2.5 py-2">
          {lines.map((l, i) => (
            <p
              key={`${l.time}-${i}`}
              ref={i === activeLine ? activeRef : undefined}
              className={`text-xs leading-relaxed transition-[color,text-shadow] duration-500 ${
                i === activeLine ? "lyric-active" : "text-moon/60"
              }`}
            >
              {l.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );

  // 小岛造型的一键开关：收起播放器后悬浮在角落
  const isleToggle = (
    <button
      type="button"
      aria-label="打开音乐播放器"
      title="打开音乐播放器"
      onClick={openPlayer}
      className="glass card-glow float-isle flex h-14 w-14 items-center justify-center rounded-full shadow-[0_0_30px_-6px_rgba(142,162,255,0.7)] transition hover:brightness-110"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/floating-island.svg" alt="" className="h-10 w-10 rounded-full" />
    </button>
  );

  // 挂靠卡片停靠位置：优先小岛左侧，其次右侧，最后叠在小岛上/下方
  const attachedStyle = useMemo(() => {
    if (typeof window === "undefined") return {};
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const size = vw < 640 ? 96 : 128;
    const insetX = vw < 640 ? 16 : 32;
    const insetY = vw < 640 ? 20 : 32;
    const ix = vw - insetX - size + (islePos?.x ?? 0);
    const iy = vh - insetY - size + (islePos?.y ?? 0);
    const cardW = 288;
    const cardH = 176;
    let left = ix - cardW - 20;
    let top = Math.max(16, Math.min(vh - cardH - 16, iy + size / 2 - cardH / 2));
    if (left < 16) {
      left = ix + size + 20;
      if (left + cardW > vw - 16) {
        left = Math.max(8, ix);
        top = Math.max(8, iy - cardH - 20);
        if (top + cardH > vh) top = Math.min(vh - cardH - 8, iy + size + 16);
      }
    }
    return {
      left: Math.max(8, Math.min(vw - cardW - 8, left)),
      top: Math.max(8, Math.min(vh - cardH - 8, top)),
    };
  }, [islePos]);

  const attachedCard = (
    <motion.div
      initial={{ opacity: 0, x: 12, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={attachedStyle}
      data-music-player
      className="glass card-glow fixed z-40 w-72 rounded-2xl p-3.5 select-none"
    >
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1">{info}</div>
        <button
          type="button"
          aria-label="歌词"
          title="歌词"
          onClick={() => {
            setLyOpen((v) => !v);
            setListOpen(false);
          }}
          className={tinyBtn}
        >
          {lyOpen ? "✕" : "♪"}
        </button>
        <button
          type="button"
          aria-label="歌单"
          title="歌单"
          onClick={() => {
            setListOpen((v) => !v);
            setLyOpen(false);
          }}
          className={tinyBtn}
        >
          ☰
        </button>
        <button type="button" aria-label="脱离小岛" title="脱离小岛，回到自由窗口" onClick={unAttach} className={tinyBtn}>
          ↖
        </button>
        <button
          type="button"
          aria-label="收起播放器"
          title="收起播放器（点小岛菜单的♪音乐可再次唤出）"
          onClick={() => {
            setAttachedOpen(false);
            broadcastMusicVisible(false);
          }}
          className={tinyBtn}
        >
          ⌄
        </button>
      </div>
      <div className="mt-2.5">{controls}</div>
      <div className="mt-2">{progress}</div>
      {listPanel}
      {lyricPanel}
    </motion.div>
  );

  // ---------- 桌面端：可拖动的玻璃卡片 ----------
  if (isDesktop) {
    if (attached && attachedOpen) {
      return attachedCard;
    }
    if (collapsed) {
      return <div data-music-player className="fixed bottom-24 left-6 z-40">{isleToggle}</div>;
    }
    return (
      <motion.div
        data-music-player
        drag
        dragMomentum={false}
        dragConstraints={constraints}
        style={{ x: pos?.x ?? 0, y: pos?.y ?? 0 }}
        onDragEnd={(_, info) => {
          const base = posRef.current ?? { x: 0, y: 0 };
          const nx = base.x + info.offset.x;
          const ny = base.y + info.offset.y;
          const clamped = {
            x: Math.min(constraints.right, Math.max(constraints.left, nx)),
            y: Math.min(constraints.bottom, Math.max(constraints.top, ny)),
          };
          posRef.current = clamped;
          setPos(clamped);
          try {
            localStorage.setItem(POS_KEY, JSON.stringify(clamped));
          } catch {
            /* ignore */
          }
        }}
        className="glass card-glow fixed bottom-24 left-6 z-40 w-72 rounded-2xl p-3.5 select-none"
      >
        <div className="flex items-center gap-1">
          <div className="min-w-0 flex-1">{info}</div>
          <button
            type="button"
            aria-label="歌词"
            title="歌词"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              setLyOpen((v) => !v);
              setListOpen(false);
            }}
            className={tinyBtn}
          >
            {lyOpen ? "✕" : "♪"}
          </button>
          <button
            type="button"
            aria-label="歌单"
            title="歌单"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              setListOpen((v) => !v);
              setLyOpen(false);
            }}
            className={tinyBtn}
          >
            ☰
          </button>
          <button type="button" aria-label="归位到左侧" title="归位到左侧" onPointerDown={(e) => e.stopPropagation()} onClick={dockLeft} className={tinyBtn}>
            ↩
          </button>
          <button type="button" aria-label="收起播放器" title="收起播放器" onPointerDown={(e) => e.stopPropagation()} onClick={closePlayer} className={tinyBtn}>
            ⌄
          </button>
        </div>
        <div className="mt-2.5">{controls}</div>
        <div className="mt-2">{progress}</div>
        {listPanel}
        {lyricPanel}
      </motion.div>
    );
  }

  // ---------- 移动端：底部迷你条 ----------
  if (attached && attachedOpen) {
    return attachedCard;
  }
  if (collapsed) {
    return <div data-music-player className="fixed bottom-4 right-4 z-40">{isleToggle}</div>;
  }
  return (
    <div data-music-player className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-abyss/85 backdrop-blur-xl">
      <ProgressBar time={time} dur={dur} onSeek={onSeek} />
      <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-2.5">
        <div className="min-w-0 flex-1">{info}</div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="歌词"
            onClick={() => setLyOpen((v) => !v)}
            className={tinyBtn}
          >
            ♪
          </button>
          <button
            type="button"
            aria-label="上一首"
            onClick={() => loadTrack((idxRef.current - 1 + tracks.length) % tracks.length, true)}
            className={tinyBtn}
          >
            ⏮
          </button>
          <button
            type="button"
            aria-label={playing ? "暂停" : "播放"}
            onClick={togglePlay}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-aurora text-sm text-void shadow-[0_0_20px_-4px_rgba(142,162,255,0.8)]"
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <button
            type="button"
            aria-label="下一首"
            onClick={() => loadTrack((idxRef.current + 1) % tracks.length, true)}
            className={tinyBtn}
          >
            ⏭
          </button>
          <button
            type="button"
            aria-label="收起播放器"
            onClick={closePlayer}
            className={tinyBtn}
          >
            ⌄
          </button>
        </div>
      </div>
      {listPanel}
      {lyricPanel}
    </div>
  );
}