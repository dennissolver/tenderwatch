import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { User, CreditCard, Bell, Shield } from "lucide-react";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences.
        </p>
      </div>

      {/* Profile */}
      <div className="border rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <User className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">Profile</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Company</span>
            <span>{(profile as any)?.company_name || "Not set"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ABN</span>
            <span>{(profile as any)?.abn || "Not set"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plan</span>
            <span className="capitalize">{(profile as any)?.plan || "free"}</span>
          </div>
        </div>
      </div>

      {/* Billing */}
      <div className="border rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Billing</h2>
          </div>
          <Link
            href="/dashboard/settings/billing"
            className="text-sm text-primary hover:underline"
          >
            Manage
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {(profile as any)?.plan === "pro"
            ? "You're on the Pro plan."
            : "You're on the Free plan. Upgrade for more watches and features."}
        </p>
      </div>

      {/* Connected Accounts */}
      <div className="border rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Connected Portals</h2>
          </div>
          <Link
            href="/dashboard/accounts"
            className="text-sm text-primary hover:underline"
          >
            Manage
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Manage your linked tender portal accounts.
        </p>
      </div>
    </div>
  );
}
