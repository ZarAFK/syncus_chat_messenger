import { FC, useState, useEffect } from "react";
import { X, ZoomIn, Bookmark, Pin, Smile } from "lucide-react";
import { UserProfileModal } from "./UserProfileModal";
import { resolveAvatarUrl } from "@/shared/utils/avatarUtils";

export interface MessageBubbleProps {
  msgId: number | string;
  text: string;
  type?: "received" | "sent";
  createdAt?: string | Date;
  msgType?: string;
  sender?: any;
  relations?: any;
  chatName: string;
  chatId: number;
  isGroup: boolean;
  onPin?: (msg: any) => void;
  onUnpin?: (msgId: any) => void;
  isPinned?: boolean;
  isChannel?: boolean;
  onReact?: (msgId: any, emoji: string) => void;
  reactions?: { [emoji: string]: { userId: number; username: string }[] };
  currentUserId: number;
}

const MessageBubble: FC<MessageBubbleProps> = ({
  msgId,
  text,
  type,
  createdAt,
  msgType,
  sender,
  relations,
  chatName,
  chatId,
  isGroup,
  onPin,
  onUnpin,
  isPinned,
  isChannel = false,
  onReact,
  reactions = {},
  currentUserId,
}) => {
  const [showProfile, setShowProfile] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [timeAgo, setTimeAgo] = useState("");
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const isImage = msgType === "image" || text.startsWith("data:image/");

  const isSaved = relations?.isSaved?.(msgId) || false;

  const handleToggleSave = () => {
    if (!relations) return;
    if (isSaved) {
      relations.unsaveMessage(msgId);
    } else {
      relations.saveMessage({
        id: msgId,
        content: text,
        created_at: createdAt || new Date().toISOString(),
        sender_name: sender?.username || "Unknown",
        sender_id: sender?.user_id || 0,
        chat_name: chatName,
        chat_id: chatId,
        is_group: isGroup,
      });
    }
  };

  useEffect(() => {
    const updateRelativeTime = () => {
      const date = createdAt ? new Date(createdAt) : new Date();
      if (isNaN(date.getTime())) return;

      const timeStr = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let relative = "";
      if (diffMs < 0) relative = "just now";
      else if (diffMins < 1) relative = "just now";
      else if (diffMins < 60) relative = `${diffMins}m ago`;
      else if (diffHours < 24) relative = `${diffHours}h ago`;
      else relative = `${diffDays}d ago`;

      setTimeAgo(`${timeStr} • ${relative}`);
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 30000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const avatarSeed = sender?.username || "Guest";
  const avatarUrl = resolveAvatarUrl(sender?.profile?.avatar_url || sender?.profile?.profile_picture, avatarSeed);

  const renderAvatar = () => (
    <button
      onClick={() => setShowProfile(true)}
      className="flex-shrink-0 focus:outline-none hover:scale-110 active:scale-90 transition-all duration-200 cursor-pointer"
      title={`View @${avatarSeed}'s profile`}
    >
      <img
        src={avatarUrl}
        alt={avatarSeed}
        className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700/60 shadow-sm"
      />
    </button>
  );

  if (msgType === "system") {
    return (
      <div className="flex justify-center my-3.5 animate-fadeIn w-full">
        <div className="px-4 py-1.5 bg-[#161b26]/50 border border-gray-800/40 rounded-full text-[11px] text-gray-400 font-medium select-none tracking-wide shadow-sm">
          {text}
        </div>
      </div>
    );
  }

  const hasReactions = reactions && Object.keys(reactions).length > 0;

  return (
    <>
      <div
        id={`msg-${msgId}`}
        className={`flex items-start gap-2.5 animate-fadeIn ${
          type === "sent" ? "justify-end" : "justify-start"
        } ${hasReactions ? "mb-5" : "mb-2.5"}`}
      >
        {/* Render avatar on the left for received messages */}
        {type === "received" && !isChannel && renderAvatar()}

        <div
          className={`relative max-w-sm md:max-w-md shadow-md transition-all duration-200 group ${
            isImage
              ? "p-1.5 bg-[#161b26]/90 border border-gray-800/80 rounded-2xl"
              : type === "sent"
              ? "px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-2xl rounded-tr-none shadow-blue-500/5"
              : "px-4 py-2.5 bg-[#161b26]/90 border border-gray-800/80 text-gray-100 rounded-2xl rounded-tl-none"
          }`}
        >
          {isImage ? (
            <div className="relative rounded-xl overflow-hidden cursor-zoom-in group-hover:opacity-95 transition-opacity max-w-[280px] sm:max-w-[320px]">
              <img
                src={text}
                alt="Shared attachment"
                onClick={() => setIsZoomed(true)}
                className="w-full h-auto object-cover max-h-[240px] rounded-xl"
              />
              <div
                onClick={() => setIsZoomed(true)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
              >
                <ZoomIn size={20} className="transform scale-90 group-hover:scale-100 transition-transform" />
              </div>
            </div>
          ) : (
            <p className="text-lg leading-relaxed whitespace-pre-wrap break-words">{text}</p>
          )}

          {timeAgo && (
            <span
              className={`text-[11px] sm:text-xs block mt-1 text-right px-1 ${
                isImage
                  ? "text-gray-400"
                  : type === "sent"
                  ? "text-blue-200"
                  : "text-gray-400"
              }`}
            >
              {timeAgo}
            </span>
          )}

          {/* Reactions list floating at the bottom corner of message content */}
          {reactions && Object.keys(reactions).length > 0 && (
            <div className={`absolute -bottom-2.5 flex items-center gap-1 select-none z-10 ${
              type === "sent" ? "left-3" : "right-3"
            }`}>
              {Object.entries(reactions).map(([emoji, usersList]) => {
                if (!usersList || usersList.length === 0) return null;
                const hasIReacted = usersList.some((u) => u.userId === currentUserId);
                const titleStr = usersList.map((u) => `@${u.username}`).join(", ");
                return (
                  <button
                    key={emoji}
                    type="button"
                    title={titleStr}
                    onClick={() => onReact?.(msgId, emoji)}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-bold shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                      hasIReacted
                        ? "bg-blue-650/90 border-blue-500 text-white animate-pulse"
                        : "bg-[#181d2a] border-gray-800 text-gray-300 hover:text-white"
                    }`}
                  >
                    <span>{emoji}</span>
                    <span>{usersList.length}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Bookmark Button */}
          {relations && (
            <button
              onClick={handleToggleSave}
              className={`absolute top-1/2 -translate-y-1/2 p-1.5 rounded-lg border bg-gray-950/80 backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-md cursor-pointer ${
                type === "sent"
                  ? "-left-10 hover:bg-blue-600/20 hover:text-blue-400"
                  : "-right-10 hover:bg-blue-600/20 hover:text-blue-400"
              } ${
                isSaved
                  ? "text-blue-400 border-blue-500/30 bg-blue-500/10 opacity-100"
                  : "text-gray-400 border-gray-800"
              }`}
              title={isSaved ? "Hapus dari pesan disimpan" : "Simpan pesan"}
            >
              <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} />
            </button>
          )}

          {/* Pin Button */}
          {onPin && onUnpin && (
            <button
              onClick={() => {
                if (isPinned) {
                  onUnpin(msgId);
                } else {
                  onPin({
                    id: msgId,
                    content: text,
                    created_at: createdAt || new Date().toISOString(),
                    sender_name: sender?.username || "Unknown",
                    sender_id: sender?.user_id || 0,
                    type: msgType,
                  });
                }
              }}
              className={`absolute top-1/2 -translate-y-1/2 p-1.5 rounded-lg border bg-gray-950/80 backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-md cursor-pointer ${
                type === "sent"
                  ? "-left-[76px] hover:bg-amber-605/20 hover:text-amber-400"
                  : "-right-[76px] hover:bg-amber-605/20 hover:text-amber-400"
              } ${
                isPinned
                  ? "text-amber-400 border-amber-500/30 bg-amber-500/10 opacity-100"
                  : "text-gray-400 border-gray-800"
              }`}
              title={isPinned ? "Lepas pin pesan" : "Sematkan pesan (Pin)"}
            >
              <Pin size={14} fill={isPinned ? "currentColor" : "none"} className="rotate-45" />
            </button>
          )}

          {/* Reaction Picker Button */}
          {onReact && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowReactionPicker(prev => !prev)}
                className={`absolute top-1/2 -translate-y-1/2 p-1.5 rounded-lg border bg-gray-950/80 backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-md cursor-pointer ${
                  type === "sent"
                    ? "-left-[112px] hover:bg-indigo-600/20 hover:text-indigo-400"
                    : "-right-[112px] hover:bg-indigo-600/20 hover:text-indigo-400"
                } ${
                  showReactionPicker
                    ? "text-indigo-400 border-indigo-500/30 bg-indigo-500/10 opacity-100"
                    : "text-gray-400 border-gray-800"
                }`}
                title="Tambahkan reaksi"
              >
                <Smile size={14} />
              </button>

              {showReactionPicker && (
                <div
                  className={`absolute bottom-8 bg-gray-900 border border-gray-800 rounded-full px-2.5 py-1.5 shadow-xl z-30 flex items-center gap-2 animate-fadeIn ${
                    type === "sent" ? "-left-12" : "-right-12"
                  }`}
                >
                  {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        onReact(msgId, emoji);
                        setShowReactionPicker(false);
                      }}
                      className="hover:scale-130 active:scale-95 transition-all text-base cursor-pointer border-none bg-transparent"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Render avatar on the right for sent messages */}
        {type === "sent" && !isChannel && renderAvatar()}
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <UserProfileModal
          user={sender}
          relations={relations}
          onClose={() => setShowProfile(false)}
        />
      )}

      {/* Lightbox Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-opacity duration-300"
          onClick={() => setIsZoomed(false)}
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/10 shadow-lg"
          >
            <X size={20} />
          </button>
          <div
            className="relative max-w-full max-h-[90vh] transition-transform duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={text}
              alt="Shared attachment zoomed"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-gray-800"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default MessageBubble;
