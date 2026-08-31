// 构建时同步评论区与社区动态：
// 1. 官方动态（posts.json）匹配/自动创建专属讨论帖，抓评论写入 comments.json
// 2. "动态"分类（社区动态）的讨论帖烘为 data/community.json，进入动态流
// 在 GitHub Actions 中运行（需要 GITHUB_TOKEN，discussions:write 权限）
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OWNER = "jhaoz833";
const NAME = "jhaoz833.github.io";
const ANNOUNCE_CATEGORY_ID = "DIC_kwDOUI6We84DEhRC"; // Announcements：官方动态评论区
const COMMUNITY_CATEGORY_NAME = "动态"; // 社区动态分类（任何人可发帖）
const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.log("无 GITHUB_TOKEN，跳过同步（保留现有数据）");
  process.exit(0);
}

async function gql(query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

// 从社区动态正文提取图片链接，正文去掉图片标记
function extract(body) {
  const images = [...body.matchAll(/!\[[^\]]*\]\(([^)\s]+)[^)]*\)/g)].map((m) => m[1]);
  const text = body.replace(/!\[[^\]]*\]\([^)]*\)/g, "").trim();
  return { images, text };
}

try {
  const posts = JSON.parse(
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "data", "posts.json"), "utf8")
  );

  const data = await gql(
    `query($o:String!,$n:String!){
      repository(owner:$o,name:$n){
        id
        discussions(first:50){
          nodes{
            id
            number
            title
            category{name}
            author{login avatarUrl}
            body
            createdAt
            reactions{totalCount}
            comments(first:50){
              nodes{ author{login avatarUrl} body createdAt reactions{totalCount} }
            }
          }
        }
      }
    }`,
    { o: OWNER, n: NAME }
  );

  const nodes = data.repository.discussions.nodes;
  const byNumber = (n) => nodes.find((d) => d.number === n);

  // ── 官方动态：按标题【动态id】约定匹配，缺的自动创建 ──
  const byPostId = {};
  for (const d of nodes) {
    const m = d.title.match(/^【(.+?)】/);
    if (m) byPostId[m[1]] = d;
  }

  const out = {};
  let created = 0;
  for (const post of posts) {
    let d = byPostId[post.id] || (post.discussion ? byNumber(post.discussion) : null);

    if (!d) {
      const res = await gql(
        `mutation($r:ID!,$c:ID!,$t:String!,$b:String!){
          createDiscussion(input:{repositoryId:$r,categoryId:$c,title:$t,body:$b}){
            discussion{ number }
          }
        }`,
        {
          r: data.repository.id,
          c: ANNOUNCE_CATEGORY_ID,
          t: `【${post.id}】${post.text.slice(0, 30)}`,
          b: `「${post.text.slice(0, 60)}」\n\n这里是这条动态的评论区，欢迎岛民留言 🏝️`,
        }
      );
      d = {
        number: res.createDiscussion.discussion.number,
        id: null,
        reactions: { totalCount: 0 },
        comments: { nodes: [] },
      };
      created += 1;
    }

    out[post.id] = {
      number: d.number,
      nodeId: d.id ?? "",
      likes: d.reactions.totalCount,
      comments: d.comments.nodes.map((c) => ({
        login: c.author?.login ?? "匿名岛民",
        avatar: c.author?.avatarUrl ?? "",
        body: c.body,
        createdAt: (c.createdAt || "").slice(0, 10),
        likes: c.reactions.totalCount,
      })),
    };
  }

  // ── 社区动态：「动态」分类的讨论帖烘为帖子 ──
  const communityNodes = nodes.filter((d) => d.category?.name === COMMUNITY_CATEGORY_NAME);
  const anims = ["fadeUp", "flipIn", "polaroid", "typewriter", "starlight"];
  const community = communityNodes.map((d) => {
    const { images, text } = extract(d.body);
    return {
      id: `community-${d.number}`,
      author: d.author?.login ?? "岛民",
      authorAvatar: d.author?.avatarUrl ?? "",
      createdAt: (d.createdAt || "").slice(0, 10),
      text: text || "（无文字）",
      images,
      tags: ["岛民动态"],
      animation: anims[d.number % anims.length],
      likes: d.reactions.totalCount,
      comments: d.comments.nodes.length,
    };
  });

  for (const d of communityNodes) {
    out[`community-${d.number}`] = {
      number: d.number,
      nodeId: d.id,
      likes: d.reactions.totalCount,
      comments: d.comments.nodes.map((c) => ({
        login: c.author?.login ?? "匿名岛民",
        avatar: c.author?.avatarUrl ?? "",
        body: c.body,
        createdAt: (c.createdAt || "").slice(0, 10),
        likes: c.reactions.totalCount,
      })),
    };
  }

  const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
  writeFileSync(join(dir, "comments.json"), JSON.stringify(out, null, 2));
  writeFileSync(join(dir, "community.json"), JSON.stringify(community, null, 2));
  console.log(
    `同步完成：官方 ${posts.length} 条（新建 ${created} 帖），社区动态 ${community.length} 条`
  );
} catch (err) {
  console.error("同步失败，保留现有数据:", err.message);
  process.exit(0);
}
