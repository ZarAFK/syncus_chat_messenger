import React, { useState } from "react";
import { Bookmark, ChevronDown, ChevronRight, Trash2, MessageSquare, User, Hash, Calendar, Sparkles } from "lucide-react";
import { SavedMessage } from "../../hooks/useUserRelations";
import useChat from "../../hooks/useHooksChat";
import { IChatProfile } from "../../services/chatServices";

interface SavedChatsViewProps {
  relations: any;
  groups: any[];
  setActiveChatUser: (user: IChatProfile | null) => void;
  setActiveGroupRoom: (room: any | null) => void;
  setActiveTabs: (tab: any) => void;
}

export const SavedChatsView: React.FC<SavedChatsViewProps> = ({
  relations,
  groups,
  setActiveChatUser,
  setActiveGroupRoom,
  setActiveTabs,
}) => {
  const { savedMessages, unsaveMessage, savedStatuses = [], unsaveStatus = () => {} } = relations;
  const { users } = useChat();

  const [activeSection, setActiveSection] = useState<"messages" | "statuses">("messages");

  // State to track which groups are collapsed. If not in collapsed record, default to expanded.
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Group messages by key: is_group + chat_id
  const groupsMap = savedMessages.reduce((acc: Record<string, { key: string; chat_id: string | number; chat_name: string; is_group: boolean; messages: SavedMessage[] }>, msg: SavedMessage) => {
    const key = `${msg.is_group ? "group" : "dm"}_${msg.chat_id}`;
    if (!acc[key]) {
      acc[key] = {
        key,
        chat_id: msg.chat_id,
        chat_name: msg.chat_name,
        is_group: msg.is_group,
        messages: [],
      };
    }
    acc[key].messages.push(msg);
    return acc;
  }, {});

  const groupedChats: { key: string; chat_id: string | number; chat_name: string; is_group: boolean; messages: SavedMessage[] }[] = Object.values(groupsMap);

  const handleNavigateToChat = (chatItem: { chat_id: string | number; is_group: boolean; chat_name: string }) => {
    if (chatItem.is_group) {
      const targetRoom = groups.find((g) => g.room_id === Number(chatItem.chat_id));
      if (targetRoom) {
        setActiveChatUser(null);
        setActiveGroupRoom(targetRoom);
        setActiveTabs("groups");
      } else {
        const fallbackRoom = {
          room_id: Number(chatItem.chat_id),
          room_name: chatItem.chat_name,
          room_description: "Group Chat",
          roomMembers: [],
        };
        setActiveChatUser(null);
        setActiveGroupRoom(fallbackRoom);
        setActiveTabs("groups");
      }
    } else {
      const targetUser = users.find((u) => u.user_id === Number(chatItem.chat_id));
      if (targetUser) {
        setActiveGroupRoom(null);
        setActiveChatUser(targetUser);
        setActiveTabs("chat");
      } else {
        const fallbackUser: IChatProfile = {
          user_id: Number(chatItem.chat_id),
          username: chatItem.chat_name,
          is_online: false,
          last_seen: new Date().toISOString(),
          role: "user",
          country: "Unknown",
          gender: "Other",
          profile: {
            avatar_url: "",
            bio: "Saved Chat Contact",
          },
          auth: {
            email: "",
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setActiveGroupRoom(null);
        setActiveChatUser(fallbackUser);
        setActiveTabs("chat");
      }
    }
  };

  const formatDate = (dateStr: string | Date) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0d0f14]">
      {/* Title Header */}
      <div className="p-4 border-b border-gray-800/80 flex items-center justify-between bg-gradient-to-r from-blue-900/10 via-transparent to-transparent flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
            <Bookmark className="text-blue-400" size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-100">Saved Chats</h2>
            <p className="text-[10px] text-gray-400">Pesan & status yang Anda simpan</p>
          </div>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex border-b border-gray-800/80 px-2.5 py-2.5 text-[10px] font-bold gap-1.5 bg-gray-950/20 flex-shrink-0">
        <button
          onClick={() => setActiveSection("messages")}
          className={`flex-1 py-1.5 text-center rounded-lg transition duration-200 cursor-pointer ${
            activeSection === "messages"
              ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
              : "text-gray-400 hover:text-gray-200 hover:bg-gray-850/30"
          }`}
        >
          Pesan ({savedMessages.length})
        </button>
        <button
          onClick={() => setActiveSection("statuses")}
          className={`flex-1 py-1.5 text-center rounded-lg transition duration-200 cursor-pointer ${
            activeSection === "statuses"
              ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
              : "text-gray-400 hover:text-gray-200 hover:bg-gray-850/30"
          }`}
        >
          Status ({savedStatuses.length})
        </button>
      </div>

      {/* Message List */}
      {activeSection === "messages" && (
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent p-2 space-y-3">
          {groupedChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-500/5 border border-blue-500/10 flex items-center justify-center mb-4 text-blue-500/40 animate-pulse">
                <Bookmark size={32} />
              </div>
              <h3 className="text-xs font-semibold text-gray-300 mb-1">Belum Ada Pesan Disimpan</h3>
              <p className="text-[10px] text-gray-500 max-w-[200px] leading-relaxed">
                Arahkan kursor ke pesan di dalam room chat, lalu klik ikon bookmark untuk menyimpannya di sini.
              </p>
            </div>
          ) : (
            groupedChats.map((group) => {
              const isCollapsed = collapsedGroups[group.key] || false;
              const Icon = group.is_group ? Hash : User;
              const groupColor = group.is_group ? "text-cyan-400" : "text-purple-400";
              const bgGrad = group.is_group 
                ? "hover:from-cyan-950/20 hover:to-transparent border-cyan-500/20" 
                : "hover:from-purple-950/20 hover:to-transparent border-purple-500/20";

              return (
                <div
                  key={group.key}
                  className="bg-[#121620]/45 border border-gray-800/80 rounded-xl overflow-hidden shadow-md transition-all duration-300"
                >
                  {/* Accordion Header */}
                  <div
                    onClick={() => toggleGroup(group.key)}
                    className="flex items-center justify-between p-3 cursor-pointer bg-[#121620]/80 hover:bg-[#161b29] transition-colors border-b border-gray-800/55"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex-shrink-0">
                        {isCollapsed ? (
                          <ChevronRight size={14} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={14} className="text-gray-400" />
                        )}
                      </div>
                      <div className={`w-6 h-6 rounded-md bg-gray-900/60 border border-gray-800 flex items-center justify-center ${groupColor}`}>
                        <Icon size={12} />
                      </div>
                      <span className="text-[12px] font-bold text-gray-200 truncate pr-1">
                        {group.chat_name}
                      </span>
                    </div>
                    <span className="text-[9px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-medium">
                      {group.messages.length}
                    </span>
                  </div>

                  {/* Accordion Body */}
                  {!isCollapsed && (
                    <div className="divide-y divide-gray-850 bg-[#0d0f14]/30">
                      {group.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`group relative p-3 transition-all duration-300 border-l-2 border-transparent bg-gradient-to-r from-transparent to-transparent ${bgGrad} flex gap-2.5 items-start`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500/60 mt-1.5 flex-shrink-0" />
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => handleNavigateToChat(group)}
                          >
                            <div className="flex items-center gap-2 mb-1 justify-between">
                              <span className="text-[10px] font-bold text-blue-300 truncate">
                                {msg.sender_name}
                              </span>
                              <span className="text-[8px] text-gray-550 flex items-center gap-1 flex-shrink-0">
                                <Calendar size={8} />
                                {formatDate(msg.created_at)}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-300 break-words leading-relaxed line-clamp-3">
                              {msg.content}
                            </p>
                          </div>

                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                unsaveMessage(msg.id);
                              }}
                              className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 transition-all duration-200 cursor-pointer"
                              title="Hapus pesan disimpan"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Statuses List */}
      {activeSection === "statuses" && (
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent p-2 space-y-3">
          {savedStatuses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-500/5 border border-blue-500/10 flex items-center justify-center mb-4 text-blue-500/40 animate-pulse">
                <Bookmark size={32} />
              </div>
              <h3 className="text-xs font-semibold text-gray-300 mb-1">Belum Ada Status Disimpan</h3>
              <p className="text-[10px] text-gray-500 max-w-[200px] leading-relaxed">
                Buka tab Status, lalu klik ikon bookmark pada status teman untuk menyimpannya di sini.
              </p>
            </div>
          ) : (
            savedStatuses.map((st: any) => (
              <div
                key={st.status_id}
                className="bg-[#121620]/45 border border-gray-800/80 rounded-xl p-3.5 shadow-md transition-all duration-300 hover:bg-[#161c29]/50 flex flex-col gap-2.5 relative group"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={st.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${st.username}`}
                      alt={st.username}
                      className="w-7 h-7 rounded-full object-cover border border-gray-800"
                    />
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-gray-200 block truncate">
                        {st.username}
                      </span>
                      <span className="text-[8px] text-gray-500 block">
                        Diposting {formatDate(st.created_at)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => unsaveStatus(st.status_id)}
                    className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 transition-all duration-200 cursor-pointer"
                    title="Hapus status disimpan"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>

                {/* Content */}
                <div className="pl-1">
                  {st.text ? (
                    <p className="text-[11.5px] text-gray-300 break-words leading-relaxed font-normal">
                      {st.emoji && <span className="mr-1.5 text-xs">{st.emoji}</span>}
                      {st.text}
                    </p>
                  ) : null}

                  {/* Image Attachment Preview */}
                  {st.image_paths && st.image_paths.length > 0 && (
                    <div className="grid grid-cols-3 gap-1 mt-2.5 rounded-lg overflow-hidden border border-gray-850">
                      {st.image_paths.map((p: string, idx: number) => (
                        <div key={idx} className="h-12 overflow-hidden bg-black/35 relative">
                          <img
                            src={`http://localhost:3000${p}`}
                            alt="Attachment Saved"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[8px] text-gray-500 mt-1 border-t border-gray-800/40 pt-2">
                  <span className="flex items-center gap-1 font-medium text-[8px]">
                    <Sparkles size={8} className="text-blue-400" /> Saved Status
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Calendar size={8} /> Disimpan {formatDate(st.saved_at)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
