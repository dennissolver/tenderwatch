import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { DashboardStats } from "@/components/dashboard/stats";
import { RecentMatches } from "@/components/dashboard/recent-matches";
import { ActiveWatches } from "@/components/dashboard/active-watches";

export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your tenders.
        </p>
      </div>

      <Suspense fallback={<div>Loading stats...</div>}>
        <DashboardStats />
      </Suspense>

      <div className="grid lg:grid-cols-2 gap-6">
        <Suspense fallback={<div>Loading matches...</div>}>
          <RecentMatches />
        </Suspense>
        <Suspense fallback={<div>Loading watches...</div>}>
          <ActiveWatches />
        </Suspense>
      </div>
    </div>
  );
}
