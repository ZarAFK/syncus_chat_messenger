import api from '@/features/auth/services/auth.api';
import { AxiosError } from 'axios';

export interface IProfile {
  user_id: number;
  username: string;
  age?: number;
  is_online: boolean;
  last_seen: string;
  role: string;
  country: string;
  gender: string;
  profile: {
    bio?: string;
    avatar_url?: string; // pastikan sama dengan DTO backend
  };
  auth: {
    email: string;
  };
  last_username_change?: string;
  created_at: string;
  updated_at: string;
}

export const profileService = {
  getProfile: async (): Promise<{ user: IProfile; tokenPayload: any }> => {
    try {
      const { data } = await api.get('/users/profile_user');
      console.log('response dari users/profile_user : ', data);

      const resUserData = data?.data;
      if (!resUserData)
        throw new Error('Data user tidak ditemukan di response backend');
      return resUserData as { user: IProfile; tokenPayload: any };
    } catch (err: unknown) {
      let msg = 'Gagal mengambil data profil';
      if (err instanceof AxiosError) {
        msg = err.response?.data?.message || err.response?.data?.error || msg;
      }
      throw new Error(msg);
    }
  },

  updateProfile: async (user_id: number, payload: Partial<IProfile>) => {
    try {
      const { data } = await api.patch(`/users/${user_id}`, payload);
      return data.data || data.user || data;
    } catch (err: unknown) {
      let msg = 'Gagal update profil';
      if (err instanceof AxiosError) {
        msg = err.response?.data?.message || err.response?.data?.error || msg;
      }
      throw new Error(msg);
    }
  },
};
