"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  fortuneShareText,
  getDailyFortune,
  type IslandFortune as Fortune,
} from "@/lib/island-fortune";

function drawWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const chars = Array.from(text);
  let line = "";
  let cy = y;
  for (const ch of chars) {
    const next = line + ch;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = ch;
      cy += lineHeight;
    } else {
      line = next;
    }
  }
  if (line) ctx.fillText(line, x, cy);
  return cy;
}

export default function IslandFortune({
  login,
  islandName,
  onClose,
}: {
  login: string;
  islandName?: string;
  onClose: () => void;
}) {
  const fortune = useMemo<Fortune>(() => getDailyFortune(login), [login]);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 60);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fortuneShareText(fortune, islandName));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* 剪贴板不可用时忽略 */
    }
  };

  const download = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const W = 900;
      const H = 1200;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#0b1026");
      bg.addColorStop(0.55, "#06091a");
      bg.addColorStop(1, "#04050d");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // 星尘
      let seed = 7;
      for (let i = 0; i < 150; i++) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const x = (seed / 2 ** 32) * W;
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const y = (seed / 2 ** 32) * H;
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const r = 0.6 + (seed / 2 ** 32) * 1.7;
        ctx.fillStyle = i % 9 === 0 ? "rgba(245,217,160,0.65)" : "rgba(233,236,255,0.45)";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 幸运色光晕
      const glow = ctx.createRadialGradient(450, 320, 0, 450, 320, 380);
      glow.addColorStop(0, `${fortune.color.hex}55`);
      glow.addColorStop(1, `${fortune.color.hex}00`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, 760);

      ctx.textAlign = "center";
      ctx.fillStyle = "#f5d9a0";
      ctx.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText("FLOATING ISLAND · 今日岛签", W / 2, 110);
      ctx.fillStyle = "#9aa3c7";
      ctx.font = '16px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(fortune.date, W / 2, 146);

      ctx.fillStyle = "#e9ecff";
      ctx.font = '600 76px "Songti SC", "STZhongsong", "SimSun", serif';
      ctx.fillText(fortune.name, W / 2, 288);

      ctx.fillStyle = "#cdd4f3";
      ctx.font = '28px "PingFang SC", "Microsoft YaHei", sans-serif';
      drawWrapped(ctx, fortune.lines[0], W / 2, 370, 700, 46);
      drawWrapped(ctx, fortune.lines[1], W / 2, 424, 700, 46);

      ctx.strokeStyle = "rgba(245,217,160,0.28)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(230, 520);
      ctx.lineTo(670, 520);
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.fillStyle = "#f5d9a0";
      ctx.font = '600 26px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText("宜", 250, 586);
      ctx.fillStyle = "#cdd4f3";
      ctx.font = '24px "PingFang SC", "Microsoft YaHei", sans-serif';
      drawWrapped(ctx, fortune.good, 310, 586, 360, 36);

      ctx.fillStyle = "#9aa3c7";
      ctx.font = '600 26px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText("忌", 250, 666);
      ctx.fillStyle = "#aeb6d6";
      ctx.font = '24px "PingFang SC", "Microsoft YaHei", sans-serif';
      drawWrapped(ctx, fortune.bad, 310, 666, 360, 36);

      ctx.fillStyle = fortune.color.hex;
      ctx.beginPath();
      ctx.arc(286, 770, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#cdd4f3";
      ctx.font = '24px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(`幸运色 · ${fortune.color.name}`, 316, 779);

      ctx.fillStyle = "#f5d9a0";
      ctx.font = '600 24px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(`幸运星 · ${fortune.luckyNumber}`, 560, 779);

      // 简笔小岛
      ctx.fillStyle = "rgba(142,162,255,0.16)";
      ctx.beginPath();
      ctx.ellipse(450, 960, 250, 58, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1b2344";
      ctx.beginPath();
      ctx.moveTo(270, 940);
      ctx.quadraticCurveTo(450, 900, 630, 940);
      ctx.lineTo(450, 1050);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#2b3563";
      ctx.beginPath();
      ctx.moveTo(260, 940);
      ctx.quadraticCurveTo(450, 865, 640, 940);
      ctx.quadraticCurveTo(450, 985, 260, 940);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#f5d9a0";
      ctx.beginPath();
      ctx.arc(450, 918, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.textAlign = "center";
      ctx.fillStyle = "#e9ecff";
      ctx.font = '600 26px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(islandName || "我的小岛", 450, 1100);
      ctx.fillStyle = "#9aa3c7";
      ctx.font = '16px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText("浮岛 · Floating Island", 450, 1134);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return;
      const a = document.createElement("a");
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = `今日岛签-${fortune.name}-${fortune.date}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      /* 生成失败时保持静默 */
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-void/75 backdrop-blur-md"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fortune-title"
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="glass relative max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-3xl p-6"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
          style={{ background: `${fortune.color.hex}40` }}
        />
        <button
          ref={closeRef}
          type="button"
          aria-label="关闭今日岛签"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-sm text-moon transition hover:bg-white/10 hover:text-star"
        >
          ✕
        </button>

        <p className="text-[10px] tracking-[0.45em] text-gold/80">TODAY&apos;S FORTUNE</p>
        <p className="mt-2 text-xs text-moon/70">{fortune.date}</p>
        <h2 id="fortune-title" className="gradient-text mt-3 text-4xl font-bold">
          {fortune.name}
        </h2>

        <div className="mt-4 space-y-1 text-sm leading-relaxed text-star/90">
          <p>{fortune.lines[0]}</p>
          <p>{fortune.lines[1]}</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-gold/10 p-3 leading-relaxed ring-1 ring-gold/20">
            <span className="mr-1 font-semibold text-gold">宜</span>
            {fortune.good}
          </div>
          <div className="rounded-xl bg-white/5 p-3 leading-relaxed ring-1 ring-white/10">
            <span className="mr-1 font-semibold text-moon">忌</span>
            {fortune.bad}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5 text-xs ring-1 ring-white/10">
          <span className="flex items-center gap-2 text-moon">
            <span className="h-3 w-3 rounded-full" style={{ background: fortune.color.hex }} />
            幸运色 <span className="text-star">{fortune.color.name}</span>
          </span>
          <span className="text-moon">
            幸运星 <span className="font-semibold text-gold">{fortune.luckyNumber}</span>
          </span>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={copy}
            className="flex-1 rounded-full border border-white/15 px-3 py-2 text-xs text-moon transition hover:border-aurora/40 hover:text-aurora"
          >
            {copied ? "已复制" : "复制岛签"}
          </button>
          <button
            type="button"
            onClick={download}
            disabled={busy}
            className="flex-1 rounded-full bg-gold/90 px-3 py-2 text-xs font-semibold text-[#0a0e1f] transition hover:bg-gold disabled:opacity-60"
          >
            {busy ? "生成中…" : "保存图片"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 px-3 py-2 text-xs text-moon transition hover:bg-white/10 hover:text-star"
          >
            收好
          </button>
        </div>

        <p className="mt-3 text-center text-[10px] text-moon/50">
          每天零点换一支 · {islandName || "我的小岛"}
        </p>
      </motion.div>
    </motion.div>
  );
}
