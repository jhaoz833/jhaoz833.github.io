// 小岛的天空氛围：时段、季节、月相。纯函数，便于岛页与跟随岛共用。
export type IslandPhase = "dawn" | "day" | "dusk" | "night";
export type IslandSeason = "spring" | "summer" | "autumn" | "winter";

export function getIslandPhase(hour = new Date().getHours()): IslandPhase {
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "dusk";
  return "night";
}

export function getIslandSeason(month = new Date().getMonth() + 1): IslandSeason {
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

/** 0 = 新月，0.5 = 满月，1 = 下一个新月 */
export function getMoonPhase(date = new Date()): number {
  const synodic = 29.530588853;
  const known = Date.UTC(2000, 0, 6, 18, 14);
  const days = (date.getTime() - known) / 86_400_000;
  const phase = (((days % synodic) + synodic) % synodic) / synodic;
  return phase;
}

/** 两次 #rrggbb 混色，t=0 取 a，t=1 取 b */
export function mixHex(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  const k = Math.min(1, Math.max(0, t));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * k));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
