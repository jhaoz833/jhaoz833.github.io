import Link from "next/link";
import Announcements from "@/components/Announcements";

const SKILLS = ["平面设计", "插画", "摄影", "调色"];
const PLANS = ["音乐播放 🚧", "短视频动态 🚧", "岛民名录 🚧"];
const SOCIALS = [
  { label: "GitHub", href: "#" },
  { label: "哔哩哔哩", href: "#" },
  { label: "小红书", href: "#" },
  { label: "邮箱", href: "mailto:hi@example.com" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-10 pt-28">
      <Announcements />

      {/* 内测邀请横幅 */}
      <div className="glass relative mt-4 overflow-hidden rounded-3xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/invite-cover.jpg"
          alt="浮岛内测邀请封面：星海中漂浮的小岛"
          className="h-44 w-full object-cover opacity-80 sm:h-56"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1f]/90 via-[#0a0e1f]/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <p className="text-[11px] tracking-[0.3em] text-gold">CLOSED BETA</p>
          <h2 className="mt-1 text-xl font-bold text-star sm:text-2xl">
            浮岛 · 内测开岛中
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-moon">
            一座漂浮在星海里的图文小岛。GitHub 账号即可登录上岛：点亮动态、留下评论、
            装修你的专属小岛——它还会漂进动态页，陪你聊天、撒星星。
            名额有限，欢迎登陆，成为第一批岛民。
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link
              href="/island"
              className="rounded-full bg-gold/90 px-4 py-1.5 text-sm font-semibold text-[#0a0e1f] transition hover:bg-gold"
            >
              上岛入驻 →
            </Link>
            <Link
              href="/moments"
              className="text-sm text-moon transition hover:text-star"
            >
              先去逛逛动态
            </Link>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/avatar.svg"
          alt="浮岛站长头像"
          className="h-28 w-28 rounded-full shadow-[0_0_40px_-8px_rgba(142,162,255,0.6)] ring-2 ring-aurora/30"
        />
        <h1 className="gradient-text font-display mt-5 text-3xl font-black tracking-[0.12em]">浮岛站长</h1>
        <p className="mt-2 text-sm tracking-widest text-moon">设计师 / 创作者 · 岛主</p>
      </div>

      <div className="glass mt-10 rounded-3xl p-6 leading-relaxed text-moon">
        <p>白天做设计，晚上收集星光。</p>
        <p className="mt-3">
          浮岛是我给自己搭的小角落：把喜欢的图片、随手写下的文字说说都放在这座岛上。
          以后还想把常听的歌、拍的小视频也搬进来。
        </p>
        <p className="mt-3">
          如果你刚好路过这座岛，欢迎在动态下面留下一颗星星。
        </p>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold tracking-widest text-star">✦ 正在做</h2>
        <div className="flex flex-wrap gap-2">
          {SKILLS.map((s) => (
            <span
              key={s}
              className="rounded-full bg-aurora/10 px-3.5 py-1.5 text-sm text-aurora ring-1 ring-aurora/20"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold tracking-widest text-star">✦ 岛的施工计划</h2>
        <div className="flex flex-wrap gap-2">
          {PLANS.map((p) => (
            <span
              key={p}
              className="rounded-full bg-white/5 px-3.5 py-1.5 text-sm text-moon ring-1 ring-white/10"
            >
              {p}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold tracking-widest text-star">✦ 找到我</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              className="glass card-glow rounded-2xl px-3 py-3 text-center text-sm text-moon transition hover:text-star"
            >
              {s.label}
            </a>
          ))}
        </div>
      </section>

      <div className="mt-12 text-center">
        <Link href="/moments" className="text-sm text-moon transition hover:text-aurora">
          去动态里打个招呼 →
        </Link>
      </div>
    </div>
  );
}
