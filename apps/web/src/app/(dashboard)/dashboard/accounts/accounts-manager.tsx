"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Link2,
  Building2,
  Globe,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { SITES } from "@tenderwatch/shared";
import type { SiteKey } from "@tenderwatch/shared";
import { ConsentPanel } from "@/components/onboarding/consent-panel";
import { PortalLoginForm } from "@/components/onboarding/portal-login-form";
import { PortalRegisterForm } from "@/components/onboarding/portal-register-form";
import { retryAllPendingAccounts, removeLinkedAccount } from "@/lib/actions/portal-linking";

interface PortalStatus {
  siteKey: string;
  accountId: string | null;
  name: string;
  description: string;
  region: string;
  status: string;
  lastSyncAt: string | null;
  lastError: string | null;
  siteUsername: string | null;
}

interface AccountsManagerProps {
  portals: PortalStatus[];
  userEmail: string;
  userCompanyName: string;
  userAbn: string;
}

type ExpandedState = {
  siteKey: string;
  mode: "consent-login" | "login" | "consent-register" | "register";
} | null;

const STATUS_CONFIG = {
  connected: { icon: CheckCircle2, label: "Connected", color: "text-green-600", bg: "bg-green-50 border-green-200" },
  pending: { icon: Clock, label: "Pending", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
  error: { icon: AlertCircle, label: "Error", color: "text-red-600", bg: "bg-red-50 border-red-200" },
  expired: { icon: XCircle, label: "Expired", color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
  not_linked: { icon: Link2, label: "Not Connected", color: "text-muted-foreground", bg: "border" },
} as const;

export function AccountsManager({ portals, userEmail, userCompanyName, userAbn }: AccountsManagerProps) {
  const [expanded, setExpanded] = useState<ExpandedState>(null);
  const [isPending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  const pendingOrErrorCount = portals.filter(
    (p) => p.status === "pending" || p.status === "error"
  ).length;

  function handleConnect(siteKey: string, mode: "login" | "register") {
    setExpanded({ siteKey, mode: mode === "login" ? "consent-login" : "consent-register" });
  }

  function handleRemove(accountId: string) {
    if (!confirm("Remove this linked account? You can re-add it afterwards.")) return;
    setRemovingId(accountId);
    startTransition(async () => {
      await removeLinkedAccount(accountId);
      setRemovingId(null);
      window.location.reload();
    });
  }

  function handleRetryAll() {
    setRetryMessage(null);
    startTransition(async () => {
      const result = await retryAllPendingAccounts();
      if (result.success) {
        setRetryMessage(
          result.retriedCount > 0
            ? `Retrying ${result.retriedCount} account${result.retriedCount > 1 ? "s" : ""}. This may take a few minutes.`
            : "No pending or errored accounts to retry."
        );
        if (result.retriedCount > 0) {
          setTimeout(() => window.location.reload(), 3000);
        }
      } else {
        setRetryMessage(`Error: ${result.error}`);
      }
    });
  }

  return (
    <div className="space-y-3">
      {pendingOrErrorCount > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-sm text-yellow-800">
            {pendingOrErrorCount} account{pendingOrErrorCount > 1 ? "s" : ""} pending or errored
          </p>
          <button
            onClick={handleRetryAll}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-yellow-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
            {isPending ? "Retrying..." : "Retry All"}
          </button>
        </div>
      )}
      {retryMessage && (
        <p className={`text-sm ${retryMessage.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>
          {retryMessage}
        </p>
      )}
      {portals.map((portal) => {
        const config = STATUS_CONFIG[portal.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.not_linked;
        const StatusIcon = config.icon;
        const isExpanded = expanded?.siteKey === portal.siteKey;
        const site = SITES[portal.siteKey as SiteKey];

        return (
          <div key={portal.siteKey} className={`rounded-xl border p-4 ${isExpanded ? "ring-2 ring-primary/20" : ""}`}>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{portal.name}</p>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${config.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{portal.description}</p>
                {portal.siteUsername && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Linked as: {portal.siteUsername}
                  </p>
                )}
                {portal.lastError && (
                  <p className="text-xs text-destructive mt-0.5">{portal.lastError}</p>
                )}
              </div>

              {portal.status === "not_linked" && !isExpanded && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleConnect(portal.siteKey, "login")}
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Login
                  </button>
                  <span className="text-muted-foreground">|</span>
                  <button
                    onClick={() => handleConnect(portal.siteKey, "register")}
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Register
                  </button>
                </div>
              )}

              {(portal.status === "expired" || portal.status === "error") && !isExpanded && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleConnect(portal.siteKey, "login")}
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Reconnect
                  </button>
                  <span className="text-muted-foreground">|</span>
                  <button
                    onClick={() => portal.accountId && handleRemove(portal.accountId)}
                    disabled={removingId === portal.accountId}
                    className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
                  >
                    {removingId === portal.accountId ? "Removing..." : "Remove"}
                  </button>
                </div>
              )}

              {(portal.status === "pending" || portal.status === "connected") && !isExpanded && portal.accountId && (
                <button
                  onClick={() => handleRemove(portal.accountId!)}
                  disabled={removingId === portal.accountId}
                  className="text-sm font-medium text-muted-foreground hover:text-destructive transition-colors shrink-0 disabled:opacity-50"
                  title="Remove linked account"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Expanded linking forms */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t">
                {expanded.mode === "consent-login" && (
                  <ConsentPanel
                    portalName={portal.name}
                    onConsent={() => setExpanded({ siteKey: portal.siteKey, mode: "login" })}
                  />
                )}
                {expanded.mode === "login" && (
                  <PortalLoginForm
                    siteKey={portal.siteKey}
                    portalName={portal.name}
                    onSuccess={() => {
                      setExpanded(null);
                      window.location.reload();
                    }}
                    onBack={() => setExpanded(null)}
                  />
                )}
                {expanded.mode === "consent-register" && (
                  <ConsentPanel
                    portalName={portal.name}
                    onConsent={() => setExpanded({ siteKey: portal.siteKey, mode: "register" })}
                  />
                )}
                {expanded.mode === "register" && site && (
                  <PortalRegisterForm
                    siteKey={portal.siteKey}
                    portalName={portal.name}
                    requiredFields={site.requiredFields}
                    prefillEmail={userEmail}
                    prefillCompanyName={userCompanyName}
                    prefillAbn={userAbn}
                    onSuccess={() => {
                      setExpanded(null);
                      window.location.reload();
                    }}
                    onBack={() => setExpanded(null)}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
