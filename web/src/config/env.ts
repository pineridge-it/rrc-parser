/**
 * Environment Variable Validation
 * 
 * Centralized validation for all environment variables.
 * Validates at startup and provides clear error messages.
 */

export interface EnvConfig {
  // Supabase (public - browser)
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  
  // Supabase (server-only)
  SUPABASE_SERVICE_ROLE_KEY?: string;
  
  // Optional with defaults
  NODE_ENV: 'development' | 'staging' | 'production' | 'test';
}

class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  
  if (!value || value.trim() === '') {
    throw new EnvValidationError(
      `Missing required environment variable: ${name}\n\n` +
      `Please set ${name} in your .env file or environment.\n` +
      `See .env.example for all required variables.`
    );
  }
  
  return value.trim();
}

function getOptionalEnvVar(name: string, defaultValue: string): string {
  const value = process.env[name];
  return value?.trim() || defaultValue;
}

function validateUrl(name: string, value: string): void {
  try {
    new URL(value);
  } catch {
    throw new EnvValidationError(
      `Invalid URL format for ${name}: ${value}\n\n` +
      `Please provide a valid URL (e.g., https://example.com)`
    );
  }
}

function validateSupabaseKey(name: string, value: string): void {
  // Supabase keys are base64-encoded JWTs, typically starting with 'eyJ'
  if (!value.startsWith('eyJ')) {
    throw new EnvValidationError(
      `Invalid Supabase key format for ${name}\n\n` +
      `The key should be a JWT token starting with 'eyJ'.\n` +
      `Please check your Supabase project settings for the correct key.`
    );
  }
}

/**
 * Validate and load environment configuration
 * Call this early in application startup
 */
export function validateEnv(): EnvConfig {
  const errors: string[] = [];
  
  // Required public variables
  let NEXT_PUBLIC_SUPABASE_URL: string | undefined;
  let NEXT_PUBLIC_SUPABASE_ANON_KEY: string | undefined;
  
  try {
    NEXT_PUBLIC_SUPABASE_URL = getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL');
    validateUrl('NEXT_PUBLIC_SUPABASE_URL', NEXT_PUBLIC_SUPABASE_URL);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  
  try {
    NEXT_PUBLIC_SUPABASE_ANON_KEY = getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    if (NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      validateSupabaseKey('NEXT_PUBLIC_SUPABASE_ANON_KEY', NEXT_PUBLIC_SUPABASE_ANON_KEY);
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  
  // Optional server-only variables
  let SUPABASE_SERVICE_ROLE_KEY: string | undefined;
  try {
    SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (SUPABASE_SERVICE_ROLE_KEY) {
      validateSupabaseKey('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY);
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  
  // NODE_ENV with validation
  const rawNodeEnv = getOptionalEnvVar('NODE_ENV', 'development');
  const validEnvs = ['development', 'staging', 'production', 'test'] as const;
  const NODE_ENV = validEnvs.includes(rawNodeEnv as typeof validEnvs[number]) 
    ? rawNodeEnv as typeof validEnvs[number]
    : 'development';
  
  // If there were any validation errors, throw them all at once
  if (errors.length > 0) {
    throw new EnvValidationError(
      `Environment validation failed with ${errors.length} error(s):\n\n` +
      errors.map((e, i) => `${i + 1}. ${e}`).join('\n\n')
    );
  }
  
  // At this point we know these are defined (validation passed)
  return {
    NEXT_PUBLIC_SUPABASE_URL: NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV,
  };
}

// Lazy-loaded validated config
let cachedConfig: EnvConfig | null = null;

/**
 * Get validated environment configuration
 * Caches result after first call
 */
export function getEnv(): EnvConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnv();
  }
  return cachedConfig;
}

/**
 * Clear cached config (useful for testing)
 */
export function clearEnvCache(): void {
  cachedConfig = null;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnv().NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === 'development';
}

// Validate immediately in server context to fail fast
if (typeof window === 'undefined') {
  // Server-side: validate immediately
  try {
    validateEnv();
  } catch (error) {
    // Log to stderr for visibility during build/startup
    console.error('❌ Environment validation failed:');
    console.error(error instanceof Error ? error.message : String(error));
    // Re-throw to prevent server from starting with invalid config
    throw error;
  }
}
