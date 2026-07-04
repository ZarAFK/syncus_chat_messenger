// userservices.ts
import { AxiosError } from 'axios';
import api from './auth.api';

export interface IUser {
  /* keep as you have */
}

export interface getIUser {
  user_id: number;
  username: string;
  email: string;
  role: string;
  profile?: {
    avatar_url?: string;
    bio?: string;
  };
}

export const userService = {
  me: async (): Promise<getIUser> => {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Token not found');

    try {
      // Use profile_user to get full data including profile picture
      const res = await api.get('/users/profile_user');
      console.log('me() response:', res.data);
      // profile_user returns { data: { user: {...}, tokenPayload: {...} } }
      const payload = res.data?.data?.user ?? res.data?.data ?? res.data?.user ?? res.data;
      if (!payload) throw new Error('Invalid response from server');
      // Normalize profile picture field from backend DTO
      const rawProfile = payload.profile as any;
      if (rawProfile) {
        payload.profile = {
          ...rawProfile,
          avatar_url: rawProfile.profile_picture || rawProfile.avatar_url || '',
        };
      }
      return payload as getIUser;
    } catch (err: unknown) {
      let msg = 'Failed to fetch user data';
      if (err instanceof AxiosError) {
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_id');
        }
        msg = err.response?.data?.message || err.response?.data?.error || msg;
      }
      throw new Error(msg);
    }
  },

  login: async ({ email, password }: { email: string; password: string }) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const token = data?.access_token ?? data?.token;
      if (!token) throw new Error('No access token in response');
      return token as string;
    } catch (err) {
      if (err instanceof AxiosError) {
        throw new Error(err.response?.data?.message || 'Invalid credentials');
      }
      throw err;
    }
  },

  register: async (payload: { username: string; email: string; password: string; gender: string; country: string; age: number }) => {
    try {
      const formattedPayload = {
        username: payload.username,
        age: payload.age,
        country: payload.country,
        gender: payload.gender,
        auth: {
          email: payload.email,
          password: payload.password,
        },
      };
      console.log('Send to BE:', formattedPayload);
      const { data } = await api.post('/users/signup', formattedPayload);
      return data;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const msg = err.response?.data?.message || err.response?.data?.error || 'Register failed';
        throw new Error(msg);
      }
      throw new Error('Unexpected error during register');
    }
  },

  logout: async (): Promise<void> => {
    const token = localStorage.getItem('access_token');
    console.log('check logout token', token);

    if (!token) return;

    try {
      await api.post(
        '/auth/logout',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('✅ Logout berhasil di server');
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.warn(`⚠️ Logout API failed (${error.response?.status}): ${error.message}, hapus session tetap dilakukan.`);
      } else {
        console.warn('⚠️ Logout API failed, hapus session tetap dilakukan.', error);
      }
    } finally {
      // Clear semua sesi lokal
      localStorage.removeItem('access_token');
      sessionStorage.clear(); // optional, bersihkan storage lain
      // Reset state user jika pakai context atau Redux bisa ditaruh di sini
      console.log('✅ Session cleared');
      // Redirect ke login page bisa ditambahkan di sini, misal:
      window.location.href = '/'; // atau gunakan navigate() kalau react-router
    }
  },

  getAllUser: async (): Promise<IUser[]> => {
    const { data } = await api.get('/users');
    return data;
  },
};
