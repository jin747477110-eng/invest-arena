import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 静态文件扩展名
const STATIC_EXTS = /\.(js|css|svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot|json|xml|txt|map)$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 无论如何，静态资源和 API 直接放行
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname === "/favicon.ico" ||
    STATIC_EXTS.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 登录页直接放行
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // 其他页面需要登录
  const token = request.cookies.get("invest_user")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
