import api from '@/features/auth/services/auth.api';
import { AxiosError } from 'axios';

export interface IChatProfile {
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
    avatar_url?: string;
  };
  auth: {
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface IUserFriends {
  id: number;
  user_id: number;
  friend_id:number
  status: string;
  requested_at: string;
  accepted_at: string;
  created_at: string;
}

export const chatService = {
  getAllUser: async (): Promise<IChatProfile[]> => {
    try {
      const response = await api.get('/users');

      const users: IChatProfile[] = response.data.data || (Array.isArray(response.data) ? response.data : []);

      console.log('response user dt:', users);
      return users;
    } catch (error) {
      const err = error as AxiosError;
      console.error('Failed to fetch users:', err.message);
      return [];
    }
  },
  getUserByid: async (userId: number): Promise<IChatProfile | null> => {
    try {
      const resUserId = await api.get(`/users/profile_user/${userId}`);
      if (!resUserId.data.userdt) {
        throw new Error('user not found');
      }
      return resUserId.data.userdt as IChatProfile;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const error = err.response?.data.message || err.response?.data.error || err.message;
        console.error('error:', error);
      }
      return null;
    }
  },
  getUserFriends: async (userId: number): Promise<IUserFriends[]> => {
    try {
      const resFriendsDt = await api.get(`/friends/user/${userId}`);
      return resFriendsDt.data.data as IUserFriends[];
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const error = err.response?.data.message || err.response?.data.error || err.message;
        console.error('Failed to fetch user friends:', error);
      }
      return [];
    }
  }
};
