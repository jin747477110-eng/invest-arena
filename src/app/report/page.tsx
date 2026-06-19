"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Report {
  id: string;
  userId: string;
  date: string;
  totalAsset: number;
  note: string;
  createdAt: string;
}

export default function ReportPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [totalAsset, setTotalAsset] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load reports
  async function loadReports() {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      setReports(data);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  // Submit new report
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const asset = parseFloat(totalAsset);
    if (!asset || asset <= 0) {
      setError("请输入有效的总资产金额");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalAsset: asset, date, note }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "提交失败");
        setSubmitting(false);
        return;
      }

      // Clear form
      setTotalAsset("");
      setNote("");
      setDate(new Date().toISOString().slice(0, 10));
      await loadReports();
    } catch {
      setError("网络错误");
    }
    setSubmitting(false);
  }

  // Start editing
  function startEdit(report: Report) {
    setEditingId(report.id);
    setTotalAsset(report.totalAsset.toString());
    setDate(report.date);
    setNote(report.note);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Cancel editing
  function cancelEdit() {
    setEditingId(null);
    setTotalAsset("");
    setNote("");
    setDate(new Date().toISOString().slice(0, 10));
  }

  // Save edit
  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const asset = parseFloat(totalAsset);
    if (!asset || asset <= 0) {
      setError("请输入有效的总资产金额");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: editingId, totalAsset: asset, date, note }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "修改失败（可能已超过24小时）");
        setSubmitting(false);
        return;
      }

      cancelEdit();
      await loadReports();
    } catch {
      setError("网络错误");
    }
    setSubmitting(false);
  }

  // Delete report
  async function handleDelete(reportId: string) {
    if (!confirm("确定要删除这条记录吗？仅可删除24小时内的记录。")) return;

    try {
      const res = await fetch("/api/reports", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "删除失败");
        return;
      }
      await loadReports();
    } catch {
      alert("网络错误");
    }
  }

  function canEditDelete(createdAt: string): boolean {
    return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
  }

  return (
    <div className="min-h-screen bg-surface-950 pb-20">
      {/* Nav bar */}
      <nav className="bg-surface-900 border-b border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
            ← 返回排名
          </Link>
          <span className="text-white font-bold text-sm">📝 每日报数</span>
          <div className="w-16" />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Form */}
        <div className="bg-surface-900 rounded-xl p-5 border border-gray-800 mb-6">
          <h2 className="text-white font-bold mb-4">
            {editingId ? "✏️ 修改记录" : "📝 今日报数"}
          </h2>

          <form onSubmit={editingId ? handleEdit : handleSubmit}>
            {/* Date */}
            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-1.5">日期</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors"
              />
            </div>

            {/* Total Asset */}
            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-1.5">
                当日总资产 <span className="text-gray-600">(打开券商APP看)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">¥</span>
                <input
                  type="number"
                  step="0.01"
                  value={totalAsset}
                  onChange={(e) => setTotalAsset(e.target.value)}
                  placeholder="例如 11234.56"
                  className="w-full pl-8 pr-3 py-2.5 bg-surface-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>
            </div>

            {/* Note */}
            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-1.5">
                备注 <span className="text-gray-600">(选填，今天干啥了)</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="如：买了宁德时代，卖了茅台..."
                className="w-full px-3 py-2.5 bg-surface-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm mb-4 text-center bg-red-400/10 py-2 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-gold-500 hover:bg-gold-400 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? "提交中..." : editingId ? "保存修改" : "提交报数"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  取消
                </button>
              )}
            </div>
          </form>
        </div>

        {/* History */}
        <div>
          <h2 className="text-white font-bold mb-3">📋 我的报数记录</h2>
          {reports.length === 0 ? (
            <div className="text-center py-12 bg-surface-900 rounded-xl border border-gray-800">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-500">还没有报数记录，赶紧报一个！</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-surface-900 rounded-lg p-3.5 border border-gray-800 flex items-center justify-between"
                >
                  <div>
                    <p className="text-white font-semibold">
                      ¥{report.totalAsset.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {report.date}
                      {report.note && ` · ${report.note}`}
                    </p>
                  </div>
                  {canEditDelete(report.createdAt) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(report)}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        修改
                      </button>
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  )}
                  {!canEditDelete(report.createdAt) && (
                    <span className="text-xs text-gray-600">已锁定</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
