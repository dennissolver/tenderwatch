import Link from "next/link";
import { ArrowRight, Search, Bell, FileText, CheckCircle } from "lucide-react";

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Never Miss a{" "}
              <span className="text-primary">Government Tender</span>{" "}
              Again
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              AI-powered tender intelligence for Australian businesses. 
              We scan every portal, match opportunities to your business, 
              and deliver actionable summaries—so you can focus on winning.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition"
              >
                Start Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-input bg-background hover:bg-accent transition"
              >
                See How It Works
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Free plan includes 3 matches/month. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            How TenderWatch Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Search className="h-8 w-8 text-primary" />}
              title="Connect Your Accounts"
              description="Link your existing tender portal accounts. We search as you—seeing everything you're eligible for."
            />
            <FeatureCard
              icon={<Bell className="h-8 w-8 text-primary" />}
              title="Set Your Watches"
              description="Tell us what you're looking for with keywords, regions, and value ranges. Our AI learns what matters to you."
            />
            <FeatureCard
              icon={<FileText className="h-8 w-8 text-primary" />}
              title="Get Smart Summaries"
              description="Receive personalised digests with AI-analysed summaries highlighting what matters to YOUR business."
            />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
            Trusted by Australian Businesses
          </p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
            {/* Placeholder for logos */}
            <div className="h-8 w-24 bg-muted rounded" />
            <div className="h-8 w-32 bg-muted rounded" />
            <div className="h-8 w-28 bg-muted rounded" />
            <div className="h-8 w-24 bg-muted rounded" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Win More Tenders?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join hundreds of Australian businesses using TenderWatch to find their next contract.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-background text-foreground font-semibold hover:bg-background/90 transition"
          >
            Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

function FeatureCard({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-background rounded-xl p-6 shadow-sm border">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
