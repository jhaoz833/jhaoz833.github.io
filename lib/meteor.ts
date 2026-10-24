// 真实流星雨日期（±1 天）与夜晚判断，用于触发小岛的观星夜。
export type MeteorShower = { name: string; month: number; day: number };

export const METEOR_SHOWERS: MeteorShower[] = [
  { name: "象限仪座流星雨", month: 1, day: 3 },
  { name: "天琴座流星雨", month: 4, day: 22 },
  { name: "宝瓶座η流星雨", month: 5, day: 6 },
  { name: "英仙座流星雨", month: 8, day: 12 },
  { name: "猎户座流星雨", month: 10, day: 21 },
  { name: "狮子座流星雨", month: 11, day: 17 },
  { name: "双子座流星雨", month: 12, day: 14 },
];

function dayNumber(d: Date): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}

export function meteorShowerName(date = new Date()): string | null {
  const today = dayNumber(date);
  for (const s of METEOR_SHOWERS) {
    const peak = dayNumber(new Date(date.getFullYear(), s.month - 1, s.day));
    if (Math.abs(today - peak) <= 1) return s.name;
  }
  return null;
}

export function isMeteorNight(date = new Date()): boolean {
  return meteorShowerName(date) !== null;
}

export function isNightHour(date = new Date()): boolean {
  const h = date.getHours();
  return h >= 18 || h < 5;
}
