import { useState, useEffect } from "react";
import api from "@/features/auth/services/auth.api";
import { Socket } from "socket.io-client";

export interface INotification {
  notification_id: number;
  type: "new_message" | "friend_request" | "friend_accept" | "favorite_add" | "room_invite";
  related_id?: number;
  message?: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    user_id: number;
    username: string;
    profile?: {
      bio?: string;
      avatar_url?: string;
    };
  };
}

export const useNotifications = (socket: Socket | null, currentUserId: number, onRelationsChanged?: () => void) => {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentUserId]);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif: INotification) => {
      console.log("🔔 New notification received via socket:", notif);
      setNotifications((prev) => {
        // Prevent duplicates
        if (prev.some((n) => n.notification_id === notif.notification_id)) return prev;
        return [notif, ...prev];
      });
      if (onRelationsChanged) {
        onRelationsChanged();
      }
    };

    socket.on("newNotification", handleNewNotification);

    return () => {
      socket.off("newNotification", handleNewNotification);
    };
  }, [socket, onRelationsChanged]);

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.notification_id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const acceptFriendRequest = async (friendshipId: number, notificationId: number) => {
    try {
      await api.patch(`/friends/${friendshipId}/accept`);
      setNotifications((prev) => prev.filter((n) => n.notification_id !== notificationId));
      if (onRelationsChanged) {
        onRelationsChanged();
      }
    } catch (err) {
      console.error("Failed to accept friend request:", err);
    }
  };

  const rejectFriendRequest = async (friendshipId: number, notificationId: number) => {
    try {
      await api.patch(`/friends/${friendshipId}/reject`);
      setNotifications((prev) => prev.filter((n) => n.notification_id !== notificationId));
      if (onRelationsChanged) {
        onRelationsChanged();
      }
    } catch (err) {
      console.error("Failed to reject friend request:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    acceptFriendRequest,
    rejectFriendRequest,
  };
};
