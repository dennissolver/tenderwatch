import Link from "next/link";

export function MarketingNav() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl">
          TenderWatch
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/how-it-works" className="text-muted-foreground hover:text-foreground">
            How It Works
          </Link>
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
            Pricing
          </Link>
          <Link href="/login" className="text-muted-foreground hover:text-foreground">
            Login
          </Link>
          <Link
            href="/signup"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90"
          >
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}
