import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { universityId, password, role } = await request.json();

    if (!universityId || !password || !role) {
      return NextResponse.json(
        { error: "Enter your ID, password and portal." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return NextResponse.json(
        { error: "Server authentication is not configured." },
        { status: 500 }
      );
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, email, role, university_id")
      .eq("university_id", universityId.trim())
      .maybeSingle();

    if (
      profileError ||
      !profile ||
      profile.role !== role.toLowerCase() ||
      !profile.email
    ) {
      return NextResponse.json(
        { error: "Invalid ID, password or portal." },
        { status: 401 }
      );
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false }
    });

    const { data, error } = await authClient.auth.signInWithPassword({
      email: profile.email,
      password
    });

    if (error || !data.session) {
      return NextResponse.json(
        { error: "Invalid ID, password or portal." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        universityId: profile.university_id,
        role: profile.role
      },
      session: data.session
    });
  } catch (error) {
    console.error("Authentication route error:", error);

    return NextResponse.json(
      { error: "Unable to sign in. Please try again." },
      { status: 500 }
    );
  }
}
