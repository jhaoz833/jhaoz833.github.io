// 用访客自己的 GitHub 令牌操作讨论帖：一键点赞（表情）与原地评论。
// 任何 GitHub 用户本就有权互动公开仓库的讨论帖，无需仓库写权限。
"use client";

import type { PostComment } from "@/lib/types";

const GQL = "https://api.github.com/graphql";

// 网络瞬时抖动重试：国内到 api.github.com 的连接时通时断，自动多试两次
async function fetchRetry(url: string, init: RequestInit, tries = 3): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fetch(url, init);
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1200 * (i + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("网络请求失败");
}

async function gql<T>(token: string, query: string, variables: object): Promise<T> {
  const res = await fetchRetry(GQL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const j = await res.json();
  if (j.errors?.length) throw new Error(j.errors[0].message ?? "GitHub 请求失败");
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  return j.data as T;
}

// 幂等设置表情：想要"已赞"就保证是已赞，想要"已取消"就保证没有。
// 重复调用安全，适合离线队列补交。
// 用 REST 接口（GraphQL 的 viewerReaction 字段在 Discussion 上不存在）。
export async function setHeart(
  token: string,
  discussionNumber: number,
  myLogin: string,
  want: "like" | "unlike"
): Promise<"liked" | "unliked"> {
  const base = `https://api.github.com/repos/jhaoz833/jhaoz833.github.io/discussions/${discussionNumber}/reactions`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };

  const res = await fetchRetry(`${base}?per_page=100`, { headers });
  if (!res.ok) throw new Error(`GitHub ${res.status}：读取表情失败`);
  const list = (await res.json()) as {
    id: number;
    content: string;
    user?: { login: string } | null;
  }[];
  const mine = list.find(
    (r) =>
      r.content === "heart" &&
      r.user?.login?.toLowerCase() === myLogin.toLowerCase()
  );

  if (want === "like" && !mine) {
    const add = await fetchRetry(base, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ content: "heart" }),
    });
    if (!add.ok) throw new Error(`GitHub ${add.status}：点赞失败`);
  }
  if (want === "unlike" && mine) {
    const del = await fetchRetry(`https://api.github.com/reactions/${mine.id}`, {
      method: "DELETE",
      headers,
    });
    if (!del.ok && del.status !== 404) throw new Error(`GitHub ${del.status}：取消点赞失败`);
  }
  return want;
}

export async function postComment(
  token: string,
  discussionNodeId: string,
  body: string
): Promise<PostComment> {
  const d = await gql<{ addDiscussionComment: { comment: {
    id: string; body: string; createdAt: string;
    author: { login: string; avatarUrl: string } | null;
  } } }>(
    token,
    `mutation($sid:ID!,$body:String!){
      addDiscussionComment(input:{discussionId:$sid,body:$body}){
        comment{ id body createdAt author{ login avatarUrl } }
      }
    }`,
    { sid: discussionNodeId, body }
  );
  const c = d.addDiscussionComment.comment;
  return {
    login: c.author?.login ?? "匿名岛民",
    avatar: c.author?.avatarUrl ?? "",
    body: c.body,
    createdAt: (c.createdAt || "").slice(0, 10),
    likes: 0,
  };
}
