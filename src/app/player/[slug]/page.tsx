"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface UserInfo {
  id: string;
  slug: string;
  name: string;
  nickname: string;
  bio: string;
  initCapital: number;
}

interface Report {
  id: string;
  date: string;
  totalAsset: number;
  note: string;
  createdAt: string;
}

interface RankingItem {
  userId: string;
  returnRate: number;
  reportCount: number;
}

const BADGE_CHECKS: { emoji: string; name: string; desc: string; check: (reports: Report[], initCapital: number) => boolean }[] = [
  {
    emoji: "💎",
    name: "钻石手",
    desc: "持仓超过30天不动",
    check: (reports) => reports.length > 0 && reports.length <= 4,
  },
  {
    emoji: "🔄",
    name: "高频战士",
    desc: "报数超过20次",
    check: (reports) => reports.length >= 20,
  },
  {
    emoji: "🐢",
    name: "佛系投资者",
    desc: "报数不超过5次",
    check: (reports) => reports.length > 0 && reports.length <= 5,
  },
  {
    emoji: "🚀",
    name: "月球人",
    desc: "收益率突破50%",
    check: (reports, init) => {
      if (reports.length === 0) return false;
      const latest = reports[0].totalAsset;
      return (latest - init) / init >= 0.5;
    },
  },
  {
    emoji: "💀",
    name: "抄底抄在半山腰",
    desc: "最大回撤超过20%",
    check: (reports, init) => {
      if (reports.length < 2) return false;
      const values = reports.map((r) => (r.totalAsset - init) / init);
      let maxDrawdown = 0;
      let peak = values[values.length - 1]; // oldest
      for (let i = values.length - 1; i >= 0; i--) {
        if (values[i] > peak) peak = values[i];
        const dd = peak - values[i];
        if (dd > maxDrawdown) maxDrawdown = dd;
      }
      return maxDrawdown > 0.2;
    },
  },
];

export default function PlayerPage() {
  const { slug } = useParams<{ slug: string }>();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const rankRes = await fetch("/api/ranking");
        const rankings = await rankRes.json();
        const found = rankings.find((r: any) => r.slug === slug);
        if (found) {
          setUser({
            id: found.userId,
            slug: found.slug,
            name: found.name,
            nickname: found.nickname,
            bio: found.bio || "",
            initCapital: found.initCapital,
          });
          setRank(rankings.findIndex((r: any) => r.slug === slug) + 1);
        }

        if (found) {
          const reportsRes = await fetch(`/api/reports?userId=${found.userId}`);
          const reportsData = await reportsRes.json();
          // Newest first for badges, oldest first for chart
          setReports(reportsData);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="text-gold-500 text-lg animate-pulse">加载中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-400">选手未找到</p>
          <Link href="/" className="text-gold-400 hover:text-gold-300 text-sm mt-3 inline-block">← 返回排名</Link>
        </div>
      </div>
    );
  }

  const latestAsset = reports.length > 0 ? reports[0].totalAsset : user.initCapital;
  const returnRate = ((latestAsset - user.initCapital) / user.initCapital) * 100;

  // Chart data: reports sorted oldest first
  const chartData = [...reports]
    .reverse()
    .map((r) => ({
      date: r.date.slice(5),
      value: Math.round((r.totalAsset / user.initCapital) * 10000) / 10000,
    }));

  // If no reports, show starting point
  if (chartData.length === 0) {
    chartData.push({ date: new Date().toISOString().slice(5, 10), value: 1.0 });
  }

  // Badges
  const badges = BADGE_CHECKS.filter((b) => b.check(reports, user.initCapital));

  return (
    <div className="min-h-screen bg-surface-950 pb-20">
      {/* Nav */}
      <nav className="bg-surface-900/80 backdrop-blur border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">← 返回排名</Link>
          <span className="text-white font-bold text-sm">👤 {user.nickname}</span>
          <div className="w-12" />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        {/* Profile Card */}
        <div className="bg-surface-900 rounded-xl p-5 border border-gray-800 mb-5 text-center">
          <div className="text-5xl mb-2">{rank === 1 ? "👑" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "📊"}</div>
          <h1 className="text-xl font-bold text-white mb-1">{user.nickname}</h1>
          <p className="text-gray-500 text-xs mb-4">{user.bio || "这个选手很懒，还没写个性签名"}</p>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface-800 rounded-lg p-3">
              <p className="text-gray-500 text-[10px] mb-0.5">排名</p>
              <p className="text-white text-lg font-bold">#{rank}</p>
            </div>
            <div className="bg-surface-800 rounded-lg p-3">
              <p className="text-gray-500 text-[10px] mb-0.5">总资产</p>
              <p className="text-white text-lg font-bold">¥{latestAsset.toLocaleString()}</p>
            </div>
            <div className="bg-surface-800 rounded-lg p-3">
              <p className="text-gray-500 text-[10px] mb-0.5">收益率</p>
              <p className={`text-lg font-bold ${returnRate >= 0 ? "text-green-400" : "text-red-400"}`}>
                {returnRate >= 0 ? "+" : ""}{Math.round(returnRate * 100) / 100}%
              </p>
            </div>
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="bg-surface-900 rounded-xl p-4 border border-gray-800 mb-5">
            <h2 className="text-white font-bold text-sm mb-3">🏅 成就徽章</h2>
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <div key={b.name} className="bg-surface-800 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="text-lg">{b.emoji}</span>
                  <div>
                    <p className="text-white text-xs font-bold">{b.name}</p>
                    <p className="text-gray-500 text-[10px]">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Net Value Chart */}
        <div className="bg-surface-900 rounded-xl p-4 border border-gray-800 mb-5">
          <h2 className="text-white font-bold text-sm mb-3">📈 净值曲线</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={["auto", "auto"]} tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toFixed(2)} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1a1d24", border: "1px solid #374151", borderRadius: "8px", color: "#e5e5e5", fontSize: "12px" }}
              />
              <ReferenceLine y={1.0} stroke="#4b5563" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="value" stroke={returnRate >= 0 ? "#34d399" : "#f472b6"} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Reports History */}
        <div>
          <h2 className="text-white font-bold text-sm mb-3">📋 报数历史 ({reports.length}次)</h2>
          {reports.length === 0 ? (
            <div className="text-center py-12 bg-surface-900 rounded-xl border border-gray-800">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-500 text-sm">还没有报数记录</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map((report) => {
                const r = ((report.totalAsset - user.initCapital) / user.initCapital) * 100;
                return (
                  <div key={report.id} className="bg-surface-900 rounded-lg p-3.5 border border-gray-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold text-sm">
                          ¥{report.totalAsset.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                        </span>
                        <span className={`text-xs font-medium ${r >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {r >= 0 ? "+" : ""}{Math.round(r * 100) / 100}%
                        </span>
                      </div>
                      <p className="text-gray-500 text-[10px] mt-0.5">
                        {report.date}
                        {report.note && ` · ${report.note}`}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-600">
                      {new Date(report.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
