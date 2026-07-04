// useAuth.tsx (or .ts)
import { useState, useCallback, useEffect } from 'react';
import { userService, getIUser } from '../services/userservices';
import { AxiosError } from 'axios';

export const useAuth = () => {
  const [user, setUser] = useState<getIUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserdt = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const me = await userService.me();
      setUser(me);
      if (me && me.user_id) {
        localStorage.setItem('user_id', String(me.user_id));
      }
      setError(null);
    } catch (err: unknown) {
      setUser(null);
      let msg = 'Failed to fetch user';
      if (err instanceof AxiosError) msg = err.response?.data?.message || err.message;
      else if (err instanceof Error) msg = err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchUserdt();
    })();
    return () => {
      mounted = false;
    };
  }, [fetchUserdt]);

  const login = async (email: string, password: string) => {
    try {
      const token = await userService.login({ email, password });
      localStorage.setItem('access_token', token);
      await fetchUserdt();
      setError(null);
      return token;
    } catch (err: unknown) {
      setUser(null);
      let backendMessage: string | undefined;
      if (err instanceof AxiosError) {
        backendMessage = err.response?.data?.message || err.response?.data?.error;
      } else if (err instanceof Error) {
        backendMessage = err.message;
      }
      setError(backendMessage || 'Failed to login');
      throw err;
    }
  };

  const register = async (payload: { username: string; email: string; password: string; gender: string; country: string; age: number }) => {
    try {
      await userService.register(payload);
      await login(payload.email, payload.password);
    } catch (err: unknown) {
      let backendMessage: string | undefined;
      if (err instanceof AxiosError) {
        backendMessage = err.response?.data?.message || err.response?.data?.error;
      } else if (err instanceof Error) {
        backendMessage = err.message;
      }
      setError(backendMessage || 'Failed to register');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await userService.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      localStorage.removeItem('access_token');
    }
  };

  return {
    user,
    error,
    loading,
    login,
    register,
    logout,
  };
};
