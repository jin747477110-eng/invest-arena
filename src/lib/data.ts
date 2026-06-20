const SUPABASE_URL = "https://ynvqbbngmirvtmpnfepe.supabase.co";
const SUPABASE_KEY = "sb_publishable_4Ch2vILw8eFcqEmbGoVYkQ_sZf6h_7-";

function headers() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };
}

async function restGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase GET ${path} 失败 [${res.status}]: ${text}`);
  }
  return res.json();
}

async function restPost(path: string, body: any) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=minimal" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase POST ${path} 失败 [${res.status}]: ${text}`);
  }
}

async function restPatch(path: string, body: any) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "PATCH",
    headers: { ...headers(), Prefer: "return=representation" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase PATCH ${path} 失败 [${res.status}]: ${text}`);
  }
  const data = await res.json();
  return data?.[0] || null;
}

async function restDelete(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "DELETE",
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase DELETE ${path} 失败 [${res.status}]: ${text}`);
  }
  return true;
}

// ── 类型 ──

export interface User {
  id: string;
  slug: string;
  name: string;
  nickname: string;
  password: string;
  bio: string;
  initCapital: number;
}

export interface Report {
  id: string;
  userId: string;
  date: string;
  totalAsset: number;
  note: string;
  createdAt: string;
}

// ── Users ──

export async function getUsers(): Promise<User[]> {
  const rows = await restGet("users?select=*");
  return rows.map((u: any) => ({
    id: u.id, slug: u.slug, name: u.name,
    nickname: u.nickname, password: u.password,
    bio: u.bio, initCapital: u.initcapital || 10000,
  }));
}

export async function getUserBySlug(slug: string): Promise<User | undefined> {
  const rows = await restGet(`users?select=*&slug=eq.${encodeURIComponent(slug)}`);
  const u = rows[0];
  if (!u) return undefined;
  return { id: u.id, slug: u.slug, name: u.name, nickname: u.nickname, password: u.password, bio: u.bio, initCapital: u.initcapital || 10000 };
}

export async function getUserById(id: string): Promise<User | undefined> {
  const rows = await restGet(`users?select=*&id=eq.${encodeURIComponent(id)}`);
  const u = rows[0];
  if (!u) return undefined;
  return { id: u.id, slug: u.slug, name: u.name, nickname: u.nickname, password: u.password, bio: u.bio, initCapital: u.initcapital || 10000 };
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  // Not frequently used, keep simple
  return null;
}

// ── Reports ──

function mapRow(r: any): Report {
  return { id: r.id, userId: r.userid, date: r.date, totalAsset: r.totalasset, note: r.note || "", createdAt: r.createdat };
}

export async function getReports(userId?: string): Promise<Report[]> {
  let path = "reports?select=*&order=createdat.desc";
  if (userId) path += `&userid=eq.${encodeURIComponent(userId)}`;
  const rows = await restGet(path);
  return rows.map(mapRow);
}

export async function addReport(userId: string, totalAsset: number, date: string, note: string): Promise<Report> {
  const row = {
    id: "r" + Date.now() + Math.random().toString(36).slice(2, 6),
    userid: userId, date, totalasset: totalAsset, note: note || "",
    createdat: new Date().toISOString(),
  };
  await restPost("reports", row);
  return mapRow(row);
}

export async function updateReport(reportId: string, userId: string, updates: { totalAsset?: number; note?: string; date?: string }): Promise<Report | null> {
  // Check ownership & time
  const rows = await restGet(`reports?select=*&id=eq.${encodeURIComponent(reportId)}`);
  if (!rows[0] || rows[0].userid !== userId) return null;
  const created = new Date(rows[0].createdat).getTime();
  if (Date.now() - created > 86400000) return null;

  const body: any = {};
  if (updates.totalAsset !== undefined) body.totalasset = updates.totalAsset;
  if (updates.date !== undefined) body.date = updates.date;
  if (updates.note !== undefined) body.note = updates.note;

  const result = await restPatch(`reports?id=eq.${encodeURIComponent(reportId)}`, body);
  return result ? mapRow(result) : null;
}

export async function deleteReport(reportId: string, userId: string): Promise<boolean> {
  const rows = await restGet(`reports?select=*&id=eq.${encodeURIComponent(reportId)}`);
  if (!rows[0] || rows[0].userid !== userId) return false;
  const created = new Date(rows[0].createdat).getTime();
  if (Date.now() - created > 86400000) return false;
  return restDelete(`reports?id=eq.${encodeURIComponent(reportId)}`);
}

// ── Rankings ──

export async function getRankings() {
  const [users, reports] = await Promise.all([
    restGet("users?select=*"),
    restGet("reports?select=*&order=createdat.desc"),
  ]);

  const rankings = (users || []).map((user: any) => {
    const userReports = (reports || []).filter((r: any) => r.userid === user.id);
    const initCapital = user.initcapital || 10000;
    const latestAsset = userReports.length > 0 ? userReports[0].totalasset : initCapital;
    const returnRate = ((latestAsset - initCapital) / initCapital) * 100;
    return {
      userId: user.id, slug: user.slug, name: user.name, nickname: user.nickname,
      totalAsset: latestAsset, initCapital,
      returnRate: Math.round(returnRate * 100) / 100,
      reportCount: userReports.length,
    };
  });

  rankings.sort((a, b) => b.returnRate - a.returnRate);
  return rankings;
}

// ── Season ──

export async function getSeasonInfo() {
  return { seasonStart: "2026-07-01", seasonEnd: "2026-09-30" };
}
