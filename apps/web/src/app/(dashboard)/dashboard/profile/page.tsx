import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfilePageClient } from "./profile-page-client";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("company_name, abn, acn, legal_name, business_name, org_type, address_line1, address_line2, city, state, postcode, country, phone, contact_first_name, contact_last_name, contact_position")
    .eq("id", user.id)
    .single();

  const p = profile as any;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Business Profile</h1>
        <p className="text-muted-foreground mt-1">
          This data is used to register you on tender portals automatically.
          Update it here and future registrations will use the latest details.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <ProfilePageClient
          initialData={{
            companyName: p?.company_name || "",
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
          }}
        />
      </div>
    </div>
  );
}
