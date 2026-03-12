"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { registerPortalAccount } from "@/lib/actions/portal-linking";

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

interface PortalRegisterFormProps {
  siteKey: string;
  portalName: string;
  requiredFields: readonly string[];
  prefillEmail: string;
  prefillCompanyName: string;
  prefillAbn: string;
  profileData?: ProfileData;
  onSuccess: () => void;
  onBack: () => void;
}

export function PortalRegisterForm({
  siteKey,
  portalName,
  requiredFields,
  prefillEmail,
  prefillCompanyName,
  prefillAbn,
  profileData,
  onSuccess,
  onBack,
}: PortalRegisterFormProps) {
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState(prefillCompanyName);
  const [abn, setAbn] = useState(prefillAbn);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const needsAbn = requiredFields.includes("abn");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await registerPortalAccount(
      siteKey,
      email,
      password,
      companyName,
      { abn: needsAbn ? abn : undefined, ...profileData }
    );

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || "Registration failed");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        We&apos;ll create a new account on {portalName} for you using the details below.
      </p>

      <div className="space-y-2">
        <label htmlFor="reg-email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="reg-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="reg-password" className="text-sm font-medium">
          Password
        </label>
        <div className="relative">
          <input
            id="reg-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            placeholder="Min. 8 characters"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="reg-company" className="text-sm font-medium">
          Company Name
        </label>
        <input
          id="reg-company"
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      {needsAbn && (
        <div className="space-y-2">
          <label htmlFor="reg-abn" className="text-sm font-medium">
            ABN
          </label>
          <input
            id="reg-abn"
            type="text"
            value={abn}
            onChange={(e) => setAbn(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            placeholder="e.g. 12 345 678 901"
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading || !email || !password || !companyName}
          className="flex-1 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Registering...
            </>
          ) : (
            "Register & Connect"
          )}
        </button>
      </div>
    </form>
  );
}
