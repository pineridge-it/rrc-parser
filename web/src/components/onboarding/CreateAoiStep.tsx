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

export default function CreateAoiStep() {
  const { completeStep, skipStep, setFirstAoiId } = useOnboarding();
  const [aoiName, setAoiName] = useState("");
  const [drawingMode, setDrawingMode] = useState<"draw" | "county">("draw");
  const [isCreating, setIsCreating] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const handleContinue = async () => {
    if (!aoiName.trim()) return;

    setIsCreating(true);
    // Simulate creation delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 800));

    const fakeAoiId = "aoi-" + Date.now();
    setFirstAoiId(fakeAoiId);
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
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4"
          >
            <MapPin className="h-8 w-8 text-indigo-600" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Create Your First Area of Interest
          </h1>
          <p className="text-gray-600">
            Define the geographic area you want to monitor for drilling permits.
          </p>
        </motion.div>

        {/* Main Form Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-lg shadow-md p-6 mb-6"
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
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How would you like to define your area?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.button
                type="button"
                onClick={() => setDrawingMode("draw")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  drawingMode === "draw"
                    ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center">
                  <motion.div
                    animate={
                      drawingMode === "draw"
                        ? { rotate: [0, -10, 10, 0] }
                        : {}
                    }
                    transition={{ duration: 0.5 }}
                    className={`flex-shrink-0 rounded-md p-2 ${
                      drawingMode === "draw" ? "bg-indigo-200" : "bg-indigo-100"
                    }`}
                  >
                    <Pencil
                      className={`h-5 w-5 ${
                        drawingMode === "draw"
                          ? "text-indigo-700"
                          : "text-indigo-600"
                      }`}
                    />
                  </motion.div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      Draw on Map
                    </h3>
                    <p className="text-xs text-gray-500">
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
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  drawingMode === "county"
                    ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center">
                  <motion.div
                    animate={
                      drawingMode === "county"
                        ? { scale: [1, 1.1, 1] }
                        : {}
                    }
                    transition={{ duration: 0.5 }}
                    className={`flex-shrink-0 rounded-md p-2 ${
                      drawingMode === "county" ? "bg-green-200" : "bg-green-100"
                    }`}
                  >
                    <Globe
                      className={`h-5 w-5 ${
                        drawingMode === "county"
                          ? "text-green-700"
                          : "text-green-600"
                      }`}
                    />
                  </motion.div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      Select County
                    </h3>
                    <p className="text-xs text-gray-500">
                      Choose from Texas counties
                    </p>
                  </div>
                </div>
              </motion.button>
            </div>
          </motion.div>

          {/* Popular Areas */}
          <motion.div variants={itemVariants} className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Popular Areas
            </h3>
            <div className="flex flex-wrap gap-2">
              {popularAreas.map((area, index) => (
                <motion.button
                  key={area}
                  type="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAoiName(area)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    aoiName === area
                      ? "bg-indigo-600 text-white"
                      : "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                  }`}
                >
                  {aoiName === area && (
                    <Check className="h-3 w-3 mr-1" />
                  )}
                  {area}
                </motion.button>
              ))}
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
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Skip for now
            </motion.button>

            <motion.button
              onClick={handleContinue}
              disabled={!aoiName.trim() || isCreating}
              whileHover={aoiName.trim() && !isCreating ? { scale: 1.02 } : {}}
              whileTap={aoiName.trim() && !isCreating ? { scale: 0.98 } : {}}
              className={`inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${
                aoiName.trim() && !isCreating
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-indigo-400 cursor-not-allowed"
              }`}
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
          className="text-center text-sm text-gray-500"
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={cancelSkip}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                  <SkipForward className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Skip creating an area?
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  You won't receive any alerts until you create at least one
                  area of interest. You can always add one later from your
                  dashboard.
                </p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={cancelSkip}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={confirmSkip}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
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