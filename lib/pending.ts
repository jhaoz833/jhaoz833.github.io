// 待同步互动队列：网络失败时把点赞/评论记在本地，
// 之后每次页面打开由 PostCard 自动重试补交，成功即清除。
"use client";

export type PendingOp = {
  key: string; // 唯一标识
  postId: string;
  kind: "like" | "unlike" | "comment";
  number: number; // 讨论帖编号
  nodeId?: string; // 评论补交需要讨论帖节点 ID
  login: string;
  body?: string; // 评论内容
  at: number;
};

const KEY = "fudao-pending-ops";

export function loadPending(): PendingOp[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function save(ops: PendingOp[]) {
  localStorage.setItem(KEY, JSON.stringify(ops.slice(-50)));
}

export function addPending(op: Omit<PendingOp, "key" | "at">) {
  const ops = loadPending();
  ops.push({
    ...op,
    key: `${op.kind}-${op.postId}-${Date.now()}`,
    at: Date.now(),
  });
  save(ops);
}

export function removePending(key: string) {
  save(loadPending().filter((o) => o.key !== key));
}

// 只保留某条动态的待办（PostCard 按动态分别补交）
export function pendingFor(postId: string): PendingOp[] {
  return loadPending().filter((o) => o.postId === postId);
}
