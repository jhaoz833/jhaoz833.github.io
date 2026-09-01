export type Post = {
  id: string;
  author: string;
  authorAvatar?: string; // 社区动态：作者 GitHub 头像
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
  nodeId: string;
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
  featured?: boolean; // 策展区精选
  acquired?: string; // 入藏日期 YYYY-MM-DD
  origin?: string; // 来源动态 id（可选互链）
};
