# Supabase Auth Integration

This directory contains the Supabase authentication configuration for the Texas Drilling Permit Alerts application.

## Files

- `client.ts` - Browser client for client-side Supabase operations
- `server.ts` - Server client for server-side Supabase operations (Server Components, API routes)
- `middleware.ts` - Session management and route protection logic

## Environment Variables

Required environment variables (see `.env.local.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Usage

### Client Components

```tsx
'use client'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
```

### Server Components

```tsx
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
```

## Auth Flow

1. **Sign Up** (`/signup`) - Email/password registration with email verification
2. **Login** (`/login`) - Email/password or magic link authentication
3. **Forgot Password** (`/forgot-password`) - Password reset email
4. **Update Password** (`/update-password`) - Set new password after reset
5. **Auth Callback** (`/auth/callback`) - Handle OAuth and email verification callbacks

## Security

- Sessions stored in httpOnly cookies
- CSRF protection via Supabase Auth
- Row Level Security (RLS) policies in database
- Middleware redirects unauthenticated users from protected routes
