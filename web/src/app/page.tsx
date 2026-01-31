import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Texas Drilling Permit Alerts | Real-Time RRC Permit Tracking",
  description:
    "Get real-time alerts for new drilling permits in Texas. Track operator activity, set custom areas of interest, and never miss a permit filing. Built for landmen and E&P companies.",
  keywords: [
    "Texas drilling permits",
    "RRC permits",
    "drilling alerts",
    "oil and gas permits",
    "Texas Railroad Commission",
    "permit tracking",
    "landman tools",
    "E&P intelligence",
  ],
  openGraph: {
    title: "Texas Drilling Permit Alerts",
    description:
      "Real-time drilling permit alerts and operator intelligence for Texas.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
