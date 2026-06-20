import { setEnv, findUser } from "../../_shared/db.js";

export async function onRequestPost({ request, env }) {
  try {
    setEnv(env);
    console.log("[login] KV keys:", Object.keys(env || {}));
    console.log("[login] INVEST_KV:", !!env?.INVEST_KV);

    const { username, password } = await request.json();
    const user = await findUser(username, password);

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
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "服务器错误: " + (e.message || String(e)) }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
