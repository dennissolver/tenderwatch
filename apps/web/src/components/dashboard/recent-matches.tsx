import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, Star, TrendingUp, Minus } from "lucide-react";

const TIER_CONFIG = {
  strong: { label: "Strong", color: "text-green-600 bg-green-50", icon: TrendingUp },
  maybe: { label: "Maybe", color: "text-yellow-600 bg-yellow-50", icon: Star },
  stretch: { label: "Stretch", color: "text-muted-foreground bg-muted", icon: Minus },
} as const;

export async function RecentMatches() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get user's watch IDs
  const { data: userWatches } = await supabase
    .from("watches")
    .select("id")
    .eq("user_id", user.id);

  const watchIds = (userWatches || []).map((w: any) => w.id);

  let matches: any[] = [];
  if (watchIds.length > 0) {
    const { data } = await supabase
      .from("matches")
      .select("*, tenders(*), watches(name)")
      .in("watch_id", watchIds)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(5);
    matches = data || [];
  }

  return (
    <div className="border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Matches</h2>
        {matches.length > 0 && (
          <Link
            href="/dashboard/tenders"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      {matches.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">
            No matches yet. Create a Watch to start finding tenders.
          </p>
          <Link
            href="/dashboard/watches/new"
            className="inline-block mt-3 text-sm font-medium text-primary hover:underline"
          >
            Create your first Watch
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {matches.map((match: any) => {
            const tier = TIER_CONFIG[match.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.maybe;
            const TierIcon = tier.icon;
            const tender = match.tenders;

            return (
              <li key={match.id}>
                <Link
                  href={`/dashboard/tenders?id=${tender?.id}`}
                  className="block p-3 rounded-lg hover:bg-muted/50 transition -mx-1"
                >
                  <div className="flex items-start gap-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${tier.color} shrink-0 mt-0.5`}>
                      <TierIcon className="h-3 w-3" />
                      {match.score}%
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {tender?.title || "Unknown tender"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tender?.buyer_org || tender?.source} &middot; {match.watches?.name}
                      </p>
                      {tender?.closes_at && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Closes {new Date(tender.closes_at).toLocaleDateString("en-AU")}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
