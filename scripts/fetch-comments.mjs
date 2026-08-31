// 构建时同步评论区：
// 1. 读取 data/posts.json 里的动态列表
// 2. 为每条动态匹配/自动创建专属 GitHub Discussion（标题约定：【动态id】开头）
// 3. 抓取评论写入 data/comments.json，Next.js 构建时烘进静态页面
// 在 GitHub Actions 中运行（需要 GITHUB_TOKEN，discussions:write 权限）
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OWNER = "jhaoz833";
const NAME = "jhaoz833.github.io";
const CATEGORY_ID = "DIC_kwDOUI6We84DEhRC"; // Announcements
const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.log("无 GITHUB_TOKEN，跳过评论同步（保留现有 comments.json）");
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
            number
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

  // 按标题约定索引已有讨论：【动态id】开头
  const byPostId = {};
  for (const d of data.repository.discussions.nodes) {
    const m = d.title.match(/^【(.+?)】/);
    if (m) byPostId[m[1]] = d;
  }
  const byNumber = (n) =>
    data.repository.discussions.nodes.find((d) => d.number === n);

  const out = {};
  let created = 0;
  for (const post of posts) {
    let d = byPostId[post.id] || (post.discussion ? byNumber(post.discussion) : null);

    if (!d) {
      // 自动创建该动态的专属评论帖
      const res = await gql(
        `mutation($r:ID!,$c:ID!,$t:String!,$b:String!){
          createDiscussion(input:{repositoryId:$r,categoryId:$c,title:$t,body:$b}){
            discussion{ number }
          }
        }`,
        {
          r: data.repository.id,
          c: CATEGORY_ID,
          t: `【${post.id}】${post.text.slice(0, 30)}`,
          b: `「${post.text.slice(0, 60)}」\n\n这里是这条动态的评论区，欢迎岛民留言 🏝️`,
        }
      );
      d = { number: res.createDiscussion.discussion.number, comments: { nodes: [] } };
      created += 1;
    }

    out[post.id] = {
      number: d.number,
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

  const target = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "comments.json");
  writeFileSync(target, JSON.stringify(out, null, 2));
  console.log(`同步完成：${posts.length} 条动态，新建 ${created} 个评论帖`);
} catch (err) {
  console.error("同步失败，保留现有数据:", err.message);
  process.exit(0);
}
