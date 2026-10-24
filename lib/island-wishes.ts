// 星愿瓶：许愿记录只存本机，按 GitHub 账号隔离；最多保留 20 条。
export type IslandWish = {
  id: string;
  text: string;
  createdAt: string;
  date: string;
};

const KEY_BASE = "fudao-island-wishes";

function scope(login?: string | null): string | null {
  return login?.trim().toLowerCase() || null;
}

function key(login?: string | null): string | null {
  const s = scope(login);
  return s ? `${KEY_BASE}:${s}` : null;
}

function localDate(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function read(login?: string | null): IslandWish[] {
  const k = key(login);
  if (!k) return [];
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (w): w is IslandWish =>
        Boolean(w) &&
        typeof (w as IslandWish).id === "string" &&
        typeof (w as IslandWish).text === "string" &&
        typeof (w as IslandWish).createdAt === "string" &&
        typeof (w as IslandWish).date === "string"
    );
  } catch {
    return [];
  }
}

function write(login: string | null | undefined, wishes: IslandWish[]) {
  const k = key(login);
  if (!k) return;
  try {
    localStorage.setItem(k, JSON.stringify(wishes.slice(0, 20)));
  } catch {}
}

export function loadWishes(login?: string | null): IslandWish[] {
  return read(login);
}

export function wishCount(login?: string | null): number {
  return read(login).length;
}

export function addWish(login: string | null | undefined, text: string): IslandWish | null {
  const body = text.replace(/[\u0000-\u001f]/g, "").trim().slice(0, 60);
  if (!body || !scope(login)) return null;
  const now = new Date();
  const wish: IslandWish = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `wish-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: body,
    createdAt: now.toISOString(),
    date: localDate(now),
  };
  const next = [wish, ...read(login)].slice(0, 20);
  write(login, next);
  return wish;
}
