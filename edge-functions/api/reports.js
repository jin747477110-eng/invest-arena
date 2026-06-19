async function getDB(env) {
  const raw = await env.INVEST_KV.get("db");
  if (!raw) return { users: [], reports: [], settings: {} };
  return JSON.parse(raw);
}

async function saveDB(env, db) {
  await env.INVEST_KV.put("db", JSON.stringify(db));
}

function getUserId(request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/invest_user=([^;]+)/);
  return match ? match[1] : null;
}

// GET /api/reports
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const filterUserId = url.searchParams.get("userId");
  const db = await getDB(env);
  let reports = db.reports || [];
  if (filterUserId) {
    reports = reports.filter((r) => r.userId === filterUserId);
  }
  reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return new Response(JSON.stringify(reports), {
    headers: { "content-type": "application/json" },
  });
}

// POST /api/reports
export async function onRequestPost({ request, env }) {
  const userId = getUserId(request);
  if (!userId) {
    return new Response(JSON.stringify({ error: "未登录" }), { status: 401, headers: { "content-type": "application/json" } });
  }

  const { totalAsset, date, note } = await request.json();
  if (!totalAsset || !date) {
    return new Response(JSON.stringify({ error: "总资产和日期不能为空" }), { status: 400, headers: { "content-type": "application/json" } });
  }
  if (totalAsset < 0) {
    return new Response(JSON.stringify({ error: "总资产不能为负数" }), { status: 400, headers: { "content-type": "application/json" } });
  }

  const db = await getDB(env);
  const report = {
    id: "r" + Date.now() + Math.random().toString(36).slice(2, 6),
    userId,
    date,
    totalAsset,
    note: note || "",
    createdAt: new Date().toISOString(),
  };
  if (!db.reports) db.reports = [];
  db.reports.push(report);
  await saveDB(env, db);

  return new Response(JSON.stringify(report), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

// PUT /api/reports
export async function onRequestPut({ request, env }) {
  const userId = getUserId(request);
  if (!userId) {
    return new Response(JSON.stringify({ error: "未登录" }), { status: 401, headers: { "content-type": "application/json" } });
  }

  const { reportId, totalAsset, date, note } = await request.json();
  const db = await getDB(env);
  const idx = (db.reports || []).findIndex((r) => r.id === reportId);
  if (idx === -1 || db.reports[idx].userId !== userId) {
    return new Response(JSON.stringify({ error: "修改失败（记录不存在或非本人）" }), { status: 400, headers: { "content-type": "application/json" } });
  }

  const created = new Date(db.reports[idx].createdAt).getTime();
  if (Date.now() - created > 24 * 60 * 60 * 1000) {
    return new Response(JSON.stringify({ error: "修改失败（已超过24小时）" }), { status: 400, headers: { "content-type": "application/json" } });
  }

  if (totalAsset !== undefined) db.reports[idx].totalAsset = totalAsset;
  if (date !== undefined) db.reports[idx].date = date;
  if (note !== undefined) db.reports[idx].note = note;
  await saveDB(env, db);

  return new Response(JSON.stringify(db.reports[idx]), {
    headers: { "content-type": "application/json" },
  });
}

// DELETE /api/reports
export async function onRequestDelete({ request, env }) {
  const userId = getUserId(request);
  if (!userId) {
    return new Response(JSON.stringify({ error: "未登录" }), { status: 401, headers: { "content-type": "application/json" } });
  }

  const { reportId } = await request.json();
  const db = await getDB(env);
  const idx = (db.reports || []).findIndex((r) => r.id === reportId);
  if (idx === -1 || db.reports[idx].userId !== userId) {
    return new Response(JSON.stringify({ error: "删除失败" }), { status: 400, headers: { "content-type": "application/json" } });
  }

  const created = new Date(db.reports[idx].createdAt).getTime();
  if (Date.now() - created > 24 * 60 * 60 * 1000) {
    return new Response(JSON.stringify({ error: "删除失败（已超过24小时）" }), { status: 400, headers: { "content-type": "application/json" } });
  }

  db.reports.splice(idx, 1);
  await saveDB(env, db);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
}
