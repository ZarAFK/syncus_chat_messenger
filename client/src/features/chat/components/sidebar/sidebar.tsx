import React, { useEffect, useState, useMemo } from "react";
import { users } from "../../data/userdummy";
import SidebarItem from "./sidebarItem";
import SidebarTabs from "./sidebarTabs";
import TopTabs from "../bar/topTabs";
import ResizeHandle from "../../function/resizeHandlerSidebar";
import { GroupSidebarItem } from "../groupsidebar/groupsidebaritem";
import { useLocation } from "react-router-dom";
import { NotificationsSidebarView } from "./NotificationsSidebarView";
import { INotification } from "../../hooks/useNotifications";
import useChat from "../../hooks/useHooksChat";
import { usePresence } from "../../hooks/useHookPresence";

import { topTabsType } from "../bar/topTabs";
import { IChatProfile } from "../../services/chatServices";
import { SavedChatsView } from "./SavedChatsView";
import { UserStatusSidebarView } from "./UserStatusSidebarView";
import { RandomSidebarView } from "./RandomSidebarView";
import { ChannelsSidebarView } from "./ChannelsSidebarView";

export interface sidebarItemTabsProps {
  activeTabs: topTabsType;
  setActiveTabs: (tab: topTabsType) => void;
  activeChatUser: IChatProfile | null;
  setActiveChatUser: (user: IChatProfile | null) => void;
  groups: any[];
  activeGroupRoom: any | null;
  setActiveGroupRoom: (room: any | null) => void;
  relations: any;
  notifications: INotification[];
  markNotificationAsRead: (id: number) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: number) => void;
  acceptFriendRequest: (friendshipId: number, notificationId: number) => void;
  rejectFriendRequest: (friendshipId: number, notificationId: number) => void;
  onSelectRandomPartner?: (partnerId: number) => void;
  activeRandomPartnerId?: number | null;
  onStartRandomMatch?: () => void;
  statusFilter?: "public" | "friends" | "mine";
  setStatusFilter?: (filter: "public" | "friends" | "mine") => void;
  currentUserId?: number;
  socket?: any;
  setGroups?: (groups: any[]) => void;
}

