"use client";

import { useOnboarding } from "./OnboardingContext";
import { motion } from "framer-motion";
import { MapPin, Bell, BarChart3, ArrowRight, Sparkles } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const featureVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
} as const;

export default function WelcomeStep() {
  const { completeStep } = useOnboarding();

  const handleContinue = () => {
    completeStep("welcome");
  };

  const features = [
    {
      icon: MapPin,
      title: "Monitor Areas of Interest",
      description: "Track drilling activity in specific regions",
      color: "indigo",
    },
    {
      icon: Bell,
      title: "Real-time Alerts",
      description: "Get notified when new permits are filed",
      color: "green",
    },
    {
      icon: BarChart3,
      title: "Data Insights",
      description: "Analyze permit trends and activity",
      color: "blue",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <motion.div
        className="text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Animated header with sparkles */}
        <motion.div variants={itemVariants} className="relative inline-block">
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
            className="absolute -top-4 -right-4 text-yellow-400"
          >
            <Sparkles className="h-6 w-6" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Texas Drilling Permit Alerts
          </h1>
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="text-lg text-gray-600 mb-8"
        >
          Get notified about new drilling permits in your areas of interest
          across Texas.
        </motion.p>

        {/* Feature cards with animations */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-lg shadow-md p-6 mb-8 overflow-hidden"
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={featureVariants}
                whileHover={{ scale: 1.02, x: 5 }}
                className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-default"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                  className={`flex-shrink-0 bg-${feature.color}-100 rounded-full p-3`}
                >
                  <feature.icon
                    className={`h-6 w-6 text-${feature.color}-600`}
                  />
                </motion.div>
                <div className="ml-4 text-left">
                  <h3 className="text-lg font-medium text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Animated CTA button */}
        <motion.div variants={itemVariants}>
          <motion.button
            onClick={handleContinue}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Get Started
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut" as const,
              }}
            >
              <ArrowRight className="-mr-1 ml-2 h-5 w-5" />
            </motion.div>
          </motion.button>
        </motion.div>

        {/* Trust indicators */}
        <motion.p
          variants={itemVariants}
          className="mt-6 text-sm text-gray-500"
        >
          Takes less than 2 minutes to set up
        </motion.p>
      </motion.div>
    </div>
  );
}