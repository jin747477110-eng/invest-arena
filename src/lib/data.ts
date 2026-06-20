import { supabase } from "./supabase";

// 类型定义（camelCase，和前端一致）
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
  const { data } = await supabase.from("users").select("*");
  return (data || []).map((u: any) => ({
    id: u.id, slug: u.slug, name: u.name,
    nickname: u.nickname, password: u.password,
    bio: u.bio, initCapital: u.initcapital || 10000,
  }));
}

export async function getUserBySlug(slug: string): Promise<User | undefined> {
  const { data } = await supabase.from("users").select("*").eq("slug", slug).single();
  if (!data) return undefined;
  return {
    id: data.id, slug: data.slug, name: data.name,
    nickname: data.nickname, password: data.password,
    bio: data.bio, initCapital: data.initcapital || 10000,
  };
}

export async function getUserById(id: string): Promise<User | undefined> {
  const { data } = await supabase.from("users").select("*").eq("id", id).single();
  if (!data) return undefined;
  return {
    id: data.id, slug: data.slug, name: data.name,
    nickname: data.nickname, password: data.password,
    bio: data.bio, initCapital: data.initcapital || 10000,
  };
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const dbUpdates: any = {};
  if (updates.nickname !== undefined) dbUpdates.nickname = updates.nickname;
  if (updates.password !== undefined) dbUpdates.password = updates.password;
  if (updates.bio !== undefined) dbUpdates.bio = updates.bio;

  const { data } = await supabase.from("users").update(dbUpdates).eq("id", id).select().single();
  if (!data) return null;
  return {
    id: data.id, slug: data.slug, name: data.name,
    nickname: data.nickname, password: data.password,
    bio: data.bio, initCapital: data.initcapital || 10000,
  };
}

// ── Reports ──

function mapReport(r: any): Report {
  return {
    id: r.id,
    userId: r.userid,
    date: r.date,
    totalAsset: r.totalasset,
    note: r.note || "",
    createdAt: r.createdat,
  };
}

export async function getReports(userId?: string): Promise<Report[]> {
  let query = supabase.from("reports").select("*");
  if (userId) query = query.eq("userid", userId);
  const { data } = await query.order("createdat", { ascending: false });
  return (data || []).map(mapReport);
}

export async function getLatestReport(userId: string): Promise<Report | undefined> {
  const { data } = await supabase
    .from("reports").select("*")
    .eq("userid", userId)
    .order("createdat", { ascending: false })
    .limit(1).single();
  return data ? mapReport(data) : undefined;
}

export async function addReport(
  userId: string, totalAsset: number, date: string, note: string
): Promise<Report> {
  const row = {
    id: "r" + Date.now() + Math.random().toString(36).slice(2, 6),
    userid: userId, date, totalasset: totalAsset,
    note: note || "",
    createdat: new Date().toISOString(),
  };
  await supabase.from("reports").insert(row);
  return mapReport(row);
}

export async function updateReport(
  reportId: string, userId: string,
  updates: { totalAsset?: number; note?: string; date?: string }
): Promise<Report | null> {
  const { data: existing } = await supabase.from("reports").select("*").eq("id", reportId).single();
  if (!existing || existing.userid !== userId) return null;

  const created = new Date(existing.createdat).getTime();
  if (Date.now() - created > 24 * 60 * 60 * 1000) return null;

  const dbUpdates: any = {};
  if (updates.totalAsset !== undefined) dbUpdates.totalasset = updates.totalAsset;
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.note !== undefined) dbUpdates.note = updates.note;

  const { data } = await supabase.from("reports").update(dbUpdates).eq("id", reportId).select().single();
  return data ? mapReport(data) : null;
}

export async function deleteReport(reportId: string, userId: string): Promise<boolean> {
  const { data: existing } = await supabase.from("reports").select("*").eq("id", reportId).single();
  if (!existing || existing.userid !== userId) return false;

  const created = new Date(existing.createdat).getTime();
  if (Date.now() - created > 24 * 60 * 60 * 1000) return false;

  const { error } = await supabase.from("reports").delete().eq("id", reportId);
  return !error;
}

// ── Rankings ──

export async function getRankings() {
  const { data: users } = await supabase.from("users").select("*");
  const { data: reportsRaw } = await supabase.from("reports").select("*").order("createdat", { ascending: false });

  // Supabase JS 可能自动转 camelCase，统一兼容两种列名
  const reports = (reportsRaw || []).map((r: any) => ({
    id: r.id,
    userId: r.userid || r.userId,
    totalAsset: r.totalasset || r.totalAsset,
    date: r.date,
    createdAt: r.createdat || r.createdAt,
  }));

  const rankings = (users || []).map((user: any) => {
    const userReports = reports.filter((r: any) => r.userId === user.id);
    const initCapital = user.initcapital || 10000;
    const latestAsset = userReports.length > 0 ? userReports[0].totalAsset : initCapital;
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
  const { data } = await supabase.from("settings").select("*").single();
  if (data) return { seasonStart: data.seasonstart, seasonEnd: data.seasonend };
  return { seasonStart: "2026-07-01", seasonEnd: "2026-09-30" };
}
