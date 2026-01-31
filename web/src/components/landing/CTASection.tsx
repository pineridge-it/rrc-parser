"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="bg-gradient-to-br from-[var(--color-brand-primary)] to-[var(--color-brand-accent)] py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
          Start Tracking Permits Today
        </h2>
        <p className="mb-8 text-lg text-white/90">
          Join hundreds of landmen and operators who never miss a drilling permit.
          Start your 14-day free trial now.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/signup">
            <Button
              size="lg"
              className="group min-w-[200px] bg-white text-[var(--color-brand-primary)] hover:bg-white/90"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="lg"
              variant="ghost"
              className="min-w-[200px] border border-white/30 text-white hover:bg-white/10"
            >
              Sign In
            </Button>
          </Link>
        </div>
        <p className="mt-6 text-sm text-white/70">
          No credit card required. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
