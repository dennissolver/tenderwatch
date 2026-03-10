import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Eye, EyeOff, MoreHorizontal } from "lucide-react";

export async function ActiveWatches() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: watches } = await supabase
    .from("watches")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const watchList = watches || [];

  return (
    <div className="border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Your Watches</h2>
        <Link
          href="/dashboard/watches/new"
          className="text-sm text-primary hover:underline"
        >
          + Create Watch
        </Link>
      </div>
      {watchList.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">
            No watches yet. Create one to start monitoring for tenders.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {watchList.map((watch: any) => (
            <li key={watch.id}>
              <Link
                href={`/dashboard/watches?id=${watch.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition -mx-1"
              >
                {watch.is_active ? (
                  <Eye className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{watch.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(watch.keywords_must || []).length} required keywords
                    {watch.regions?.length > 0 && ` \u00b7 ${watch.regions.join(", ")}`}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    watch.is_active
                      ? "bg-green-50 text-green-600"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {watch.is_active ? "Active" : "Paused"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {watchList.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <Link
            href="/dashboard/watches"
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            View all watches
          </Link>
        </div>
      )}
    </div>
  );
}
