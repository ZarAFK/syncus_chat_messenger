  import React, { useState, useRef, useEffect } from "react";
  import { useLocation, useNavigate } from "react-router-dom";
  import { MessageSquare, Bell, LogOut, UserCog } from "lucide-react";
  import NotificationDropdown from "../drawer/notificationDrwaer";
  import { useAuth } from "@/features/auth/hooks/useAuth";
  import { resolveAvatarUrl } from "@/shared/utils/avatarUtils";

import { INotification } from "../../hooks/useNotifications";

export interface TopBarProps {
  setActiveTopBarTabs: (tab: "chat" | "groups" | "profile") => void;
  setActiveSidebarTabs?: (tab: any) => void;
  notifications?: INotification[];
  unreadCount?: number;
  markNotificationAsRead?: (id: number) => void;
  markAllNotificationsAsRead?: () => void;
  deleteNotification?: (id: number) => void;
  acceptFriendRequest?: (friendshipId: number, notificationId: number) => void;
  rejectFriendRequest?: (friendshipId: number, notificationId: number) => void;
}

const Topbar: React.FC<TopBarProps> = ({
  setActiveTopBarTabs,
  setActiveSidebarTabs,
  notifications = [],
  unreadCount = 0,
  markNotificationAsRead = () => {},
  markAllNotificationsAsRead = () => {},
  deleteNotification = () => {},
  acceptFriendRequest = () => {},
  rejectFriendRequest = () => {},
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showNotif, setShowNotif] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const { user, loading, logout } = useAuth();

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
          setShowNotif(false);
        }
        if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
          setShowUserMenu(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const goToGroups = () => {
      setActiveTopBarTabs("groups");
      if (setActiveSidebarTabs) {
        setActiveSidebarTabs("groups");
      }
      if (location.pathname !== "/chat") {
        navigate("/chat", { state: { activeSidebarTab: "groups" } });
      }
    };

    const handleLogout = async () => {
      try {
        await logout();
        navigate("/signin");
      } catch (err) {
        console.error("Logout failed:", err);
      }
    };

    return (
      <div
        className="flex items-center justify-between 
        bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 
        text-white px-8 py-4 shadow-md relative z-45"
      >
        <div className="flex items-center space-x-2 ml-20">
          <h2 className="text-3xl font-extrabold tracking-wide drop-shadow-md">
            SyncUs
          </h2>
        </div>

        <div className="flex items-center space-x-10">
          <div
            className="flex items-center gap-2 cursor-pointer 
            hover:text-blue-200 transition duration-300 hover:scale-105"
            onClick={goToGroups}
          >
            <MessageSquare size={22} className="drop-shadow-md" />
            <span className="text-base font-medium">Group Chats</span>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <div
              className="flex items-center gap-2 cursor-pointer 
              hover:text-blue-200 transition duration-300 hover:scale-105"
              onClick={() => setShowNotif(!showNotif)}
            >
              <div className="relative">
                <Bell size={22} className="drop-shadow-md" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 bg-red-500 text-white 
                    text-xs w-4 h-4 flex items-center justify-center rounded-full font-bold border border-blue-500"
                  >
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="text-base font-medium">Notification</span>
            </div>

            {showNotif && (
              <NotificationDropdown
                notifications={notifications}
                onClose={() => setShowNotif(false)}
                onMarkRead={markNotificationAsRead}
                onMarkAllRead={markAllNotificationsAsRead}
                onDelete={deleteNotification}
                onAcceptFriend={acceptFriendRequest}
                onRejectFriend={rejectFriendRequest}
              />
            )}
          </div>

          {/* Profile + Logout Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <div
              className="flex items-center gap-2 cursor-pointer 
              hover:text-blue-200 transition duration-300 hover:scale-105"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {/* User Avatar */}
              {(() => {
                const avatarUrl = resolveAvatarUrl(user?.profile?.avatar_url, user?.username);
                return (
                  <img
                    src={avatarUrl}
                    alt={user?.username || "User"}
                    className="w-8 h-8 rounded-full object-cover border-2 border-white/30 shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(user?.username || 'user')}`;
                    }}
                  />
                );
              })()}
              <span className="text-base font-medium">
                {user?.username ? `Hi, ${user.username}` : "Account"}
              </span>
            </div>

            {showUserMenu && (
              <div
                className="absolute right-0 mt-3 w-40 bg-white text-gray-700 
                rounded-lg shadow-lg py-2 transition-all duration-150 animate-fadeIn"
              >
                <button
                  onClick={() => {
                    navigate("/profile");
                    setShowUserMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 transition"
                >
                  <UserCog size={16} className="mr-2" /> Profile
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 transition text-red-600"
                >
                  <LogOut size={16} className="mr-2" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  export default Topbar;
