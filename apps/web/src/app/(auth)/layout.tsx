import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="font-bold text-xl">
            TenderWatch
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
    </div>
  );
}
