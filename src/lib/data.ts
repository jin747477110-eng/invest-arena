import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

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

interface DB {
  users: User[];
  reports: Report[];
  seasonStart: string;
  seasonEnd: string;
}

function readDB(): DB {
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeDB(db: DB): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

// ---- Users ----

export function getUsers(): User[] {
  return readDB().users;
}

export function getUserBySlug(slug: string): User | undefined {
  return readDB().users.find((u) => u.slug === slug);
}

export function getUserById(id: string): User | undefined {
  return readDB().users.find((u) => u.id === id);
}

export function updateUser(id: string, data: Partial<User>): User | null {
  const db = readDB();
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  db.users[idx] = { ...db.users[idx], ...data };
  writeDB(db);
  return db.users[idx];
}

// ---- Reports ----

export function getReports(userId?: string): Report[] {
  const reports = readDB().reports;
  if (userId) return reports.filter((r) => r.userId === userId);
  return reports;
}

export function getLatestReport(userId: string): Report | undefined {
  const reports = readDB()
    .reports.filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return reports[0];
}

export function addReport(
  userId: string,
  totalAsset: number,
  date: string,
  note: string
): Report {
  const db = readDB();
  const report: Report = {
    id: "r" + Date.now() + Math.random().toString(36).slice(2, 6),
    userId,
    date,
    totalAsset,
    note,
    createdAt: new Date().toISOString(),
  };
  db.reports.push(report);
  writeDB(db);
  return report;
}

export function updateReport(
  reportId: string,
  userId: string,
  data: { totalAsset?: number; note?: string; date?: string }
): Report | null {
  const db = readDB();
  const idx = db.reports.findIndex((r) => r.id === reportId);
  if (idx === -1) return null;
  // Only allow editing your own report
  if (db.reports[idx].userId !== userId) return null;
  // Only allow editing within 24 hours
  const created = new Date(db.reports[idx].createdAt).getTime();
  if (Date.now() - created > 24 * 60 * 60 * 1000) return null;

  db.reports[idx] = { ...db.reports[idx], ...data };
  writeDB(db);
  return db.reports[idx];
}

export function deleteReport(reportId: string, userId: string): boolean {
  const db = readDB();
  const idx = db.reports.findIndex((r) => r.id === reportId);
  if (idx === -1) return false;
  if (db.reports[idx].userId !== userId) return false;
  // Only allow deleting within 24 hours
  const created = new Date(db.reports[idx].createdAt).getTime();
  if (Date.now() - created > 24 * 60 * 60 * 1000) return false;

  db.reports.splice(idx, 1);
  writeDB(db);
  return true;
}

// ---- Rankings ----

export function getRankings(): {
  userId: string;
  slug: string;
  name: string;
  nickname: string;
  totalAsset: number;
  initCapital: number;
  returnRate: number;
  reportCount: number;
}[] {
  const users = readDB().users;
  const reports = readDB().reports;

  const rankings = users.map((user) => {
    const userReports = reports
      .filter((r) => r.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const latestAsset =
      userReports.length > 0 ? userReports[0].totalAsset : user.initCapital;

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

  // Sort by return rate descending
  rankings.sort((a, b) => b.returnRate - a.returnRate);
  return rankings;
}

// ---- Season ----

export function getSeasonInfo() {
  const db = readDB();
  return { seasonStart: db.seasonStart, seasonEnd: db.seasonEnd };
}
