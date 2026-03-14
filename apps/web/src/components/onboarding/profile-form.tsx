"use client";

import { useState, useRef, useCallback } from "react";
import { Loader2, CheckCircle2, AlertCircle, Search } from "lucide-react";
import { updateProfile } from "@/lib/actions/portal-linking";
import { AddressAutocomplete } from "./address-autocomplete";

interface ProfileFormProps {
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
  onSave: () => void;
}

const inputClassName =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

const selectClassName =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

const ORG_TYPES = [
  "Company",
  "Sole Trader",
  "Partnership",
  "Trust",
  "Government",
  "Not for Profit",
] as const;


// Map ABR entity types to our org types
function mapEntityType(abrType: string): string {
  const lower = abrType.toLowerCase();
  if (lower.includes("company") || lower.includes("proprietary")) return "Company";
  if (lower.includes("sole trader") || lower.includes("individual")) return "Sole Trader";
  if (lower.includes("partnership")) return "Partnership";
  if (lower.includes("trust")) return "Trust";
  if (lower.includes("government") || lower.includes("commonwealth") || lower.includes("state")) return "Government";
  if (lower.includes("not-for-profit") || lower.includes("charity")) return "Not for Profit";
  return "";
}

type AbnStatus = "idle" | "loading" | "found" | "not-found" | "error";

