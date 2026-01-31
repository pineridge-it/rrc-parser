"use client";

import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    description: "Perfect for individual landmen getting started",
    price: "$99",
    period: "/month",
    features: [
      { text: "Up to 3 Areas of Interest", included: true },
      { text: "Email alerts", included: true },
      { text: "Basic search & filtering", included: true },
      { text: "7-day alert history", included: true },
      { text: "CSV exports (50 rows)", included: true },
      { text: "SMS alerts", included: false },
      { text: "API access", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    description: "For active operators and small E&P companies",
    price: "$249",
    period: "/month",
    features: [
      { text: "Unlimited Areas of Interest", included: true },
      { text: "Email & SMS alerts", included: true },
      { text: "Advanced search & filtering", included: true },
      { text: "90-day alert history", included: true },
      { text: "Unlimited CSV exports", included: true },
      { text: "Operator intelligence", included: true },
      { text: "API access (1,000 calls/mo)", included: true },
      { text: "Priority support", included: false },
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For larger teams with advanced needs",
    price: "Custom",
    period: "",
    features: [
      { text: "Everything in Professional", included: true },
      { text: "Unlimited API access", included: true },
      { text: "Custom integrations", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "SLA guarantees", included: true },
      { text: "On-premise deployment option", included: true },
      { text: "Advanced analytics", included: true },
      { text: "24/7 phone support", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="bg-[var(--color-surface-default)] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[var(--color-text-secondary)]">
            Start with a 14-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 ${
                plan.popular
                  ? "border-[var(--color-brand-primary)] bg-[var(--color-surface-raised)] shadow-xl"
                  : "border-[var(--color-border-default)] bg-[var(--color-surface-raised)]"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-[var(--color-brand-primary)] px-4 py-1 text-sm font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-text-tertiary)]">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-[var(--color-text-primary)]">
                  {plan.price}
                </span>
                <span className="text-[var(--color-text-tertiary)]">
                  {plan.period}
                </span>
              </div>

              <ul className="mb-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-success)]" />
                    ) : (
                      <X className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-text-placeholder)]" />
                    )}
                    <span
                      className={
                        feature.included
                          ? "text-[var(--color-text-secondary)]"
                          : "text-[var(--color-text-placeholder)]"
                      }
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href={plan.name === "Enterprise" ? "#contact" : "/signup"}>
                <Button
                  variant={plan.popular ? "primary" : "secondary"}
                  className="w-full"
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
