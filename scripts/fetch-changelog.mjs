// 构建时把最近的 git 提交按日期自动烘入公告（data/auto-changelog.json）。
// 每次推送新更新 → Actions 构建时运行本脚本 → 公告自动追加并标明日期。
// 规则：手写公告（changelog.json）覆盖的日期跳过；已收录过的提交信息不重复。
import { writeFileSync, readFileSync, existsSync } from "node:fs";

const REPO = "jhaoz833/jhaoz833.github.io";
const OUT = new URL("../data/auto-changelog.json", import.meta.url);
const MANUAL = new URL("../data/changelog.json", import.meta.url);

// 发布器提交与合并提交不算"更新"
const NOISE = [/^发布动态/, /^Merge /];

const headers = {
  Accept: "application/vnd.github+json",
  ...(process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {}),
};

let commits;
try {
  const res = await fetch(`https://api.github.com/repos/${REPO}/commits?per_page=100`, {
    headers,
  });
  if (!res.ok) {
    console.log(`拉取提交失败（${res.status}），保留现有公告数据`);
    process.exit(0);
  }
  commits = await res.json();
} catch (e) {
  console.log(`拉取提交异常（${e.message}），保留现有公告数据`);
  process.exit(0);
}

const manual = JSON.parse(readFileSync(MANUAL, "utf8"));
const existing = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : [];

// 已被手写公告覆盖的日期 + 自动公告已收录过的信息
const knownDates = new Set(manual.map((e) => e.date));
const knownMsgs = new Set(existing.flatMap((e) => e.items));

const byDay = new Map(); // date -> 条目（含新 items）
const dayIndex = new Map(); // date -> existing 中的条目下标
existing.forEach((e, i) => {
  dayIndex.set(e.date, i);
  byDay.set(e.date, e);
});

for (const c of commits) {
  const msg = (c.commit?.message || "").split("\n")[0].trim();
  if (!msg || NOISE.some((r) => r.test(msg))) continue;
  const date = (c.commit?.committer?.date || "").slice(0, 10);
  if (!date || knownDates.has(date) || knownMsgs.has(msg)) continue;

  if (!byDay.has(date)) {
    const entry = { date, title: "✦ 小更新速递", items: [] };
    byDay.set(date, entry);
    dayIndex.set(date, -1); // 新条目，稍后合并
  }
  byDay.get(date).items.push(msg);
  knownMsgs.add(msg);
}

// 合并：更新已存在的条目 / 追加新条目（按日期倒序）
for (const [date, entry] of byDay) {
  const idx = dayIndex.get(date);
  if (idx >= 0) {
    existing[idx] = entry;
  } else {
    existing.push(entry);
  }
}
existing.sort((a, b) => b.date.localeCompare(a.date));

// 滚动窗口：自动公告只保留最近 AUTO_KEEP_DAYS 天，更早的丢弃（手写精编公告不受影响）
const AUTO_KEEP_DAYS = 30;
const cutoff = new Date(Date.now() - AUTO_KEEP_DAYS * 86400_000).toISOString().slice(0, 10);
const kept = existing.filter((e) => manual.some((m) => m.date === e.date) || e.date >= cutoff);
if (kept.length !== existing.length) {
  console.log(`裁剪 ${existing.length - kept.length} 条超过 ${AUTO_KEEP_DAYS} 天的自动公告`);
}

writeFileSync(OUT, JSON.stringify(kept, null, 2) + "\n");
console.log(`自动公告已更新：共 ${kept.length} 条（新增日期 ${
  [...byDay.keys()].filter((d) => dayIndex.get(d) === -1).length
} 个）`);
