import { useState, useCallback, useEffect } from 'react';
import { chatService, IChatProfile, IUserFriends } from '../services/chatServices';

const useChat = () => {
  const [users, setUsers] = useState<IChatProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetched, setIsFetched] = useState<boolean>(false);
  const userId = Number(localStorage.getItem('user_id'));
  const [friends, setFriends] = useState<IUserFriends[]>([]);
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const fetchedUsers = await chatService.getAllUser();
      console.log('📦 API getAllUser() result:', fetchedUsers);

      const mergedUsers: IChatProfile[] = fetchedUsers.map((user) => {
        const rawProfile = user.profile as any;
        // Server DTO returns `profile_picture`, but IChatProfile uses `avatar_url`
        const rawAvatarUrl = rawProfile?.profile_picture || rawProfile?.avatar_url || '';
        return {
          ...user,
          auth: user.auth || { email: 'No email' },
          profile: {
            bio: rawProfile?.bio || '',
            avatar_url: rawAvatarUrl,
          },
        };
      });

      console.log('✅ Processed user data:', mergedUsers);
      setUsers(mergedUsers);

      setIsFetched(true);
    } catch (error: unknown) {
      console.error('❌ Failed to load users:', error);
      if (error instanceof Error) setError(error.message);
      else setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchFriendsData = async () => {
    setLoading(true);
    try {
      const friends = await chatService.getUserFriends(userId);
      console.log('📦 API getUserFriends() result:', friends);
      setFriends(friends);
    } catch (error: unknown) {
      console.error('❌ Failed to load friends:', error);
      if (error instanceof Error) setError(error.message);
      else setError('Failed to fetch friends');
    } finally {
      setLoading(false);
    }
  };

  return { users, loading, error, isFetched };
};

export default useChat;
