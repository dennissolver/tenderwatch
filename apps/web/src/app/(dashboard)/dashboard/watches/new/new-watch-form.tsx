"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWatch } from "@/lib/actions/watches";

const AUSTRALIAN_REGIONS = [
  "ACT",
  "NSW",
  "NT",
  "QLD",
  "SA",
  "TAS",
  "VIC",
  "WA",
  "National",
];

const SENSITIVITY_OPTIONS = [
  { value: "strict", label: "Strict", desc: "Only close matches" },
  { value: "balanced", label: "Balanced", desc: "Good balance of relevance" },
  { value: "adventurous", label: "Adventurous", desc: "Cast a wider net" },
] as const;

const DELIVERY_OPTIONS = [
  { value: "instant", label: "Instant", desc: "As soon as matched" },
  { value: "daily", label: "Daily Digest", desc: "Once per day" },
  { value: "weekly", label: "Weekly Digest", desc: "Once per week" },
] as const;

export function NewWatchForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [keywordsMust, setKeywordsMust] = useState("");
  const [keywordsBonus, setKeywordsBonus] = useState("");
  const [keywordsExclude, setKeywordsExclude] = useState("");
  const [regions, setRegions] = useState<string[]>([]);
  const [valueMin, setValueMin] = useState("");
  const [valueMax, setValueMax] = useState("");
  const [sensitivity, setSensitivity] = useState("balanced");
  const [deliveryMethod, setDeliveryMethod] = useState("daily");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createWatch({
      name,
      keywordsMust: parseKeywords(keywordsMust),
      keywordsBonus: parseKeywords(keywordsBonus),
      keywordsExclude: parseKeywords(keywordsExclude),
      regions,
      valueMin: valueMin ? parseInt(valueMin) * 1000 : undefined,
      valueMax: valueMax ? parseInt(valueMax) * 1000 : undefined,
      sensitivity,
      deliveryMethod,
    });

    setLoading(false);

    if (result.success) {
      router.push("/dashboard/watches");
      router.refresh();
    } else {
      setError(result.error || "Failed to create watch");
    }
  }

  function parseKeywords(input: string): string[] {
    return input
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  }

  function toggleRegion(region: string) {
    setRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region]
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-1">Watch Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='e.g. "IT Services NSW"'
          required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Keywords */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            Required Keywords
          </label>
          <input
            type="text"
            value={keywordsMust}
            onChange={(e) => setKeywordsMust(e.target.value)}
            placeholder="Comma separated, e.g. software, IT services"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Tenders must contain at least one of these.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Bonus Keywords
          </label>
          <input
            type="text"
            value={keywordsBonus}
            onChange={(e) => setKeywordsBonus(e.target.value)}
            placeholder="Comma separated, e.g. cloud, SaaS, migration"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Boost match score if present.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Exclude Keywords
          </label>
          <input
            type="text"
            value={keywordsExclude}
            onChange={(e) => setKeywordsExclude(e.target.value)}
            placeholder="Comma separated, e.g. construction, demolition"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Skip tenders containing these.
          </p>
        </div>
      </div>

      {/* Regions */}
      <div>
        <label className="block text-sm font-medium mb-2">Regions</label>
        <div className="flex flex-wrap gap-2">
          {AUSTRALIAN_REGIONS.map((region) => (
            <button
              key={region}
              type="button"
              onClick={() => toggleRegion(region)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                regions.includes(region)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {region}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Leave empty to match all regions.
        </p>
      </div>

      {/* Value Range */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Value Range (AUD, in thousands)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={valueMin}
            onChange={(e) => setValueMin(e.target.value)}
            placeholder="Min (K)"
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="number"
            value={valueMax}
            onChange={(e) => setValueMax(e.target.value)}
            placeholder="Max (K)"
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Sensitivity */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Match Sensitivity
        </label>
        <div className="grid grid-cols-3 gap-2">
          {SENSITIVITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSensitivity(opt.value)}
              className={`p-3 rounded-lg border text-left transition ${
                sensitivity === opt.value
                  ? "border-primary bg-primary/5"
                  : "hover:border-foreground/30"
              }`}
            >
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {opt.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Delivery */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Notification Delivery
        </label>
        <div className="grid grid-cols-3 gap-2">
          {DELIVERY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDeliveryMethod(opt.value)}
              className={`p-3 rounded-lg border text-left transition ${
                deliveryMethod === opt.value
                  ? "border-primary bg-primary/5"
                  : "hover:border-foreground/30"
              }`}
            >
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {opt.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || !name}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Watch"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
