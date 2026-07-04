import React, { useState, useEffect, useMemo } from "react";
import { Activity, Edit2, Check, X, Search, MessageSquare, User, Smile } from "lucide-react";
import { useProfile } from "@/features/userprofile/hooks/useProfileHooks";
import { usePresence } from "../../hooks/useHookPresence";
import useChat from "../../hooks/useHooksChat";
import { IChatProfile } from "../../services/chatServices";
import { formatDistanceToNow } from "date-fns";
import { id as localeID } from "date-fns/locale";
import api from "@/features/auth/services/auth.api";
import { resolveAvatarUrl } from "@/shared/utils/avatarUtils";

interface UserStatusSidebarViewProps {
  setActiveChatUser: (user: IChatProfile | null) => void;
  setActiveGroupRoom: (room: any | null) => void;
  setActiveTabs: (tab: "chat" | "groups" | "ai" | "saved" | "notifications" | "status") => void;
  setStatusFilter?: (filter: "public" | "friends" | "mine") => void;
}

export const UserStatusSidebarView: React.FC<UserStatusSidebarViewProps> = ({
  setActiveChatUser,
  setActiveGroupRoom,
  setActiveTabs,
  setStatusFilter,
}) => {
  const { profile, loading: profileLoading } = useProfile();
  const { users, loading: usersLoading } = useChat();
  const token = localStorage.getItem("access_token") || "";
  const { onlineUsers } = usePresence(token);

  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [statusInput, setStatusInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [friendStatuses, setFriendStatuses] = useState<any[]>([]);

  const fetchFriendStatuses = async () => {
    try {
      const res = await api.get("/users/status/friends");
      setFriendStatuses(res.data || []);
    } catch (e) {
      console.error("Gagal mengambil status teman di sidebar:", e);
    }
  };

  useEffect(() => {
    fetchFriendStatuses();
  }, []);

  // Create a map of active status groups by user_id
  const statusMap = useMemo(() => {
    const map = new Map<number, any>();
    friendStatuses.forEach((g) => {
      map.set(g.user_id, g);
    });
    return map;
  }, [friendStatuses]);

  // Create a set of online user IDs
  const onlineSet = useMemo(() => {
    return new Set(onlineUsers?.map((ou) => ou.user_id));
  }, [onlineUsers]);

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];

    const currentUserId = profile?.user_id || Number(localStorage.getItem("user_id"));

    return users
      .filter((u) => u.user_id !== currentUserId)
      .map((u) => {
        const sGroup = statusMap.get(u.user_id);
        return {
          ...u,
          is_online: onlineSet.has(u.user_id),
          hasStatus: !!sGroup,
          has_unread: sGroup?.has_unread || false,
        };
      })
      .filter((u) =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        // Online users first
        if (a.is_online && !b.is_online) return -1;
        if (!a.is_online && b.is_online) return 1;
        // Then active status posters first
        if (a.hasStatus && !b.hasStatus) return -1;
        if (!a.hasStatus && b.hasStatus) return 1;
        // Then alphabetical
        return a.username.localeCompare(b.username);
      });
  }, [users, onlineSet, profile, searchQuery, statusMap]);

  // Initialize status input when profile is loaded
  useEffect(() => {
    if (profile?.profile?.bio) {
      // Check if bio is JSON
      try {
        const parsed = JSON.parse(profile.profile.bio);
        setStatusInput(parsed.text || "");
      } catch (e) {
        setStatusInput(profile.profile.bio);
      }
    } else {
      setStatusInput("");
    }
  }, [profile]);

  const handleSaveStatus = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      await api.post("/users/status", {
        text: statusInput,
      });
      setIsEditing(false);
      fetchFriendStatuses();
    } catch (err) {
      console.error("Gagal memperbarui status:", err);
      alert("Gagal memperbarui status");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUserClick = async (u: any) => {
    const sGroup = statusMap.get(u.user_id);
    if (sGroup && sGroup.statuses?.length > 0) {
      // Mark all unread status posts for this user as read
      for (const st of sGroup.statuses) {
        if (!st.is_read) {
          try {
            await api.post(`/users/status/${st.status_id}/view`);
          } catch (e) {
            // Ignore
          }
        }
      }
    }
    setActiveGroupRoom(null);
    setActiveChatUser(u);
    setActiveTabs("chat");
  };

  const formatLastSeen = (dateStr?: string) => {
    if (!dateStr) return "Tidak diketahui";
    const parsedDate = new Date(dateStr);
    if (parsedDate instanceof Date && !isNaN(parsedDate.getTime())) {
      return formatDistanceToNow(parsedDate, {
        addSuffix: true,
        locale: localeID,
      });
    }
    return "Tidak diketahui";
  };

  const displayMyBio = useMemo(() => {
    if (!profile?.profile?.bio) return "Set a status message...";
    try {
      const parsed = JSON.parse(profile.profile.bio);
      const prefix = parsed.emoji ? `${parsed.emoji} ` : "";
      const suffix = parsed.image ? " 🖼️" : "";
      return parsed.text || parsed.image ? `"${prefix}${parsed.text}${suffix}"` : "Set a status message...";
    } catch (e) {
      return `"${profile.profile.bio}"`;
    }
  }, [profile]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0d0f14]">
      {/* Title Header */}
      <div className="p-4 border-b border-gray-800/80 flex items-center justify-between bg-gradient-to-r from-blue-900/10 via-transparent to-transparent flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
            <Activity className="text-blue-400" size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-100">User Status</h2>
            <p className="text-[10px] text-gray-400">Aktivitas & status realtime</p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        {/* My Status Card */}
        <div 
          onClick={() => {
            setStatusFilter?.("mine");
            setActiveTabs("status");
          }}
          className="bg-[#121620]/45 border border-gray-800/80 rounded-xl p-4 mx-3 my-3 shadow-md flex-shrink-0 cursor-pointer hover:bg-gray-800/60 active:scale-[0.99] transition-all duration-200"
          title="Klik untuk melihat status aktif Anda"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase">My Status</h3>
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
              Online
            </span>
          </div>

          {profileLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-850 rounded w-1/3"></div>
              <div className="h-3 bg-gray-850 rounded w-2/3"></div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0 mt-0.5">
                <img
                  src={
                    resolveAvatarUrl(profile?.profile?.avatar_url, profile?.username || "me")
                  }
                  alt="My Avatar"
                  className="w-10 h-10 rounded-full object-cover border border-gray-800 shadow-inner"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-200">{profile?.username || "User"}</p>
                
                {isEditing ? (
                  <div className="mt-2 space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={statusInput}
                        onChange={(e) => setStatusInput(e.target.value)}
                        placeholder="Apa yang sedang kamu lakukan?"
                        className="w-full bg-[#161a24] text-xs text-white placeholder-gray-500 border border-blue-500/50 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        disabled={isSaving}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveStatus();
                          if (e.key === "Escape") setIsEditing(false);
                        }}
                      />
                      <Smile size={14} className="absolute right-2.5 top-2 text-gray-500" />
                    </div>
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="p-1 rounded bg-gray-850 hover:bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-300 transition-colors"
                        title="Cancel"
                        disabled={isSaving}
                      >
                        <X size={12} />
                      </button>
                      <button
                        onClick={handleSaveStatus}
                        className="p-1 rounded bg-blue-600 hover:bg-blue-500 border border-blue-500 text-white transition-colors flex items-center justify-center"
                        title="Save Status"
                        disabled={isSaving}
                      >
                        <Check size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="group/bio flex items-start justify-between gap-1.5 mt-1">
                    <p className="text-[11px] text-gray-300 break-words leading-relaxed italic pr-1">
                      {displayMyBio}
                    </p>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1 rounded hover:bg-gray-800 text-gray-500 hover:text-blue-400 opacity-0 group-hover/bio:opacity-100 transition-all duration-200 flex-shrink-0"
                      title="Ubah Status"
                    >
                      <Edit2 size={10} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Activities Section */}
        <div className="flex-1 flex flex-col min-h-0 mt-1">
          <div className="px-4 py-2 flex-shrink-0">
            <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-2">User Activities</h4>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#161a24] text-xs text-white placeholder-gray-500 border border-gray-850 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <Search size={12} className="absolute left-2.5 top-2.5 text-gray-500" />
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent p-2 space-y-1">
            {usersLoading ? (
              <div className="flex items-center justify-center py-10 text-gray-500 text-xs italic">
                Loading users status...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-800/20 border border-gray-850 flex items-center justify-center mb-3 text-gray-600">
                  <User size={20} />
                </div>
                <h5 className="text-[11px] font-semibold text-gray-400">Tidak ada pengguna</h5>
                <p className="text-[9px] text-gray-500 max-w-[160px] mt-1 leading-relaxed">
                  Tidak ditemukan pengguna dengan nama "{searchQuery}".
                </p>
              </div>
            ) : (
              filteredUsers.map((usr) => {
                const avatar = resolveAvatarUrl(usr.profile?.avatar_url, usr.username);

                // Check status map details
                const sGroup = statusMap.get(usr.user_id);
                const hasUnread = sGroup?.has_unread || false;
                const hasViewed = !!sGroup && !hasUnread;

                // Status rings styling
                const ringClass = hasUnread
                  ? "ring-2 ring-offset-2 ring-offset-[#0d0f14] ring-blue-500 ring-dashed animate-pulse"
                  : hasViewed
                  ? "ring-2 ring-offset-2 ring-offset-[#0d0f14] ring-gray-700"
                  : "";

                // Get status preview
                let statusPreview = "";
                if (sGroup && sGroup.statuses?.length > 0) {
                  const st = sGroup.statuses[0];
                  const prefix = st.emoji ? `${st.emoji} ` : "";
                  const hasImages = st.image_paths && st.image_paths.length > 0;
                  const suffix = hasImages ? ` 🖼️ [${st.image_paths.length} Foto]` : "";
                  if (!st.text && hasImages) {
                    statusPreview = `${prefix}[${st.image_paths.length} Foto]`.trim();
                  } else {
                    statusPreview = `"${prefix}${st.text || ""}${suffix}"`.trim();
                  }
                } else if (usr.profile?.bio) {
                  // Fallback to parsed bio
                  try {
                    const parsed = JSON.parse(usr.profile.bio);
                    const prefix = parsed.emoji ? `${parsed.emoji} ` : "";
                    const suffix = parsed.image ? " 🖼️" : "";
                    statusPreview = `"${prefix}${parsed.text || "Foto status"}${suffix}"`;
                  } catch (e) {
                    statusPreview = `"${usr.profile.bio}"`;
                  }
                }

                return (
                  <div
                    key={usr.user_id}
                    onClick={() => handleUserClick(usr)}
                    className="group relative flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-gray-800/60 hover:bg-gray-800/20 hover:scale-[1.01] transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {/* Avatar with status rings */}
                      <div className="relative flex-shrink-0">
                        <div className={`rounded-full p-[2px] transition-all duration-300 ${ringClass}`}>
                          <img
                            src={avatar}
                            alt={usr.username}
                            className="w-9 h-9 rounded-full object-cover border border-gray-800/40 shadow-sm"
                          />
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0d0f14] ${
                            usr.is_online ? "bg-green-500" : "bg-gray-600"
                          }`}
                        ></span>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 mt-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-gray-250 truncate">
                            {usr.username}
                          </span>
                          {usr.role === "admin" && (
                            <span className="text-[8px] font-extrabold text-blue-400 bg-blue-950/40 px-1 rounded border border-blue-900/30">
                              ADMIN
                            </span>
                          )}
                        </div>

                        {/* Status Message Preview */}
                        {statusPreview && (
                          <p className="text-[10px] text-blue-300/80 italic font-medium truncate mt-0.5 max-w-[160px] group-hover:text-blue-300">
                            {statusPreview}
                          </p>
                        )}

                        {/* Last Seen / Status Text */}
                        <p className="text-[9px] text-gray-500 mt-0.5">
                          {usr.is_online ? (
                            <span className="text-green-500/90 font-medium">Online sekarang</span>
                          ) : (
                            <span>Aktif {formatLastSeen(usr.last_seen)}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Quick DM Button */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUserClick(usr);
                        }}
                        className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-600 border border-blue-500/20 hover:border-blue-500 text-blue-400 hover:text-white transition-all duration-200"
                        title="Kirim pesan langsung"
                      >
                        <MessageSquare size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
