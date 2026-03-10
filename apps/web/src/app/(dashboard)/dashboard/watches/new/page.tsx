import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewWatchForm } from "./new-watch-form";

export default async function NewWatchPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Watch</h1>
        <p className="text-muted-foreground mt-1">
          Define what tenders you want TenderWatch to find for you.
        </p>
      </div>
      <NewWatchForm />
    </div>
  );
}
