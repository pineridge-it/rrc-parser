"use client";

import { useOnboarding } from "./OnboardingContext";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pencil,
  Globe,
  MapPin,
  ArrowRight,
  SkipForward,
  Check,
  Loader2,
  Info,
} from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

const popularAreas = [
  "Permian Basin",
  "Eagle Ford Shale",
  "Barnett Shale",
  "Haynesville Shale",
];

/**
 * DEMO MODE: This component is in demo mode.
 * AOI creation is simulated for onboarding demonstration purposes.
 * No actual areas are persisted to the database.
 * TODO: Integrate with real AOI creation API when map functionality is ready.
 */
export default function CreateAoiStep() {
  const { completeStep, skipStep, setFirstAoiId } = useOnboarding();
  const [aoiName, setAoiName] = useState("");
  const [drawingMode, setDrawingMode] = useState<"draw" | "county">("draw");
  const [isCreating, setIsCreating] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const handleContinue = async () => {
    if (!aoiName.trim()) return;

    setIsCreating(true);
    // DEMO MODE: Simulated creation delay for UX demonstration
    // In production, this will call the real AOI creation API
    await new Promise((resolve) => setTimeout(resolve, 800));

    // DEMO MODE: Generate a temporary demo ID (not persisted)
    const demoAoiId = "aoi-demo-" + Date.now();
    setFirstAoiId(demoAoiId);
    setIsCreating(false);
    completeStep("create_aoi");
  };

  const handleSkip = () => {
    setShowSkipConfirm(true);
  };

  const confirmSkip = () => {
    skipStep("create_aoi");
    setShowSkipConfirm(false);
  };

  const cancelSkip = () => {
    setShowSkipConfirm(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Demo Mode Banner */}
        <motion.div
          variants={itemVariants}
          className="mb-6 p-4 border rounded-lg"
          style={{ background: 'color-mix(in srgb, var(--color-warning) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--color-warning) 30%, transparent)' }}
        >
          <div className="flex items-start">
            <Info className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-warning)' }} />
            <div className="ml-3">
              <h3 className="text-sm font-medium" style={{ color: 'var(--color-warning)' }}>
                Demo Mode
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                This is a demonstration of the AOI creation flow.
                Areas created here are not persisted to the database.
                Full map integration coming soon.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: 'color-mix(in srgb, var(--color-brand-primary) 12%, transparent)' }}
          >
            <MapPin className="h-8 w-8" style={{ color: 'var(--color-brand-primary)' }} />
          </motion.div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Create Your First Area of Interest
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Define the geographic area you want to monitor for drilling permits.
          </p>
        </motion.div>

        {/* Main Form Card */}
        <motion.div
          variants={itemVariants}
          className="rounded-xl border p-6 mb-6"
          style={{ background: 'var(--color-surface-raised)', borderColor: 'var(--color-border-default)' }}
        >
          {/* AOI Name Input */}
          <motion.div variants={itemVariants} className="mb-6">
            <Input
              id="aoi-name"
              label="Area Name"
              placeholder="e.g., Permian Basin, My Ranch, etc."
              floatingLabel
              value={aoiName}
              onChange={(e) => setAoiName(e.target.value)}
            />
          </motion.div>

          {/* Drawing Mode Selection */}
          <motion.div variants={itemVariants} className="mb-6">
            <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              How would you like to define your area?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.button
                type="button"
                onClick={() => setDrawingMode("draw")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-4 border-2 rounded-lg text-left transition-all"
                style={{
                  borderColor: drawingMode === 'draw' ? 'var(--color-brand-primary)' : 'var(--color-border-default)',
                  background: drawingMode === 'draw' ? 'color-mix(in srgb, var(--color-brand-primary) 6%, transparent)' : 'transparent',
                }}
              >
                <div className="flex items-center">
                  <motion.div
                    animate={drawingMode === "draw" ? { rotate: [0, -10, 10, 0] } : {}}
                    transition={{ duration: 0.5 }}
                    className="flex-shrink-0 rounded-md p-2"
                    style={{ background: 'color-mix(in srgb, var(--color-brand-primary) 12%, transparent)' }}
                  >
                    <Pencil className="h-5 w-5" style={{ color: 'var(--color-brand-primary)' }} />
                  </motion.div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      Draw on Map
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      Draw a polygon directly on the map
                    </p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => setDrawingMode("county")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-4 border-2 rounded-lg text-left transition-all"
                style={{
                  borderColor: drawingMode === 'county' ? 'var(--color-success)' : 'var(--color-border-default)',
                  background: drawingMode === 'county' ? 'color-mix(in srgb, var(--color-success) 6%, transparent)' : 'transparent',
                }}
              >
                <div className="flex items-center">
                  <motion.div
                    animate={drawingMode === "county" ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.5 }}
                    className="flex-shrink-0 rounded-md p-2"
                    style={{ background: 'color-mix(in srgb, var(--color-success) 12%, transparent)' }}
                  >
                    <Globe className="h-5 w-5" style={{ color: 'var(--color-success)' }} />
                  </motion.div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      Select County
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      Choose from Texas counties
                    </p>
                  </div>
                </div>
              </motion.button>
            </div>
          </motion.div>

          {/* Popular Areas */}
          <motion.div variants={itemVariants} className="mb-6">
            <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Popular Areas
            </h3>
            <div className="flex flex-wrap gap-2">
              {popularAreas.map((area, index) => {
                const isSelected = aoiName === area
                return (
                  <motion.button
                    key={area}
                    type="button"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setAoiName(area)}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                    style={{
                      background: isSelected ? 'var(--color-brand-primary)' : 'color-mix(in srgb, var(--color-brand-primary) 10%, transparent)',
                      color: isSelected ? '#fff' : 'var(--color-brand-primary)',
                    }}
                  >
                    {isSelected && <Check className="h-3 w-3 mr-1" />}
                    {area}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex justify-between items-center"
          >
            <motion.button
              onClick={handleSkip}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center px-4 py-2 border text-sm font-medium rounded-lg focus:outline-none transition-colors"
              style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)', background: 'transparent' }}
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Skip for now
            </motion.button>

            <motion.button
              onClick={handleContinue}
              disabled={!aoiName.trim() || isCreating}
              whileHover={aoiName.trim() && !isCreating ? { scale: 1.02 } : {}}
              whileTap={aoiName.trim() && !isCreating ? { scale: 0.98 } : {}}
              className="inline-flex items-center px-6 py-2 border-0 text-sm font-medium rounded-lg shadow-sm text-white focus:outline-none transition-all"
              style={{
                background: 'var(--color-brand-primary)',
                opacity: aoiName.trim() && !isCreating ? 1 : 0.5,
                cursor: aoiName.trim() && !isCreating ? 'pointer' : 'not-allowed',
              }}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Continue
                  <motion.div
                    animate={{ x: [0, 3, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut" as const,
                    }}
                  >
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </motion.div>
                </>
              )}
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Progress hint */}
        <motion.p
          variants={itemVariants}
          className="text-center text-sm"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Step 2 of 5 • You can always add more areas later
        </motion.p>
      </motion.div>

      {/* Skip Confirmation Modal */}
      <AnimatePresence>
        {showSkipConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={cancelSkip}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="rounded-xl border shadow-xl p-6 max-w-md w-full"
              style={{ background: 'var(--color-surface-raised)', borderColor: 'var(--color-border-default)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4"
                  style={{ background: 'color-mix(in srgb, var(--color-warning) 12%, transparent)' }}
                >
                  <SkipForward className="h-6 w-6" style={{ color: 'var(--color-warning)' }} />
                </div>
                <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Skip creating an area?
                </h3>
                <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                  You won't receive any alerts until you create at least one
                  area of interest. You can always add one later from your
                  dashboard.
                </p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={cancelSkip}
                    className="px-4 py-2 border text-sm font-medium rounded-lg focus:outline-none transition-colors"
                    style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)', background: 'transparent' }}
                  >
                    Go Back
                  </button>
                  <button
                    onClick={confirmSkip}
                    className="px-4 py-2 border-0 text-sm font-medium rounded-lg text-white focus:outline-none"
                    style={{ background: 'var(--color-warning)' }}
                  >
                    Skip Anyway
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}