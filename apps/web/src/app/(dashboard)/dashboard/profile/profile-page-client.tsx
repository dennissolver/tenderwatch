"use client";

import { useState } from "react";
import { ProfileForm } from "@/components/onboarding/profile-form";

interface ProfilePageClientProps {
  initialData: {
    companyName?: string;
    abn?: string;
    acn?: string;
    legalName?: string;
    businessName?: string;
    orgType?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    phone?: string;
    contactFirstName?: string;
    contactLastName?: string;
    contactPosition?: string;
  };
}

export function ProfilePageClient({ initialData }: ProfilePageClientProps) {
  const [saved, setSaved] = useState(false);

  return (
    <>
      {saved && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Profile saved successfully.
        </div>
      )}
      <ProfileForm
        initialData={initialData}
        onSave={() => {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }}
      />
    </>
  );
}
