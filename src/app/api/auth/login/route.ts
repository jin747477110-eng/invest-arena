import { NextResponse } from "next/server";
import { getUsers } from "@/lib/data";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  try {
    const users = await getUsers();

    // Debug: log user count
    console.log("Login attempt:", username, "| Users in DB:", users.length);

    const user = users.find(
      (u) => (u.slug === username || u.name === username) && u.password === password
    );

    if (!user) {
      return NextResponse.json({
        error: "用户名或密码错误",
        debug: { userCount: users.length, usersFound: users.map(u => u.slug) }
      }, { status: 401 });
    }

    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, slug: user.slug, name: user.name, nickname: user.nickname },
    });

    response.cookies.set("invest_user", user.id, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (e: any) {
    console.error("Login error:", e);
    return NextResponse.json({
      error: "服务器错误: " + (e.message || "未知错误"),
    }, { status: 500 });
  }
}
