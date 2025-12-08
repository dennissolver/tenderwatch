import Link from "next/link";
import { User } from "@supabase/supabase-js";

export function DashboardNav({ user }: { user: User }) {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-xl">
          TenderWatch
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user.email}
          </span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
