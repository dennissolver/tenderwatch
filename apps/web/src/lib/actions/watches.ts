"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

interface CreateWatchInput {
  name: string;
  keywordsMust: string[];
  keywordsBonus: string[];
  keywordsExclude: string[];
  regions: string[];
  valueMin?: number;
  valueMax?: number;
  sensitivity: string;
  deliveryMethod: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function createWatch(input: CreateWatchInput): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase.from("watches").insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    name: input.name,
    is_active: true,
    keywords_must: input.keywordsMust,
    keywords_bonus: input.keywordsBonus,
    keywords_exclude: input.keywordsExclude,
    regions: input.regions,
    value_min: input.valueMin || null,
    value_max: input.valueMax || null,
    sensitivity: input.sensitivity,
    delivery_method: input.deliveryMethod,
    detail_level: "standard",
  } as any);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/watches");
  return { success: true };
}

export async function toggleWatch(watchId: string, isActive: boolean): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("watches")
    .update({ is_active: isActive, updated_at: new Date().toISOString() } as any)
    .eq("id", watchId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/watches");
  return { success: true };
}

export async function deleteWatch(watchId: string): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("watches")
    .delete()
    .eq("id", watchId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/watches");
  return { success: true };
}
