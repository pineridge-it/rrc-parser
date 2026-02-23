import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { validateEnvVar } from '@/lib/errors'

export async function createClient() {
  const supabaseUrl = validateEnvVar('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = validateEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: object }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorName = error instanceof Error ? error.name : 'UnknownError';

            if (process.env.NODE_ENV === 'development') {
              console.warn(
                '[Supabase] Cookie set failed (expected in Server Components):',
                { error: errorName, message: errorMessage, cookieCount: cookiesToSet.length }
              );
            } else {
              console.warn(
                '[Supabase] supabase_cookie_set_failed',
                JSON.stringify({
                  error: errorMessage,
                  errorType: errorName,
                  cookieCount: cookiesToSet.length,
                })
              );
            }
          }
        },
      },
    }
  )
}