const Sidebar: React.FC<sidebarItemTabsProps> = ({
  activeTabs,
  setActiveTabs,
  activeChatUser,
  setActiveChatUser,
  groups,
  activeGroupRoom,
  setActiveGroupRoom,
  relations,
  notifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  acceptFriendRequest,
  rejectFriendRequest,
  onSelectRandomPartner,
  activeRandomPartnerId,
  onStartRandomMatch,
  statusFilter,
  setStatusFilter,
  currentUserId,
  socket,
  setGroups,
}) => {
  const [width, setWidth] = useState(320);
  const compact = width < 260;
  const location = useLocation();

  const { users } = useChat();
  const token = localStorage.getItem("access_token") || "";
  const { onlineUsers } = usePresence(token);

  const favoriteUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];
    const onlineSet = new Set(onlineUsers?.map((ou) => ou.user_id));
    
    return users
      .filter((u) => u.user_id !== currentUserId && !relations.isBlocked(u.user_id) && relations.isFavorite(u.user_id))
      .map((u) => ({
        user_id: u.user_id,
        username: u.username,
        age: u.age,
        country: u.country || "ID",
        gender: typeof u.gender === "string" ? u.gender : "other",
        is_online: onlineSet.has(u.user_id),
        last_seen: u.last_seen || new Date().toISOString(),
        role: u.role || "",
        profile: {
          avatar_url: u.profile?.avatar_url || "",
          bio: u.profile?.bio || "",
        },
        auth: {
          email: u.auth?.email || "unknown@email.com",
        },
      }));
  }, [users, onlineUsers, currentUserId, relations]);

  useEffect(() => {
    if (location.state && (location.state as any).activeSidebarTab) {
      setActiveTabs((location.state as any).activeSidebarTab);
    }
  }, [location.state, setActiveTabs]);

  return (
    <aside
      className="h-full flex flex-col min-h-0 border-r border-gray-800 bg-[#0d0f14] relative"
      style={{ width: `${width}px` }}
    >
      <TopTabs activeTabs={activeTabs} setActiveTabs={setActiveTabs} />
      {activeTabs === "chat" && (
        <SidebarTabs
          compact={compact}
          activeChatUser={activeChatUser}
          setActiveChatUser={setActiveChatUser}
          relations={relations}
          notifications={notifications}
          markNotificationAsRead={markNotificationAsRead}
        />
      )}

      {activeTabs === "groups" && (
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-855 scrollbar-track-transparent bg-[#0d0f14]">
          {groups.filter(g => !g.room_description?.startsWith("[CHANNEL]") && g.roomMembers?.some((m: any) => m.user?.user_id === currentUserId)).length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-555 italic">
              Belum ada grup obrolan publik yang aktif
            </div>
          ) : (
            groups
              .filter(g => !g.room_description?.startsWith("[CHANNEL]") && g.roomMembers?.some((m: any) => m.user?.user_id === currentUserId))
              .map((grp) => {
                const onlineCount = grp.roomMembers?.filter((m: any) => m.user?.is_online).length || 0;
                return (
                  <GroupSidebarItem
                    key={grp.room_id}
                    nameGroup={grp.room_name}
                    description={grp.room_description || "Tidak ada deskripsi"}
                    online={onlineCount}
                    isActive={activeGroupRoom?.room_id === grp.room_id}
                    onClick={() => {
                      setActiveChatUser(null);
                      setActiveGroupRoom(grp);
                    }}
                  />
                );
              })
          )}
        </div>
      )}
      {activeTabs === "ai" && (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm bg-[#0d0f14]">
          AI Assistant coming soon 🤖
        </div>
      )}
      {activeTabs === "saved" && (
        <SavedChatsView
          relations={relations}
          groups={groups}
          setActiveChatUser={setActiveChatUser}
          setActiveGroupRoom={setActiveGroupRoom}
          setActiveTabs={setActiveTabs}
        />
      )}
      {activeTabs === "notifications" && (
        <NotificationsSidebarView
          notifications={notifications}
          onMarkRead={markNotificationAsRead}
          onMarkAllRead={markAllNotificationsAsRead}
          onDelete={deleteNotification}
          onAcceptFriend={acceptFriendRequest}
          onRejectFriend={rejectFriendRequest}
          setActiveChatUser={setActiveChatUser}
          setActiveGroupRoom={setActiveGroupRoom}
          setActiveTabs={setActiveTabs}
        />
      )}
      {activeTabs === "status" && (
        <UserStatusSidebarView
          setActiveChatUser={setActiveChatUser}
          setActiveGroupRoom={setActiveGroupRoom}
          setActiveTabs={setActiveTabs}
          setStatusFilter={setStatusFilter}
        />
      )}
      {activeTabs === "random" && (
        <RandomSidebarView
          onSelectPartner={onSelectRandomPartner || (() => {})}
          activePartnerId={activeRandomPartnerId || null}
          onStartMatch={onStartRandomMatch || (() => {})}
        />
      )}
      {activeTabs === "channels" && currentUserId && socket && (
        <ChannelsSidebarView
          groups={groups}
          activeGroupRoom={activeGroupRoom}
          setActiveGroupRoom={setActiveGroupRoom}
          setActiveChatUser={setActiveChatUser}
          currentUserId={currentUserId}
          socket={socket}
          setGroups={setGroups}
        />
      )}
      {activeTabs === "favorite" && (
        <div className="flex-1 min-h-0 flex flex-col bg-[#0d0f14]">
          <div className="p-3.5 bg-[#0b0f19] border-b border-gray-800/40 text-xs text-gray-400 font-bold uppercase tracking-wider select-none flex items-center gap-1.5">
            ⭐ Favorite Users ({favoriteUsers.length})
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-855 scrollbar-track-transparent">
            {favoriteUsers.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-505 italic">
                Daftar favorit masih kosong
              </div>
            ) : (
              favoriteUsers.map((usr) => (
                <SidebarItem
                  key={usr.user_id}
                  user={usr}
                  compact={compact}
                  isActive={activeChatUser?.user_id === usr.user_id}
                  onClick={() => {
                    setActiveGroupRoom(null);
                    setActiveChatUser(usr as any);
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}

      <ResizeHandle onResize={setWidth} />
    </aside>
  );
};

export default Sidebar;
