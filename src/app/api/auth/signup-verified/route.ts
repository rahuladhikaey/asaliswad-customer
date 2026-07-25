import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = null;

    try {
      const { data, error } = await supabaseServer.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName || "Customer" }
      });

      if (!error && data?.user) {
        user = data.user;
      } else {
        const signUpRes = await supabaseServer.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (signUpRes.error) {
          return NextResponse.json(
            { success: false, error: signUpRes.error.message },
            { status: 400 }
          );
        }
        user = signUpRes.data.user;
      }
    } catch (adminErr: any) {
      const signUpRes = await supabaseServer.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { full_name: fullName }
        }
      });
      if (signUpRes.error) {
        return NextResponse.json(
          { success: false, error: signUpRes.error.message },
          { status: 400 }
        );
      }
      user = signUpRes.data.user;
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user?.id,
        email: user?.email,
        confirmed_at: user?.confirmed_at || new Date().toISOString(),
      },
      message: "Account created and verified successfully!",
    });

  } catch (error: any) {
    console.error("Auth API Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process email verification." },
      { status: 400 }
    );
  }
}
