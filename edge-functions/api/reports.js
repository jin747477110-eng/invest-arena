import { setEnv, getReports, addReport, updateReport, deleteReport } from "../../_shared/db.js";

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
    setEnv(env);
    const url = new URL(request.url);
    const filterUserId = url.searchParams.get("userId");
    const reports = await getReports(filterUserId);
    return json(reports);
  } catch (e) { return json({ error: "GET: " + e.message }, 500); }
}

export async function onRequestPost({ request, env }) {
  try {
    setEnv(env);
    const userId = getUserId(request);
    if (!userId) return json({ error: "未登录" }, 401);
    const { totalAsset, date, note } = await request.json();
    if (!totalAsset || !date) return json({ error: "总资产和日期不能为空" }, 400);
    const report = await addReport(userId, totalAsset, date, note);
    return json(report);
  } catch (e) { return json({ error: "POST: " + e.message }, 500); }
}

export async function onRequestPut({ request, env }) {
  try {
    setEnv(env);
    const userId = getUserId(request);
    if (!userId) return json({ error: "未登录" }, 401);
    const { reportId, totalAsset, date, note } = await request.json();
    const result = await updateReport(reportId, userId, { totalAsset, date, note });
    if (!result) return json({ error: "修改失败" }, 400);
    if (result.expired) return json({ error: "已超过24小时" }, 400);
    return json(result);
  } catch (e) { return json({ error: "PUT: " + e.message }, 500); }
}

export async function onRequestDelete({ request, env }) {
  try {
    setEnv(env);
    const userId = getUserId(request);
    if (!userId) return json({ error: "未登录" }, 401);
    const { reportId } = await request.json();
    const ok = await deleteReport(reportId, userId);
    if (!ok) return json({ error: "删除失败" }, 400);
    return json({ ok: true });
  } catch (e) { return json({ error: "DELETE: " + e.message }, 500); }
}
