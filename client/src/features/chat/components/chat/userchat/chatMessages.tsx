import { FC, useEffect, useRef } from "react";
import MessageBubble from "./messageBubble";
import { decryptMessage } from "@/shared/helper/cryptoHelper";
import useChat from "../../../hooks/useHooksChat";
import { useProfile } from "@/features/userprofile/hooks/useProfileHooks";

interface ChatMessagesProps {
  messages: any[];
  currentUserId: number;
  activeRoom?: any;
  relations: any;
  searchQuery?: string;
  chatName: string;
  chatId: number;
  isGroup: boolean;
  onPin?: (msg: any) => void;
  onUnpin?: (msgId: any) => void;
  pinnedMessages?: any[];
  isChannel?: boolean;
  onReact?: (msgId: any, emoji: string) => void;
  reactionsMap?: { [msgId: string]: { [emoji: string]: { userId: number; username: string }[] } };
}

const ChatMessages: FC<ChatMessagesProps> = ({
  messages,
  currentUserId,
  activeRoom,
  relations,
  searchQuery = "",
  chatName,
  chatId,
  isGroup,
  onPin,
  onUnpin,
  pinnedMessages = [],
  isChannel = false,
  onReact,
  reactionsMap = {},
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { users } = useChat();
  const { profile } = useProfile();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filter out messages from blocked users and apply search query
  const visibleMessages = messages?.filter((msg) => {
    if (msg.type === "system") {
      if (searchQuery.trim()) {
        return msg.content?.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    }
    const isBlocked = relations.isBlocked(msg.sender?.user_id || msg.sender_id);
    if (isBlocked) return false;

    if (searchQuery.trim()) {
      return msg.content?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  }) || [];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0c10] flex flex-col scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
      {visibleMessages.map((msg) => {
        const isSentByMe =
          msg.sender?.user_id === currentUserId ||
          msg.sender_id === currentUserId;

        const textContent = activeRoom && msg.content?.startsWith("[E2E]")
          ? decryptMessage(msg.content, activeRoom.room_name)
          : msg.content;

        const freshUser = isSentByMe
          ? null
          : users.find((u) => u.user_id === (msg.sender?.user_id || msg.sender_id));

        const senderObj = isSentByMe
          ? {
              user_id: currentUserId,
              username: profile?.username || "Saya",
              country: profile?.country || "ID",
              gender: profile?.gender || "male",
              age: profile?.age || 20,
              profile: {
                bio: profile?.profile?.bio || "",
                avatar_url: profile?.profile?.avatar_url || "",
              }
            }
          : freshUser || msg.sender || {
              user_id: msg.sender_id,
              username: "User",
              country: "ID",
              gender: "male",
              age: 20,
              profile: { bio: "No bio yet", avatar_url: "" }
            };

        const msgId = msg.id || `${msg.created_at}-${msg.content}`;
        const isPinned = pinnedMessages.some((m) => m.id === msgId);

        return (
          <MessageBubble
            key={msgId}
            msgId={msgId}
            text={textContent}
            type={msg.type === "system" ? undefined : (isSentByMe ? "sent" : "received")}
            msgType={msg.type}
            createdAt={msg.created_at}
            sender={msg.type === "system" ? null : senderObj}
            relations={relations}
            chatName={chatName}
            chatId={chatId}
            isGroup={isGroup}
            onPin={onPin}
            onUnpin={onUnpin}
            isPinned={isPinned}
            isChannel={isChannel}
            onReact={onReact}
            reactions={reactionsMap[msgId]}
            currentUserId={currentUserId}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatMessages;

