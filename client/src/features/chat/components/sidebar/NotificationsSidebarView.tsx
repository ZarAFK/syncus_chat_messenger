import React from "react";
import { Bell, CheckCheck, Trash2, MessageSquare, Star, UserPlus, Clock } from "lucide-react";
import { INotification } from "../../hooks/useNotifications";
import { IChatProfile } from "../../services/chatServices";
import useChat from "../../hooks/useHooksChat";
import { resolveAvatarUrl } from "@/shared/utils/avatarUtils";

interface NotificationsSidebarViewProps {
  notifications: INotification[];
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
  onDelete: (id: number) => void;
  onAcceptFriend: (friendshipId: number, notificationId: number) => void;
  onRejectFriend: (friendshipId: number, notificationId: number) => void;
  setActiveChatUser: (user: IChatProfile | null) => void;
  setActiveGroupRoom: (room: any | null) => void;
  setActiveTabs: (tab: any) => void;
}

export const NotificationsSidebarView: React.FC<NotificationsSidebarViewProps> = ({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onAcceptFriend,
  onRejectFriend,
  setActiveChatUser,
  setActiveGroupRoom,
  setActiveTabs,
}) => {
  const { users: allUsers } = useChat();
  const unreadNotifications = notifications.filter((n) => !n.is_read);

  const formatTime = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 600);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch {
      return "";
    }
  };

  const handleNotificationClick = async (notif: INotification) => {
    // Mark as read
    if (!notif.is_read) {
      await onMarkRead(notif.notification_id);
    }

    // Direct action based on type
    if (notif.type === "new_message" && notif.sender) {
      // Find matching user profile
      const targetUser = allUsers.find((u) => u.user_id === notif.sender?.user_id);
      if (targetUser) {
        setActiveGroupRoom(null);
        setActiveChatUser(targetUser);
        setActiveTabs("chat");
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "friend_request":
        return <UserPlus size={12} className="text-blue-400" />;
      case "friend_accept":
        return <UserPlus size={12} className="text-emerald-450" />;
      case "new_message":
        return <MessageSquare size={12} className="text-indigo-400" />;
      case "favorite_add":
        return <Star size={12} className="text-amber-400" fill="currentColor" />;
      default:
        return <Bell size={12} className="text-gray-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0d0f14]">
      {/* Header */}
      <div className="p-4 border-b border-gray-800/80 flex items-center justify-between bg-gradient-to-r from-blue-900/10 via-transparent to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
            <Bell className="text-blue-450" size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-100">Notifications</h2>
            <p className="text-[10px] text-gray-400">Pemberitahuan akun Anda</p>
          </div>
        </div>
        {unreadNotifications.length > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1 text-[10px] font-semibold text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 cursor-pointer"
            title="Mark all as read"
          >
            <CheckCheck size={10} />
            <span>Mark read</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent p-2 space-y-2">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-800/20 border border-gray-800/50 flex items-center justify-center mb-4 text-gray-550">
              <Bell size={28} />
            </div>
            <h3 className="text-xs font-semibold text-gray-300 mb-1">Tidak Ada Notifikasi</h3>
            <p className="text-[10px] text-gray-500 max-w-[200px] leading-relaxed">
              Anda tidak memiliki pemberitahuan baru saat ini.
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const avatar = resolveAvatarUrl(notif.sender?.profile?.avatar_url, notif.sender?.username || 'syncus');
            const isFriendRequest = notif.type === "friend_request" && notif.related_id;

            return (
              <div
                key={notif.notification_id}
                onClick={() => handleNotificationClick(notif)}
                className={`group relative p-3 rounded-xl border transition-all duration-300 cursor-pointer flex gap-3 items-start ${
                  notif.is_read
                    ? "bg-[#121620]/30 border-gray-800/60 hover:bg-[#121620]/50"
                    : "bg-[#161c2a]/60 border-blue-900/30 hover:bg-[#1b2336]/60 shadow-md shadow-blue-950/10"
                }`}
              >
                {/* Unread Indicator Dot */}
                {!notif.is_read && (
                  <div className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-blue-500" />
                )}

                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={avatar}
                    alt={notif.sender?.username || "System"}
                    className="w-9 h-9 rounded-full object-cover bg-gray-800 border border-gray-800"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center">
                    {getNotificationIcon(notif.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-xs text-gray-250 leading-relaxed font-medium break-words">
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-[9px] text-gray-500">
                    <Clock size={8} />
                    <span>{formatTime(notif.created_at)}</span>
                  </div>

                  {/* Friend Request Action Buttons */}
                  {isFriendRequest && (
                    <div className="flex gap-2 mt-2.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onAcceptFriend(notif.related_id!, notif.notification_id)}
                        className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] transition shadow shadow-emerald-950/20 cursor-pointer"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => onRejectFriend(notif.related_id!, notif.notification_id)}
                        className="px-3 py-1 rounded bg-red-650 hover:bg-red-700 text-white font-semibold text-[10px] transition shadow shadow-red-950/20 cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>

                {/* Delete button (displays on hover) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notif.notification_id);
                  }}
                  className="absolute right-2 bottom-2 p-1 rounded hover:bg-red-500/10 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                  title="Delete notification"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
