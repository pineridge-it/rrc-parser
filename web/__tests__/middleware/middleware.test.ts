import { updateSession } from '@/lib/supabase/middleware';
import { NextRequest, NextResponse } from 'next/server';

// Mock Supabase client
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn().mockImplementation(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    },
  })),
}));

describe('Middleware', () => {
  const mockRequest = {
    cookies: {
      getAll: jest.fn().mockReturnValue([]),
      set: jest.fn(),
    },
    nextUrl: {
      pathname: '/',
      clone: jest.fn().mockReturnThis(),
    },
  } as unknown as NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect unauthenticated users from protected paths', async () => {
    mockRequest.nextUrl.pathname = '/dashboard';
    
    const response = await updateSession(mockRequest);
    
    expect(response).toBeInstanceOf(NextResponse);
    // Should redirect to login
    expect((response as NextResponse).status).toBe(307);
  });

  it('should allow authenticated users to access protected paths', async () => {
    // Mock authenticated user
    jest.requireMock('@supabase/ssr').createServerClient.mockImplementationOnce(() => ({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user123' } },
          error: null,
        }),
      },
    }));

    mockRequest.nextUrl.pathname = '/dashboard';
    
    const response = await updateSession(mockRequest);
    
    expect(response).toBeInstanceOf(NextResponse);
    // Should not redirect
    expect((response as NextResponse).status).toBe(200);
  });

  it('should redirect authenticated users away from auth pages', async () => {
    // Mock authenticated user
    jest.requireMock('@supabase/ssr').createServerClient.mockImplementationOnce(() => ({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user123' } },
          error: null,
        }),
      },
    }));

    mockRequest.nextUrl.pathname = '/login';
    
    const response = await updateSession(mockRequest);
    
    expect(response).toBeInstanceOf(NextResponse);
    // Should redirect to dashboard
    expect((response as NextResponse).status).toBe(307);
  });

  it('should allow unauthenticated users to access auth pages', async () => {
    mockRequest.nextUrl.pathname = '/login';
    
    const response = await updateSession(mockRequest);
    
    expect(response).toBeInstanceOf(NextResponse);
    // Should not redirect
    expect((response as NextResponse).status).toBe(200);
  });
});