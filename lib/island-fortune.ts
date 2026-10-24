// 今日岛签：按登录名 + 本地日期确定性生成，每天换一支，30 天一轮。
export type FortuneColor = { name: string; hex: string };

export type IslandFortune = {
  key: string;
  name: string;
  lines: [string, string];
  good: string;
  bad: string;
  color: FortuneColor;
  luckyNumber: number;
  date: string;
};

type FortuneEntry = Omit<IslandFortune, "luckyNumber" | "date">;

const FORTUNES: FortuneEntry[] = [
  {
    key: "star-tide",
    name: "星潮",
    lines: ["潮水把星星推近了一寸", "你惦记的事也在慢慢靠岸"],
    good: "把搁置的消息发出去",
    bad: "反复改同一句话",
    color: { name: "月白", hex: "#e9ecff" },
  },
  {
    key: "thin-fog",
    name: "薄雾",
    lines: ["雾把远处的岛藏了起来", "看不见的地方，也在好好长大"],
    good: "慢一点",
    bad: "急着证明",
    color: { name: "雾蓝", hex: "#9aa3c7" },
  },
  {
    key: "wind-direction",
    name: "风向",
    lines: ["今天风从背面来", "换个方向站着，就是顺风"],
    good: "换一个座位",
    bad: "硬撑",
    color: { name: "潮绿", hex: "#7fe0bd" },
  },
  {
    key: "pick-light",
    name: "拾光",
    lines: ["捡到一段没用完的下午", "把它留给一件小事"],
    good: "晒十分钟太阳",
    bad: "把日程排满",
    color: { name: "暖金", hex: "#f5d9a0" },
  },
  {
    key: "echo",
    name: "回音",
    lines: ["你喊出去的话", "会在另一个岛上被听见"],
    good: "说一句真心话",
    bad: "猜别人怎么想",
    color: { name: "星紫", hex: "#b39dff" },
  },
  {
    key: "small-full",
    name: "小满",
    lines: ["不必等到万事俱备", "七分满的杯子也能解渴"],
    good: "先做五分钟",
    bad: "等一个完美时机",
    color: { name: "晚霞粉", hex: "#f5a0c0" },
  },
  {
    key: "night-sail",
    name: "夜航",
    lines: ["星星不负责指路", "但会陪你走一段"],
    good: "早点睡",
    bad: "一个人扛",
    color: { name: "深海蓝", hex: "#6fd3ff" },
  },
  {
    key: "pine-needle",
    name: "松针",
    lines: ["落下来的不一定是失去", "也可能是给地面铺一层软"],
    good: "整理桌面",
    bad: "翻旧账",
    color: { name: "潮绿", hex: "#7fe0bd" },
  },
  {
    key: "low-tide",
    name: "退潮",
    lines: ["退潮时露出的礁石", "也是岛的一部分"],
    good: "承认一件小事",
    bad: "假装没事",
    color: { name: "雾蓝", hex: "#9aa3c7" },
  },
  {
    key: "firefly",
    name: "萤火",
    lines: ["微弱的光也算光", "尤其在很暗的地方"],
    good: "给自己留盏灯",
    bad: "拿别人的尺子量自己",
    color: { name: "暖金", hex: "#f5d9a0" },
  },
  {
    key: "evening-breeze",
    name: "晚风",
    lines: ["风把白天吹松了一点", "你也该松一松"],
    good: "出门散步",
    bad: "在夜里做决定",
    color: { name: "极光青", hex: "#8ea2ff" },
  },
  {
    key: "star-bridge",
    name: "星桥",
    lines: ["有些相遇是绕远路来的", "所以更值得停一停"],
    good: "回一条消息",
    bad: "急着下结论",
    color: { name: "星紫", hex: "#b39dff" },
  },
  {
    key: "empty-island",
    name: "空岛",
    lines: ["岛上今天没有访客", "正好把想做的事摊开"],
    good: "留一点独处",
    bad: "刷太久手机",
    color: { name: "月白", hex: "#e9ecff" },
  },
  {
    key: "salt-soda",
    name: "盐汽水",
    lines: ["冒泡的念头别急着盖住", "让它响一会儿"],
    good: "记下一个灵感",
    bad: "马上否定自己",
    color: { name: "深海蓝", hex: "#6fd3ff" },
  },
  {
    key: "moonlight",
    name: "月光",
    lines: ["月光不催人", "它只是照着"],
    good: "慢读几页书",
    bad: "熬夜等一个回复",
    color: { name: "月白", hex: "#e9ecff" },
  },
  {
    key: "migratory",
    name: "候鸟",
    lines: ["有些离开是为了回来", "有些不是，都没关系"],
    good: "放下一个执念",
    bad: "反复回看聊天记录",
    color: { name: "晚霞粉", hex: "#f5a0c0" },
  },
  {
    key: "lighthouse",
    name: "灯塔",
    lines: ["你不必照亮整片海", "照见脚下就够了"],
    good: "完成一件小事",
    bad: "把别人的期待全背上",
    color: { name: "暖金", hex: "#f5d9a0" },
  },
  {
    key: "tide-sound",
    name: "潮声",
    lines: ["听不清也没关系", "海一直在那里"],
    good: "发一会儿呆",
    bad: "逼自己立刻想通",
    color: { name: "潮绿", hex: "#7fe0bd" },
  },
  {
    key: "island-song",
    name: "岛歌",
    lines: ["跑调也是歌", "唱给愿意听的人"],
    good: "哼一段旋律",
    bad: "怕被听见",
    color: { name: "极光青", hex: "#8ea2ff" },
  },
  {
    key: "shell",
    name: "拾贝",
    lines: ["好看的壳不一定有珍珠", "喜欢就值得捡"],
    good: "买一束花",
    bad: "只算性价比",
    color: { name: "晚霞粉", hex: "#f5a0c0" },
  },
  {
    key: "cloud-ladder",
    name: "云梯",
    lines: ["云没有台阶", "但你可以先踮起脚"],
    good: "主动问一句",
    bad: "等对方先开口",
    color: { name: "星紫", hex: "#b39dff" },
  },
  {
    key: "stardust",
    name: "星尘",
    lines: ["落在肩上的星尘", "拍掉也不可惜，它来过"],
    good: "和过去和解",
    bad: "反复自责",
    color: { name: "暖金", hex: "#f5d9a0" },
  },
  {
    key: "little-island",
    name: "小岛",
    lines: ["岛不需要变大", "也能装下整个晚上"],
    good: "早点回家",
    bad: "把行程塞满",
    color: { name: "雾蓝", hex: "#9aa3c7" },
  },
  {
    key: "north-wind",
    name: "北风",
    lines: ["冷一点的风", "会把人吹得更清醒"],
    good: "做一个决定",
    bad: "嘴硬",
    color: { name: "深海蓝", hex: "#6fd3ff" },
  },
  {
    key: "dew",
    name: "露水",
    lines: ["清晨的露水不解释自己", "太阳出来就散了"],
    good: "轻装上阵",
    bad: "过度解释",
    color: { name: "月白", hex: "#e9ecff" },
  },
  {
    key: "distant-sail",
    name: "远帆",
    lines: ["看不见岸的时候", "就先相信方向"],
    good: "迈出第一步",
    bad: "原地权衡",
    color: { name: "极光青", hex: "#8ea2ff" },
  },
  {
    key: "lamp-wick",
    name: "灯芯",
    lines: ["把灯芯剪短一点", "火反而更稳"],
    good: "减少一件事",
    bad: "同时开太多头",
    color: { name: "暖金", hex: "#f5d9a0" },
  },
  {
    key: "insect-song",
    name: "虫鸣",
    lines: ["夏夜很长", "不必每一秒都有用"],
    good: "听一会儿虫鸣",
    bad: "把休息也安排成任务",
    color: { name: "潮绿", hex: "#7fe0bd" },
  },
  {
    key: "valley-echo",
    name: "回声",
    lines: ["山谷会还给你", "你喊出的那一点勇气"],
    good: "鼓励一个人",
    bad: "等别人先鼓掌",
    color: { name: "星紫", hex: "#b39dff" },
  },
  {
    key: "new-snow",
    name: "新雪",
    lines: ["雪把脚印盖住", "也把路留白"],
    good: "重新开始",
    bad: "翻旧账",
    color: { name: "月白", hex: "#e9ecff" },
  },
];

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function fortuneDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getDailyFortune(seed: string, date = new Date()): IslandFortune {
  const key = fortuneDateKey(date);
  const dayNumber = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  const offset = hashString(seed || "guest") % FORTUNES.length;
  const entry = FORTUNES[(dayNumber + offset) % FORTUNES.length];
  const rand = mulberry32(hashString(`${seed || "guest"}|${key}|lucky-star`));
  const luckyNumber = 1 + Math.floor(rand() * 99);
  return {
    ...entry,
    luckyNumber,
    date: key,
  };
}

export function fortuneShareText(f: IslandFortune, islandName?: string): string {
  return [
    `【今日岛签 · ${f.name}】${f.date}`,
    f.lines[0],
    f.lines[1],
    `宜：${f.good}`,
    `忌：${f.bad}`,
    `幸运色：${f.color.name} · 幸运星：${f.luckyNumber}`,
    `${islandName ? `${islandName} · ` : ""}浮岛 Floating Island`,
  ].join("\n");
}
