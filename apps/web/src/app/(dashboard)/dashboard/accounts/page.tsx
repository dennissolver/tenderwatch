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
    .select("email, company_name, abn, acn, legal_name, business_name, org_type, address_line1, address_line2, city, state, postcode, country, phone, contact_first_name, contact_last_name, contact_position")
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
      liveViewUrl: account ? (account as any).live_view_url : null,
      manualStepType: account ? (account as any).manual_step_type : null,
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
        profileData={{
          abn: (profile as any)?.abn || "",
          acn: (profile as any)?.acn || "",
          legalName: (profile as any)?.legal_name || "",
          businessName: (profile as any)?.business_name || "",
          orgType: (profile as any)?.org_type || "",
          addressLine1: (profile as any)?.address_line1 || "",
          addressLine2: (profile as any)?.address_line2 || "",
          city: (profile as any)?.city || "",
          state: (profile as any)?.state || "",
          postcode: (profile as any)?.postcode || "",
          country: (profile as any)?.country || "Australia",
          phone: (profile as any)?.phone || "",
          contactFirstName: (profile as any)?.contact_first_name || "",
          contactLastName: (profile as any)?.contact_last_name || "",
          contactPosition: (profile as any)?.contact_position || "",
        }}
      />
    </div>
  );
}
