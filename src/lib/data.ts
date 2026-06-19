import { supabase } from "./supabase";

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
  return (data || []) as User[];
}

export async function getUserBySlug(slug: string): Promise<User | undefined> {
  const { data } = await supabase.from("users").select("*").eq("slug", slug).single();
  return data as User | undefined;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const { data } = await supabase.from("users").select("*").eq("id", id).single();
  return data as User | undefined;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const { data } = await supabase.from("users").update(updates).eq("id", id).select().single();
  return data as User | null;
}

// ── Reports ──

export async function getReports(userId?: string): Promise<Report[]> {
  let query = supabase.from("reports").select("*");
  if (userId) query = query.eq("userId", userId);
  const { data } = await query.order("createdAt", { ascending: false });
  // Map userId (DB column) to userId (camelCase for frontend)
  return (data || []).map(mapReport);
}

export async function getLatestReport(userId: string): Promise<Report | undefined> {
  const { data } = await supabase
    .from("reports")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: false })
    .limit(1)
    .single();
  return data ? mapReport(data) : undefined;
}

export async function addReport(
  userId: string,
  totalAsset: number,
  date: string,
  note: string
): Promise<Report> {
  const report = {
    id: "r" + Date.now() + Math.random().toString(36).slice(2, 6),
    userId,
    date,
    totalAsset,
    note,
    createdAt: new Date().toISOString(),
  };
  await supabase.from("reports").insert(report);
  return report;
}

export async function updateReport(
  reportId: string,
  userId: string,
  updates: { totalAsset?: number; note?: string; date?: string }
): Promise<Report | null> {
  // Check ownership and 24h window
  const { data: existing } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .single();

  if (!existing) return null;
  if (existing.userId !== userId) return null;

  const created = new Date(existing.createdAt).getTime();
  if (Date.now() - created > 24 * 60 * 60 * 1000) return null;

  const { data } = await supabase
    .from("reports")
    .update(updates)
    .eq("id", reportId)
    .select()
    .single();

  return data ? mapReport(data) : null;
}

export async function deleteReport(reportId: string, userId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .single();

  if (!existing) return false;
  if (existing.userId !== userId) return false;

  const created = new Date(existing.createdAt).getTime();
  if (Date.now() - created > 24 * 60 * 60 * 1000) return false;

  const { error } = await supabase.from("reports").delete().eq("id", reportId);
  return !error;
}

// ── Rankings ──

export async function getRankings(): Promise<
  {
    userId: string;
    slug: string;
    name: string;
    nickname: string;
    totalAsset: number;
    initCapital: number;
    returnRate: number;
    reportCount: number;
  }[]
> {
  const { data: users } = await supabase.from("users").select("*");
  const { data: reports } = await supabase.from("reports").select("*").order("createdAt", { ascending: false });

  const rankings = (users || []).map((user: any) => {
    const userReports = (reports || []).filter((r: any) => r.userId === user.id);
    const latestAsset = userReports.length > 0 ? userReports[0].totalAsset : user.initCapital;
    const returnRate = ((latestAsset - user.initCapital) / user.initCapital) * 100;

    return {
      userId: user.id,
      slug: user.slug,
      name: user.name,
      nickname: user.nickname,
      totalAsset: latestAsset,
      initCapital: user.initCapital,
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
  if (data) return { seasonStart: data.seasonStart, seasonEnd: data.seasonEnd };
  return { seasonStart: "2026-07-01", seasonEnd: "2026-09-30" };
}

// ── Helper ──

function mapReport(row: any): Report {
  return {
    id: row.id,
    userId: row.userId,
    date: row.date,
    totalAsset: row.totalAsset,
    note: row.note || "",
    createdAt: row.createdAt,
  };
}
