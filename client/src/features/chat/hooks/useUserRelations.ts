import { useState, useEffect, useCallback } from "react";
import api from "@/features/auth/services/auth.api";

export interface SavedMessage {
  id: number | string;
  content: string;
  created_at: string | Date;
  sender_name: string;
  sender_id: number;
  chat_name: string;
  chat_id: number;
  is_group: boolean;
}

export interface SavedStatus {
  status_id: number;
  user_id: number;
  username: string;
  avatar: string;
  text: string;
  emoji: string;
  image_paths: string[];
  created_at: string | Date;
  saved_at: string | Date;
}

export interface UserRelations {
  friends: number[];
  favorites: number[];
  blocked: number[];
  savedMessages: SavedMessage[];
  savedStatuses: SavedStatus[];
  relationsList: any[];
  isFriend: (id: number) => boolean;
  isFavorite: (id: number) => boolean;
  isBlocked: (id: number) => boolean;
  isSaved: (id: number | string) => boolean;
  isStatusSaved: (id: number) => boolean;
  isPendingIncoming: (id: number) => boolean;
  isPendingOutgoing: (id: number) => boolean;
  getRelation: (id: number) => any;
  addFriend: (id: number) => Promise<void>;
  removeFriend: (id: number) => Promise<void>;
  acceptFriendRequest: (relationId: number) => Promise<void>;
  rejectFriendRequest: (relationId: number) => Promise<void>;
  toggleFavorite: (id: number) => Promise<void>;
  toggleBlock: (id: number) => void;
  saveMessage: (msg: SavedMessage) => void;
  unsaveMessage: (msgId: number | string) => void;
  saveStatus: (status: SavedStatus) => void;
  unsaveStatus: (statusId: number) => void;
  reloadRelations: () => void;
}

