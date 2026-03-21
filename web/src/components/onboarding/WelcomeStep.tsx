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

const featureColors = [
  { bg: 'var(--color-brand-primary)', text: 'var(--color-brand-primary)' },
  { bg: 'var(--color-success)', text: 'var(--color-success)' },
  { bg: 'var(--color-brand-accent)', text: 'var(--color-brand-accent)' },
];

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
      colorIdx: 0,
    },
    {
      icon: Bell,
      title: "Real-time Alerts",
      description: "Get notified when new permits are filed",
      colorIdx: 1,
    },
    {
      icon: BarChart3,
      title: "Data Insights",
      description: "Analyze permit trends and activity",
      colorIdx: 2,
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
        <motion.div variants={itemVariants} className="relative inline-block">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="absolute -top-4 -right-4"
            style={{ color: 'var(--color-warning)' }}
          >
            <Sparkles className="h-6 w-6" />
          </motion.div>
          <h1
            className="text-3xl font-bold mb-4"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Welcome to Texas Drilling Permit Alerts
          </h1>
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="text-lg mb-8"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Get notified about new drilling permits in your areas of interest across Texas.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="rounded-xl border p-6 mb-8 overflow-hidden shadow-sm"
          style={{
            background: 'var(--color-surface-raised)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {features.map((feature, index) => {
              const c = featureColors[feature.colorIdx];
              return (
                <motion.div
                  key={feature.title}
                  variants={featureVariants}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="flex items-center p-3 rounded-lg transition-colors cursor-default"
                  style={{ ':hover': { background: 'var(--color-surface-subtle)' } } as React.CSSProperties}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                    className="flex-shrink-0 rounded-full p-3"
                    style={{ background: `color-mix(in srgb, ${c.bg} 12%, transparent)` }}
                  >
                    <feature.icon className="h-6 w-6" style={{ color: c.text }} />
                  </motion.div>
                  <div className="ml-4 text-left">
                    <h3
                      className="text-lg font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {feature.title}
                    </h3>
                    <p style={{ color: 'var(--color-text-tertiary)' }}>
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <motion.button
            onClick={handleContinue}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center px-6 py-3 border-0 text-base font-medium rounded-lg shadow-sm text-white transition-colors"
            style={{ background: 'var(--color-brand-primary)' }}
          >
            Get Started
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" as const }}
            >
              <ArrowRight className="-mr-1 ml-2 h-5 w-5" />
            </motion.div>
          </motion.button>
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="mt-6 text-sm"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Takes less than 2 minutes to set up
        </motion.p>
      </motion.div>
    </div>
  );
}
