const DEFAULT_DB = {
  users: [
    { id: "user1", slug: "player1", name: "选手一", nickname: "待定选手1", password: "123456", bio: "个性签名未设置", initCapital: 10000 },
    { id: "user2", slug: "player2", name: "选手二", nickname: "待定选手2", password: "123456", bio: "个性签名未设置", initCapital: 10000 },
    { id: "user3", slug: "player3", name: "选手三", nickname: "待定选手3", password: "123456", bio: "个性签名未设置", initCapital: 10000 },
    { id: "user4", slug: "player4", name: "选手四", nickname: "待定选手4", password: "123456", bio: "个性签名未设置", initCapital: 10000 },
  ],
  reports: [],
  settings: { seasonStart: "2026-07-01", seasonEnd: "2026-09-30" },
};

async function getDB(env) {
  const raw = await env.INVEST_KV.get("db");
  if (!raw) {
    await env.INVEST_KV.put("db", JSON.stringify(DEFAULT_DB));
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }
  return JSON.parse(raw);
}

export async function onRequestPost({ request, env }) {
  const { username, password } = await request.json();
  const db = await getDB(env);
  const user = db.users.find(
    (u) => (u.slug === username || u.name === username) && u.password === password
  );

  if (!user) {
    return new Response(JSON.stringify({ error: "用户名或密码错误" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ ok: true, user: { id: user.id, slug: user.slug, name: user.name, nickname: user.nickname } }),
    {
      headers: {
        "content-type": "application/json",
        "set-cookie": `invest_user=${user.id}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax`,
      },
    }
  );
}
