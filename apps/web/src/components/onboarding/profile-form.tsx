"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { updateProfile } from "@/lib/actions/portal-linking";

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

const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "NT", "ACT"] as const;

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
          <label htmlFor="prof-abn" className="text-sm font-medium">
            ABN
          </label>
          <input
            id="prof-abn"
            type="text"
            value={abn}
            onChange={(e) => setAbn(e.target.value)}
            placeholder="e.g. 12 345 678 901"
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
          <input
            id="prof-address1"
            type="text"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            className={inputClassName}
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
            <select
              id="prof-state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className={selectClassName}
            >
              <option value="">Select...</option>
              {AU_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
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
