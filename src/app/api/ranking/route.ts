import { NextResponse } from "next/server";
import { getRankings } from "@/lib/data";

export async function GET() {
  const rankings = getRankings();
  return NextResponse.json(rankings);
}
