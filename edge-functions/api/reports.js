let memoryDB = null;

async function getDB(env) {
  if (env.INVEST_KV) {
    const raw = await env.INVEST_KV.get("db");
    return raw ? JSON.parse(raw) : { users: [], reports: [], settings: {} };
  }
  if (!memoryDB) memoryDB = { users: [], reports: [], settings: {} };
  return memoryDB;
}

async function saveDB(env, db) {
  if (env.INVEST_KV) await env.INVEST_KV.put("db", JSON.stringify(db));
  memoryDB = db;
}

function getUserId(request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/invest_user=([^;]+)/);
  return match ? match[1] : null;
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const filterUserId = url.searchParams.get("userId");
    const db = await getDB(env);
    let reports = db.reports || [];
    if (filterUserId) reports = reports.filter((r) => r.userId === filterUserId);
    reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return json(reports);
  } catch (e) { return json({ error: "GET: " + e.message }, 500); }
}

export async function onRequestPost({ request, env }) {
  try {
    const userId = getUserId(request);
    if (!userId) return json({ error: "未登录" }, 401);
    const { totalAsset, date, note } = await request.json();
    if (!totalAsset || !date) return json({ error: "总资产和日期不能为空" }, 400);
    const db = await getDB(env);
    const report = {
      id: "r" + Date.now() + Math.random().toString(36).slice(2, 6),
      userId, date, totalAsset, note: note || "", createdAt: new Date().toISOString(),
    };
    if (!db.reports) db.reports = [];
    db.reports.push(report);
    await saveDB(env, db);
    return json(report);
  } catch (e) { return json({ error: "POST: " + e.message }, 500); }
}

export async function onRequestPut({ request, env }) {
  try {
    const userId = getUserId(request);
    if (!userId) return json({ error: "未登录" }, 401);
    const { reportId, totalAsset, date, note } = await request.json();
    const db = await getDB(env);
    const idx = (db.reports || []).findIndex((r) => r.id === reportId);
    if (idx === -1 || db.reports[idx].userId !== userId) return json({ error: "修改失败" }, 400);
    if (Date.now() - new Date(db.reports[idx].createdAt).getTime() > 86400000) return json({ error: "已超过24小时" }, 400);
    if (totalAsset !== undefined) db.reports[idx].totalAsset = totalAsset;
    if (date !== undefined) db.reports[idx].date = date;
    if (note !== undefined) db.reports[idx].note = note;
    await saveDB(env, db);
    return json(db.reports[idx]);
  } catch (e) { return json({ error: "PUT: " + e.message }, 500); }
}

export async function onRequestDelete({ request, env }) {
  try {
    const userId = getUserId(request);
    if (!userId) return json({ error: "未登录" }, 401);
    const { reportId } = await request.json();
    const db = await getDB(env);
    const idx = (db.reports || []).findIndex((r) => r.id === reportId);
    if (idx === -1 || db.reports[idx].userId !== userId) return json({ error: "删除失败" }, 400);
    db.reports.splice(idx, 1);
    await saveDB(env, db);
    return json({ ok: true });
  } catch (e) { return json({ error: "DELETE: " + e.message }, 500); }
}
