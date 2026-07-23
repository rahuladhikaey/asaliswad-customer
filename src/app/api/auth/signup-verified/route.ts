import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // 1. Try admin creation with auto-confirmation first
    let { data, error } = await supabaseServer.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true, // Auto-confirm the email
    });

    // 2. Fallback to standard signUp if service role key is missing/unconfigured or unauthorized
    if (error && (error.message.toLowerCase().includes("bearer token") || error.message.toLowerCase().includes("not allowed") || error.status === 401 || error.status === 403)) {
      console.warn("[Auth API] Admin creation requires Service Role key, falling back to standard signUp:", error.message);
      const signUpRes = await supabaseServer.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
      });
      data = { user: signUpRes.data.user };
      error = signUpRes.error;
    }

    if (error) {
      // Handle different error types
      const message = error.message.toLowerCase();

      if (message.includes("already registered") || message.includes("duplicate")) {
        return NextResponse.json(
          { error: "An account already exists for this email. Please sign in." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message || "Failed to create account" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        confirmed_at: data.user?.confirmed_at,
      },
      message: "Account created and verified successfully!",
    });

  } catch (error) {
    console.error("Auth API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
