import { createClient } from "@/lib/supabase/server";

export async function DashboardStats() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get user's watch IDs first
  const { data: userWatches } = await supabase
    .from("watches")
    .select("id")
    .eq("user_id", user.id);

  const watchIds = (userWatches || []).map((w: any) => w.id);
  const activeWatchIds = watchIds; // all fetched watches; filter active separately

  const [activeRes, accountsRes] = await Promise.all([
    supabase
      .from("watches")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_active", true),
    supabase
      .from("linked_accounts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "connected"),
  ]);

  let newMatchCount = 0;
  let savedCount = 0;

  if (watchIds.length > 0) {
    const [matchRes, savedRes] = await Promise.all([
      supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .in("watch_id", watchIds)
        .is("notified_at", null),
      supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .in("watch_id", watchIds)
        .eq("is_saved", true),
    ]);
    newMatchCount = matchRes.count || 0;
    savedCount = savedRes.count || 0;
  }

  const stats = {
    activeWatches: activeRes.count || 0,
    newMatches: newMatchCount,
    savedTenders: savedCount,
    linkedAccounts: accountsRes.count || 0,
  };

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Active Watches" value={stats.activeWatches} />
      <StatCard label="New Matches" value={stats.newMatches} highlight />
      <StatCard label="Saved Tenders" value={stats.savedTenders} />
      <StatCard label="Connected Portals" value={stats.linkedAccounts} />
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-6 rounded-xl border ${highlight ? "bg-primary/5 border-primary/20" : "bg-background"}`}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${highlight ? "text-primary" : ""}`}>
        {value}
      </p>
    </div>
  );
}
