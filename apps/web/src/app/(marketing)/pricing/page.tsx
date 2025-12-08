import Link from "next/link";
import { Check, X } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground">
            Start free, upgrade when you need more.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="border rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-2">Free</h2>
            <p className="text-muted-foreground mb-6">
              Perfect for getting started
            </p>
            <div className="mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <Link
              href="/signup"
              className="block w-full text-center py-3 px-4 rounded-lg border border-primary text-primary font-semibold hover:bg-primary/5 transition mb-8"
            >
              Get Started
            </Link>
            <ul className="space-y-3">
              <PricingFeature included>1 watch</PricingFeature>
              <PricingFeature included>3 matches/month</PricingFeature>
              <PricingFeature included>1 linked account</PricingFeature>
              <PricingFeature included>Weekly digest</PricingFeature>
              <PricingFeature included>Keyword matching</PricingFeature>
              <PricingFeature>AI summaries</PricingFeature>
              <PricingFeature>Document downloads</PricingFeature>
              <PricingFeature>Instant alerts</PricingFeature>
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="border-2 border-primary rounded-xl p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm font-semibold px-3 py-1 rounded-full">
              Most Popular
            </div>
            <h2 className="text-2xl font-bold mb-2">Pro</h2>
            <p className="text-muted-foreground mb-6">
              For serious tender hunters
            </p>
            <div className="mb-6">
              <span className="text-4xl font-bold">$20</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <Link
              href="/signup?plan=pro"
              className="block w-full text-center py-3 px-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition mb-8"
            >
              Start Free Trial
            </Link>
            <ul className="space-y-3">
              <PricingFeature included>Unlimited watches</PricingFeature>
              <PricingFeature included>Unlimited matches</PricingFeature>
              <PricingFeature included>20 linked accounts</PricingFeature>
              <PricingFeature included>Daily or instant alerts</PricingFeature>
              <PricingFeature included>AI semantic matching</PricingFeature>
              <PricingFeature included>AI summaries (standard & deep)</PricingFeature>
              <PricingFeature included>Document downloads</PricingFeature>
              <PricingFeature included>4-hour sync cycle</PricingFeature>
              <PricingFeature included>90-day document storage</PricingFeature>
              <PricingFeature included>CSV export</PricingFeature>
            </ul>
          </div>
        </div>

        <div className="text-center mt-12 text-muted-foreground">
          <p>Annual billing available at $16/month (save 20%)</p>
          <p className="mt-2">7-day money back guarantee on Pro plans</p>
        </div>
      </div>
    </div>
  );
}

function PricingFeature({
  children,
  included = false
}: {
  children: React.ReactNode;
  included?: boolean;
}) {
  return (
    <li className="flex items-center gap-2">
      {included ? (
        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
      ) : (
        <X className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      )}
      <span className={included ? "" : "text-muted-foreground"}>{children}</span>
    </li>
  );
}
