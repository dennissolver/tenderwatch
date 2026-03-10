import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Eye, EyeOff, Plus, Settings2 } from "lucide-react";

export default async function WatchesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: watches } = await supabase
    .from("watches")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const watchList = watches || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Watches</h1>
          <p className="text-muted-foreground mt-1">
            Configure what tenders you want to monitor.
          </p>
        </div>
        <Link
          href="/dashboard/watches/new"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
        >
          <Plus className="h-4 w-4" />
          New Watch
        </Link>
      </div>

      {watchList.length === 0 ? (
        <div className="text-center py-16 border rounded-xl">
          <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold">No watches yet</h2>
          <p className="text-muted-foreground mt-1 max-w-md mx-auto">
            Watches define your tender criteria — keywords, regions, value ranges, and more.
            TenderWatch will match new tenders against your watches and notify you.
          </p>
          <Link
            href="/dashboard/watches/new"
            className="inline-flex items-center gap-2 mt-6 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
          >
            <Plus className="h-4 w-4" />
            Create your first Watch
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {watchList.map((watch: any) => (
            <div
              key={watch.id}
              className="border rounded-xl p-5 hover:border-primary/20 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {watch.is_active ? (
                    <Eye className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  )}
                  <div>
                    <h3 className="font-semibold">{watch.name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                      {watch.keywords_must?.length > 0 && (
                        <span>
                          Required: {watch.keywords_must.join(", ")}
                        </span>
                      )}
                      {watch.keywords_bonus?.length > 0 && (
                        <span>
                          Bonus: {watch.keywords_bonus.join(", ")}
                        </span>
                      )}
                      {watch.regions?.length > 0 && (
                        <span>Regions: {watch.regions.join(", ")}</span>
                      )}
                      {(watch.value_min || watch.value_max) && (
                        <span>
                          Value:{" "}
                          {watch.value_min
                            ? `$${(watch.value_min / 1000).toFixed(0)}K`
                            : "Any"}{" "}
                          -{" "}
                          {watch.value_max
                            ? `$${(watch.value_max / 1000).toFixed(0)}K`
                            : "Any"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>Sensitivity: {watch.sensitivity}</span>
                      <span>Delivery: {watch.delivery_method}</span>
                      <span>
                        Created{" "}
                        {new Date(watch.created_at).toLocaleDateString("en-AU")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      watch.is_active
                        ? "bg-green-50 text-green-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {watch.is_active ? "Active" : "Paused"}
                  </span>
                  <Link
                    href={`/dashboard/watches/${watch.id}`}
                    className="p-2 rounded-lg hover:bg-muted transition"
                  >
                    <Settings2 className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
