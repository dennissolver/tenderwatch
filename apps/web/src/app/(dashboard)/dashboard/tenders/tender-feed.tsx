"use client";

import { useState } from "react";
import {
  ExternalLink,
  Calendar,
  Building2,
  MapPin,
  DollarSign,
  Star,
  TrendingUp,
  Minus,
  Bookmark,
  BookmarkCheck,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import { SITES } from "@tenderwatch/shared";
import type { SiteKey } from "@tenderwatch/shared";

const TIER_CONFIG = {
  strong: { label: "Strong Match", color: "text-green-600 bg-green-50 border-green-200", icon: TrendingUp },
  maybe: { label: "Possible Match", color: "text-yellow-600 bg-yellow-50 border-yellow-200", icon: Star },
  stretch: { label: "Stretch", color: "text-muted-foreground bg-muted border", icon: Minus },
} as const;

interface TenderFeedProps {
  matches: any[];
  recentTenders: any[];
  watches: any[];
}

type Tab = "matched" | "all";

export function TenderFeed({ matches, recentTenders, watches }: TenderFeedProps) {
  const [tab, setTab] = useState<Tab>(matches.length > 0 ? "matched" : "all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMatches = matches.filter((m: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const t = m.tenders;
    return (
      t?.title?.toLowerCase().includes(q) ||
      t?.description?.toLowerCase().includes(q) ||
      t?.buyer_org?.toLowerCase().includes(q)
    );
  });

  const filteredTenders = recentTenders.filter((t: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t?.title?.toLowerCase().includes(q) ||
      t?.description?.toLowerCase().includes(q) ||
      t?.buyer_org?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-4 border-b mb-4">
        <button
          onClick={() => setTab("matched")}
          className={`pb-2 text-sm font-medium border-b-2 transition ${
            tab === "matched"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Matched ({matches.length})
        </button>
        <button
          onClick={() => setTab("all")}
          className={`pb-2 text-sm font-medium border-b-2 transition ${
            tab === "all"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          All Recent ({recentTenders.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search tenders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Content */}
      {tab === "matched" ? (
        filteredMatches.length === 0 ? (
          <EmptyState
            title="No matched tenders"
            description={
              watches.length === 0
                ? "Create a Watch to start matching tenders to your criteria."
                : "No tenders match your current watch criteria yet. Check back soon."
            }
            actionHref={watches.length === 0 ? "/dashboard/watches/new" : undefined}
            actionLabel={watches.length === 0 ? "Create Watch" : undefined}
          />
        ) : (
          <div className="space-y-3">
            {filteredMatches.map((match: any) => (
              <MatchCard
                key={match.id}
                match={match}
                expanded={expandedId === match.id}
                onToggle={() =>
                  setExpandedId(expandedId === match.id ? null : match.id)
                }
              />
            ))}
          </div>
        )
      ) : filteredTenders.length === 0 ? (
        <EmptyState
          title="No tenders yet"
          description="Connect your portal accounts and tenders will appear here as they're synced."
          actionHref="/dashboard/accounts"
          actionLabel="Manage Accounts"
        />
      ) : (
        <div className="space-y-3">
          {filteredTenders.map((tender: any) => (
            <TenderCard
              key={tender.id}
              tender={tender}
              expanded={expandedId === tender.id}
              onToggle={() =>
                setExpandedId(expandedId === tender.id ? null : tender.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchCard({
  match,
  expanded,
  onToggle,
}: {
  match: any;
  expanded: boolean;
  onToggle: () => void;
}) {
  const tier =
    TIER_CONFIG[match.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.maybe;
  const TierIcon = tier.icon;
  const tender = match.tenders;
  if (!tender) return null;

  const siteName =
    SITES[tender.source as SiteKey]?.name || tender.source;

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left p-4 hover:bg-muted/30 transition"
      >
        <div className="flex items-start gap-3">
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${tier.color} shrink-0`}
          >
            <TierIcon className="h-3 w-3" />
            {match.score}%
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium line-clamp-1">{tender.title}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
              {tender.buyer_org && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {tender.buyer_org}
                </span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {siteName}
              </span>
              {tender.closes_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Closes{" "}
                  {new Date(tender.closes_at).toLocaleDateString("en-AU")}
                </span>
              )}
              {(tender.value_low || tender.value_high) && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {formatValue(tender.value_low, tender.value_high)}
                </span>
              )}
            </div>
            {match.watches?.name && (
              <p className="text-xs text-primary/70 mt-1">
                Watch: {match.watches.name}
              </p>
            )}
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t pt-3 space-y-3">
          {match.personalised_summary && (
            <p className="text-sm">{match.personalised_summary}</p>
          )}
          {tender.description && (
            <p className="text-sm text-muted-foreground">{tender.description}</p>
          )}
          {match.llm_reasoning && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                AI Analysis
              </p>
              <p className="text-sm">{match.llm_reasoning}</p>
            </div>
          )}
          {match.matched_keywords?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {match.matched_keywords.map((kw: string) => (
                <span
                  key={kw}
                  className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 pt-1">
            {tender.source_url && (
              <a
                href={tender.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View on portal <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TenderCard({
  tender,
  expanded,
  onToggle,
}: {
  tender: any;
  expanded: boolean;
  onToggle: () => void;
}) {
  const siteName =
    SITES[tender.source as SiteKey]?.name || tender.source;

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left p-4 hover:bg-muted/30 transition"
      >
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium line-clamp-1">{tender.title}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
              {tender.buyer_org && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {tender.buyer_org}
                </span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {siteName}
              </span>
              {tender.closes_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Closes{" "}
                  {new Date(tender.closes_at).toLocaleDateString("en-AU")}
                </span>
              )}
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t pt-3 space-y-3">
          {tender.description && (
            <p className="text-sm text-muted-foreground">{tender.description}</p>
          )}
          {tender.llm_summary && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                AI Summary
              </p>
              <p className="text-sm">{tender.llm_summary}</p>
            </div>
          )}
          {tender.categories?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tender.categories.map((cat: string) => (
                <span
                  key={cat}
                  className="text-xs bg-muted px-2 py-0.5 rounded-full"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 pt-1">
            {tender.source_url && (
              <a
                href={tender.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View on portal <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="text-center py-12 border rounded-xl">
      <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
        {description}
      </p>
      {actionHref && actionLabel && (
        <a
          href={actionHref}
          className="inline-block mt-4 text-sm font-medium text-primary hover:underline"
        >
          {actionLabel}
        </a>
      )}
    </div>
  );
}

function formatValue(low: number | null, high: number | null): string {
  const fmt = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(0)}K`
        : `$${n}`;

  if (low && high) return `${fmt(low)} - ${fmt(high)}`;
  if (low) return `From ${fmt(low)}`;
  if (high) return `Up to ${fmt(high)}`;
  return "";
}
