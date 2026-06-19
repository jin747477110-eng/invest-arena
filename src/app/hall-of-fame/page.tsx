"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface RankingItem {
  userId: string;
  slug: string;
  name: string;
  nickname: string;
  totalAsset: number;
  initCapital: number;
  returnRate: number;
  reportCount: number;
}

interface Report {
  id: string;
  userId: string;
  totalAsset: number;
  date: string;
  note: string;
  createdAt: string;
}

export default function HallOfFamePage() {
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [records, setRecords] = useState<{
    highestReturn: { nickname: string; value: number } | null;
    lowestReturn: { nickname: string; value: number } | null;
    mostReports: { nickname: string; value: number } | null;
    biggestGain: { nickname: string; value: number; note: string } | null;
  }>({ highestReturn: null, lowestReturn: null, mostReports: null, biggestGain: null });

  useEffect(() => {
    async function load() {
      const [rankRes, reportsRes] = await Promise.all([
        fetch("/api/ranking"),
        fetch("/api/reports"),
      ]);
      const ranks: RankingItem[] = await rankRes.json();
      const allReports: Report[] = await reportsRes.json();

      setRankings(ranks);

      // Compute records
      const sorted = [...ranks].sort((a, b) => b.returnRate - a.returnRate);
      if (sorted.length > 0) {
        setRecords((prev) => ({
          ...prev,
          highestReturn: { nickname: sorted[0].nickname, value: sorted[0].returnRate },
          lowestReturn: { nickname: sorted[sorted.length - 1].nickname, value: sorted[sorted.length - 1].returnRate },
          mostReports: ranks.reduce(
            (best, r) => (r.reportCount > (best?.value || 0) ? { nickname: r.nickname, value: r.reportCount } : best),
            null as { nickname: string; value: number } | null
          ),
        }));
      }

      // Biggest single-day gain (vs previous report)
      let biggest: { nickname: string; value: number; note: string } | null = null;
      const rankingsMap = new Map(ranks.map((r) => [r.userId, r]));
      const userReports = new Map<string, Report[]>();
      for (const r of allReports) {
        if (!userReports.has(r.userId)) userReports.set(r.userId, []);
        userReports.get(r.userId)!.push(r);
      }

      for (const [userId, reps] of userReports) {
        const user = rankingsMap.get(userId);
        if (!user) continue;
        const sorted = reps.sort((a, b) => a.date.localeCompare(b.date));
        for (let i = 1; i < sorted.length; i++) {
          const change = ((sorted[i].totalAsset - sorted[i - 1].totalAsset) / user.initCapital) * 100;
          if (!biggest || change > biggest.value) {
            biggest = { nickname: user.nickname, value: Math.round(change * 100) / 100, note: sorted[i].note || sorted[i].date };
          }
        }
      }

      setRecords((prev) => ({ ...prev, biggestGain: biggest }));
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-surface-950 pb-20">
      <nav className="bg-surface-900/80 backdrop-blur border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">← 返回排名</Link>
          <span className="text-white font-bold text-sm">🏛️ 名人堂</span>
          <div className="w-12" />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🏛️</div>
          <h1 className="text-xl font-bold text-white">名人堂</h1>
          <p className="text-gray-500 text-xs mt-1">传奇在此永存</p>
        </div>

        {/* Current Rankings as Hall */}
        <div className="bg-surface-900 rounded-xl p-4 border border-gray-800 mb-5">
          <h2 className="text-white font-bold text-sm mb-3">🏆 当前赛季排名</h2>
          <div className="space-y-2">
            {rankings.map((r, i) => (
              <Link
                key={r.userId}
                href={`/player/${r.slug}`}
                className="flex items-center justify-between bg-surface-800 rounded-lg p-3 hover:bg-surface-800/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{["🥇", "🥈", "🥉", "4️⃣"][i]}</span>
                  <div>
                    <p className="text-white text-sm font-bold">{r.nickname}</p>
                    <p className="text-gray-500 text-[10px]">{r.reportCount || 0}次报数</p>
                  </div>
                </div>
                <span className={`text-lg font-extrabold ${r.returnRate >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {r.returnRate >= 0 ? "+" : ""}{r.returnRate}%
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Records */}
        <div className="bg-surface-900 rounded-xl p-4 border border-gray-800">
          <h2 className="text-white font-bold text-sm mb-3">📊 赛季之最</h2>
          <div className="space-y-2">
            <RecordRow emoji="🚀" label="最高收益率" record={records.highestReturn} suffix="%" />
            <RecordRow emoji="📉" label="最低收益率" record={records.lowestReturn} suffix="%  😅" />
            <RecordRow emoji="🔄" label="报数最多" record={records.mostReports} suffix="次" />
            <RecordRow emoji="💥" label="单日最大涨幅" record={records.biggestGain} suffix="%" />
          </div>
          {!records.highestReturn && (
            <p className="text-gray-600 text-xs text-center py-4">还没有数据，等开赛吧</p>
          )}
        </div>
      </div>
    </div>
  );
}

function RecordRow({
  emoji,
  label,
  record,
  suffix,
}: {
  emoji: string;
  label: string;
  record: { nickname: string; value: number } | null;
  suffix: string;
}) {
  if (!record) return null;
  return (
    <div className="flex items-center justify-between bg-surface-800 rounded-lg p-3">
      <div className="flex items-center gap-2">
        <span className="text-base">{emoji}</span>
        <span className="text-gray-400 text-xs">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-white text-sm font-bold">{record.nickname}</span>
        <span className="text-gold-400 text-sm font-bold ml-2">
          {record.value >= 0 ? "+" : ""}{record.value}{suffix}
        </span>
      </div>
    </div>
  );
}
