"use client";

import { useState } from "react";
import { Building2, CheckCircle2, Globe } from "lucide-react";
import { ConsentPanel } from "./consent-panel";
import { PortalLoginForm } from "./portal-login-form";
import { PortalRegisterForm } from "./portal-register-form";
import type { SiteKey } from "@tenderwatch/shared";
import { SITES } from "@tenderwatch/shared";

type StepPhase = "choice" | "consent-login" | "login" | "consent-register" | "register" | "connected";

interface PortalStepProps {
  siteKey: SiteKey;
  stepNumber: number;
  totalSteps: number;
  userEmail: string;
  userCompanyName: string;
  userAbn: string;
  onComplete: (status: "connected" | "skipped") => void;
}

export function PortalStep({
  siteKey,
  stepNumber,
  totalSteps,
  userEmail,
  userCompanyName,
  userAbn,
  onComplete,
}: PortalStepProps) {
  const [phase, setPhase] = useState<StepPhase>("choice");
  const site = SITES[siteKey];

  if (phase === "connected") {
    return (
      <div className="text-center py-8 space-y-4">
        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
        <div>
          <h3 className="text-lg font-semibold">{site.name} Connected</h3>
          <p className="text-sm text-muted-foreground mt-1">
            TenderWatch will now monitor this portal for you.
          </p>
        </div>
        <button
          onClick={() => onComplete("connected")}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {stepNumber < totalSteps ? "Next Portal" : "Finish Setup"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portal header */}
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{site.name}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{site.description}</p>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <Globe className="h-3 w-3" />
            {site.url}
          </div>
        </div>
      </div>

      {/* Choice phase */}
      {phase === "choice" && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Do you have an existing account on {site.name}?</p>

          <button
            onClick={() => setPhase("consent-login")}
            className="w-full text-left rounded-lg border border-input p-4 hover:border-primary hover:bg-primary/5 transition-colors group"
          >
            <p className="font-medium group-hover:text-primary">Yes, I have an account</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Log in to grant TenderWatch access to your {site.name} account
            </p>
          </button>

          <button
            onClick={() => setPhase("consent-register")}
            className="w-full text-left rounded-lg border border-input p-4 hover:border-primary hover:bg-primary/5 transition-colors group"
          >
            <p className="font-medium group-hover:text-primary">No, register me</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Create a new {site.name} account and connect it automatically
            </p>
          </button>

          <button
            onClick={() => onComplete("skipped")}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
          >
            Skip for now
          </button>
        </div>
      )}

      {/* Consent before login */}
      {phase === "consent-login" && (
        <ConsentPanel
          portalName={site.name}
          onConsent={() => setPhase("login")}
        />
      )}

      {/* Login form */}
      {phase === "login" && (
        <PortalLoginForm
          siteKey={siteKey}
          portalName={site.name}
          onSuccess={() => setPhase("connected")}
          onBack={() => setPhase("choice")}
        />
      )}

      {/* Consent before registration */}
      {phase === "consent-register" && (
        <ConsentPanel
          portalName={site.name}
          onConsent={() => setPhase("register")}
        />
      )}

      {/* Registration form */}
      {phase === "register" && (
        <PortalRegisterForm
          siteKey={siteKey}
          portalName={site.name}
          requiredFields={site.requiredFields}
          prefillEmail={userEmail}
          prefillCompanyName={userCompanyName}
          prefillAbn={userAbn}
          onSuccess={() => setPhase("connected")}
          onBack={() => setPhase("choice")}
        />
      )}
    </div>
  );
}
