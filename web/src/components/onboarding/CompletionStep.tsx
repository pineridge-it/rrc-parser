"use client";

import { useOnboarding } from "./OnboardingContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  ArrowRight,
  MapPin,
  Bell,
  BarChart3,
  Sparkles,
  PartyPopper,
} from "lucide-react";

declare global {
  interface Window {
    confetti?: (options: {
      particleCount?: number;
      spread?: number;
      origin?: { y?: number; x?: number };
      colors?: string[];
      disableForReducedMotion?: boolean;
    }) => void;
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const checkVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 15,
      delay: 0.2,
    },
  },
};

const floatingVariants = {
  animate: {
    y: [-10, 10, -10] as number[],
    rotate: [-5, 5, -5] as number[],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
} as const;

export default function CompletionStep() {
  const { completeOnboarding } = useOnboarding();
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Celebrate completion with confetti
    if (typeof window !== "undefined" && window.confetti && showConfetti) {
      const colors = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

      // Multiple bursts for dramatic effect
      const burst1 = setTimeout(() => {
        window.confetti?.({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors,
        });
      }, 300);

      const burst2 = setTimeout(() => {
        window.confetti?.({
          particleCount: 80,
          spread: 100,
          origin: { y: 0.7, x: 0.2 },
          colors,
        });
      }, 600);

      const burst3 = setTimeout(() => {
        window.confetti?.({
          particleCount: 80,
          spread: 100,
          origin: { y: 0.7, x: 0.8 },
          colors,
        });
      }, 900);

      return () => {
        clearTimeout(burst1);
        clearTimeout(burst2);
        clearTimeout(burst3);
      };
    }

    // Mark onboarding as complete
    completeOnboarding();
  }, [completeOnboarding, showConfetti]);

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  const nextSteps = [
    {
      icon: MapPin,
      text: "Monitor your areas of interest for new drilling permits",
    },
    {
      icon: Bell,
      text: "Receive alerts based on your preferences",
    },
    {
      icon: BarChart3,
      text: "Analyze permit trends and activity in your dashboard",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center"
      >
        {/* Animated success icon with floating elements */}
        <motion.div variants={itemVariants} className="relative mb-6">
          {/* Floating sparkles */}
          <motion.div
            variants={floatingVariants}
            animate="animate"
            className="absolute -top-2 -left-4 text-yellow-400"
          >
            <Sparkles className="h-6 w-6" />
          </motion.div>
          <motion.div
            variants={floatingVariants}
            animate="animate"
            style={{ animationDelay: "1s" }}
            className="absolute -top-1 -right-4 text-yellow-400"
          >
            <Sparkles className="h-5 w-5" />
          </motion.div>

          {/* Main success circle */}
          <motion.div
            variants={checkVariants}
            className="inline-flex items-center justify-center"
          >
            <div className="relative">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut" as const,
                }}
                className="absolute inset-0 bg-green-400 rounded-full blur-xl"
              />
              <div className="relative bg-green-100 rounded-full p-6">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>
          </motion.div>

          {/* Party popper */}
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="absolute -bottom-2 -right-2 bg-purple-100 rounded-full p-2"
          >
            <PartyPopper className="h-5 w-5 text-purple-600" />
          </motion.div>
        </motion.div>

        {/* Success message */}
        <motion.h1
          variants={itemVariants}
          className="text-3xl font-bold text-gray-900 mb-4"
        >
          You're All Set!
        </motion.h1>

        <motion.p variants={itemVariants} className="text-lg text-gray-600 mb-8">
          Congratulations! You've successfully set up your Texas Drilling
          Permit Alerts account.
        </motion.p>

        {/* What's Next card */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-lg shadow-md p-6 mb-8"
        >
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-lg font-medium text-gray-900 mb-4"
          >
            What's Next?
          </motion.h3>
          <motion.ul
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            <AnimatePresence>
              {nextSteps.map((step, index) => (
                <motion.li
                  key={step.text}
                  variants={itemVariants}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ x: 5 }}
                  className="flex items-start p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1, type: "spring" }}
                    className="flex-shrink-0"
                  >
                    <div className="bg-green-100 rounded-full p-1">
                      <step.icon className="h-4 w-4 text-green-600" />
                    </div>
                  </motion.div>
                  <p className="ml-3 text-gray-600 text-left">{step.text}</p>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        </motion.div>

        {/* CTA Button */}
        <motion.div variants={itemVariants}>
          <motion.button
            onClick={handleGoToDashboard}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go to Dashboard
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut" as const,
              }}
            >
              <ArrowRight className="ml-2 h-5 w-5" />
            </motion.div>
          </motion.button>
        </motion.div>

        {/* Additional info */}
        <motion.p
          variants={itemVariants}
          className="mt-6 text-sm text-gray-500"
        >
          You can always return to onboarding from your profile settings
        </motion.p>
      </motion.div>
    </div>
  );
}