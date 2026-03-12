"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PORTAL_ORDER } from "@tenderwatch/shared";
import type { SiteKey } from "@tenderwatch/shared";
import { ProfileForm } from "@/components/onboarding/profile-form";
import { PortalStep } from "@/components/onboarding/portal-step";
import { PortalSummary } from "@/components/onboarding/portal-summary";
import { completeOnboarding } from "@/lib/actions/portal-linking";

interface ProfileData {
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
}

interface OnboardingWizardProps {
  userEmail: string;
  userCompanyName: string;
  userAbn: string;
  profileData: ProfileData;
  alreadyLinked: Record<string, "connected" | "skipped">;
}

export function OnboardingWizard({
  userEmail,
  userCompanyName,
  userAbn,
  profileData: initialProfileData,
  alreadyLinked,
}: OnboardingWizardProps) {
  const router = useRouter();

  // Skip portals that are already linked
  const portalsToSetup = PORTAL_ORDER.filter((key) => !alreadyLinked[key]);
  const totalSteps = portalsToSetup.length;

  const [profileCompleted, setProfileCompleted] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>(initialProfileData);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<Record<string, "connected" | "skipped">>(alreadyLinked);
  const [finishing, setFinishing] = useState(false);

  const showSummary = currentIndex >= totalSteps;
  const currentPortal = portalsToSetup[currentIndex] as SiteKey | undefined;

  const handleStepComplete = useCallback(
    (status: "connected" | "skipped") => {
      if (!currentPortal) return;
      setResults((prev) => ({ ...prev, [currentPortal]: status }));
      setCurrentIndex((prev) => prev + 1);
    },
    [currentPortal]
  );

  async function handleFinish() {
    setFinishing(true);
    await completeOnboarding();
    router.push("/dashboard");
  }

  // If all portals were already linked, skip straight to summary
  if (totalSteps === 0 || showSummary) {
    return (
      <div className="space-y-6">
        <PortalSummary
          results={results}
          onFinish={handleFinish}
          loading={finishing}
        />
      </div>
    );
  }

  // Step 0: Collect business profile before linking portals
  if (!profileCompleted) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Your Business Profile</h1>
          <p className="text-muted-foreground text-sm">
            Fill in your business details once — TenderWatch uses this data to
            register you on each tender portal automatically.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <ProfileForm
            initialData={{
              companyName: userCompanyName,
              abn: userAbn,
              ...profileData,
            }}
            onSave={() => setProfileCompleted(true)}
          />
        </div>
      </div>
    );
  }

  const overallStep = PORTAL_ORDER.indexOf(currentPortal!) + 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Connect Your Tender Portals</h1>
        <p className="text-muted-foreground text-sm">
          Link your accounts so TenderWatch can monitor all Australian government
          tenders from a single dashboard. You only need to do this once.
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Portal {overallStep} of {PORTAL_ORDER.length}</span>
          <span>{Object.values(results).filter((v) => v === "connected").length} connected</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(overallStep / PORTAL_ORDER.length) * 100}%` }}
          />
        </div>
        {/* Step indicators */}
        <div className="flex gap-1.5">
          {PORTAL_ORDER.map((key, i) => {
            const status = results[key];
            const isCurrent = key === currentPortal;
            let bgClass = "bg-muted";
            if (status === "connected") bgClass = "bg-green-500";
            else if (status === "skipped") bgClass = "bg-muted-foreground/30";
            else if (isCurrent) bgClass = "bg-primary";
            return (
              <div
                key={key}
                className={`h-1.5 flex-1 rounded-full transition-colors ${bgClass}`}
              />
            );
          })}
        </div>
      </div>

      {/* Current portal step */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <PortalStep
          key={currentPortal}
          siteKey={currentPortal!}
          stepNumber={currentIndex + 1}
          totalSteps={totalSteps}
          userEmail={userEmail}
          userCompanyName={userCompanyName}
          userAbn={userAbn}
          profileData={profileData}
          onComplete={handleStepComplete}
        />
      </div>
    </div>
  );
}
