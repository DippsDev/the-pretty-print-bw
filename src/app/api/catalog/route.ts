import { NextResponse } from "next/server";
import { readGroups } from "@/lib/studioStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ groups: readGroups() });
}
