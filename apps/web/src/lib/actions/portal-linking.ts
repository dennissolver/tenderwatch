"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { Inngest } from "inngest";

const inngest = new Inngest({ id: "tenderwatch" });

function generateId(): string {
  return crypto.randomUUID();
}

interface LinkPortalResult {
  success: boolean;
  error?: string;
}

export async function linkPortalAccount(
  site: string,
  username: string,
  password: string
): Promise<LinkPortalResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // TODO: In production, this will:
  // 1. Call the agent package to validate credentials via Playwright/Browserbase
  // 2. Encrypt the password via the crypto package
  // 3. Store the session cookies from the successful login
  //
  // For now, we store the linked account as "pending" and validate async via Inngest

  const accountId = generateId();
  const { error } = await supabase.from("linked_accounts").insert({
    id: accountId,
    user_id: user.id,
    site,
    site_username: username,
    encrypted_credentials: "__PENDING_ENCRYPTION__",
    registered_via_tenderwatch: false,
    consent_granted_at: new Date().toISOString(),
    status: "pending",
  } as any);

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "This portal account is already linked" };
    }
    return { success: false, error: error.message };
  }

  // Fire Inngest event to validate credentials via Browserbase
  await inngest.send({
    name: "account/validate",
    data: {
      accountId,
      username,
      password,
      site,
      isRegistration: false,
    },
  });

  revalidatePath("/welcome");
  revalidatePath("/dashboard/accounts");
  return { success: true };
}

export async function registerPortalAccount(
  site: string,
  email: string,
  password: string,
  companyName: string,
  abn?: string
): Promise<LinkPortalResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // TODO: In production, this will:
  // 1. Call the agent package to register on the portal via Playwright/Browserbase
  // 2. Encrypt the password via the crypto package
  // 3. Store the session from successful registration
  //
  // For now, we store as "pending" — registration will be processed async via Inngest

  const accountId = generateId();
  const { error } = await supabase.from("linked_accounts").insert({
    id: accountId,
    user_id: user.id,
    site,
    site_username: email,
    encrypted_credentials: "__PENDING_ENCRYPTION__",
    registered_via_tenderwatch: true,
    consent_granted_at: new Date().toISOString(),
    status: "pending",
  } as any);

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "This portal account is already linked" };
    }
    return { success: false, error: error.message };
  }

  // Fire Inngest event to register + validate via Browserbase
  await inngest.send({
    name: "account/validate",
    data: {
      accountId,
      username: email,
      password,
      site,
      isRegistration: true,
      companyName,
      abn,
    },
  });

  revalidatePath("/welcome");
  revalidatePath("/dashboard/accounts");
  return { success: true };
}

export async function skipPortal(site: string): Promise<void> {
  // No DB action needed — skipped portals simply don't have a linked_accounts row
  // The onboarding UI tracks skip state client-side
}

export async function completeOnboarding(): Promise<LinkPortalResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("users")
    .update({ onboarding_completed: true, updated_at: new Date().toISOString() } as any)
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getLinkedAccounts() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("linked_accounts")
    .select("*")
    .eq("user_id", user.id);

  return data || [];
}

export async function removeLinkedAccount(
  accountId: string
): Promise<LinkPortalResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("linked_accounts")
    .delete()
    .eq("id", accountId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/accounts");
  return { success: true };
}

export async function retryAllPendingAccounts(): Promise<{
  success: boolean;
  retriedCount: number;
  error?: string;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, retriedCount: 0, error: "Not authenticated" };
  }

  // Fetch all pending or error accounts for this user
  const { data: accounts, error } = await supabase
    .from("linked_accounts")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["pending", "error"]);

  if (error) {
    return { success: false, retriedCount: 0, error: error.message };
  }

  if (!accounts || accounts.length === 0) {
    return { success: true, retriedCount: 0 };
  }

  // Reset all to pending and re-fire validation events
  const events = [];
  for (const account of accounts) {
    const a = account as any;

    // Reset status to pending
    await supabase
      .from("linked_accounts")
      .update({ status: "pending", last_error: null, updated_at: new Date().toISOString() } as any)
      .eq("id", a.id);

    events.push({
      name: "account/validate" as const,
      data: {
        accountId: a.id,
        username: a.site_username,
        password: "__USE_STORED__", // Signal to use already-encrypted credentials
        site: a.site,
        isRegistration: a.registered_via_tenderwatch || false,
      },
    });
  }

  // Send all events to Inngest in one batch
  await inngest.send(events);

  revalidatePath("/dashboard/accounts");
  return { success: true, retriedCount: events.length };
}
