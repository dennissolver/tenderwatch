"use client";

import { CheckCircle2, MinusCircle, ArrowRight } from "lucide-react";
import { SITES, PORTAL_ORDER } from "@tenderwatch/shared";
import type { SiteKey } from "@tenderwatch/shared";

interface PortalSummaryProps {
  results: Record<string, "connected" | "skipped">;
  onFinish: () => void;
  loading: boolean;
}

export function PortalSummary({ results, onFinish, loading }: PortalSummaryProps) {
  const connected = PORTAL_ORDER.filter((key) => results[key] === "connected");
  const skipped = PORTAL_ORDER.filter((key) => results[key] === "skipped");

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">You&apos;re all set!</h2>
        <p className="text-muted-foreground">
          {connected.length > 0
            ? `TenderWatch is now monitoring ${connected.length} portal${connected.length === 1 ? "" : "s"} for you.`
            : "You can connect portals anytime from Settings."}
        </p>
      </div>

      {connected.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-green-700">Connected</p>
          {connected.map((key) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3"
            >
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-medium">{SITES[key].name}</p>
                <p className="text-xs text-muted-foreground">{SITES[key].description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {skipped.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Skipped</p>
          {skipped.map((key) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <MinusCircle className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">{SITES[key].name}</p>
                <p className="text-xs text-muted-foreground">
                  Connect anytime from Settings &rarr; Accounts
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onFinish}
        disabled={loading}
        className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        Go to Dashboard
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
