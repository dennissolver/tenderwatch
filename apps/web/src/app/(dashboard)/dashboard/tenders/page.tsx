import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TenderFeed } from "./tender-feed";

export default async function TendersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get user's watch IDs
  const { data: userWatches } = await supabase
    .from("watches")
    .select("id, name")
    .eq("user_id", user.id);

  const watchIds = (userWatches || []).map((w: any) => w.id);

  // Get matches with tender details
  let matches: any[] = [];
  if (watchIds.length > 0) {
    const { data } = await supabase
      .from("matches")
      .select("*, tenders(*), watches(name)")
      .in("watch_id", watchIds)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(50);
    matches = data || [];
  }

  // Also get recent tenders not yet matched (from connected portals)
  const { data: recentTenders } = await supabase
    .from("tenders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tenders</h1>
        <p className="text-muted-foreground mt-1">
          Browse matched tenders from your connected portals.
        </p>
      </div>

      <TenderFeed
        matches={matches}
        recentTenders={recentTenders || []}
        watches={userWatches || []}
      />
    </div>
  );
}
