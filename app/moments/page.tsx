import Link from "next/link";
import PostCard from "@/components/PostCard";
import PostComposer from "@/components/PostComposer";
import FollowIsland from "@/components/FollowIsland";
import postsData from "@/data/posts.json";
import communityData from "@/data/community.json";
import commentsJson from "@/data/comments.json";
import type { Post, PostThread } from "@/lib/types";

const posts = postsData as Post[];
const community = communityData as Post[];
const commentsData = commentsJson as Record<string, PostThread>;

// 官方动态 + 社区动态，按日期混排
const feed = [...posts, ...community].sort((a, b) =>
  b.createdAt.localeCompare(a.createdAt)
);

export default function MomentsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-10 pt-28">
      <header className="mb-8 text-center">
        <p className="text-xs tracking-[0.5em] text-moon">✦ 动态</p>
        <h1 className="gradient-text mt-3 text-3xl font-bold">岛上的最近更新</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-moon/80">
          岛主的动态与岛民们的社区动态都在这里，每小时与 GitHub 同步
        </p>
      </header>
      <PostComposer />
      <div className="space-y-6 [perspective:1200px]">
        {feed.map((p) => (
          <PostCard key={p.id} post={p} thread={commentsData[p.id]} />
        ))}
      </div>
      <p className="mt-10 text-center text-sm text-moon/70">
        评论与点赞已接入 GitHub Discussions（每小时自动同步到页面）
      </p>
      <div className="mt-6 text-center">
        <Link href="/" className="text-sm text-moon transition hover:text-aurora">
          ← 回到首页
        </Link>
      </div>
      <FollowIsland />
    </div>
  );
}
