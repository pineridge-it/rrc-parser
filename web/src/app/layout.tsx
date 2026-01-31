import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/styles/index.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { OnboardingProvider } from "@/components/onboarding/OnboardingContext";
import { NotificationProvider } from "@/components/notifications/NotificationContext";
import { SkipLink } from "@/components/ui/skip-link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Texas Drilling Permit Alerts",
  description: "Get notified about new drilling permits in your areas of interest across Texas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Skip Link for keyboard navigation */}
        <SkipLink targetId="main-content" />

        <ThemeProvider
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <NotificationProvider>
            <OnboardingProvider>
              {/* Main content wrapper with landmark region */}
              <div id="main-content" role="main" tabIndex={-1}>
                {children}
              </div>
              <Toaster />
            </OnboardingProvider>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}