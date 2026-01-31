import { GET } from '@/app/auth/callback/route';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock NextResponse
const mockRedirect = jest.fn();
jest.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: string) => {
      mockRedirect(url);
      return { status: 307 } as any;
    },
  },
}));

describe('Auth Callback Route', () => {
  const mockExchangeCodeForSession = jest.fn();
  const mockSupabase = {
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
    },
  };

  beforeEach(() => {
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    mockRedirect.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect to dashboard on successful authentication', async () => {
    const mockRequest = {
      url: 'http://localhost:3000/auth/callback?code=testcode',
      headers: {
        get: jest.fn().mockReturnValue(null),
      },
    } as unknown as NextRequest;

    await GET(mockRequest);

    expect(createClient).toHaveBeenCalled();
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('testcode');
    expect(mockRedirect).toHaveBeenCalledWith('http://localhost:3000/');
  });

  it('should redirect to update password for recovery flow', async () => {
    const mockRequest = {
      url: 'http://localhost:3000/auth/callback?code=testcode&type=recovery',
      headers: {
        get: jest.fn().mockReturnValue(null),
      },
    } as unknown as NextRequest;

    await GET(mockRequest);

    expect(createClient).toHaveBeenCalled();
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('testcode');
    expect(mockRedirect).toHaveBeenCalledWith('http://localhost:3000/update-password');
  });

  it('should redirect to error page on authentication failure', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: new Error('Invalid code') });

    const mockRequest = {
      url: 'http://localhost:3000/auth/callback?code=invalidcode',
      headers: {
        get: jest.fn().mockReturnValue(null),
      },
    } as unknown as NextRequest;

    await GET(mockRequest);

    expect(createClient).toHaveBeenCalled();
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('invalidcode');
    expect(mockRedirect).toHaveBeenCalledWith('http://localhost:3000/auth/auth-code-error');
  });

  it('should redirect to error page when no code is provided', async () => {
    const mockRequest = {
      url: 'http://localhost:3000/auth/callback',
      headers: {
        get: jest.fn().mockReturnValue(null),
      },
    } as unknown as NextRequest;

    await GET(mockRequest);

    expect(createClient).not.toHaveBeenCalled();
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith('http://localhost:3000/auth/auth-code-error');
  });
});