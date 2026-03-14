"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { confirmManualStep, getAccountStatus } from "@/lib/actions/portal-linking";

interface LiveSessionEmbedProps {
  accountId: string;
  portalName: string;
  liveViewUrl: string | null;
  manualStepType: string;
}

export function LiveSessionEmbed({
  accountId,
  portalName,
  liveViewUrl,
  manualStepType,
}: LiveSessionEmbedProps) {
  const [confirming, setConfirming] = useState(false);
  const [polling, setPolling] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  const pollStatus = useCallback(async () => {
    setPolling(true);
    // Poll every 3s for up to 30s
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const result = await getAccountStatus(accountId);
      if (result.status === "connected") {
        setDone(true);
        setMessage("Connected successfully!");
        setPolling(false);
        setTimeout(() => window.location.reload(), 1500);
        return;
      }
      if (result.status === "error") {
        setMessage(result.error || "Verification failed. Please try again.");
        setPolling(false);
        return;
      }
    }
    setMessage("Still processing... Refresh the page in a moment.");
    setPolling(false);
  }, [accountId]);

  async function handleConfirm() {
    setConfirming(true);
    setMessage("");
    const result = await confirmManualStep(accountId);
    if (!result.success) {
      setMessage(result.error || "Failed to confirm");
      setConfirming(false);
      return;
    }
    // Start polling for status change
    await pollStatus();
    setConfirming(false);
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 border border-green-200">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <p className="text-sm font-medium text-green-800">
          {portalName} connected successfully!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
        {manualStepType === "captcha" ? (
          <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        ) : (
          <Mail className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        )}
        <div className="text-sm text-blue-800">
          {manualStepType === "captcha" ? (
            <p>
              <strong>{portalName}</strong> requires you to complete a CAPTCHA.
              Please solve it in the browser window below, then click{" "}
              <strong>I've Completed This Step</strong>.
            </p>
          ) : (
            <p>
              <strong>{portalName}</strong> has sent a verification email to your
              inbox. Please click the link in the email, then come back and click{" "}
              <strong>I've Verified My Email</strong>.
            </p>
          )}
        </div>
      </div>

      {/* Embedded browser view for CAPTCHA */}
      {manualStepType === "captcha" && liveViewUrl && (
        <div className="rounded-lg border overflow-hidden">
          <iframe
            src={liveViewUrl}
            className="w-full border-0"
            style={{ height: "500px" }}
            allow="clipboard-read; clipboard-write"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={confirming || polling}
        className="w-full bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {confirming || polling ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {polling ? "Checking..." : "Confirming..."}
          </>
        ) : manualStepType === "captcha" ? (
          "I've Completed This Step"
        ) : (
          "I've Verified My Email"
        )}
      </button>

      {message && (
        <p
          className={`text-sm ${
            message.includes("success") ? "text-green-600" : "text-amber-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
