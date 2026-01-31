"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "How quickly will I receive alerts after a permit is filed?",
    answer:
      "Our system checks for new permits every 15 minutes during business hours. Most alerts are delivered within 2 hours of the permit appearing on the RRC website. We also track amendments and status changes to existing permits.",
  },
  {
    question: "Can I draw multiple Areas of Interest (AOIs)?",
    answer:
      "Yes! Starter plans include up to 3 AOIs, while Professional and Enterprise plans offer unlimited AOIs. You can draw custom polygons on the map, add buffer zones, and even upload your own shapefiles for complex boundaries.",
  },
  {
    question: "What types of permits do you track?",
    answer:
      "We track all drilling permits filed with the Texas Railroad Commission (RRC), including new drilling permits, permit amendments, transfers, and cancellations. We also monitor well completion reports and production data where available.",
  },
  {
    question: "Do you offer API access?",
    answer:
      "Yes, API access is included with Professional plans (1,000 calls/month) and unlimited with Enterprise plans. Our REST API provides access to permits, wells, operators, and alert data. Full documentation and SDKs are available.",
  },
  {
    question: "Can I export data for my own analysis?",
    answer:
      "Absolutely. All plans include CSV export functionality. Starter plans can export up to 50 rows at a time, while Professional and Enterprise plans offer unlimited exports with advanced filtering options.",
  },
  {
    question: "How do you handle permit amendments?",
    answer:
      "We track the full permit lifecycle including amendments. You can choose to receive alerts for new permits only, or include amendments and status changes. Our system preserves historical versions so you can see what changed and when.",
  },
  {
    question: "Is there a mobile app?",
    answer:
      "Our web application is fully responsive and works great on mobile devices. Native iOS and Android apps are on our roadmap for Q2 2026. In the meantime, you can add the web app to your home screen for a native-like experience.",
  },
  {
    question: "What happens after my free trial ends?",
    answer:
      "After your 14-day free trial, you'll need to enter payment details to continue using the service. We'll send you a reminder 3 days before the trial ends. If you choose not to subscribe, your account will be paused but your data will be preserved for 30 days.",
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-[var(--color-border-default)] last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="pr-8 text-base font-medium text-[var(--color-text-primary)]">
          {question}
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-[var(--color-text-tertiary)] transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-96 pb-5" : "max-h-0"
        )}
      >
        <p className="text-[var(--color-text-secondary)]">{answer}</p>
      </div>
    </div>
  );
}

export function FAQSection() {
  return (
    <section className="bg-[var(--color-surface-subtle)] py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-[var(--color-text-secondary)]">
            Everything you need to know about Texas Drilling Permit Alerts.
          </p>
        </div>

        {/* FAQ List */}
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-6">
          {faqs.map((faq) => (
            <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}
