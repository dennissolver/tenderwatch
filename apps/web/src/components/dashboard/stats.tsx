export async function DashboardStats() {
  // TODO: Fetch real stats
  const stats = {
    activeWatches: 2,
    newMatches: 5,
    savedTenders: 12,
    linkedAccounts: 3
  };

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Active Watches" value={stats.activeWatches} />
      <StatCard label="New Matches" value={stats.newMatches} highlight />
      <StatCard label="Saved Tenders" value={stats.savedTenders} />
      <StatCard label="Linked Accounts" value={stats.linkedAccounts} />
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className={`p-6 rounded-xl border ${highlight ? "bg-primary/5 border-primary/20" : "bg-background"}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${highlight ? "text-primary" : ""}`}>
        {value}
      </p>
    </div>
  );
}
