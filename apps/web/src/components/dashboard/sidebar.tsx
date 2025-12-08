import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Search, Eye, Link2, Settings } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/tenders", label: "Tenders", icon: Search },
  { href: "/dashboard/watches", label: "Watches", icon: Eye },
  { href: "/dashboard/accounts", label: "Accounts", icon: Link2 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

export function DashboardSidebar() {
  return (
    <aside className="w-64 border-r min-h-[calc(100vh-4rem)] p-4">
      <nav className="space-y-1">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
