export async function RecentMatches() {
  // TODO: Fetch real matches
  const matches: any[] = [];

  return (
    <div className="border rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">Recent Matches</h2>
      {matches.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No matches yet. Create a Watch to start finding tenders.
        </p>
      ) : (
        <ul className="space-y-4">
          {matches.map(match => (
            <li key={match.id} className="border-b pb-4 last:border-0">
              {/* Match details */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
