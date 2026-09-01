// 浮岛 · 在线人数 Worker（部署到 Cloudflare Workers，绑定 D1 数据库 DB）
// 接口：
//   POST /heartbeat {id}  —— 前端每 60s 上报一次心跳（id 为浏览器本地匿名 UUID）
//   GET  /count           —— 返回最近 3 分钟内有心跳的独立访客数 {n}
// 隐私：不存 IP / UA，只存匿名 ID 与最后活跃时间；旧数据定期清理。
const TTL = 180_000; // 3 分钟无心跳视为离线
const KEEP = 3_600_000; // 1 小时前的记录直接清理

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    const { pathname } = new URL(request.url);

    if (pathname === "/heartbeat" && request.method === "POST") {
      const { id } = await request.json().catch(() => ({}));
      if (!id || typeof id !== "string" || id.length > 64) {
        return json({ ok: false }, 400);
      }
      await env.DB.prepare(
        "INSERT INTO presence (id, seen_at) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET seen_at = excluded.seen_at"
      )
        .bind(id, Date.now())
        .run();
      return json({ ok: true });
    }

    if (pathname === "/count" && request.method === "GET") {
      const now = Date.now();
      const row = await env.DB.prepare(
        "SELECT COUNT(*) AS n FROM presence WHERE seen_at > ?"
      )
        .bind(now - TTL)
        .first();
      // 概率性清理过期记录（删除也占 D1 写额度，不必每次都做）
      if (Math.random() < 0.1) {
        await env.DB.prepare("DELETE FROM presence WHERE seen_at < ?")
          .bind(now - KEEP)
          .run()
          .catch(() => {});
      }
      return json({ n: row?.n ?? 0 });
    }

    return json({ ok: false }, 404);
  },
};
