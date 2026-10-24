"use client";
/* eslint-disable react-hooks/set-state-in-effect -- 本地存储/事件总线同步需要 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValue, useReducedMotion } from "motion/react";
import IslandAvatar from "@/components/IslandAvatar";
import IslandFortune from "@/components/IslandFortune";
import { getAuthServerSnapshot, getAuthSnapshot, getMyComments, getMyLikes, subscribeAuth } from "@/lib/gh-auth";
import {
  defaultIslandConfig,
  loadFollow,
  loadIslandConfig,
  loadIslandMusic,
  loadIslandPos,
  migrateLegacyIslandStorage,
  recordIslandPet,
  recordIslandVisit,
  saveIslandConfig,
  saveIslandPos,
  type IslandConfig,
  type IslandMood,
  type IslandPersonality,
} from "@/lib/island-store";
import {
  broadcastIslandMoved,
  broadcastIslandPresence,
  onIslandCheer,
  onIslandEasterEgg,
  onIslandLyric,
  onIslandMusicState,
  onIslandMusicVisible,
  onMusicLayout,
  onWishMade,
  openIslandWish,
  toggleIslandMusic,
  toggleIslandPlayback,
  type IslandLyric,
  type IslandMusicState,
} from "@/lib/island-events";
import { wishCount } from "@/lib/island-wishes";
import { useOnlineCount } from "@/lib/use-online";

const BURST_STARS = 10;
const MOOD_LABEL: Record<IslandMood, string> = {
  happy: "开心",
  sad: "难过",
  dazed: "发呆",
  sleepy: "困倦",
};

type MenuPlacement = { vertical: "top" | "bottom"; horizontal: "left" | "right" };

// 小岛呢喃话术库（按心情/性格分池；夜话全心情共用）
const MURMURS = {
  idle: {
    happy: [
      "今天心情好，飘得都轻了些",
      "星星在给岛打拍子呢 ✦",
      "嘿，今天的风也顺路",
      "一切都刚刚好的样子",
    ],
    sad: [
      "云有点重，压得岛低低的",
      "今天的星光淡了些…",
      "岛有点想以前的事了",
      "飘得慢一点，也没关系吧",
    ],
    dazed: [
      "咦……刚才想到哪了？",
      "风把思路吹跑了",
      "发呆中，勿扰 zzZ",
      "底下那颗星叫什么来着",
    ],
    sleepy: [
      "眼皮好重……",
      "岛要先睡一小会儿",
      "别走太远，我眯一下",
      "zzZ…",
    ],
  },
  calm: [
    "风很轻，岛也慢下来了",
    "就这样待一会儿吧",
    "星海今天很安静",
    "不用说话，我也在",
  ],
  tsundere: [
    "才、才不是特意等你的",
    "哼，来了就来了",
    "别多想，岛只是刚好亮着",
    "你再摸，我可要飘走了",
  ],
  poke: [
    "痒痒的！",
    "再摸就要飘走啦",
    "嘿嘿，星星送你 ✦",
    "岛身一晃～",
  ],
  cheer: [
    "哇，被点亮了！",
    "心跳…扑通扑通",
    "这座岛为你欢呼 ✦",
    "喜欢就多点亮几个嘛",
  ],
  night: [
    "这么晚还醒着呀…",
    "星星都困得眨眼睛了",
    "夜里的小岛最安静",
    "早点休息，岛替你守夜",
    "月光刚好，盖好被子",
  ],
} as const;

function isNight(): boolean {
  const h = new Date().getHours();
  return h < 5;
}

function pick<T>(arr: readonly T[], not?: unknown): T {
  if (arr.length === 0) return undefined as T;
  if (arr.length === 1) return arr[0];
  let v = arr[Math.floor(Math.random() * arr.length)];
  while (not !== undefined && v === not) v = arr[Math.floor(Math.random() * arr.length)];
  return v;
}

function idlePool(mood: IslandMood, personality: IslandPersonality): readonly string[] {
  if (personality === "tsundere") return MURMURS.tsundere;
  if (personality === "calm") return MURMURS.calm;
  return MURMURS.idle[mood];
}

function welcomeLine(daysSince: number, streak: number): string {
  if (daysSince >= 7) return `你离开了 ${daysSince} 天，岛上落了厚厚一层星尘`;
  if (daysSince >= 3) return `好久不见，岛上落了 ${daysSince} 天的星尘`;
  if (streak >= 7) return `连续 ${streak} 天来看我，岛在发光`;
  if (isNight()) return pick(MURMURS.night);
  return pick(MURMURS.idle.happy);
}

// 跟随小岛：开启"一键跟随"后漂浮在页面右下角。
// 心情由点赞/评论/抚摸/久置驱动；岛灵会看向指针、眨眼；
// 装修/位置/心情记忆按 GitHub 账号存在本机；播放器挂靠时让出底部空间。
export default function FollowIsland() {
  const auth = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthServerSnapshot);
  const login = auth.me?.login ?? null;
  const pathname = usePathname();
  const online = useOnlineCount();
  const reduceMotion = Boolean(useReducedMotion());

  const [cfg, setCfg] = useState<IslandConfig | null>(null);
  const [followOn, setFollowOn] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [musicVisible, setMusicVisible] = useState(false);
  const [musicState, setMusicState] = useState<IslandMusicState>({
    playing: false,
    companion: false,
    source: null,
  });
  const [lyric, setLyric] = useState<IslandLyric | null>(null);
  const [mood, setMood] = useState<IslandMood>("happy");
  const [murmur, setMurmur] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [fortuneOpen, setFortuneOpen] = useState(false);
  const [burst, setBurst] = useState(0);
  const [cheer, setCheer] = useState(0);
  const [dragSpark, setDragSpark] = useState(0);
  const [lift, setLift] = useState(0);
  const [menuPlacement, setMenuPlacement] = useState<MenuPlacement>({
    vertical: "top",
    horizontal: "right",
  });
  const [bubbleSide, setBubbleSide] = useState<"left" | "right">("left");
  const [bubblePlacement, setBubblePlacement] = useState<"above" | "below">("above");
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);
  const [streak, setStreak] = useState(0);
  const [wishes, setWishes] = useState(0);
  const [secret, setSecret] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const islandRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const moodRef = useRef<IslandMood>("happy");
  const cfgRef = useRef<IslandConfig | null>(null);
  const lyricRef = useRef<IslandLyric | null>(null);
  const lastInteractionRef = useRef(0);
  const lastTrailRef = useRef(0);
  const draggingRef = useRef(false);
  const keyboardOpenRef = useRef(false);
  const initializedRef = useRef<string | null>(null);
  const greetingUntilRef = useRef(0);
  const secretTimerRef = useRef<number | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const changeMood = useCallback((next: IslandMood) => {
    moodRef.current = next;
    setMood(next);
  }, []);

  const noteInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
  }, []);

  const scope = cfg?.followScope ?? "moments";
  const visible =
    Boolean(cfg) &&
    followOn &&
    (scope === "all"
      ? pathname !== "/island" && pathname !== "/publish"
      : pathname === "/moments");

  // 配置/位置/开关：登录账号或路由变化时重新读取
  useEffect(() => {
    if (!login) {
      setCfg(null);
      setFollowOn(false);
      setMusicEnabled(false);
      setWishes(0);
      setSecret(false);
      initializedRef.current = null;
      x.set(0);
      y.set(0);
      return;
    }
    migrateLegacyIslandStorage(login);
    const next = loadIslandConfig(login) ?? defaultIslandConfig(login);
    setCfg(next);
    setFollowOn(loadFollow(login));
    setMusicEnabled(loadIslandMusic(login));
    setWishes(wishCount(login));
    const pos = loadIslandPos(login);
    x.set(pos?.x ?? 0);
    y.set(pos?.y ?? 0);
  }, [login, pathname, refresh, x, y]);

  // 其他标签页改了装修/跟随设置 → 重新读取
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key || !e.key.startsWith("fudao-island")) return;
      setRefresh((v) => v + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    cfgRef.current = cfg;
    if (!lastInteractionRef.current) lastInteractionRef.current = Date.now();
  }, [cfg]);

  useEffect(() => {
    broadcastIslandPresence({ visible, scope });
    if (visible) lastInteractionRef.current = Date.now();
    else {
      setMenuOpen(false);
      setFortuneOpen(false);
    }
  }, [visible, scope]);

  // 播放器状态 / 歌词 / 底部占位
  useEffect(() => onIslandMusicVisible(setMusicVisible), []);
  useEffect(() => onIslandMusicState(setMusicState), []);
  useEffect(
    () =>
      onIslandLyric((next) => {
        lyricRef.current = next;
        setLyric(next);
      }),
    []
  );
  useEffect(() => onMusicLayout((layout) => setLift(layout.mode === "bar" ? layout.height : 0)), []);

  // 进岛记忆：每日首次出现时说一句应景的话
  useEffect(() => {
    if (!visible || !cfg || !login) return;
    const visit = recordIslandVisit(login);
    setStreak(visit.streak);
    setLikes(getMyLikes().length);
    setComments(getMyComments().length);

    if (initializedRef.current !== login || visit.isNewDay) {
      initializedRef.current = login;
      const nextMood: IslandMood = visit.daysSince >= 3 ? "sad" : isNight() ? "sleepy" : "happy";
      changeMood(nextMood);
      if (!cfg.quiet && (visit.isNewDay || visit.daysSince > 0)) {
        greetingUntilRef.current = Date.now() + 20_000;
        setMurmur(welcomeLine(visit.daysSince, visit.streak));
      }
    }
  }, [visible, cfg, login, changeMood]);

  // 随机呢喃：安静模式停止；困倦时自动犯困；有歌词时让位给歌词
  useEffect(() => {
    if (!cfg || !visible) return;
    if (cfg.quiet) {
      setMurmur(null);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const interval = cfg.personality === "calm" ? 20_000 : cfg.personality === "tsundere" ? 14_000 : 10_000;
    const schedule = () => {
      timer = setTimeout(() => {
        if (!document.hidden) {
          const idle = Date.now() - lastInteractionRef.current;
          if (idle > 120_000) {
            const next: IslandMood = isNight() ? "sleepy" : "dazed";
            if (next !== moodRef.current) changeMood(next);
          }
          if (!lyricRef.current && Date.now() >= greetingUntilRef.current) {
            const pool = isNight() ? MURMURS.night : idlePool(moodRef.current, cfg.personality);
            setMurmur((cur) => pick(pool, cur));
          }
        }
        schedule();
      }, interval);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [cfg, visible, changeMood]);

  // 点赞/评论成功 → 欢呼 + 开心
  useEffect(
    () =>
      onIslandCheer(() => {
        noteInteraction();
        changeMood("happy");
        setCheer((v) => v + 1);
        setLikes(getMyLikes().length);
        setComments(getMyComments().length);
        if (!cfgRef.current?.quiet && !lyricRef.current) {
          setMurmur(pick(MURMURS.cheer));
        }
      }),
    [changeMood, noteInteraction]
  );

  // 许下一个星愿 → 岛上多一颗许愿星，岛灵回应
  useEffect(
    () =>
      onWishMade((payload) => {
        noteInteraction();
        setWishes(payload.count);
        changeMood("happy");
        setBurst((v) => v + 1);
        if (!cfgRef.current?.quiet && !lyricRef.current) {
          setMurmur("听到了，流星会把愿望带远");
        }
      }),
    [changeMood, noteInteraction]
  );

  // 隐藏彩蛋：稀有极光形态 30 秒
  useEffect(
    () =>
      onIslandEasterEgg(() => {
        noteInteraction();
        setSecret(true);
        changeMood("happy");
        setCheer((v) => v + 1);
        if (!cfgRef.current?.quiet && !lyricRef.current) {
          setMurmur("你发现了岛的另一面");
        }
        if (secretTimerRef.current) clearTimeout(secretTimerRef.current);
        secretTimerRef.current = window.setTimeout(() => setSecret(false), 30_000);
      }),
    [changeMood, noteInteraction]
  );

  useEffect(
    () => () => {
      if (secretTimerRef.current) clearTimeout(secretTimerRef.current);
    },
    []
  );

  const updatePlacements = useCallback(() => {
    const el = islandRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const menuW = menuRef.current?.offsetWidth || 176;
    const menuH = menuRef.current?.offsetHeight || 128;
    const spaceAbove = rect.top - 8;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const vertical: "top" | "bottom" =
      spaceAbove >= menuH + 12 || spaceAbove >= spaceBelow ? "top" : "bottom";
    const spaceLeft = rect.left - 8;
    const spaceRight = window.innerWidth - rect.right - 8;
    const horizontal: "left" | "right" =
      spaceLeft >= menuW || spaceLeft >= spaceRight ? "right" : "left";
    setMenuPlacement((prev) =>
      prev.vertical === vertical && prev.horizontal === horizontal
        ? prev
        : { vertical, horizontal }
    );
    const bubbleW = window.innerWidth < 640 ? 144 : 176;
    const side: "left" | "right" = rect.left >= bubbleW + 12 ? "left" : "right";
    setBubbleSide((prev) => (prev === side ? prev : side));
    // 靠近导航时把气泡翻到岛下方，避免长歌词被顶栏盖住
    const placement: "above" | "below" = rect.top < 170 ? "below" : "above";
    setBubblePlacement((prev) => (prev === placement ? prev : placement));
  }, []);

  const clampIsland = useCallback(
    (persist = false) => {
      const el = islandRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const baseLeft = rect.left - x.get();
      const baseTop = rect.top - y.get();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 8;
      // 顶部留出固定导航的高度；底部至少留出根节点当前的避让距离（含安全区/播放条）
      const topMargin = 88;
      const rootBottom = rootRef.current
        ? parseFloat(getComputedStyle(rootRef.current).bottom) || 0
        : 0;
      const bottomMargin = Math.max(margin, rootBottom);
      const minX = margin - baseLeft;
      const maxX = vw - margin - rect.width - baseLeft;
      const minY = topMargin - baseTop;
      const maxY = vh - bottomMargin - rect.height - baseTop;
      const loX = Math.min(minX, maxX);
      const hiX = Math.max(minX, maxX);
      const loY = Math.min(minY, maxY);
      const hiY = Math.max(minY, maxY);
      let nx = Math.min(hiX, Math.max(loX, x.get()));
      let ny = Math.min(hiY, Math.max(loY, y.get()));

      // 边缘吸附：靠近边缘时轻轻贴住
      const snap = 14;
      if (Math.abs(nx - minX) < snap) nx = minX;
      else if (Math.abs(nx - maxX) < snap) nx = maxX;
      if (Math.abs(ny - minY) < snap) ny = minY;
      else if (Math.abs(ny - maxY) < snap) ny = maxY;

      if (Math.abs(nx - x.get()) > 0.5 || Math.abs(ny - y.get()) > 0.5) {
        x.set(nx);
        y.set(ny);
      }
      if (persist) saveIslandPos({ x: nx, y: ny }, login);
      broadcastIslandMoved({
        x: nx,
        y: ny,
        left: baseLeft + nx,
        top: baseTop + ny,
        width: rect.width,
        height: rect.height,
      });
      requestAnimationFrame(updatePlacements);
    },
    [login, updatePlacements, x, y]
  );

  // 首次出现时等入场动画结束再测量；旋转/缩放/底栏变化时重新夹取
  useEffect(() => {
    if (!visible) return;
    const raf = requestAnimationFrame(updatePlacements);
    const timer = window.setTimeout(() => clampIsland(true), 620);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [visible, clampIsland, updatePlacements]);

  useEffect(() => {
    if (!visible) return;
    const raf = requestAnimationFrame(() => clampIsland(true));
    return () => cancelAnimationFrame(raf);
  }, [lift, visible, clampIsland]);

  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => clampIsland(true));
    };
    window.addEventListener("resize", onResize);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", onResize);
    vv?.addEventListener("scroll", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      vv?.removeEventListener("resize", onResize);
      vv?.removeEventListener("scroll", onResize);
    };
  }, [clampIsland]);

  // 菜单：点外部关闭、Esc 关闭、键盘打开时聚焦第一项
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setMenuOpen(false);
      triggerRef.current?.focus();
    };
    const raf = requestAnimationFrame(() => {
      updatePlacements();
      if (keyboardOpenRef.current) {
        menuRef.current?.querySelector<HTMLElement>("button, a")?.focus({ preventScroll: true });
      }
    });
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
      cancelAnimationFrame(raf);
    };
  }, [menuOpen, updatePlacements]);

  const closeMenu = useCallback((focusTrigger = true) => {
    setMenuOpen(false);
    if (focusTrigger) requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const onPoke = () => {
    if (draggingRef.current) return;
    noteInteraction();
    setMenuOpen((v) => !v);
  };

  const onPet = () => {
    noteInteraction();
    setBurst((v) => v + 1);
    closeMenu();
    changeMood("dazed");
    if (login) recordIslandPet(login);
    if (!cfgRef.current?.quiet && !lyricRef.current) setMurmur(pick(MURMURS.poke));
  };

  const onFortune = () => {
    noteInteraction();
    closeMenu();
    setFortuneOpen(true);
  };

  const onWish = () => {
    noteInteraction();
    closeMenu();
    openIslandWish();
  };

  const onMusic = () => {
    noteInteraction();
    closeMenu();
    toggleIslandMusic();
  };

  const onQuiet = () => {
    const current = cfgRef.current;
    if (!current) return;
    noteInteraction();
    const next = { ...current, quiet: !current.quiet };
    setCfg(next);
    saveIslandConfig(next, login);
    if (next.quiet) {
      setMurmur(null);
    } else {
      setMurmur(pick(idlePool(moodRef.current, next.personality)));
    }
    closeMenu();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const step = e.shiftKey ? 4 : 16;
    let dx = 0;
    let dy = 0;
    if (e.key === "ArrowLeft") dx = -step;
    else if (e.key === "ArrowRight") dx = step;
    else if (e.key === "ArrowUp") dy = -step;
    else if (e.key === "ArrowDown") dy = step;
    if (!dx && !dy) return;
    e.preventDefault();
    noteInteraction();
    x.set(x.get() + dx);
    y.set(y.get() + dy);
    // 等 Motion 把新位移写进 DOM 后再测量，避免用旧矩形夹取
    requestAnimationFrame(() => clampIsland(true));
  };

  const moodFloat = reduceMotion
    ? { animate: undefined, transition: undefined }
    : mood === "happy"
      ? {
          animate: { y: [0, -9, 0] },
          transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" as const },
        }
      : mood === "sad"
        ? {
            animate: { y: [0, -3, 0], rotate: [0, 1.2, 0] },
            transition: { duration: 4.2, repeat: Infinity, ease: "easeInOut" as const },
          }
        : mood === "sleepy"
          ? {
              animate: { y: [0, -2, 0], opacity: [0.94, 1, 0.94] },
              transition: { duration: 6.5, repeat: Infinity, ease: "easeInOut" as const },
            }
          : {
              animate: { rotate: [-2.2, 2.2, -2.2] },
              transition: { duration: 3.6, repeat: Infinity, ease: "easeInOut" as const },
            };

  const activeLyric = lyric && lyric.text ? lyric : null;
  const bubbleText = activeLyric?.text ?? murmur;
  const showBubble = Boolean(bubbleText) && !menuOpen && (!cfg?.quiet || Boolean(activeLyric));
  const bubbleLabel = activeLyric
    ? activeLyric.playing
      ? "♪ 伴唱"
      : "♪ 暂停"
    : MOOD_LABEL[mood];

  return (
    <>
    <AnimatePresence>
      {cfg && visible && (
        <motion.div
          key="follow-island"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 48, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 48, scale: 0.85 }}
          transition={reduceMotion ? { duration: 0.15 } : { type: "spring", stiffness: 140, damping: 16 }}
          className="group fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 z-30 sm:bottom-8 sm:right-8"
          style={lift > 0 ? { bottom: lift + 12 } : undefined}
        >
          <motion.div
            ref={(el) => {
              islandRef.current = el;
            }}
            drag
            dragMomentum={false}
            style={{ x, y }}
            onDragStart={() => {
              draggingRef.current = true;
              noteInteraction();
              setMenuOpen(false);
            }}
            onDrag={() => {
              if (reduceMotion) return;
              const now = Date.now();
              if (now - lastTrailRef.current > 90) {
                lastTrailRef.current = now;
                setDragSpark((v) => v + 1);
              }
            }}
            onDragEnd={() => {
              clampIsland(true);
              // click 在 dragEnd 之后同步触发，延后复位以吞掉误触的点击
              window.setTimeout(() => {
                draggingRef.current = false;
              }, 60);
            }}
            className="relative cursor-grab touch-none select-none active:cursor-grabbing"
          >
            <button
              ref={triggerRef}
              type="button"
              onClick={(e) => {
                keyboardOpenRef.current = e.detail === 0;
                onPoke();
              }}
              onKeyDown={onKeyDown}
              aria-label={`小岛菜单（${MOOD_LABEL[mood]}${cfg.quiet ? "，安静" : ""}）`}
              aria-haspopup="true"
              aria-expanded={menuOpen}
              aria-controls={menuOpen ? "island-menu" : undefined}
              className="relative block cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora/60"
            >
              {/* 欢呼：蹦跳两下 + 左右摇摆 */}
              <motion.div
                key={`cheer-${cheer}`}
                animate={
                  !reduceMotion && cheer > 0
                    ? { y: [0, -18, 0, -10, 0], rotate: [0, 5, -5, 2, 0] }
                    : undefined
                }
                transition={{ duration: 0.9, ease: "easeOut" }}
              >
                {/* 心情专属漂浮 */}
                <motion.div animate={moodFloat.animate} transition={moodFloat.transition}>
                  <div className="island-beat">
                    <div className="w-24 transition-transform duration-500 group-hover:scale-110 sm:w-32">
                      <IslandAvatar
                        config={cfg}
                        mood={mood}
                        trackPointer
                        visitors={online}
                        likes={likes}
                        comments={comments}
                        streak={streak}
                        wishes={wishes}
                        rare={secret}
                      />
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* 点击冒星星：一圈星屑向外散开 */}
              {!reduceMotion && burst > 0 && (
                <span key={burst} className="pointer-events-none absolute inset-x-0 top-2">
                  {Array.from({ length: BURST_STARS }).map((_, i) => {
                    const angle = (i / BURST_STARS) * Math.PI * 2 + (burst % 4) * 0.5;
                    const dist = 34 + (i % 3) * 14;
                    return (
                      <motion.span
                        key={i}
                        className="absolute left-1/2 text-xs text-gold"
                        initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
                        animate={{
                          x: Math.cos(angle) * dist,
                          y: Math.sin(angle) * dist - 12,
                          opacity: 0,
                          scale: 1.25,
                        }}
                        transition={{ duration: 0.85, ease: "easeOut" }}
                      >
                        ✦
                      </motion.span>
                    );
                  })}
                </span>
              )}

              {/* 欢呼时头顶冒小心心 */}
              {!reduceMotion && cheer > 0 && (
                <span key={`cheer-${cheer}`} className="pointer-events-none absolute inset-x-0 top-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.span
                      key={i}
                      className="absolute left-1/2 text-sm text-gold"
                      initial={{ x: (i - 2) * 10, y: 0, opacity: 1 }}
                      animate={{ x: (i - 2) * 22, y: -46 - (i % 2) * 12, opacity: 0 }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    >
                      ❤
                    </motion.span>
                  ))}
                </span>
              )}

              {/* 音乐播放时飘出的小音符 */}
              {!reduceMotion && musicState.playing && (
                <span className="pointer-events-none absolute -right-1 top-1 text-[10px] text-gold/80" aria-hidden>
                  {["♪", "♪", "♫"].map((note, i) => (
                    <span
                      key={i}
                      className="isle-note absolute"
                      style={{ left: i * 5, top: i * -2 }}
                    >
                      {note}
                    </span>
                  ))}
                </span>
              )}
            </button>

            {/* 功能菜单：点小岛弹出，跟随小岛移动，按空间自动翻转 */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  ref={menuRef}
                  id="island-menu"
                  key="isle-menu"
                  initial={{ opacity: 0, y: menuPlacement.vertical === "top" ? 10 : -10, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: menuPlacement.vertical === "top" ? 8 : -8, scale: 0.95 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  onPointerDown={(e) => e.stopPropagation()}
                  role="group"
                  aria-label="小岛菜单"
                  className={`glass absolute z-20 w-44 rounded-2xl p-1.5 shadow-xl ${
                    menuPlacement.vertical === "top" ? "bottom-full mb-3" : "top-full mt-3"
                  } ${menuPlacement.horizontal === "right" ? "right-0" : "left-0"}`}
                >
                  <button
                    type="button"
                    onClick={onPet}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-moon transition hover:bg-white/10 hover:text-star"
                  >
                    <span>✦</span> 摸摸小岛
                  </button>
                  <button
                    type="button"
                    onClick={onQuiet}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-moon transition hover:bg-white/10 hover:text-star"
                  >
                    <span>{cfg.quiet ? "✦" : "◌"}</span> {cfg.quiet ? "说说话" : "静一静"}
                  </button>
                  <button
                    type="button"
                    onClick={onFortune}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-moon transition hover:bg-white/10 hover:text-star"
                  >
                    <span>✦</span> 今日岛签
                  </button>
                  <button
                    type="button"
                    onClick={onWish}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-moon transition hover:bg-white/10 hover:text-star"
                  >
                    <span>✦</span> 星愿
                    {wishes > 0 && (
                      <span className="ml-auto text-[9px] text-aurora">{wishes}</span>
                    )}
                  </button>
                  {musicEnabled ? (
                    <button
                      type="button"
                      onClick={onMusic}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs transition hover:bg-white/10 ${
                        musicState.playing || musicVisible ? "text-gold" : "text-moon hover:text-star"
                      }`}
                    >
                      <span>♪</span> 音乐
                      {(musicState.playing || musicVisible) && (
                        <span className={`ml-auto text-[9px] ${musicState.playing ? "text-gold" : "text-aurora"}`}>
                          {musicState.playing ? "播放中" : "已展开"}
                        </span>
                      )}
                    </button>
                  ) : (
                    <Link
                      href="/island"
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-moon/45 transition hover:bg-white/10 hover:text-moon"
                    >
                      <span>♪</span> 音乐 <span className="ml-auto text-[9px]">去开启 →</span>
                    </Link>
                  )}
                  <Link
                    href="/island"
                    className="mt-0.5 flex w-full items-center gap-2 rounded-xl border-t border-white/10 px-3 py-2 text-left text-xs text-moon transition hover:bg-white/10 hover:text-star"
                  >
                    <span>✦</span> 装修我的小岛
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 呢喃/歌词气泡：空间不足时翻到岛的右侧 */}
            {showBubble && (
              <div
                className={`pointer-events-none absolute w-36 sm:w-44 ${
                  bubblePlacement === "above" ? "bottom-[55%]" : "top-full mt-1"
                } ${bubbleSide === "left" ? "right-[62%]" : "left-[62%]"}`}
              >
                <AnimatePresence mode="wait">
                  {bubbleText && (
                    activeLyric ? (
                      <motion.button
                        key={bubbleText}
                        type="button"
                        initial={{ opacity: 0, y: 6, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleIslandPlayback();
                        }}
                        title={activeLyric.playing ? "暂停播放" : "继续播放"}
                        className="glass pointer-events-auto relative w-full rounded-xl px-3 py-1.5 text-left text-[11px] leading-relaxed text-aurora/95"
                      >
                        <span className="mr-1.5 text-[9px] tracking-widest text-gold/80">{bubbleLabel}</span>
                        <span className="line-clamp-3">{bubbleText}</span>
                        <span
                          className={`absolute h-2.5 w-2.5 rotate-45 bg-white/10 ${
                            bubblePlacement === "above" ? "-bottom-1" : "-top-1"
                          } ${bubbleSide === "left" ? "right-5" : "left-5"}`}
                        />
                      </motion.button>
                    ) : (
                      <motion.p
                        key={bubbleText}
                        initial={{ opacity: 0, y: 6, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                        className="glass relative rounded-xl px-3 py-1.5 text-[11px] leading-relaxed text-star/90"
                      >
                        <span className="mr-1.5 text-[9px] tracking-widest text-gold/70">{bubbleLabel}</span>
                        {bubbleText}
                        <span
                          className={`absolute h-2.5 w-2.5 rotate-45 bg-white/10 ${
                            bubblePlacement === "above" ? "-bottom-1" : "-top-1"
                          } ${bubbleSide === "left" ? "right-5" : "left-5"}`}
                        />
                      </motion.p>
                    )
                  )}
                </AnimatePresence>
              </div>
            )}

            <Link
              href="/island"
              className="mt-1 block text-center text-[10px] tracking-widest text-moon/60 transition-colors duration-300 hover:text-moon"
            >
              {cfg.name || "我的小岛"} ✦
            </Link>

            {/* 拖动星屑 */}
            {!reduceMotion && dragSpark > 0 && (
              <span key={`spark-${dragSpark}`} className="pointer-events-none absolute inset-x-0 bottom-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="absolute left-1/2 text-[9px] text-gold"
                    initial={{ x: 0, y: 0, opacity: 0.9, scale: 0.6 }}
                    animate={{ x: (i - 1.5) * 14, y: 12 + (i % 2) * 8, opacity: 0, scale: 1 }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                  >
                    ✦
                  </motion.span>
                ))}
              </span>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    <AnimatePresence>
      {fortuneOpen && cfg && login && (
        <motion.div
          key="fortune"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50"
        >
          <IslandFortune
            login={login}
            islandName={cfg.name || undefined}
            onClose={() => setFortuneOpen(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
