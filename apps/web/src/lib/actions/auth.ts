"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

interface AuthResult {
  error?: string;
}

export async function signUp(formData: FormData): Promise<AuthResult> {
  const supabase = createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const companyName = formData.get("companyName") as string;
  const abn = formData.get("abn") as string;

  if (!email || !password || !companyName) {
    return { error: "Email, password, and company name are required" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        company_name: companyName,
        abn: abn || null,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Create the user record in our users table
  if (data.user) {
    const { error: insertError } = await supabase.from("users").insert({
      id: data.user.id,
      email,
      company_name: companyName,
      abn: abn || null,
    } as any);

    // Ignore duplicate key error (user already exists)
    if (insertError && insertError.code !== "23505") {
      console.error("Failed to create user record:", insertError);
    }
  }

  // If email confirmation is required, show confirmation message
  // Otherwise redirect to onboarding
  if (data.user?.identities?.length === 0) {
    return { error: "An account with this email already exists" };
  }

  revalidatePath("/", "layout");
  redirect("/welcome");
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  const supabase = createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");

  // Check if onboarding is completed
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    if (!(profile as any)?.onboarding_completed) {
      redirect("/welcome");
    }
  }

  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function resetPassword(formData: FormData): Promise<AuthResult> {
  const supabase = createClient();

  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required" };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/dashboard/settings`,
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}
