import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

// Mock Supabase auth methods
const mockSignIn = jest.fn();
const mockSignUp = jest.fn();
const mockSignOut = jest.fn();
const mockResetPassword = jest.fn();
const mockUpdateUser = jest.fn();
const mockSignInWithOtp = jest.fn();
const mockGetUser = jest.fn();
const mockOnAuthStateChange = jest.fn();

const mockSupabase = {
  auth: {
    signInWithPassword: mockSignIn,
    signUp: mockSignUp,
    signOut: mockSignOut,
    resetPasswordForEmail: mockResetPassword,
    updateUser: mockUpdateUser,
    signInWithOtp: mockSignInWithOtp,
    getUser: mockGetUser,
    onAuthStateChange: mockOnAuthStateChange,
  },
};

describe('useAuth', () => {
  beforeEach(() => {
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    mockSignIn.mockResolvedValue({ error: null });
    mockSignUp.mockResolvedValue({ error: null, data: { user: null } });
    mockSignOut.mockResolvedValue({ error: null });
    mockResetPassword.mockResolvedValue({ error: null });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockSignInWithOtp.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle sign in', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
    expect(result.current.loading).toBe(false);
  });

  it('should handle sign up', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp('test@example.com', 'password', 'Test User');
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
      options: {
        data: {
          full_name: 'Test User',
        },
        emailRedirectTo: expect.any(String),
      },
    });
    expect(result.current.loading).toBe(false);
  });

  it('should handle sign out', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOut).toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it('should handle password reset', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.resetPassword('test@example.com');
    });

    expect(mockResetPassword).toHaveBeenCalledWith('test@example.com', {
      redirectTo: expect.any(String),
    });
    expect(result.current.loading).toBe(false);
  });

  it('should handle password update', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.updatePassword('newpassword');
    });

    expect(mockUpdateUser).toHaveBeenCalledWith({
      password: 'newpassword',
    });
    expect(result.current.loading).toBe(false);
  });

  it('should handle magic link send', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.sendMagicLink('test@example.com');
    });

    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: {
        emailRedirectTo: expect.any(String),
      },
    });
    expect(result.current.loading).toBe(false);
  });
});