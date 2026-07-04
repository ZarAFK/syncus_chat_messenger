import { useState, useCallback, useEffect } from 'react';
import { profileService, IProfile } from '../services/profileServices';
import { AxiosError } from 'axios';
import { resolveAvatarUrl } from '@/shared/utils/avatarUtils';

export const useProfile = () => {
  const [profile, setProfile] = useState<IProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await profileService.getProfile();
      console.log('✅ Response dari backend:', response);

      const userData = response.user || {};
      const authData = userData.auth || { email: 'No email' };
      const profileData = (userData.profile || {}) as any;

      const mergedProfile: IProfile = {
        ...userData,
        auth: authData,
        profile: {
          bio: profileData.bio || 'No bio yet',
          avatar_url: resolveAvatarUrl(
            profileData.profile_picture || profileData.avatar_url,
            userData.username
          ),
        },
      };

      setProfile(mergedProfile);
      setError(null);
    } catch (err: unknown) {
      let msg = 'Gagal mengambil profile';
      if (err instanceof AxiosError) {
        msg = err.response?.data?.message || err.response?.data?.error || msg;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      console.error('Error fetchProfile:', err);
      setProfile(null);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updatedProfile: Partial<IProfile>) => {
    if (!profile) return;

    try {
      const updated = await profileService.updateProfile(profile.user_id, updatedProfile);
      
      const userData = updated || {};
      const authData = userData.auth || profile.auth;
      const profileData = (userData.profile || {}) as any;

      const mergedProfile: IProfile = {
        ...profile,
        ...userData,
        auth: {
          ...profile.auth,
          ...authData,
        },
        profile: {
          ...profile.profile,
          bio: profileData.bio !== undefined ? profileData.bio : profile.profile.bio,
          avatar_url: resolveAvatarUrl(
            profileData.profile_picture || profileData.avatar_url || profile.profile.avatar_url,
            userData.username || profile.username
          ),
        },
      };

      setProfile(mergedProfile);
      setError(null);
    } catch (err: unknown) {
      let msg = 'Gagal update profile';
      if (err instanceof AxiosError) {
        msg = err.response?.data?.message || err.response?.data?.error || msg;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
      throw err;
    }
  };

  return { profile, loading, error, fetchProfile, updateProfile };
};
