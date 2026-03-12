import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SITES, PORTAL_ORDER } from "@tenderwatch/shared";
import { AccountsManager } from "./accounts-manager";

export default async function AccountsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: linkedAccounts } = await supabase
    .from("linked_accounts")
    .select("*")
    .eq("user_id", user.id);

  const { data: profile } = await supabase
    .from("users")
    .select("email, company_name, abn")
    .eq("id", user.id)
    .single();

  // Build portal status map
  const portalStatuses = PORTAL_ORDER.map((key) => {
    const account = (linkedAccounts || []).find((a: any) => a.site === key);
    return {
      siteKey: key,
      accountId: account ? (account as any).id as string : null,
      name: SITES[key].name,
      description: SITES[key].description,
      region: SITES[key].region,
      status: account ? (account as any).status as string : "not_linked",
      lastSyncAt: account ? (account as any).last_sync_at : null,
      lastError: account ? (account as any).last_error : null,
      siteUsername: account ? (account as any).site_username : null,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Linked Accounts</h1>
        <p className="text-muted-foreground mt-1">
          Manage your connections to Australian tender portals. Once connected,
          TenderWatch monitors each portal automatically.
        </p>
      </div>

      <AccountsManager
        portals={portalStatuses}
        userEmail={user.email || ""}
        userCompanyName={(profile as any)?.company_name || ""}
        userAbn={(profile as any)?.abn || ""}
      />
    </div>
  );
}