export function ProfileForm({ initialData, onSave }: ProfileFormProps) {
  const [legalName, setLegalName] = useState(
    initialData.legalName || initialData.companyName || ""
  );
  const [businessName, setBusinessName] = useState(
    initialData.businessName || initialData.companyName || ""
  );
  const [abn, setAbn] = useState(initialData.abn || "");
  const [acn, setAcn] = useState(initialData.acn || "");
  const [orgType, setOrgType] = useState(initialData.orgType || "");
  const [addressLine1, setAddressLine1] = useState(initialData.addressLine1 || "");
  const [addressLine2, setAddressLine2] = useState(initialData.addressLine2 || "");
  const [city, setCity] = useState(initialData.city || "");
  const [state, setState] = useState(initialData.state || "");
  const [postcode, setPostcode] = useState(initialData.postcode || "");
  const [country, setCountry] = useState(initialData.country || "Australia");
  const [phone, setPhone] = useState(initialData.phone || "");
  const [contactFirstName, setContactFirstName] = useState(
    initialData.contactFirstName || ""
  );
  const [contactLastName, setContactLastName] = useState(
    initialData.contactLastName || ""
  );
  const [contactPosition, setContactPosition] = useState(
    initialData.contactPosition || ""
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ABN lookup state
  const [abnStatus, setAbnStatus] = useState<AbnStatus>("idle");
  const [abnMessage, setAbnMessage] = useState("");
  const abnDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  const lookupAbn = useCallback(async (abnValue: string) => {
    const digits = abnValue.replace(/\s/g, "");
    if (digits.length !== 11) {
      setAbnStatus("idle");
      setAbnMessage("");
      return;
    }

    setAbnStatus("loading");
    setAbnMessage("");

    try {
      const res = await fetch(`/api/abn-lookup?abn=${digits}`);
      const data = await res.json();

      if (res.ok && data.abn) {
        setAbnStatus("found");

        // Auto-fill fields from ABR data
        if (data.entityName && !legalName) {
          setLegalName(data.entityName);
        }
        if (data.businessNames?.length > 0 && !businessName) {
          setBusinessName(data.businessNames[0]);
        } else if (data.entityName && !businessName) {
          setBusinessName(data.entityName);
        }
        if (data.acn && !acn) {
          setAcn(data.acn);
        }
        if (data.entityType && !orgType) {
          const mapped = mapEntityType(data.entityType);
          if (mapped) setOrgType(mapped);
        }

        const statusLabel =
          data.abnStatus === "Active" ? "Active" : data.abnStatus || "Unknown";
        setAbnMessage(
          `${data.entityName}${statusLabel !== "Active" ? ` (${statusLabel})` : ""}`
        );
      } else {
        setAbnStatus("not-found");
        setAbnMessage(data.error || "ABN not found");
      }
    } catch {
      setAbnStatus("error");
      setAbnMessage("Lookup failed — you can still enter details manually");
    }
  }, [legalName, businessName, acn, orgType]);

  function handleAbnChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setAbn(val);

    if (abnDebounceRef.current) clearTimeout(abnDebounceRef.current);
    abnDebounceRef.current = setTimeout(() => lookupAbn(val), 500);
  }

  function handleAddressSelect(result: {
    addressLine1: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  }) {
    setAddressLine1(result.addressLine1);
    setCity(result.city);
    setState(result.state);
    setPostcode(result.postcode);
    setCountry(result.country);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await updateProfile({
      legalName,
      businessName,
      abn,
      acn,
      orgType,
      addressLine1,
      addressLine2,
      city,
      state,
      postcode,
      country,
      phone,
      contactFirstName,
      contactLastName,
      contactPosition,
    });

    if (result.success) {
      onSave();
    } else {
      setError(result.error || "Failed to save profile");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section 1 — Company Details */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Company Details</h3>

        {/* ABN — first, with auto-lookup */}
        <div className="space-y-2">
          <label htmlFor="prof-abn" className="text-sm font-medium">
            ABN
          </label>
          <div className="relative">
            <input
              id="prof-abn"
              type="text"
              value={abn}
              onChange={handleAbnChange}
              placeholder="e.g. 12 345 678 901"
              className={`${inputClassName} pr-10`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {abnStatus === "loading" && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {abnStatus === "found" && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              {(abnStatus === "not-found" || abnStatus === "error") && (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
              {abnStatus === "idle" && abn.replace(/\s/g, "").length < 11 && (
                <Search className="h-4 w-4 text-muted-foreground/50" />
              )}
            </div>
          </div>
          {abnMessage && (
            <p
              className={`text-xs ${
                abnStatus === "found"
                  ? "text-green-600"
                  : "text-amber-600"
              }`}
            >
              {abnMessage}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="prof-legalName" className="text-sm font-medium">
            Legal Name
          </label>
          <input
            id="prof-legalName"
            type="text"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="prof-businessName" className="text-sm font-medium">
            Business / Trading Name
          </label>
          <input
            id="prof-businessName"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="prof-acn" className="text-sm font-medium">
            ACN
          </label>
          <input
            id="prof-acn"
            type="text"
            value={acn}
            onChange={(e) => setAcn(e.target.value)}
            placeholder="e.g. 123 456 789"
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="prof-orgType" className="text-sm font-medium">
            Organisation Type
          </label>
          <select
            id="prof-orgType"
            value={orgType}
            onChange={(e) => setOrgType(e.target.value)}
            className={selectClassName}
          >
            <option value="">Select...</option>
            {ORG_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Section 2 — Address */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Address</h3>

        <div className="space-y-2">
          <label htmlFor="prof-address1" className="text-sm font-medium">
            Street Address
          </label>
          <AddressAutocomplete
            id="prof-address1"
            value={addressLine1}
            onChange={setAddressLine1}
            onSelect={handleAddressSelect}
            className={inputClassName}
            placeholder="Start typing an address..."
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="prof-address2" className="text-sm font-medium">
            Address Line 2{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            id="prof-address2"
            type="text"
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label htmlFor="prof-city" className="text-sm font-medium">
              City / Suburb
            </label>
            <input
              id="prof-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputClassName}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="prof-state" className="text-sm font-medium">
              State
            </label>
            <input
              id="prof-state"
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g. NSW"
              className={inputClassName}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label htmlFor="prof-postcode" className="text-sm font-medium">
              Postcode
            </label>
            <input
              id="prof-postcode"
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              maxLength={4}
              className={inputClassName}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="prof-country" className="text-sm font-medium">
              Country
            </label>
            <input
              id="prof-country"
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={inputClassName}
            />
          </div>
        </div>
      </div>

      {/* Section 3 — Primary Contact */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Primary Contact</h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label htmlFor="prof-firstName" className="text-sm font-medium">
              First Name
            </label>
            <input
              id="prof-firstName"
              type="text"
              value={contactFirstName}
              onChange={(e) => setContactFirstName(e.target.value)}
              className={inputClassName}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="prof-lastName" className="text-sm font-medium">
              Last Name
            </label>
            <input
              id="prof-lastName"
              type="text"
              value={contactLastName}
              onChange={(e) => setContactLastName(e.target.value)}
              className={inputClassName}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="prof-position" className="text-sm font-medium">
            Position / Title
          </label>
          <input
            id="prof-position"
            type="text"
            value={contactPosition}
            onChange={(e) => setContactPosition(e.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="prof-phone" className="text-sm font-medium">
            Phone
          </label>
          <input
            id="prof-phone"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClassName}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save & Continue"
        )}
      </button>
    </form>
  );
}
