import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function WelcomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile for pre-filling registration forms
  const { data: profile } = await supabase
    .from("users")
    .select("email, company_name, abn, acn, legal_name, business_name, org_type, address_line1, address_line2, city, state, postcode, country, phone, contact_first_name, contact_last_name, contact_position, onboarding_completed")
    .eq("id", user.id)
    .single();

  // If onboarding already completed, go to dashboard
  if ((profile as any)?.onboarding_completed) {
    redirect("/dashboard");
  }

  // Fetch any already-linked accounts (in case user refreshes mid-onboarding)
  const { data: linkedAccounts } = await supabase
    .from("linked_accounts")
    .select("site, status")
    .eq("user_id", user.id);

  const alreadyLinked = (linkedAccounts || []).reduce(
    (acc, row: any) => {
      acc[row.site] = "connected";
      return acc;
    },
    {} as Record<string, "connected" | "skipped">
  );

  const p = profile as any;
  const profileData = {
    abn: p?.abn || "",
    acn: p?.acn || "",
    legalName: p?.legal_name || "",
    businessName: p?.business_name || "",
    orgType: p?.org_type || "",
    addressLine1: p?.address_line1 || "",
    addressLine2: p?.address_line2 || "",
    city: p?.city || "",
    state: p?.state || "",
    postcode: p?.postcode || "",
    country: p?.country || "Australia",
    phone: p?.phone || "",
    contactFirstName: p?.contact_first_name || "",
    contactLastName: p?.contact_last_name || "",
    contactPosition: p?.contact_position || "",
  };

  return (
    <OnboardingWizard
      userEmail={user.email || ""}
      userCompanyName={(profile as any)?.company_name || ""}
      userAbn={(profile as any)?.abn || ""}
      profileData={profileData}
      alreadyLinked={alreadyLinked}
    />
  );
}
