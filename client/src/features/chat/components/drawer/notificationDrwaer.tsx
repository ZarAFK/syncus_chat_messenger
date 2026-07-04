import React from "react";
import { Check, Trash2, X, Clock, UserPlus, Star, MessageSquare } from "lucide-react";
import { INotification } from "../../hooks/useNotifications";
import { resolveAvatarUrl } from "@/shared/utils/avatarUtils";

interface NotificationDropdownProps {
  notifications: INotification[];
  onClose: () => void;
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
  onDelete: (id: number) => void;
  onAcceptFriend: (friendshipId: number, notificationId: number) => void;
  onRejectFriend: (friendshipId: number, notificationId: number) => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onAcceptFriend,
  onRejectFriend,
}) => {
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

  const getIcon = (type: string) => {
    switch (type) {
      case "friend_request":
        return <UserPlus size={14} className="text-blue-400" />;
      case "friend_accept":
        return <UserPlus size={14} className="text-emerald-400" />;
      case "new_message":
        return <MessageSquare size={14} className="text-indigo-400" />;
      case "favorite_add":
        return <Star size={14} className="text-amber-400" fill="currentColor" />;
      default:
        return <Check size={14} className="text-gray-400" />;
    }
  };

  return (
    <div
      className="absolute right-0 mt-3 w-80 bg-[#121620] border border-gray-800 rounded-xl shadow-2xl z-[60] 
      text-gray-100 overflow-hidden animate-fadeIn"
    >
      {/* Dropdown Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-blue-900/10 to-transparent">
        <span className="font-semibold text-sm">Notifications</span>
        <div className="flex items-center gap-3">
          {unreadNotifications.length > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer transition"
            >
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer transition">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-72 overflow-y-auto divide-y divide-gray-800/60 scrollbar-thin scrollbar-thumb-gray-800">
        {notifications.length > 0 ? (
          notifications.map((notif) => {
            const avatar = resolveAvatarUrl(notif.sender?.profile?.avatar_url, notif.sender?.username || 'syncus');
            const isFriendReq = notif.type === "friend_request" && notif.related_id;

            return (
              <div
                key={notif.notification_id}
                onClick={() => !notif.is_read && onMarkRead(notif.notification_id)}
                className={`p-3 flex gap-3 hover:bg-gray-800/40 transition-colors duration-250 cursor-pointer relative group ${
                  notif.is_read ? "opacity-75" : "bg-[#182030]/30"
                }`}
              >
                {/* Unread indicator */}
                {!notif.is_read && (
                  <span className="absolute top-4 right-3 w-2 h-2 rounded-full bg-blue-500" />
                )}

                {/* Sender Avatar / Icon */}
                <div className="relative flex-shrink-0">
                  <img
                    src={avatar}
                    alt={notif.sender?.username || "System"}
                    className="w-8 h-8 rounded-full object-cover bg-gray-800 border border-gray-800"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center">
                    {getIcon(notif.type)}
                  </div>
                </div>

                {/* Message & Time */}
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-xs font-medium text-gray-200 leading-normal break-words">
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-[9px] text-gray-500">
                    <Clock size={8} />
                    <span>{formatTime(notif.created_at)}</span>
                  </div>

                  {/* Accept / Decline buttons inline for requests */}
                  {isFriendReq && (
                    <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onAcceptFriend(notif.related_id!, notif.notification_id)}
                        className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[9px] transition cursor-pointer"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => onRejectFriend(notif.related_id!, notif.notification_id)}
                        className="px-2 py-0.5 rounded bg-red-650 hover:bg-red-700 text-white font-semibold text-[9px] transition cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>

                {/* Hover Delete Action */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notif.notification_id);
                  }}
                  className="absolute right-2 bottom-2 p-1 rounded hover:bg-red-500/10 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })
        ) : (
          <div className="px-4 py-8 text-center text-xs text-gray-500 italic">
            No notifications yet
          </div>
        )}
      </div>

      {/* Dropdown Footer */}
      <div className="px-4 py-2.5 bg-gray-900/50 text-center border-t border-gray-800">
        <button
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors duration-200 cursor-pointer"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
