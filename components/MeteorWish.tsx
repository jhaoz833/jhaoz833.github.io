"use client";
/* eslint-disable react-hooks/set-state-in-effect -- 本机星愿与流星夜状态在客户端读取 */

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { getAuthServerSnapshot, getAuthSnapshot, subscribeAuth } from "@/lib/gh-auth";
import {
  addWish,
  loadWishes,
  type IslandWish,
} from "@/lib/island-wishes";
import { isMeteorNight, isNightHour, meteorShowerName } from "@/lib/meteor";
import {
  broadcastWishMade,
  onOpenIslandWish,
  triggerIslandEasterEgg,
} from "@/lib/island-events";

const METEORS = [
  { top: 12, left: 78, delay: 0, dur: 1.7, scale: 1 },
  { top: 22, left: 94, delay: 0.9, dur: 1.5, scale: 0.82 },
  { top: 8, left: 62, delay: 1.8, dur: 1.9, scale: 1.1 },
  { top: 31, left: 86, delay: 2.8, dur: 1.6, scale: 0.9 },
  { top: 16, left: 70, delay: 3.7, dur: 1.8, scale: 1 },
  { top: 27, left: 98, delay: 4.6, dur: 1.5, scale: 0.75 },
];

const KONAMI = [
  "arrowup",
  "arrowup",
  "arrowdown",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "arrowleft",
  "arrowright",
  "b",
  "a",
];

