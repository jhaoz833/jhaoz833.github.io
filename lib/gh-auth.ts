// GitHub Device Flow 登录：无需任何服务器密钥。
// 访客在 github.com/login/device 输码授权后，令牌只存访客自己浏览器，
// 仅用于对公开仓库讨论帖的点赞/评论（任何 GitHub 用户本就有的权限）。
"use client";

export type Me = { login: string; name: string; avatar: string };
export type AuthState = { token: string; me: Me | null };

const TOKEN_KEY = "fudao-gh-token";
const ME_KEY = "fudao-gh-me";
const LIKES_KEY = "fudao-my-likes";
const JOINED_KEY = "fudao-joined-at";

// 由用户创建的 OAuth App 填入（公开值，设备流不需要密钥）
export const CLIENT_ID: string = "Ov23ligiP94zCiZsA3Gp";
export const authReady = () => CLIENT_ID !== "PENDING";

// 极简外部存储：让多个组件共享登录态
let snapshot: AuthState = readAuth();
const listeners = new Set<() => void>();

function readAuth(): AuthState {
  if (typeof window === "undefined") return { token: "", me: null };
  try {
    return {
      token: localStorage.getItem(TOKEN_KEY) ?? "",
      me: JSON.parse(localStorage.getItem(ME_KEY) ?? "null"),
    };
  } catch {
    return { token: "", me: null };
  }
}

function notify() {
  snapshot = readAuth();
  listeners.forEach((l) => l());
}

export function subscribeAuth(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getAuthSnapshot() {
  return snapshot;
}

export function useAuth(): AuthState {
  // 组件里配合 useSyncExternalStore(subscribeAuth, getAuthSnapshot) 使用
  return getAuthSnapshot();
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ME_KEY);
  notify();
}

async function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  const me = await fetchMe(token);
  localStorage.setItem(ME_KEY, JSON.stringify(me));
  if (!localStorage.getItem(JOINED_KEY)) {
    localStorage.setItem(JOINED_KEY, new Date().toISOString().slice(0, 10));
  }
  notify();
}

export function joinedAt(): string {
  try {
    return localStorage.getItem(JOINED_KEY) ?? "";
  } catch {
    return "";
  }
}

export async function fetchMe(token: string): Promise<Me> {
  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error("令牌无效，请重新登录");
  const j = await res.json();
  return { login: j.login, name: j.name || j.login, avatar: j.avatar_url };
}

export type DeviceSession = {
  userCode: string;
  verificationUri: string;
  deviceCode: string;
  interval: number;
  expiresAt: number;
};

// 第一步：申请设备码，返回给界面展示。
// 用表单格式（application/x-www-form-urlencoded）避免 CORS 预检，浏览器可直接调用。
export async function startDeviceLogin(): Promise<DeviceSession> {
  let res: Response;
  try {
    res = await fetch("https://github.com/login/device/code", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new URLSearchParams({ client_id: CLIENT_ID, scope: "public_repo" }),
    });
  } catch {
    throw new Error("网络不通，请稍后再试（GitHub 暂时连不上）");
  }
  if (!res.ok) throw new Error(`无法发起登录（${res.status}），请稍后再试`);
  const j = await res.json();
  return {
    userCode: j.user_code,
    verificationUri: j.verification_uri,
    deviceCode: j.device_code,
    interval: j.interval ?? 5,
    expiresAt: Date.now() + (j.expires_in ?? 900) * 1000,
  };
}

// 第二步：轮询直到用户在 GitHub 完成授权。同步返回"停止"函数
export function pollDeviceLogin(
  s: DeviceSession,
  onDone: () => void
): () => void {
  let stopped = false;
  (async () => {
    while (!stopped && Date.now() < s.expiresAt) {
      await new Promise((r) => setTimeout(r, s.interval * 1000));
      if (stopped) return;
      const res = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          device_code: s.deviceCode,
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        }),
      });
      const j = await res.json();
      if (j.access_token) {
        await saveToken(j.access_token);
        onDone();
        return;
      }
      if (j.error === "authorization_pending" || j.error === "slow_down") continue;
      if (j.error) return; // expired_token / denied 等，静默停止
    }
  })();
  return () => {
    stopped = true;
  };
}

// 备用登录：访客粘贴自己的经典 PAT（public_repo 作用域）
export async function saveManualToken(token: string) {
  const t = token.trim();
  if (t.length < 20) throw new Error("令牌长度不对，请完整粘贴");
  await saveToken(t);
}

// 我赞过的动态（记在本地，个人中心展示用）
export function recordMyLike(postId: string) {
  try {
    const arr: string[] = JSON.parse(localStorage.getItem(LIKES_KEY) ?? "[]");
    if (!arr.includes(postId)) localStorage.setItem(LIKES_KEY, JSON.stringify([postId, ...arr]));
  } catch {}
}

export function unrecordMyLike(postId: string) {
  try {
    const arr: string[] = JSON.parse(localStorage.getItem(LIKES_KEY) ?? "[]");
    localStorage.setItem(LIKES_KEY, JSON.stringify(arr.filter((x) => x !== postId)));
  } catch {}
}

export function getMyLikes(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LIKES_KEY) ?? "[]");
  } catch {
    return [];
  }
}
