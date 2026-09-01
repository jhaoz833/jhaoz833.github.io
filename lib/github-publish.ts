// GitHub Contents API 提交管道：
// 1. 图片逐张提交到 /images/posts/<id>-<n>.jpg
// 2. GET data/posts.json 取 sha → 追加新动态 → PUT 写回
// 全部直连 api.github.com，PAT 只用于这里。
import type { Post, Work } from "@/lib/types";
import creatorsData from "@/data/creators.json";

const REPO = "jhaoz833/jhaoz833.github.io";
const BRANCH = "main";
const API = `https://api.github.com/repos/${REPO}/contents`;

async function ghFetch(url: string, token: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("钥匙无效或已过期，请重新配置 PAT");
    throw new Error(`GitHub API ${res.status}：${await res.text().catch(() => "")}`.slice(0, 200));
  }
  return res.json();
}

async function putFile(
  token: string,
  path: string,
  contentBase64: string,
  message: string,
  sha?: string
) {
  return ghFetch(`${API}/${path}`, token, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: contentBase64,
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
}

export async function publishPost(opts: {
  token: string;
  id: string;
  text: string;
  tags: string[];
  animation: string;
  images: { base64: string; name: string }[];
}): Promise<string> {
  const { token, id, text, tags, animation, images } = opts;

  // 1. 图片（存进 public/images/posts，随构建进入网站）
  const imagePaths: string[] = [];
  for (let i = 0; i < images.length; i++) {
    const path = `public/images/posts/${id}-${i + 1}.jpg`;
    await putFile(
      token,
      path,
      images[i].base64,
      `发布动态 ${id}：图片 ${i + 1}`
    );
    imagePaths.push(`/images/posts/${id}-${i + 1}.jpg`);
  }

  // 2. posts.json 追加
  const file = await ghFetch(`${API}/data/posts.json?ref=${BRANCH}`, token);
  const posts = JSON.parse(
    new TextDecoder().decode(Uint8Array.from(atob(file.content.replace(/\n/g, "")), (c) => c.charCodeAt(0)))
  ) as Post[];

  const post: Post = {
    id,
    author: "岛主",
    createdAt: new Date().toISOString().slice(0, 10),
    text,
    images: imagePaths,
    tags,
    animation,
    likes: 0,
    comments: 0,
  };
  posts.unshift(post);

  const encoded = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(posts, null, 2))));
  await putFile(token, "data/posts.json", encoded, `发布动态：${text.slice(0, 24)}`, file.sha);

  return `https://jhaoz833.github.io/moments`;
}

// 入藏作品：图片提交到 /images/works/<id>.jpg，追加 works.json
export async function publishWork(opts: {
  token: string;
  slug: string;
  title: string;
  year: string;
  tags: string[];
  description: string;
  featured: boolean;
  image?: { base64: string; name: string };
}): Promise<string> {
  const { token, slug, title, year, tags, description, featured, image } = opts;

  let imagePath = "";
  if (image) {
    const path = `public/images/works/${slug}.jpg`;
    await putFile(token, path, image.base64, `入藏作品 ${slug}：图片`);
    imagePath = `/images/works/${slug}.jpg`;
  }

  const file = await ghFetch(`${API}/data/works.json?ref=${BRANCH}`, token);
  const works = JSON.parse(
    new TextDecoder().decode(Uint8Array.from(atob(file.content.replace(/\n/g, "")), (c) => c.charCodeAt(0)))
  ) as Work[];

  const work: Work = {
    slug,
    title,
    year,
    tags,
    image: imagePath,
    description,
    // 同 slug 视为更新：替换旧记录（可换图）
    ...(featured ? { featured: true } : {}),
    acquired: new Date().toISOString().slice(0, 10),
  };
  const idx = works.findIndex((w) => w.slug === slug);
  if (idx >= 0) works[idx] = { ...works[idx], ...work };
  else works.unshift(work);

  const encoded = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(works, null, 2))));
  await putFile(token, "data/works.json", encoded, `入藏作品：${title}`, file.sha);

  return `https://jhaoz833.github.io/works`;
}

// 用 PAT 校验当前用户名，并核对创作者白名单
export async function checkCreator(token: string): Promise<{ login: string; allowed: boolean }> {
  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error("钥匙无效或已过期，请重新配置 PAT");
  const { login } = await res.json();
  const creators = (creatorsData as { note?: string; creators: string[] }).creators;
  return { login, allowed: creators.includes(login) };
}
