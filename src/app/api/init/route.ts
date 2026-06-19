import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const results: string[] = [];

  // 确保表存在 (如果已存在会忽略)
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
      nickname TEXT DEFAULT '未命名选手', password TEXT NOT NULL,
      bio TEXT DEFAULT '个性签名未设置', initCapital INTEGER DEFAULT 10000,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY, userId TEXT REFERENCES users(id),
      date DATE NOT NULL, totalAsset FLOAT NOT NULL,
      note TEXT DEFAULT '', createdAt TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      seasonStart TEXT DEFAULT '2026-07-01', seasonEnd TEXT DEFAULT '2026-09-30'
    );
  `;

  try {
    // 直接用 REST API 插数据（DDL 已通过 SQL Editor 执行过）
    // 先清旧数据再插
    await supabase.from("reports").delete().neq("id", "_placeholder_");
    await supabase.from("users").delete().neq("id", "_placeholder_");
    await supabase.from("settings").delete().neq("id", -1);

    const { error: e1 } = await supabase.from("users").insert([
      { id: "user1", slug: "player1", name: "选手一", nickname: "待定选手1", password: "123456", bio: "个性签名未设置", initCapital: 10000 },
      { id: "user2", slug: "player2", name: "选手二", nickname: "待定选手2", password: "123456", bio: "个性签名未设置", initCapital: 10000 },
      { id: "user3", slug: "player3", name: "选手三", nickname: "待定选手3", password: "123456", bio: "个性签名未设置", initCapital: 10000 },
      { id: "user4", slug: "player4", name: "选手四", nickname: "待定选手4", password: "123456", bio: "个性签名未设置", initCapital: 10000 },
    ]);
    results.push(e1 ? "Users: " + e1.message : "Users: OK (4 inserted)");

    const { error: e2 } = await supabase.from("settings").insert([
      { id: 1, seasonStart: "2026-07-01", seasonEnd: "2026-09-30" },
    ]);
    results.push(e2 ? "Settings: " + e2.message : "Settings: OK");

    // 验证
    const { data } = await supabase.from("users").select("*");
    results.push("User count: " + (data?.length || 0));

    return NextResponse.json({ ok: true, results });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
