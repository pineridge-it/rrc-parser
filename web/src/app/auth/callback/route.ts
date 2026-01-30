import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        // Handle password recovery flow
        if (type === 'recovery') {
          return NextResponse.redirect(`${origin}/update-password`)
        }
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        if (type === 'recovery') {
          return NextResponse.redirect(`https://${forwardedHost}/update-password`)
        }
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        if (type === 'recovery') {
          return NextResponse.redirect(`${origin}/update-password`)
        }
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
