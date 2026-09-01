import type { Metadata, Viewport } from "next";
import "./globals.css";
import Starfield from "@/components/Starfield";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import IntroGate from "@/components/IntroGate";

const SITE = "https://jhaoz833.github.io";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "浮岛 · Floating Island",
    template: "%s · 浮岛",
  },
  description: "漂浮在星海里的个人小岛——收藏图片、文字与心情。GitHub 账号即可上岛，点亮动态、装修你的专属小岛。",
  openGraph: {
    type: "website",
    siteName: "浮岛 · Floating Island",
    title: "浮岛 · Floating Island",
    description: "漂浮在星海里的个人小岛——点亮动态、留下评论、装修你的专属小岛。",
    images: [{ url: "/images/invite-cover.jpg", width: 2560, height: 1440, alt: "浮岛 · 内测邀请" }],
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: "浮岛 · Floating Island",
    description: "漂浮在星海里的个人小岛——点亮动态、留下评论、装修你的专属小岛。",
    images: ["/images/invite-cover.jpg"],
  },
  alternates: { canonical: "/" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#04050d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="antialiased">
      <body className="min-h-screen text-star">
        <Starfield />
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="nebula nebula-violet" />
          <div className="nebula nebula-blue" />
          <div className="nebula nebula-gold" />
        </div>
        <IntroGate />
        <NavBar />
        <main className="relative z-0">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
