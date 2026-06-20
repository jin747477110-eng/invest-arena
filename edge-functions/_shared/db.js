// 共享数据层：KV优先，内存兜底
// 所有 edge functions 导入同一个实例

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

let _memoryDB = null;
let _env = null;

export function setEnv(env) {
  _env = env;
}

async function getDB() {
  // KV 优先
  if (_env?.INVEST_KV) {
    try {
      const raw = await _env.INVEST_KV.get("db");
      if (raw) {
        const db = JSON.parse(raw);
        _memoryDB = db; // 同步到内存
        return db;
      }
    } catch (e) {
      console.log("[db] KV read error:", e.message);
    }
  }
  // 内存兜底
  if (!_memoryDB) {
    _memoryDB = JSON.parse(JSON.stringify(DEFAULT_DB));
    console.log("[db] Using memory fallback");
  }
  return _memoryDB;
}

async function saveDB(db) {
  _memoryDB = db;
  if (_env?.INVEST_KV) {
    try {
      await _env.INVEST_KV.put("db", JSON.stringify(db));
      console.log("[db] Saved to KV");
    } catch (e) {
      console.log("[db] KV write error:", e.message);
    }
  }
}

// User operations
export async function findUser(username, password) {
  const db = await getDB();
  return db.users.find(
    (u) => (u.slug === username || u.name === username) && u.password === password
  ) || null;
}

// Report operations
export async function getReports(filterUserId) {
  const db = await getDB();
  let reports = db.reports || [];
  if (filterUserId) reports = reports.filter((r) => r.userId === filterUserId);
  reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return reports;
}

export async function addReport(userId, totalAsset, date, note) {
  const db = await getDB();
  const report = {
    id: "r" + Date.now() + Math.random().toString(36).slice(2, 6),
    userId, date, totalAsset,
    note: note || "",
    createdAt: new Date().toISOString(),
  };
  if (!db.reports) db.reports = [];
  db.reports.push(report);
  await saveDB(db);
  return report;
}

export async function updateReport(reportId, userId, updates) {
  const db = await getDB();
  const idx = (db.reports || []).findIndex((r) => r.id === reportId);
  if (idx === -1 || db.reports[idx].userId !== userId) return null;
  const created = new Date(db.reports[idx].createdAt).getTime();
  if (Date.now() - created > 86400000) return { expired: true };
  if (updates.totalAsset !== undefined) db.reports[idx].totalAsset = updates.totalAsset;
  if (updates.date !== undefined) db.reports[idx].date = updates.date;
  if (updates.note !== undefined) db.reports[idx].note = updates.note;
  await saveDB(db);
  return db.reports[idx];
}

export async function deleteReport(reportId, userId) {
  const db = await getDB();
  const idx = (db.reports || []).findIndex((r) => r.id === reportId);
  if (idx === -1 || db.reports[idx].userId !== userId) return false;
  db.reports.splice(idx, 1);
  await saveDB(db);
  return true;
}

// Ranking
export async function getRankings() {
  const db = await getDB();
  const users = db.users || [];
  const reports = db.reports || [];

  const rankings = users.map((user) => {
    const userReports = reports
      .filter((r) => r.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const latestAsset = userReports.length > 0 ? userReports[0].totalAsset : user.initCapital;
    const returnRate = ((latestAsset - user.initCapital) / user.initCapital) * 100;
    return {
      userId: user.id, slug: user.slug, name: user.name, nickname: user.nickname,
      totalAsset: latestAsset, initCapital: user.initCapital,
      returnRate: Math.round(returnRate * 100) / 100,
      reportCount: userReports.length,
    };
  });

  rankings.sort((a, b) => b.returnRate - a.returnRate);
  return rankings;
}
