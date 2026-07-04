import { FC, useState, useRef, useEffect } from "react";
import { UserRoundPlus, UserCheck, Search, X, EllipsisVertical, Clock, LogOut } from "lucide-react";
import { GroupInfoModal } from "../groupchat/GroupInfoModal";
import { resolveAvatarUrl } from "@/shared/utils/avatarUtils";
import { UserProfileModal } from "./UserProfileModal";
import useChat from "../../../hooks/useHooksChat";

interface ChatHeaderProps {
  name: string;
  details: string;
  user?: any;
  isGroup?: boolean;
  room?: any;
  socket?: any;
  currentUserId?: number;
  onLeaveRoom?: () => void;
  relations?: any;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

const ChatHeader: FC<ChatHeaderProps> = ({
  name,
  details,
  user,
  isGroup = false,
  room,
  socket,
  currentUserId,
  onLeaveRoom,
  relations,
  searchQuery = "",
  onSearchChange,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { users } = useChat();
  const freshUser = isGroup ? null : users.find((u) => u.user_id === user?.user_id);
  const resolvedUser = freshUser || user;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const avatar = isGroup
    ? resolveAvatarUrl(room?.room_picture, name)
    : resolveAvatarUrl(resolvedUser?.profile?.avatar_url || resolvedUser?.profile?.profile_picture, name);
  const isOnline = resolvedUser?.is_online ?? false;

  const displayDetails = isGroup
    ? (details && details.length > 60 ? `${details.slice(0, 60)}...` : details || "Public Group Chat")
    : details;

  return (
    <>
      <div className="p-4 border-b border-gray-800 bg-[#0d0f14]/90 backdrop-blur-md flex items-center space-x-3 justify-between relative z-10 min-w-0">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div
            className="relative cursor-pointer hover:opacity-80 active:scale-95 transition-all flex-shrink-0"
            onClick={() => {
              if (isGroup) {
                setShowGroupInfo(true);
              } else {
                setShowProfile(true);
              }
            }}
            title={isGroup ? "View Group Info" : "View Profile Info"}
          >
            <img
              src={avatar}
              alt={name}
              className="w-10 h-10 rounded-full object-cover bg-gray-800 border border-gray-800 shadow-md"
            />
            {!isGroup && (
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0d0f14] ${
                  isOnline ? "bg-green-500" : "bg-gray-500"
                }`}
              ></span>
            )}
          </div>
          <div 
            onClick={() => {
              if (isGroup) {
                setShowGroupInfo(true);
              } else {
                setShowProfile(true);
              }
            }}
            className="cursor-pointer hover:underline min-w-0 flex-1"
          >
            <h3 className="font-semibold text-white tracking-wide text-base truncate">{name}</h3>
            <p className="text-xs text-gray-400 font-medium truncate">{displayDetails}</p>
          </div>
        </div>

        <div className="flex items-center space-x-5 flex-shrink-0" ref={menuRef}>
          {isGroup && onLeaveRoom && (
            <LogOut
              size={18}
              className="text-red-400 hover:text-red-300 cursor-pointer transition-colors hover:scale-110"
              onClick={() => {
                if (confirm("Apakah Anda yakin ingin keluar dari grup ini?")) {
                  onLeaveRoom();
                }
              }}
            />
          )}
          {!isGroup && resolvedUser && relations && (
            (() => {
              const rel = relations.getRelation(Number(resolvedUser.user_id));
              const relationExists = !!rel;

              return relationExists ? (
                <UserCheck
                  size={22}
                  className="text-emerald-400 hover:text-emerald-350 cursor-pointer transition-colors"
                  onClick={() => {
                    relations.removeFriend(Number(resolvedUser.user_id));
                  }}
                />
              ) : (
                <UserRoundPlus
                  size={22}
                  className="text-gray-300 hover:text-white cursor-pointer transition-colors"
                  onClick={() => {
                    relations.addFriend(Number(resolvedUser.user_id));
                  }}
                />
              );
            })()
          )}

          <div 
            className="flex items-center border rounded-xl transition-all duration-300 ease-in-out px-2.5 py-1.5 overflow-hidden"
            style={{ 
              width: isSearching ? "280px" : "36px", 
              borderColor: isSearching ? "#374151" : "transparent", 
              backgroundColor: isSearching ? "#161b26" : "transparent" 
            }}
          >
            <Search
              size={18}
              className="text-gray-350 hover:text-white cursor-pointer flex-shrink-0 transition-colors"
              onClick={() => setIsSearching(prev => !prev)}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Cari kata..."
              className="bg-transparent border-none outline-none text-xs text-white placeholder-gray-550 ml-2 transition-opacity duration-200"
              style={{ 
                width: "100%", 
                opacity: isSearching ? 1 : 0, 
                pointerEvents: isSearching ? "auto" : "none" 
              }}
              autoFocus={isSearching}
            />
            {isSearching && (
              <button
                onClick={() => {
                  setIsSearching(false);
                  onSearchChange?.("");
                }}
                className="text-gray-400 hover:text-white cursor-pointer flex-shrink-0 ml-1.5"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="relative">
            <EllipsisVertical
              size={22}
              className="text-gray-300 hover:text-white cursor-pointer transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            />
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-800 rounded-lg shadow-xl overflow-hidden z-50">
                {isGroup ? (
                  <>
                    <button
                      onClick={() => {
                        setShowGroupInfo(true);
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer"
                    >
                      {room?.room_description?.startsWith("[CHANNEL]") ? "Channel Info" : "Group Info"}
                    </button>
                    <button
                      onClick={() => {
                        if (onLeaveRoom) onLeaveRoom();
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-950/35 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      {room?.room_description?.startsWith("[CHANNEL]") ? "Unfollow Channel" : "Leave Group"}
                    </button>
                  </>
                ) : (
                  <>
                    <button className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer">
                      Favorite
                    </button>
                    <button className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer">
                      Report
                    </button>
                    <button className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-950/35 hover:text-red-300 transition-colors cursor-pointer">
                      Block
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showGroupInfo && room && currentUserId !== undefined && (
        <GroupInfoModal
          room={room}
          currentUserId={currentUserId}
          socket={socket}
          onClose={() => setShowGroupInfo(false)}
        />
      )}

      {!isGroup && showProfile && resolvedUser && (
        <UserProfileModal
          user={resolvedUser}
          relations={relations}
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  );
};

export default ChatHeader;

