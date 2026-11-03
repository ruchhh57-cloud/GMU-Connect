import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json(
      {
        error:
          "Missing SUPABASE_URL or SUPABASE_ANON_KEY in the Vercel server environment."
      },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }

  return NextResponse.json(
    { url, anonKey },
    { headers: { "Cache-Control": "no-store" } }
  );
}
