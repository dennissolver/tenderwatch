"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface AddressResult {
  addressLine1: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: AddressResult) => void;
  className?: string;
  id?: string;
  placeholder?: string;
}

interface MapboxFeature {
  place_name: string;
  text: string;
  address?: string;
  context?: Array<{ id: string; text: string; short_code?: string }>;
  properties?: { address?: string };
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Map Mapbox state short codes to AU state abbreviations
function parseState(shortCode: string | undefined): string {
  if (!shortCode) return "";
  const code = shortCode.replace("au-", "").toUpperCase();
  const map: Record<string, string> = {
    NSW: "NSW", VIC: "VIC", QLD: "QLD", WA: "WA",
    SA: "SA", TAS: "TAS", NT: "NT", ACT: "ACT",
  };
  return map[code] || code;
}

function parseFeature(feature: MapboxFeature): AddressResult {
  const ctx = feature.context || [];
  const find = (prefix: string) =>
    ctx.find((c) => c.id.startsWith(prefix));

  const streetNumber = feature.address || "";
  const streetName = feature.text || "";
  const addressLine1 = streetNumber
    ? `${streetNumber} ${streetName}`
    : streetName;

  const locality = find("locality");
  const place = find("place");
  const region = find("region");
  const postcode = find("postcode");
  const country = find("country");

  return {
    addressLine1,
    city: locality?.text || place?.text || "",
    state: parseState(region?.short_code),
    postcode: postcode?.text || "",
    country: country?.text || "Australia",
  };
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  className,
  id,
  placeholder = "Start typing an address...",
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!MAPBOX_TOKEN || query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const encoded = encodeURIComponent(query);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}&country=au&types=address&limit=5&autocomplete=true`;
      const res = await fetch(url);
      const data = await res.json();
      setSuggestions(data.features || []);
      setOpen(true);
      setActiveIndex(-1);
    } catch {
      setSuggestions([]);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  }

  function handleSelect(feature: MapboxFeature) {
    const parsed = parseFeature(feature);
    onChange(parsed.addressLine1);
    onSelect(parsed);
    setSuggestions([]);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg max-h-60 overflow-auto">
          {suggestions.map((feature, i) => (
            <li
              key={feature.place_name}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                i === activeIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
              onMouseDown={() => handleSelect(feature)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {feature.place_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
