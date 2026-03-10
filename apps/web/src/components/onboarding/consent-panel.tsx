"use client";

import { Check, X, Shield } from "lucide-react";

interface ConsentPanelProps {
  portalName: string;
  onConsent: () => void;
}

export function ConsentPanel({ portalName, onConsent }: ConsentPanelProps) {
  return (
    <div className="rounded-lg border bg-muted/30 p-5 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Shield className="h-4 w-4 text-primary" />
        Permissions for {portalName}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">TenderWatch will:</p>
        <div className="space-y-1.5">
          {[
            "Search for tenders matching your watches",
            "Download tender documents on your behalf",
            "Monitor for new opportunities daily",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">TenderWatch will NOT:</p>
        <div className="space-y-1.5">
          {[
            "Submit bids or responses",
            "Modify your portal profile",
            "Share your credentials with third parties",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
              <X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Your credentials are encrypted with AES-256. You can disconnect at any time from Settings.
      </p>

      <button
        onClick={onConsent}
        className="w-full bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        I understand, continue
      </button>
    </div>
  );
}
