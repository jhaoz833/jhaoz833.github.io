export type MusicSource = "local" | "itunes" | "netease";

export interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  source: MusicSource;
  /** local 模式：音频路径 */
  src?: string;
  /** 歌词 .lrc 路径 */
  lrc?: string;
  /** itunes 模式：搜索词 */
  term?: string;
  /** netease 模式：外链曲目 id（2 期歌本页用） */
  neteaseId?: string;
}

export interface LrcLine {
  time: number;
  text: string;
}

/** 解析标准 LRC：支持 [mm:ss.xx]、一行多时间戳，跳过元数据标签 */
export function parseLrc(text: string): LrcLine[] {
  const lines: LrcLine[] = [];
  const tagRe = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
  for (const raw of text.split(/\r?\n/)) {
    const times: number[] = [];
    let m: RegExpExecArray | null;
    tagRe.lastIndex = 0;
    while ((m = tagRe.exec(raw))) {
      const min = Number(m[1]);
      const sec = Number(m[2]);
      const frac = m[3] ? Number(`0.${m[3].padEnd(3, "0")}`) : 0;
      times.push(min * 60 + sec + frac);
    }
    if (times.length === 0) continue;
    const content = raw.replace(tagRe, "").replace(/\[[^\]]*\]/g, "").trim();
    if (!content) continue;
    for (const t of times) lines.push({ time: t, text: content });
  }
  return lines.sort((a, b) => a.time - b.time);
}

export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}