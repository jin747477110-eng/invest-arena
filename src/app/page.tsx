"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

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

interface ChartPoint {
  date: string;
  [key: string]: number | string;
}

const LINE_COLORS = ["#f0c060", "#60a5fa", "#34d399", "#f472b6"];
const MEDAL_EMOJI = ["🥇", "🥈", "🥉", "💩"];
const BADGE_LABELS = [
  "👑 冠军",
  "🚀 领跑者",
  "📈 追赶中",
  "📉 反向信号",
];

export default function HomePage() {
  const router = useRouter();
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [funFact, setFunFact] = useState("");

  async function loadAll() {
    try {
      const [rankRes, reportsRes] = await Promise.all([
        fetch("/api/ranking"),
        fetch("/api/reports"),
      ]);
      const ranks: RankingItem[] = await rankRes.json();
      const allReports = await reportsRes.json();

      setRankings(ranks);

      // Build chart data: merge all users' reports by date
      const dateMap = new Map<string, Record<string, number>>();
      const slugs = ranks.map((r) => r.slug);

      for (const report of allReports) {
        const user = ranks.find((r) => r.userId === report.userId);
        if (!user) continue;
        if (!dateMap.has(report.date)) {
          dateMap.set(report.date, {});
        }
        const point = dateMap.get(report.date)!;
        point[user.slug] = Math.round((report.totalAsset / user.initCapital) * 10000) / 10000;
      }

      const sorted = Array.from(dateMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, values]) => ({
          date: date.slice(5), // MM-DD
          ...values,
        }));

      // Always include today's starting point
      if (sorted.length === 0) {
        const today = new Date().toISOString().slice(5, 10);
        const empty: ChartPoint = { date: today };
        slugs.forEach((s) => (empty[s] = 1.0));
        sorted.push(empty);
      }

      setChartData(sorted);

      // Generate fun fact
      if (ranks.length >= 4) {
        const top = ranks[0];
        const bottom = ranks[ranks.length - 1];
        const spread = top.returnRate - bottom.returnRate;
        if (top.returnRate > 0) {
          setFunFact(`🔥 ${top.nickname} 以 +${top.returnRate}% 领跑，拉开最后一名 ${Math.abs(spread).toFixed(1)} 个百分点`);
        } else if (Math.max(...ranks.map(r => r.returnRate)) === 0 && Math.min(...ranks.map(r => r.returnRate)) === 0) {
          setFunFact("⚡ 所有人都按兵不动，谁先报数谁领先！");
        } else {
          setFunFact(`📊 市场残酷，领先者 ${top.nickname} 也仅 +${top.returnRate}%`);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const refresh = useCallback(() => { loadAll(); }, []);

  useEffect(() => {
    loadAll();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="text-gold-500 text-lg animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 pb-20">
      {/* ── Nav ── */}
      <nav className="bg-surface-900/80 backdrop-blur border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <span className="text-white font-bold text-sm">万元实盘挑战赛</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/report" className="text-gold-400 hover:text-gold-300 text-sm font-medium">
              + 报数
            </Link>
            <button onClick={handleLogout} className="text-gray-500 hover:text-gray-300 text-sm">
              退出
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        {/* ── Fun Fact Banner ── */}
        {funFact && (
          <div className="bg-surface-900 border border-gray-800 rounded-xl px-4 py-3 mb-5 text-center text-sm text-gray-300 animate-in">
            {funFact}
          </div>
        )}

        {/* ── Ranking Cards Grid ── */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {rankings.map((item, idx) => (
            <Link
              key={item.userId}
              href={`/player/${item.slug}`}
              className={`rounded-xl border p-3 transition-all hover:scale-[1.02] ${
                idx === 0
                  ? "border-gold-500 bg-gold-500/5"
                  : "border-gray-800 bg-surface-900"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-lg">{MEDAL_EMOJI[idx]}</span>
                <span className="text-white text-sm font-bold truncate">{item.nickname}</span>
                {idx === 0 && <span className="text-[10px] bg-gold-500/20 text-gold-400 px-1 rounded">LEAD</span>}
              </div>
              <p className={`text-xl font-extrabold ${item.returnRate >= 0 ? "text-green-400" : "text-red-400"}`}>
                {item.returnRate >= 0 ? "+" : ""}{item.returnRate}%
              </p>
              <p className="text-gray-500 text-[10px] mt-0.5">
                ¥{item.totalAsset.toLocaleString()} · {item.reportCount || 0}次报数
              </p>
            </Link>
          ))}
        </div>

        {/* ── Net Value Chart ── */}
        <div className="bg-surface-900 rounded-xl border border-gray-800 p-4 mb-5">
          <h2 className="text-white font-bold text-sm mb-3">📈 净值走势</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={{ stroke: "#374151" }}
                  tickLine={false}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={{ stroke: "#374151" }}
                  tickLine={false}
                  tickFormatter={(v) => v.toFixed(2)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1d24",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#e5e5e5",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                />
                {rankings.map((r, i) => (
                  <Line
                    key={r.slug}
                    type="monotone"
                    dataKey={r.slug}
                    name={r.nickname}
                    stroke={LINE_COLORS[i]}
                    strokeWidth={i === 0 ? 3 : 2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-10 text-gray-600 text-sm">
              等有人报数后，走势图就会出来
            </div>
          )}
        </div>

        {/* ── Bottom Quick Actions ── */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link
            href="/report"
            className="bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl py-4 text-center transition-colors text-base"
          >
            ✍️ 我要报数
          </Link>
          <Link
            href="/hall-of-fame"
            className="bg-surface-900 border border-gray-700 hover:border-gray-500 text-white font-semibold rounded-xl py-4 text-center transition-colors"
          >
            🏛️ 名人堂
          </Link>
        </div>

        {/* ── Player Quick Links ── */}
        <div className="flex justify-center gap-4 text-sm text-gray-500">
          {rankings.map((item) => (
            <Link
              key={item.userId}
              href={`/player/${item.slug}`}
              className="hover:text-gold-400 transition-colors"
            >
              {item.nickname}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
