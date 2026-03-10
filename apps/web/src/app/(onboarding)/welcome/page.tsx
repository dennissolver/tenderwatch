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
    .select("email, company_name, abn, onboarding_completed")
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

  return (
    <OnboardingWizard
      userEmail={user.email || ""}
      userCompanyName={(profile as any)?.company_name || ""}
      userAbn={(profile as any)?.abn || ""}
      alreadyLinked={alreadyLinked}
    />
  );
}
