"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "登录失败");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("网络错误，请重试");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 px-4">
      <div className="w-full max-w-sm">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏆</div>
          <h1 className="text-2xl font-bold text-white mb-1">万元实盘投资挑战赛</h1>
          <p className="text-gray-500 text-sm">真金白银，排名对决</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-surface-900 rounded-xl p-6 border border-gray-800">
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-1.5">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入你的用户名"
              className="w-full px-3 py-2.5 bg-surface-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-400 text-sm mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              className="w-full px-3 py-2.5 bg-surface-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm mb-4 text-center bg-red-400/10 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gold-500 hover:bg-gold-400 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "登录中..." : "登 录"}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs mt-6">
          仅限参赛选手 · 初始密码请联系管理员
        </p>
      </div>
    </div>
  );
}
