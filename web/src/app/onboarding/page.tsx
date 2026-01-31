"use client";

import { useOnboarding } from "@/components/onboarding/OnboardingContext";
import WelcomeStep from "@/components/onboarding/WelcomeStep";
import CreateAoiStep from "@/components/onboarding/CreateAoiStep";
import CreateAlertStep from "@/components/onboarding/CreateAlertStep";
import NotificationPrefsStep from "@/components/onboarding/NotificationPrefsStep";
import CompletionStep from "@/components/onboarding/CompletionStep";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Play, X } from "lucide-react";

const ONBOARDING_STEPS = [
  "welcome",
  "create_aoi",
  "create_alert",
  "notification_prefs",
  "complete",
];

const STEP_LABELS = [
  "Welcome",
  "Create Area",
  "Create Alert",
  "Notifications",
  "Complete",
];

export default function OnboardingPage() {
  const { state, goToStep, resetOnboarding } = useOnboarding();
  const router = useRouter();
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect to dashboard if onboarding is already complete
  useEffect(() => {
    if (state.isOnboardingComplete) {
      router.push("/dashboard");
    }
  }, [state.isOnboardingComplete, router]);

  // Check for saved progress on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedState = localStorage.getItem("onboardingState");
        if (savedState) {
          const parsed = JSON.parse(savedState);
          // Validate parsed data
          if (parsed && typeof parsed === 'object' &&
              'currentStep' in parsed &&
              typeof parsed.currentStep === 'number') {
            // Show resume prompt if there's saved progress and not at step 0
            if (parsed.currentStep > 0 && !parsed.isOnboardingComplete) {
              setShowResumePrompt(true);
            }
          }
        }
      } catch (error) {
        console.error('Failed to parse onboarding state:', error);
        // Clear corrupted data
        localStorage.removeItem("onboardingState");
      }
    }
  }, []);

  const handleResume = () => {
    setShowResumePrompt(false);
  };

  const handleRestart = () => {
    resetOnboarding();
    setShowResumePrompt(false);
  };

  const handleDismissResume = () => {
    setShowResumePrompt(false);
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return <CreateAoiStep />;
      case 2:
        return <CreateAlertStep />;
      case 3:
        return <NotificationPrefsStep />;
      case 4:
        return <CompletionStep />;
      default:
        return <WelcomeStep />;
    }
  };

  const progressPercentage =
    ((state.currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  // Calculate step indicators
  const getStepStatus = (index: number) => {
    if (index < state.currentStep) return "completed";
    if (index === state.currentStep) return "current";
    return "upcoming";
  };

  if (!isClient) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="h-1 bg-gray-200">
        <motion.div
          className="h-full bg-indigo-600"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" as const }}
        />
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Texas Drilling Permit Alerts
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Step indicators */}
              <div className="hidden sm:flex items-center space-x-1">
                {ONBOARDING_STEPS.map((_, index) => {
                  const status = getStepStatus(index);
                  return (
                    <div key={index} className="flex items-center">
                      <motion.div
                        initial={false}
                        animate={{
                          backgroundColor:
                            status === "completed"
                              ? "#10B981"
                              : status === "current"
                                ? "#4F46E5"
                                : "#E5E7EB",
                          scale: status === "current" ? 1.1 : 1,
                        }}
                        className="w-2.5 h-2.5 rounded-full"
                      />
                      {index < ONBOARDING_STEPS.length - 1 && (
                        <div className="w-4 h-0.5 bg-gray-200 mx-1" />
                      )}
                    </div>
                  );
                })}
              </div>
              <span className="text-sm text-gray-500">
                Step {state.currentStep + 1} of {ONBOARDING_STEPS.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Resume Progress Prompt */}
      <AnimatePresence>
        {showResumePrompt && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-indigo-50 border-b border-indigo-100"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <RotateCcw className="h-5 w-5 text-indigo-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-indigo-900">
                      Welcome back! You have progress saved from your last
                      session.
                    </p>
                    <p className="text-xs text-indigo-700">
                      You were on "{STEP_LABELS[state.currentStep]}"
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleRestart}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Start Over
                  </button>
                  <motion.button
                    onClick={handleResume}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </motion.button>
                  <button
                    onClick={handleDismissResume}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}