"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  base: number;
  phase: number;
  speed: number;
  hue: "white" | "gold" | "blue";
  vx: number;
  vy: number;
  bright: boolean;
};

type Meteor = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
};

const STAR_COLORS: Record<Star["hue"], string> = {
  white: "233,236,255",
  gold: "245,217,160",
  blue: "160,180,255",
};

const TAU = Math.PI * 2;

export default function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let stars: Star[] = [];
    let meteors: Meteor[] = [];
    let galaxy: HTMLCanvasElement | null = null;
    let nextMeteorAt = 3000;
    let lastT = 0;

    const buildStars = () => {
      const count = Math.min(
        200,
        Math.floor((window.innerWidth * window.innerHeight) / 8000)
      );
      stars = Array.from({ length: count }, (_, i) => ({
        x: rand(i * 3 + 1),
        y: rand(i * 3 + 2),
        r: 0.3 + rand(i * 3 + 3) * 1.3,
        base: 0.3 + rand(i * 7 + 5) * 0.6,
        phase: rand(i * 11 + 7) * Math.PI * 2,
        speed: 0.5 + rand(i * 13 + 9) * 1.6,
        hue: pickHue(i),
        // 缓慢漂移：整体微微向左下流动，模拟银河运转
        vx: (rand(i * 19 + 2) - 0.5) * 0.008,
        vy: 0.002 + rand(i * 23 + 4) * 0.004,
        bright: i % 24 === 0,
      }));
    };

    // 远层·银河星尘带：一次性预渲染到离屏画布（右上→左下斜跨），每帧仅一次 drawImage
    const buildGalaxy = () => {
      galaxy = document.createElement("canvas");
      galaxy.width = canvas.width;
      galaxy.height = canvas.height + 120 * dpr; // 底部留视差余量
      const g = galaxy.getContext("2d");
      if (!g) return;
      const W = canvas.width;
      const H = canvas.height;
      const ox = W * 1.02;
      const oy = -H * 0.08 + 60 * dpr;
      const dx = -W * 1.06;
      const dy = H * 0.86;
      const nx = -dy / Math.hypot(dx, dy);
      const ny = dx / Math.hypot(dx, dy);

      // 柔雾：沿带心的几团大光晕
      for (let i = 0; i < 7; i++) {
        const t = (i + 0.5) / 7 + (rand(400 + i) - 0.5) * 0.1;
        const px = ox + dx * t + nx * (rand(430 + i) - 0.5) * H * 0.12;
        const py = oy + dy * t + ny * (rand(430 + i) - 0.5) * H * 0.12;
        const rr = H * (0.16 + rand(440 + i) * 0.13);
        const c = i % 3 === 0 ? "179,157,255" : i % 3 === 1 ? "142,162,255" : "205,214,255";
        const grad = g.createRadialGradient(px, py, 0, px, py, rr);
        grad.addColorStop(0, `rgba(${c},${0.05 + rand(450 + i) * 0.05})`);
        grad.addColorStop(1, `rgba(${c},0)`);
        g.fillStyle = grad;
        g.fillRect(px - rr, py - rr, rr * 2, rr * 2);
      }
      // 星尘：近高斯散布在带内
      for (let i = 0; i < 900; i++) {
        const t = rand(500 + i * 2);
        const spread = (rand(520 + i) + rand(700 + i) + rand(900 + i)) / 3 - 0.5;
        const px = ox + dx * t + nx * spread * H * 0.36;
        const py = oy + dy * t + ny * spread * H * 0.36;
        const r = (0.3 + rand(540 + i * 3) * 0.75) * dpr;
        const a = 0.1 + rand(540 + i * 3 + 1) * 0.35;
        const v = rand(540 + i * 5);
        const c = v < 0.68 ? "233,236,255" : v < 0.88 ? "196,208,255" : "245,217,160";
        g.fillStyle = `rgba(${c},${a})`;
        g.beginPath();
        g.arc(px, py, r, 0, TAU);
        g.fill();
      }
      // 带内亮星
      for (let i = 0; i < 14; i++) {
        const t = rand(600 + i * 2);
        const spread = (rand(620 + i) - 0.5) * 0.34;
        const px = ox + dx * t + nx * spread * H;
        const py = oy + dy * t + ny * spread * H;
        const r = (1 + rand(640 + i) * 0.9) * dpr;
        const a = 0.4 + rand(660 + i) * 0.35;
        const c = i % 2 === 0 ? "233,236,255" : "245,217,160";
        g.fillStyle = `rgba(${c},${a})`;
        g.beginPath();
        g.arc(px, py, r, 0, TAU);
        g.fill();
        if (i % 4 === 0) {
          const rr = 7 * dpr;
          const grad = g.createRadialGradient(px, py, 0, px, py, rr);
          grad.addColorStop(0, `rgba(233,236,255,${a * 0.5})`);
          grad.addColorStop(1, "rgba(233,236,255,0)");
          g.fillStyle = grad;
          g.beginPath();
          g.arc(px, py, rr, 0, TAU);
          g.fill();
        }
      }
    };

    const drawStars = (t: number, dt: number) => {
      const W = canvas.width;
      const H = canvas.height;
      const drift = reduced ? 0 : window.scrollY * 0.03 * dpr; // 近层视差
      for (const s of stars) {
        if (!reduced) {
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          if (s.x < -0.02) s.x += 1.04;
          else if (s.x > 1.02) s.x -= 1.04;
          if (s.y > 1.02) s.y -= 1.04;
        }

        const tw = reduced
          ? s.base
          : Math.max(0.05, Math.min(1, s.base + Math.sin((t / 1000) * s.speed + s.phase) * 0.42));
        const px = s.x * W;
        const py = s.bright
          ? (((s.y * H - drift) % H) + H) % H // 亮星随滚动缓慢位移（wrap）
          : s.y * H;
        const color = STAR_COLORS[s.hue];

        if (s.bright) {
          // 大星：光晕 + 十字星芒 + 亮核
          const glow = ctx.createRadialGradient(px, py, 0, px, py, 15 * dpr);
          glow.addColorStop(0, `rgba(${color},${0.5 * tw})`);
          glow.addColorStop(1, `rgba(${color},0)`);
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(px, py, 15 * dpr, 0, TAU);
          ctx.fill();

          ctx.strokeStyle = `rgba(${color},${0.55 * tw})`;
          ctx.lineWidth = dpr;
          ctx.beginPath();
          ctx.moveTo(px - 9 * dpr, py);
          ctx.lineTo(px + 9 * dpr, py);
          ctx.moveTo(px, py - 9 * dpr);
          ctx.lineTo(px, py + 9 * dpr);
          ctx.stroke();

          ctx.fillStyle = `rgba(${color},${Math.min(1, tw + 0.25)})`;
          ctx.beginPath();
          ctx.arc(px, py, 1.7 * dpr, 0, TAU);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.fillStyle = `rgba(${color},${tw})`;
          ctx.arc(px, py, s.r * dpr, 0, TAU);
          ctx.fill();
        }
      }
    };

    const drawMeteors = () => {
      meteors = meteors.filter((m) => m.life < m.maxLife);
      for (const m of meteors) {
        m.x += m.vx;
        m.y += m.vy;
        m.life += 1;
        const fade = Math.sin((m.life / m.maxLife) * Math.PI);
        const tailX = m.x - m.vx * 14;
        const tailY = m.y - m.vy * 14;
        const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        grad.addColorStop(0, `rgba(233,236,255,${0.9 * fade})`);
        grad.addColorStop(1, "rgba(233,236,255,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4 * dpr;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      buildStars();
      buildGalaxy();
    };

    const tick = (t: number) => {
      const dt = Math.min(0.05, lastT ? (t - lastT) / 1000 : 0);
      lastT = t;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // 银河星尘带（远层，带轻微滚动视差）
      if (galaxy) {
        const bandDrift = reduced ? 0 : Math.min(60, Math.max(-60, window.scrollY * 0.015)) * dpr;
        ctx.drawImage(galaxy, 0, -60 * dpr - bandDrift);
      }
      drawStars(t, dt);
      if (t > nextMeteorAt) {
        nextMeteorAt = t + 3500 + Math.random() * 6500;
        const speed = (5 + Math.random() * 4) * dpr;
        meteors.push({
          x: Math.random() * canvas.width * 0.8 + canvas.width * 0.1,
          y: Math.random() * canvas.height * 0.3,
          vx: -speed,
          vy: speed * (0.5 + Math.random() * 0.3),
          life: 0,
          maxLife: 60 + Math.random() * 30,
        });
      }
      drawMeteors();
      raf = requestAnimationFrame(tick);
    };

    resize();

    if (reduced) {
      // 减少动态偏好：只画一帧静态星空
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (galaxy) ctx.drawImage(galaxy, 0, -60 * dpr);
      drawStars(0, 0);
    } else {
      raf = requestAnimationFrame(tick);
      window.addEventListener("resize", resize);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}

// 确定性伪随机，避免每次重建闪烁位置跳变
function rand(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function pickHue(i: number): Star["hue"] {
  const v = rand(i * 17 + 3);
  if (v < 0.82) return "white";
  return v < 0.92 ? "gold" : "blue";
}
