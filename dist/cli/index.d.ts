/**
 * Enhanced CLI with progress reporting and better UI
 * Location: src/cli/index.ts
 *
 * IMPROVEMENTS:
 * - Removed all 'as any' type casts for better type safety
 * - Added proper type definitions for all functions
 * - Improved error handling with specific error messages
 * - Better input validation
 * - Extracted constants for magic values
 * - Added comprehensive JSDoc comments
 */
/**
 * Main CLI entry point
 * @returns Exit code (0 for success, 1 for error)
 */
declare function main(): Promise<number>;
export { main };
//# sourceMappingURL=index.d.ts.map