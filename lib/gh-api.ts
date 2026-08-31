// 用访客自己的 GitHub 令牌操作讨论帖：一键点赞（表情）与原地评论。
// 任何 GitHub 用户本就有权互动公开仓库的讨论帖，无需仓库写权限。
"use client";

import type { PostComment } from "@/lib/types";

const GQL = "https://api.github.com/graphql";

async function gql<T>(token: string, query: string, variables: object): Promise<T> {
  const res = await fetch(GQL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const j = await res.json();
  if (j.errors?.length) throw new Error(j.errors[0].message ?? "GitHub 请求失败");
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  return j.data as T;
}

// 返回 "liked"（点亮）或 "unliked"（取消）
export async function toggleHeart(
  token: string,
  discussionNodeId: string,
  discussionNumber: number
): Promise<"liked" | "unliked"> {
  const q = `query($o:String!,$n:String!,$num:Int!){
    repository(owner:$o,name:$n){
      discussion(number:$num){ viewerReaction{ id content } }
    }
  }`;
  const d = await gql<{
    repository: { discussion: { viewerReaction: { id: string; content: string } | null } };
  }>(token, q, { o: "jhaoz833", n: "jhaoz833.github.io", num: discussionNumber });

  const viewer = d.repository.discussion.viewerReaction;
  if (viewer?.content === "HEART" && viewer.id) {
    await gql(
      token,
      `mutation($rid:ID!){ removeReaction(input:{reactionId:$rid}){ clientMutationId } }`,
      { rid: viewer.id }
    );
    return "unliked";
  }

  await gql(
    token,
    `mutation($sid:ID!){ addReaction(input:{subjectId:$sid,content:HEART}){ clientMutationId } }`,
    { sid: discussionNodeId }
  );
  return "liked";
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