export const useUserRelations = (currentUserId: number): UserRelations => {
  const [friends, setFriends] = useState<number[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [blocked, setBlocked] = useState<number[]>([]);
  const [savedMessages, setSavedMessages] = useState<SavedMessage[]>([]);
  const [savedStatuses, setSavedStatuses] = useState<SavedStatus[]>([]);
  const [relationsList, setRelationsList] = useState<any[]>([]);

  const fetchRelations = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const res = await api.get(`/friends/relations?userId=${currentUserId}`);
      const list = res.data || [];
      setRelationsList(list);

      // Extract accepted friends' user IDs
      const friendIds = list
        .filter((r: any) => r.status === "accepted")
        .map((r: any) =>
          r.user_id?.user_id === currentUserId ? r.friend_id?.user_id : r.user_id?.user_id
        );
      setFriends(friendIds);
    } catch (err) {
      console.error("Failed to fetch relations:", err);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    const storedFavorites = localStorage.getItem(`syncus_favorites_${currentUserId}`);
    const storedBlocked = localStorage.getItem(`syncus_blocked_${currentUserId}`);
    const storedSaved = localStorage.getItem(`syncus_saved_${currentUserId}`);
    const storedSavedStatuses = localStorage.getItem(`syncus_saved_statuses_${currentUserId}`);

    setFavorites(storedFavorites ? JSON.parse(storedFavorites) : []);
    setBlocked(storedBlocked ? JSON.parse(storedBlocked) : []);
    setSavedMessages(storedSaved ? JSON.parse(storedSaved) : []);
    setSavedStatuses(storedSavedStatuses ? JSON.parse(storedSavedStatuses) : []);

    fetchRelations();
  }, [currentUserId, fetchRelations]);

  const addFriend = async (userId: number) => {
    try {
      await api.post("/friends", {
        user_id: currentUserId,
        friend_id: userId,
      });
      await fetchRelations();
    } catch (err) {
      console.error("Failed to send friend request:", err);
    }
  };

  const removeFriend = async (userId: number) => {
    // Find relation ID
    const rel = relationsList.find(
      (r) =>
        (r.user_id?.user_id === currentUserId && r.friend_id?.user_id === userId) ||
        (r.friend_id?.user_id === currentUserId && r.user_id?.user_id === userId)
    );
    if (!rel) return;

    try {
      await api.delete(`/friends/${rel.id}`);
      await fetchRelations();
    } catch (err) {
      console.error("Failed to remove friend/request:", err);
    }
  };

  const toggleFavorite = async (userId: number) => {
    const isFav = favorites.includes(userId);
    const updated = isFav
      ? favorites.filter((id) => id !== userId)
      : [...favorites, userId];
    
    setFavorites(updated);
    localStorage.setItem(`syncus_favorites_${currentUserId}`, JSON.stringify(updated));

    if (!isFav) {
      // Trigger backend favorite notification
      try {
        await api.post("/notifications/favorite", { targetUserId: userId });
      } catch (err) {
        console.error("Failed to send favorite notification:", err);
      }
    }
  };

  const toggleBlock = (userId: number) => {
    setBlocked((prev) => {
      const updated = prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];
      localStorage.setItem(`syncus_blocked_${currentUserId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const saveMessage = (msg: SavedMessage) => {
    setSavedMessages((prev) => {
      const updated = prev.some((m) => m.id === msg.id) ? prev : [...prev, msg];
      localStorage.setItem(`syncus_saved_${currentUserId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const unsaveMessage = (msgId: number | string) => {
    setSavedMessages((prev) => {
      const updated = prev.filter((m) => m.id !== msgId);
      localStorage.setItem(`syncus_saved_${currentUserId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const saveStatus = (status: SavedStatus) => {
    setSavedStatuses((prev) => {
      const updated = prev.some((s) => s.status_id === status.status_id) ? prev : [...prev, status];
      localStorage.setItem(`syncus_saved_statuses_${currentUserId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const unsaveStatus = (statusId: number) => {
    setSavedStatuses((prev) => {
      const updated = prev.filter((s) => s.status_id !== statusId);
      localStorage.setItem(`syncus_saved_statuses_${currentUserId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const getRelation = (userId: number) => {
    return relationsList.find(
      (r) =>
        (r.user_id?.user_id === currentUserId && r.friend_id?.user_id === userId) ||
        (r.friend_id?.user_id === currentUserId && r.user_id?.user_id === userId)
    );
  };

  const acceptFriendRequest = async (relationId: number) => {
    try {
      await api.patch(`/friends/${relationId}/accept`);
      await fetchRelations();
    } catch (err) {
      console.error("Failed to accept friend request:", err);
    }
  };

  const rejectFriendRequest = async (relationId: number) => {
    try {
      await api.patch(`/friends/${relationId}/reject`);
      await fetchRelations();
    } catch (err) {
      console.error("Failed to reject friend request:", err);
    }
  };

  const isFriend = (userId: number) => friends.includes(userId);

  const isPendingIncoming = (userId: number) => {
    const rel = getRelation(userId);
    return !!rel && rel.status === "pending" && rel.friend_id?.user_id === currentUserId;
  };

  const isPendingOutgoing = (userId: number) => {
    const rel = getRelation(userId);
    return !!rel && rel.status === "pending" && rel.user_id?.user_id === currentUserId;
  };

  return {
    friends,
    favorites,
    blocked,
    savedMessages,
    savedStatuses,
    relationsList,
    isFriend,
    isFavorite: (id: number) => favorites.includes(id),
    isBlocked: (id: number) => blocked.includes(id),
    isSaved: (id: number | string) => savedMessages.some((m) => m.id === id),
    isStatusSaved: (id: number) => savedStatuses.some((s) => s.status_id === id),
    isPendingIncoming,
    isPendingOutgoing,
    getRelation,
    addFriend,
    removeFriend,
    acceptFriendRequest,
    rejectFriendRequest,
    toggleFavorite,
    toggleBlock,
    saveMessage,
    unsaveMessage,
    saveStatus,
    unsaveStatus,
    reloadRelations: fetchRelations,
  };
};
