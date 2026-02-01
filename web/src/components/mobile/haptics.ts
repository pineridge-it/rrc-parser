/**
 * Haptic feedback utilities for mobile devices
 * Provides tactile feedback for user interactions
 */

export type HapticType = 
  | "light" 
  | "medium" 
  | "heavy" 
  | "success" 
  | "warning" 
  | "error";

/**
 * Check if the device supports haptic feedback
 */
export function supportsHaptics(): boolean {
  return "vibrate" in navigator || 
    (typeof window !== "undefined" && "HapticFeedback" in window);
}

/**
 * Trigger haptic feedback
 * @param type - The type of haptic feedback to trigger
 */
export function haptic(type: HapticType = "light"): void {
  if (!supportsHaptics()) return;

  // Use Vibration API as fallback
  if ("vibrate" in navigator) {
    const patterns: Record<HapticType, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 30,
      success: [10, 50, 10],
      warning: [20, 30, 20],
      error: [30, 50, 30],
    };

    navigator.vibrate(patterns[type]);
    return;
  }
}

/**
 * Haptic feedback for button presses
 */
export function hapticButtonPress(): void {
  haptic("light");
}

/**
 * Haptic feedback for successful actions
 */
export function hapticSuccess(): void {
  haptic("success");
}

/**
 * Haptic feedback for errors
 */
export function hapticError(): void {
  haptic("error");
}

/**
 * Haptic feedback for warnings
 */
export function hapticWarning(): void {
  haptic("warning");
}

/**
 * Haptic feedback for selection changes
 */
export function hapticSelection(): void {
  haptic("light");
}

/**
 * Haptic feedback for impact/confirmation
 */
export function hapticImpact(): void {
  haptic("medium");
}

/**
 * React hook for haptic feedback
 * Returns haptic functions for use in components
 */
export function useHaptics() {
  return {
    haptic,
    hapticButtonPress,
    hapticSuccess,
    hapticError,
    hapticWarning,
    hapticSelection,
    hapticImpact,
    supportsHaptics: supportsHaptics(),
  };
}
