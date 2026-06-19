import { NextRequest, NextResponse } from "next/server";
import { addReport, getReports, updateReport, deleteReport } from "@/lib/data";

// GET: list reports (all or filtered by userId)
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId") || undefined;
  const reports = getReports(userId);
  // Return newest first
  reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json(reports);
}

// POST: add a new report
export async function POST(request: NextRequest) {
  const token = request.cookies.get("invest_user")?.value;
  if (!token) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { totalAsset, date, note } = await request.json();

  if (!totalAsset || !date) {
    return NextResponse.json({ error: "总资产和日期不能为空" }, { status: 400 });
  }

  if (totalAsset < 0) {
    return NextResponse.json({ error: "总资产不能为负数" }, { status: 400 });
  }

  const report = addReport(token, totalAsset, date, note || "");
  return NextResponse.json(report);
}

// PUT: update a report
export async function PUT(request: NextRequest) {
  const token = request.cookies.get("invest_user")?.value;
  if (!token) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { reportId, totalAsset, date, note } = await request.json();
  const result = updateReport(reportId, token, { totalAsset, date, note });
  if (!result) return NextResponse.json({ error: "修改失败（记录不存在、非本人或已超过24小时）" }, { status: 400 });
  return NextResponse.json(result);
}

// DELETE: delete a report
export async function DELETE(request: NextRequest) {
  const token = request.cookies.get("invest_user")?.value;
  if (!token) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { reportId } = await request.json();
  const ok = deleteReport(reportId, token);
  if (!ok) return NextResponse.json({ error: "删除失败（记录不存在、非本人或已超过24小时）" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
