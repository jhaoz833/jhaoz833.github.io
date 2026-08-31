export type Post = {
  id: string;
  author: string;
  createdAt: string;
  text: string;
  images: string[];
  tags: string[];
  animation: string;
  likes: number;
  comments: number;
  discussion?: number;
};

export type PostComment = {
  login: string;
  avatar: string;
  body: string;
  createdAt: string;
  likes: number;
};

// 每条动态对应的评论帖（GitHub Discussion 编号 + 已同步的评论与点赞）
export type PostThread = {
  number: number;
  likes: number;
  comments: PostComment[];
};

export type Work = {
  slug: string;
  title: string;
  year: string;
  tags: string[];
  image: string;
  description: string;
};
