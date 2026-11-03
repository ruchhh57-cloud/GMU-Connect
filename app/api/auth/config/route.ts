import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json(
      { error: "Supabase configuration missing" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { url, anonKey },
    {
      headers: { "Cache-Control": "no-store" }
    }
  );
}
