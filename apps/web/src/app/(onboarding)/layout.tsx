import Link from "next/link";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="font-bold text-xl">
            TenderWatch
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-lg">
        {children}
      </main>
    </div>
  );
}
