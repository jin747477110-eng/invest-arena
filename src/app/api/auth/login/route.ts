import { NextResponse } from "next/server";
import { getUsers } from "@/lib/data";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  const users = await getUsers();
  const user = users.find(
    (u) => (u.slug === username || u.name === username) && u.password === password
  );

  if (!user) {
    return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, user: { id: user.id, slug: user.slug, name: user.name, nickname: user.nickname } });

  // Set cookie for 30 days
  response.cookies.set("invest_user", user.id, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}
