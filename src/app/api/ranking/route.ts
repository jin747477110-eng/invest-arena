import { NextResponse } from "next/server";
import { getRankings } from "@/lib/data";

export async function GET() {
  const rankings = await getRankings();
  return NextResponse.json(rankings);
}
