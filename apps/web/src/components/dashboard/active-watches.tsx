import Link from "next/link";

export async function ActiveWatches() {
  // TODO: Fetch real watches
  const watches: any[] = [];

  return (
    <div className="border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Active Watches</h2>
        <Link
          href="/dashboard/watches/new"
          className="text-sm text-primary hover:underline"
        >
          + Create Watch
        </Link>
      </div>
      {watches.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No watches yet. Create one to start monitoring for tenders.
        </p>
      ) : (
        <ul className="space-y-3">
          {watches.map(watch => (
            <li key={watch.id} className="flex items-center justify-between">
              {/* Watch details */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