export default function MeteorWish() {
  const auth = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthServerSnapshot);
  const login = auth.me?.login ?? null;
  const reduceMotion = Boolean(useReducedMotion());
  const [showerKind, setShowerKind] = useState<"real" | "secret" | null>(null);
  const [open, setOpen] = useState(false);
  const [wishes, setWishes] = useState<IslandWish[]>([]);
  const [text, setText] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const showerTimerRef = useRef<number | null>(null);
  const keyBufferRef = useRef<string[]>([]);
  const typeBufferRef = useRef<Array<{ key: string; at: number }>>([]);
  const lastEggRef = useRef(0);

  useEffect(() => {
    setWishes(login ? loadWishes(login) : []);
  }, [login]);

  // 真实流星雨夜：18:00-05:00 之间自动出现一次（每会话一次）
  useEffect(() => {
    if (!login || reduceMotion) return;
    if (!isMeteorNight() || !isNightHour()) return;
    const d = new Date();
    const flag = `fudao-meteor-night-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    try {
      if (sessionStorage.getItem(flag) === "1") return;
      sessionStorage.setItem(flag, "1");
    } catch {}
    setShowerKind("real");
    const t = window.setTimeout(() => setShowerKind(null), 18_000);
    return () => window.clearTimeout(t);
  }, [login, reduceMotion]);

  const showSecretShower = () => {
    if (!login) return;
    const now = Date.now();
    if (now - lastEggRef.current < 3000) return;
    lastEggRef.current = now;
    setShowerKind("secret");
    triggerIslandEasterEgg();
    if (showerTimerRef.current) clearTimeout(showerTimerRef.current);
    showerTimerRef.current = window.setTimeout(() => setShowerKind(null), 20_000);
  };

  // 隐藏彩蛋：Konami 码，或快速输入 fudao
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const k = e.key.toLowerCase();
      keyBufferRef.current = [...keyBufferRef.current, k].slice(-KONAMI.length);
      if (keyBufferRef.current.join(",") === KONAMI.join(",")) {
        keyBufferRef.current = [];
        typeBufferRef.current = [];
        showSecretShower();
        return;
      }
      const now = Date.now();
      typeBufferRef.current = [
        ...typeBufferRef.current.filter((x) => now - x.at < 2000),
        { key: k, at: now },
      ].slice(-8);
      if (typeBufferRef.current.map((x) => x.key).join("").endsWith("fudao")) {
        typeBufferRef.current = [];
        showSecretShower();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [login, reduceMotion]);

  useEffect(
    () => onOpenIslandWish(() => {
      if (!login) return;
      setOpen(true);
      setShowerKind(null);
    }),
    [login]
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 80);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open]);

  useEffect(() => () => {
    if (showerTimerRef.current) clearTimeout(showerTimerRef.current);
  }, []);

  const save = () => {
    if (!login) return;
    const wish = addWish(login, text);
    if (!wish) return;
    const next = loadWishes(login);
    setWishes(next);
    setText("");
    setJustSaved(true);
    broadcastWishMade({ text: wish.text, count: next.length });
    window.setTimeout(() => setJustSaved(false), 2600);
  };

  const showerName = showerKind === "secret" ? "隐藏星路" : meteorShowerName() || "观星夜";
  const closeShower = () => {
    setShowerKind(null);
    if (showerTimerRef.current) clearTimeout(showerTimerRef.current);
  };

  return (
    <>
      <AnimatePresence>
        {showerKind && (
          <motion.div
            key="meteor-shower"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
          >
            <div className="pointer-events-auto absolute inset-x-0 top-24 flex justify-center px-4">
              <div className="glass flex items-center gap-3 rounded-full px-4 py-2 text-xs text-star shadow-xl">
                <span className="text-gold">
                  {showerKind === "secret" ? "隐藏星路已打开" : `${showerName} · 今晚有流星雨`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(true);
                    setShowerKind(null);
                  }}
                  className="rounded-full bg-gold/90 px-3 py-1 text-[11px] font-semibold text-[#0a0e1f] transition hover:bg-gold"
                >
                  许愿
                </button>
                <button
                  type="button"
                  aria-label="收起流星雨提示"
                  onClick={closeShower}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-moon transition hover:bg-white/10 hover:text-star"
                >
                  ✕
                </button>
              </div>
            </div>

            {!reduceMotion &&
              METEORS.map((m, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label="点这颗流星许愿"
                  title="点这颗流星许愿"
                  onClick={() => {
                    setOpen(true);
                    setShowerKind(null);
                  }}
                  onAnimationEnd={(e) => {
                    e.currentTarget.style.pointerEvents = "none";
                  }}
                  className="meteor pointer-events-auto absolute h-8 w-8 cursor-pointer"
                  style={{
                    top: `${m.top}%`,
                    left: `${m.left}%`,
                    animationDelay: `${m.delay}s`,
                    animationDuration: `${m.dur}s`,
                    transform: `scale(${m.scale})`,
                  }}
                >
                  <span className="meteor-tail" />
                  <span className="meteor-head" />
                </button>
              ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && login && (
          <motion.div
            key="wish-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              aria-hidden
              onClick={() => setOpen(false)}
              className="absolute inset-0 cursor-default bg-void/75 backdrop-blur-md"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="wish-title"
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="glass relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl p-6"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-aurora/25 blur-3xl"
              />
              <button
                type="button"
                aria-label="关闭星愿"
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-sm text-moon transition hover:bg-white/10 hover:text-star"
              >
                ✕
              </button>

              <p className="text-[10px] tracking-[0.45em] text-gold/80">STAR WISH</p>
              <h2 id="wish-title" className="gradient-text mt-2 text-3xl font-bold">
                把愿望交给流星
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-moon/80">
                写下此刻最想实现的一件事。愿望只留在本机，不会公开；岛灵会替你记住。
              </p>

              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 60))}
                rows={3}
                maxLength={60}
                placeholder="希望……"
                className="mt-4 w-full resize-none rounded-2xl border border-white/15 bg-white/5 px-3.5 py-3 text-sm leading-relaxed text-star placeholder:text-moon/45 focus:border-aurora/60 focus:outline-none focus:ring-1 focus:ring-aurora/40"
              />
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-moon/60">
                <span>已收到 {wishes.length} 颗流星</span>
                <span>{text.length}/60</span>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={!text.trim()}
                  className="flex-1 rounded-full bg-aurora px-4 py-2.5 text-sm font-semibold text-void shadow-[0_0_24px_-6px_rgba(142,162,255,0.8)] transition hover:brightness-110 disabled:opacity-50"
                >
                  交给流星
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-white/15 px-4 py-2.5 text-sm text-moon transition hover:bg-white/10 hover:text-star"
                >
                  先收着
                </button>
              </div>

              <AnimatePresence>
                {justSaved && (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-gold"
                  >
                    <span aria-hidden>✦</span> 流星记住了，岛灵也听见了
                  </motion.p>
                )}
              </AnimatePresence>

              {wishes.length > 0 && (
                <div className="mt-5 border-t border-white/10 pt-3">
                  <p className="text-[10px] tracking-[0.3em] text-moon/60">最近的星愿</p>
                  <ul className="mt-2 max-h-28 space-y-1.5 overflow-y-auto pr-1">
                    {wishes.slice(0, 4).map((w) => (
                      <li key={w.id} className="rounded-xl bg-white/5 px-3 py-2 text-xs text-star/85 ring-1 ring-white/5">
                        <span className="mr-1.5 text-gold/80" aria-hidden>✦</span>
                        {w.text}
                        <span className="ml-2 text-[10px] text-moon/50">{w.date}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="mt-4 text-center text-[10px] text-moon/45">
                流星雨夜会全站下流星；也可以随时从岛菜单打开这里。
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
