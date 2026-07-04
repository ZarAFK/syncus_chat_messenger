import { FC, useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Topbar from "../components/bar/topBar";
import Sidebar from "../components/sidebar/sidebar";
import MiniSidebar from "../components/minisidebar/minisidebar";
import ChatHeader from "../components/chat/userchat/chatheader";
import ChatMessages from "../components/chat/userchat/chatMessages";
import ChatInput from "../components/chat/userchat/chatInput";
import { GroupLobby } from "../components/chat/groupchat/grouplobby";
import { StatusDashboard } from "../components/chat/status/StatusDashboard";
import { topTabsType } from "../components/bar/topTabs";
import { usePresence } from "../hooks/useHookPresence";
import { chatService, IChatProfile } from "../services/chatServices";
import { MessageSquare, Plus, X, Smile, Paperclip, Camera, Send, CircleUser, Shuffle, Sparkles, AlertCircle, Pin, ChevronRight } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useUserRelations } from "../hooks/useUserRelations";
import { useNotifications } from "../hooks/useNotifications";
import api from "@/features/auth/services/auth.api";
import { encryptMessage, decryptMessage } from "@/shared/helper/cryptoHelper";


const ChatLayout: FC = () => {
  const location = useLocation();
  const token = localStorage.getItem("access_token") || "";
  const { user } = useAuth();
  const currentUserId = user?.user_id || Number(localStorage.getItem("user_id"));

  const relations = useUserRelations(currentUserId);
  const { socket } = usePresence(token);

  const [activeSidebarTabs, setActiveSidebarTabs] = useState<topTabsType>("chat");
  const [statusFilter, setStatusFilter] = useState<"public" | "friends" | "mine">("public");
  const [activeChatUser, setActiveChatUser] = useState<IChatProfile | null>(null);
  const [activeGroupRoom, setActiveGroupRoom] = useState<any | null>(null);
  const [activeRoom, setActiveRoom] = useState<any | null>(null);
  const [messagesList, setMessagesList] = useState<any[]>([]);
  const activeRoomRef = useRef<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const activeGroupRoomRef = useRef<any>(null);
  const [chatSearchQuery, setChatSearchQuery] = useState("");

  // Group creation & Random chat features states
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [activeRandomPartnerId, setActiveRandomPartnerId] = useState<number | null>(null);
  const [anonymousChatRoom, setAnonymousChatRoom] = useState<any | null>(null);
  const [showAnonymousModal, setShowAnonymousModal] = useState(false);
  const [anonymousMessages, setAnonymousMessages] = useState<any[]>([]);
  const anonymousChatRoomRef = useRef<any>(null);

  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupAgeLimit, setGroupAgeLimit] = useState(0);
  const [groupRule, setGroupRule] = useState("");

  // Pinned messages state
  const [pinnedMessagesMap, setPinnedMessagesMap] = useState<{ [key: string]: any[] }>(() => {
    try {
      const saved = localStorage.getItem("syncus_pinned_messages_map");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [activePinIndex, setActivePinIndex] = useState(0);

  const getActiveRoomKey = () => {
    if (activeGroupRoom) return `group_${activeGroupRoom.room_id}`;
    if (activeChatUser) {
      const min = Math.min(currentUserId, activeChatUser.user_id);
      const max = Math.max(currentUserId, activeChatUser.user_id);
      return `DM_${min}_${max}`;
    }
    return "";
  };
  const activeRoomKey = getActiveRoomKey();
  const currentPins = pinnedMessagesMap[activeRoomKey] || [];

  const savePins = (map: any) => {
    setPinnedMessagesMap(map);
    localStorage.setItem("syncus_pinned_messages_map", JSON.stringify(map));
  };

  // Reactions state
  const [reactionsMap, setReactionsMap] = useState<{ [msgId: string]: { [emoji: string]: { userId: number; username: string }[] } }>(() => {
    try {
      const saved = localStorage.getItem("syncus_message_reactions");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const saveReactions = (map: any) => {
    setReactionsMap(map);
    localStorage.setItem("syncus_message_reactions", JSON.stringify(map));
  };

  useEffect(() => {
    setActivePinIndex(0);
  }, [activeRoomKey]);

  useEffect(() => {
    anonymousChatRoomRef.current = anonymousChatRoom;
  }, [anonymousChatRoom]);

  useEffect(() => {
    if (!socket || !anonymousChatRoom) {
      setAnonymousMessages([]);
      return;
    }

    socket.emit("findAllMessagesByRoom", { roomId: anonymousChatRoom.room_id }, (messages: any[]) => {
      console.log("📜 Loaded historical anonymous messages:", messages);
      if (Array.isArray(messages)) {
        setAnonymousMessages(messages);
      }
    });
  }, [socket, anonymousChatRoom]);

  useEffect(() => {
    setChatSearchQuery("");
  }, [activeChatUser, activeGroupRoom]);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  useEffect(() => {
    activeGroupRoomRef.current = activeGroupRoom;
  }, [activeGroupRoom]);

  useEffect(() => {
    if (activeChatUser && relations.isBlocked(activeChatUser.user_id)) {
      setActiveChatUser(null);
    }
  }, [activeChatUser, relations.blocked]);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    acceptFriendRequest,
    rejectFriendRequest,
  } = useNotifications(socket, currentUserId, relations.reloadRelations);

  useEffect(() => {
    if (location.state?.activeSidebarTab) {
      setActiveSidebarTabs(location.state.activeSidebarTab);
      if (location.state.activeSidebarTab === "groups") {
        setActiveGroupRoom(null);
      }
    }
  }, [location.state]);

  const handlePinMessage = (message: any) => {
    if (!activeRoom || !activeRoom.room_id || !activeRoomKey) return;
    
    if (socket) {
      socket.emit("pinMessage", { roomId: activeRoom.room_id, messageId: message.id, message });
    }

    setMessagesList((prev) =>
      prev.map((m) => (m.id === message.id ? { ...m, is_pinned: true } : m))
    );
  };

  const handleUnpinMessage = (messageId: any) => {
    if (!activeRoom || !activeRoom.room_id || !activeRoomKey) return;

    if (socket) {
      socket.emit("unpinMessage", { roomId: activeRoom.room_id, messageId });
    }

    setMessagesList((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, is_pinned: false } : m))
    );
  };

  useEffect(() => {
    if (!socket || !activeRoomKey) return;

    const handleMessagePinned = (data: any) => {
      console.log("📌 Socket event messagePinned received:", data);
      const { roomId, messageId } = data;
      if (activeRoom && activeRoom.room_id === roomId) {
        setMessagesList((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, is_pinned: true } : m))
        );
      }
    };

    const handleMessageUnpinned = (data: any) => {
      console.log("📌 Socket event messageUnpinned received:", data);
      const { roomId, messageId } = data;
      if (activeRoom && activeRoom.room_id === roomId) {
        setMessagesList((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, is_pinned: false } : m))
        );
      }
    };

    socket.on("messagePinned", handleMessagePinned);
    socket.on("messageUnpinned", handleMessageUnpinned);

    return () => {
      socket.off("messagePinned", handleMessagePinned);
      socket.off("messageUnpinned", handleMessageUnpinned);
    };
  }, [socket, activeRoomKey, activeRoom]);

  // Synchronize database is_pinned message properties to pinnedMessagesMap
  useEffect(() => {
    if (!activeRoomKey || messagesList.length === 0) return;
    
    const dbPins = messagesList
      .filter((m) => m.is_pinned)
      .map((m) => ({
        id: m.id,
        content: m.content,
        created_at: m.created_at,
        sender_name: m.sender?.username || "Unknown",
        sender_id: m.sender?.user_id || 0,
        type: m.type,
      }));
    
    setPinnedMessagesMap((prev) => {
      const currentPins = prev[activeRoomKey] || [];
      const currentIds = currentPins.map((p) => p.id).sort().join(",");
      const dbIds = dbPins.map((p) => p.id).sort().join(",");
      if (currentIds === dbIds) return prev;
      
      const newMap = { ...prev, [activeRoomKey]: dbPins };
      localStorage.setItem("syncus_pinned_messages_map", JSON.stringify(newMap));
      return newMap;
    });
  }, [messagesList, activeRoomKey]);

  const handleReactMessage = (messageId: any, emoji: string) => {
    if (!activeRoom || !activeRoom.room_id) return;
    
    if (socket) {
      socket.emit("reactMessage", {
        roomId: activeRoom.room_id,
        messageId,
        emoji,
        userId: currentUserId,
        username: user?.username || "Guest",
      });
    }
  };

  useEffect(() => {
    if (!socket || !activeRoom) return;

    const handleMessageReacted = (data: any) => {
      console.log("🔔 Socket event messageReacted received:", data);
      const { roomId, messageId, reactions } = data;
      
      if (activeRoom.room_id === roomId) {
        setMessagesList((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions: reactions } : m))
        );
      }
    };

    socket.on("messageReacted", handleMessageReacted);

    return () => {
      socket.off("messageReacted", handleMessageReacted);
    };
  }, [socket, activeRoom]);

  // Synchronize database reactions message properties to reactionsMap
  useEffect(() => {
    if (messagesList.length === 0) return;
    
    const newReactionsMap: { [msgId: string]: any } = {};
    messagesList.forEach((m) => {
      if (m.reactions) {
        try {
          newReactionsMap[m.id] = typeof m.reactions === 'string' ? JSON.parse(m.reactions) : m.reactions;
        } catch {
          newReactionsMap[m.id] = {};
        }
      }
    });
    
    setReactionsMap((prev) => {
      const currentStr = JSON.stringify(prev);
      const newStr = JSON.stringify(newReactionsMap);
      if (currentStr === newStr) return prev;
      
      localStorage.setItem("syncus_message_reactions", newStr);
      return newReactionsMap;
    });
  }, [messagesList]);

  // 1a. Join deterministic private room when selected DM user changes
  useEffect(() => {
    if (!socket || !activeChatUser || !currentUserId) {
      setActiveRoom(null);
      setMessagesList([]);
      return;
    }

    console.log(`📡 Emitting joinPrivateRoom for users: ${currentUserId} and ${activeChatUser.user_id}`);
    socket.emit("joinPrivateRoom", {
      userAId: currentUserId,
      userBId: activeChatUser.user_id,
    });
  }, [socket, activeChatUser, currentUserId]);

  // 1b. Join public group room when activeGroupRoom changes
  useEffect(() => {
    if (!socket || !activeGroupRoom) {
      return;
    }

    console.log(`📡 Emitting joinRoom for group room: ${activeGroupRoom.room_id}`);
    socket.emit("joinRoom", { roomId: activeGroupRoom.room_id }, (response: any) => {
      console.log("📡 joinedRoom response:", response);
      if (response && response.success) {
        const room = response.data;
        setActiveRoom(room);

        // Fetch room message history
        socket.emit("findAllMessagesByRoom", { roomId: room.room_id }, (messages: any[]) => {
          console.log("📜 Historical group messages loaded:", messages);
          if (Array.isArray(messages)) {
            setMessagesList(messages);
          }
        });
      } else {
        console.error("Gagal bergabung ke grup:", response?.error || "Unknown error");
      }
    });
  }, [socket, activeGroupRoom]);

  // 2. Handle room activation & real-time messaging events
  useEffect(() => {
    if (!socket) return;

    // Load public groups initially
    socket.emit("findAllRooms", {}, (response: any) => {
      if (response && response.success) {
        setGroups(response.data || []);
      } else {
        console.error("Failed to load rooms:", response?.error || "Unknown error");
      }
    });

    const handleJoinedRoom = (response: any) => {
      console.log("📡 joinedPrivateRoom response:", response);
      const room = response && response.data ? response.data : response;
      if (room && room.room_id) {
        setActiveRoom(room);

        // Fetch room message history
        socket.emit("findAllMessagesByRoom", { roomId: room.room_id }, (messages: any[]) => {
          console.log("📜 Historical messages loaded:", messages);
          if (Array.isArray(messages)) {
            setMessagesList(messages);
          }
        });
      }
    };

    const handleNewMessage = (message: any) => {
      console.log("📩 New real-time message received:", message);
      // Validate that this message belongs to our active room
      const msgRoomId = message.room?.room_id || message.room_id;
      const currentRoom = activeRoomRef.current;
      if (currentRoom && msgRoomId === currentRoom.room_id) {
        setMessagesList((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }

      // Check if this message belongs to our active anonymous room
      const currentAnonRoom = anonymousChatRoomRef.current;
      if (currentAnonRoom && msgRoomId === currentAnonRoom.room_id) {
        setAnonymousMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    };

    const handleKickedFromRoom = (data: any) => {
      setGroups((prev) => prev.map((g) => {
        if (g.room_id === data.roomId) {
          return {
            ...g,
            roomMembers: g.roomMembers.filter((m: any) => m.user?.user_id !== currentUserId)
          };
        }
        return g;
      }));

      const currentRoom = activeRoomRef.current;
      if (currentRoom && data.roomId === currentRoom.room_id) {
        alert("Anda telah dikeluarkan dari grup ini oleh Admin.");
        setActiveGroupRoom(null);
        setActiveRoom(null);
      }
    };

    const handleMemberKicked = (data: any) => {
      setGroups((prev) => prev.map((g) => {
        if (g.room_id === data.roomId) {
          return {
            ...g,
            roomMembers: g.roomMembers.filter((m: any) => m.user?.user_id !== data.targetUserId)
          };
        }
        return g;
      }));

      const currentRoom = activeRoomRef.current;
      if (currentRoom && data.roomId === currentRoom.room_id) {
        setActiveRoom((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            roomMembers: prev.roomMembers.filter(
              (m: any) => m.user?.user_id !== data.targetUserId
            ),
          };
        });
      }

      const currentActiveGroup = activeGroupRoomRef.current;
      if (currentActiveGroup && data.roomId === currentActiveGroup.room_id) {
        setActiveGroupRoom((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            roomMembers: prev.roomMembers.filter(
              (m: any) => m.user?.user_id !== data.targetUserId
            ),
          };
        });
      }
    };

    const handleMemberRoleUpdated = (data: any) => {
      setGroups((prev) => prev.map((g) => {
        if (g.room_id === data.roomId) {
          return {
            ...g,
            roomMembers: g.roomMembers.map((m: any) => {
              if (m.user?.user_id === data.targetUserId) {
                return { ...m, role: data.role };
              }
              return m;
            })
          };
        }
        return g;
      }));

      const currentRoom = activeRoomRef.current;
      if (currentRoom && data.roomId === currentRoom.room_id) {
        setActiveRoom((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            roomMembers: prev.roomMembers.map((m: any) => {
              if (m.user?.user_id === data.targetUserId) {
                return { ...m, role: data.role };
              }
              return m;
            }),
          };
        });
      }

      const currentActiveGroup = activeGroupRoomRef.current;
      if (currentActiveGroup && data.roomId === currentActiveGroup.room_id) {
        setActiveGroupRoom((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            roomMembers: prev.roomMembers.map((m: any) => {
              if (m.user?.user_id === data.targetUserId) {
                return { ...m, role: data.role };
              }
              return m;
            }),
          };
        });
      }
    };

    const handleRoomMemberJoined = (data: any) => {
      setGroups((prev) => prev.map((g) => g.room_id === data.room?.room_id ? data.room : g));

      const currentRoom = activeRoomRef.current;
      if (currentRoom && data.room?.room_id === currentRoom.room_id) {
        setActiveRoom(data.room);
      }

      const currentActiveGroup = activeGroupRoomRef.current;
      if (currentActiveGroup && data.room?.room_id === currentActiveGroup.room_id) {
        setActiveGroupRoom(data.room);
      }
    };

    const handleRoomMemberLeft = (data: any) => {
      setGroups((prev) => prev.map((g) => g.room_id === data.room?.room_id ? data.room : g));

      const currentRoom = activeRoomRef.current;
      if (currentRoom && data.room?.room_id === currentRoom.room_id) {
        setActiveRoom(data.room);
      }

      const currentActiveGroup = activeGroupRoomRef.current;
      if (currentActiveGroup && data.room?.room_id === currentActiveGroup.room_id) {
        setActiveGroupRoom(data.room);
      }
    };

    const handleRoomCreated = (room: any) => {
      setGroups((prev) => {
        if (prev.some((g) => g.room_id === room.room_id)) return prev;
        return [...prev, room];
      });
    };

    const handleRoomUpdated = (room: any) => {
      setGroups((prev) => prev.map((g) => g.room_id === room.room_id ? room : g));
      
      const currentActiveGroup = activeGroupRoomRef.current;
      if (currentActiveGroup && room.room_id === currentActiveGroup.room_id) {
        setActiveGroupRoom(room);
      }

      const currentRoom = activeRoomRef.current;
      if (currentRoom && room.room_id === currentRoom.room_id) {
        setActiveRoom((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            room_name: room.room_name,
            room_description: room.room_description,
            rule: room.rule,
            age_limit: room.age_limit,
            room_picture: room.room_picture,
          };
        });
      }
    };

    const handleRoomRemoved = (roomId: number) => {
      setGroups((prev) => prev.filter((g) => g.room_id !== roomId));
      const currentActiveGroup = activeGroupRoomRef.current;
      if (currentActiveGroup && currentActiveGroup.room_id === roomId) {
        alert("Grup ini telah dihapus oleh Admin.");
        setActiveGroupRoom(null);
        setActiveRoom(null);
      }
    };

    socket.on("joinedPrivateRoom", handleJoinedRoom);
    socket.on("newMessage", handleNewMessage);
    socket.on("kickedFromRoom", handleKickedFromRoom);
    socket.on("memberKicked", handleMemberKicked);
    socket.on("memberRoleUpdated", handleMemberRoleUpdated);
    socket.on("roomMemberJoined", handleRoomMemberJoined);
    socket.on("roomMemberLeft", handleRoomMemberLeft);
    socket.on("roomCreated", handleRoomCreated);
    socket.on("roomUpdated", handleRoomUpdated);
    socket.on("roomRemoved", handleRoomRemoved);

    return () => {
      socket.off("joinedPrivateRoom", handleJoinedRoom);
      socket.off("newMessage", handleNewMessage);
      socket.off("kickedFromRoom", handleKickedFromRoom);
      socket.off("memberKicked", handleMemberKicked);
      socket.off("memberRoleUpdated", handleMemberRoleUpdated);
      socket.off("roomMemberJoined", handleRoomMemberJoined);
      socket.off("roomMemberLeft", handleRoomMemberLeft);
      socket.off("roomCreated", handleRoomCreated);
      socket.off("roomUpdated", handleRoomUpdated);
      socket.off("roomRemoved", handleRoomRemoved);
    };
  }, [socket]);

  const startRandomMatch = async () => {
    setIsMatching(true);
    setTimeout(async () => {
      try {
        const allUsers = await chatService.getAllUser();
        const pool = allUsers.filter((u: any) => u.user_id !== currentUserId);
        if (pool.length === 0) {
          alert("Tidak ada pengguna lain yang terdaftar saat ini.");
          setIsMatching(false);
          return;
        }

        const matched = pool[Math.floor(Math.random() * pool.length)];

        // Save matched partner ID to localStorage
        const savedIdsStr = localStorage.getItem("syncus_random_chat_partners");
        const savedIds: number[] = savedIdsStr ? JSON.parse(savedIdsStr) : [];
        if (!savedIds.includes(matched.user_id)) {
          savedIds.push(matched.user_id);
          localStorage.setItem("syncus_random_chat_partners", JSON.stringify(savedIds));
        }

        // Establish private room using socket
        if (socket) {
          socket.emit("joinPrivateRoom", {
            userAId: currentUserId,
            userBId: matched.user_id,
          }, (response: any) => {
            const room = response && response.data ? response.data : response;
            if (room && room.room_id) {
              setAnonymousChatRoom(room);
              setActiveRandomPartnerId(matched.user_id);
              setShowAnonymousModal(true);
            } else {
              alert("Gagal menghubungkan ke room chat acak.");
            }
          });
        }
      } catch (err) {
        console.error("Matchmaking error:", err);
      } finally {
        setIsMatching(false);
      }
    }, 2000);
  };

  const handleSelectRandomPartner = (partnerId: number) => {
    setActiveRandomPartnerId(partnerId);
    if (socket) {
      socket.emit("joinPrivateRoom", {
        userAId: currentUserId,
        userBId: partnerId,
      }, (response: any) => {
        const room = response && response.data ? response.data : response;
        if (room && room.room_id) {
          setAnonymousChatRoom(room);
          setShowAnonymousModal(true);
        } else {
          alert("Gagal memuat obrolan random.");
        }
      });
    }
  };

  const handleSendAnonMessage = (content: string, type: "text" | "image") => {
    if (!socket || !anonymousChatRoom) return;

    const encryptedContent = anonymousChatRoom.room_name?.startsWith("DM_")
      ? encryptMessage(content.trim(), anonymousChatRoom.room_name)
      : content.trim();

    socket.emit("createMessage", {
      sender_id: currentUserId,
      receiver_id: activeRandomPartnerId || undefined,
      room_id: anonymousChatRoom.room_id,
      content: type === "text" ? encryptedContent : content,
      type: type,
      status: "sent",
    });
  };

  const handleCreateGroup = () => {
    if (!groupName.trim() || !socket) return;

    socket.emit(
      "createRoom",
      {
        room_name: groupName.trim(),
        room_description: groupDescription.trim(),
        age_limit: Number(groupAgeLimit),
        rule: groupRule.trim(),
        category_room_id: 1, // General
        creator_id: currentUserId,
      },
      (response: any) => {
        if (response && response.success) {
          const newRoom = response.data;
          setIsCreateGroupOpen(false);
          setGroupName("");
          setGroupDescription("");
          setGroupAgeLimit(0);
          setGroupRule("");
          
          setActiveSidebarTabs("groups");
          setActiveGroupRoom(newRoom);
          setActiveChatUser(null);
        } else {
          alert("Gagal membuat grup: " + (response?.error || "Error tidak diketahui"));
        }
      }
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#0d0f14] text-gray-100 overflow-hidden font-sans">
      <Topbar
        setActiveTopBarTabs={(tab) => {
          if (tab !== "profile") {
            setActiveSidebarTabs(tab);
            if (tab === "groups") {
              setActiveGroupRoom(null);
            }
          }
        }}
        setActiveSidebarTabs={setActiveSidebarTabs}
        notifications={notifications}
        unreadCount={unreadCount}
        markNotificationAsRead={markAsRead}
        markAllNotificationsAsRead={markAllAsRead}
        deleteNotification={deleteNotification}
        acceptFriendRequest={acceptFriendRequest}
        rejectFriendRequest={rejectFriendRequest}
      />

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden relative">
        <MiniSidebar
          onOpenDrawer={() => console.log("open drawer")}
          onCloseDrawer={() => console.log("close drawer")}
          activeSidebarTabs={activeSidebarTabs}
          setActiveSidebarTabs={setActiveSidebarTabs}
          unreadCount={unreadCount}
        />

        {/* Sidebar utama */}
        <Sidebar
          activeTabs={activeSidebarTabs}
          setActiveTabs={(tab) => {
            setActiveSidebarTabs(tab);
            if (tab === "groups" || tab === "channels") {
              setActiveGroupRoom(null);
            }
          }}
          activeChatUser={activeChatUser}
          setActiveChatUser={(usr) => {
            setActiveChatUser(usr);
            setActiveGroupRoom(null);
            setShowAnonymousModal(false);
          }}
          groups={groups}
          activeGroupRoom={activeGroupRoom}
          setActiveGroupRoom={(room) => {
            setActiveGroupRoom(room);
            setActiveChatUser(null);
            setShowAnonymousModal(false);
          }}
          relations={relations}
          notifications={notifications}
          markNotificationAsRead={markAsRead}
          markAllNotificationsAsRead={markAllAsRead}
          deleteNotification={deleteNotification}
          acceptFriendRequest={acceptFriendRequest}
          rejectFriendRequest={rejectFriendRequest}
          onSelectRandomPartner={handleSelectRandomPartner}
          activeRandomPartnerId={activeRandomPartnerId}
          onStartRandomMatch={startRandomMatch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          currentUserId={currentUserId}
          socket={socket}
          setGroups={setGroups}
        />

        <main className="flex-1 flex flex-col h-full bg-[#121620] relative">
          {(activeSidebarTabs === "chat" || activeSidebarTabs === "saved" || activeSidebarTabs === "notifications") && activeChatUser && (
            <>
              <ChatHeader
                name={activeChatUser.username}
                details={`${activeChatUser.gender || "Other"}, ${activeChatUser.age || "-"} years, ${activeChatUser.country || "Unknown"}`}
                user={activeChatUser}
                relations={relations}
                searchQuery={chatSearchQuery}
                onSearchChange={setChatSearchQuery}
              />
              {currentPins.length > 0 && (
                <div className="bg-[#161b26]/90 border-b border-gray-800 px-4 py-2 flex items-center justify-between text-xs select-none">
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    <Pin size={14} className="text-amber-455 flex-shrink-0 rotate-45" />
                    <div className="min-w-0 cursor-pointer" onClick={() => {
                      const activePin = currentPins[activePinIndex % currentPins.length];
                      const element = document.getElementById(`msg-${activePin.id}`);
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth", block: "center" });
                        element.classList.add("bg-amber-500/10", "duration-1000");
                        setTimeout(() => {
                          element.classList.remove("bg-amber-500/10");
                        }, 2000);
                      }
                    }}>
                      <div className="font-bold text-amber-400">
                        Pesan Disematkan {currentPins.length > 1 ? `#${(activePinIndex % currentPins.length) + 1}` : ""}
                      </div>
                      <div className="text-gray-300 truncate mt-0.5 max-w-lg">
                        {(() => {
                          const pin = currentPins[activePinIndex % currentPins.length];
                          if (pin.type === "image" || pin.content?.startsWith("data:image/")) {
                            return "📷 Photo";
                          }
                          return pin.content;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {currentPins.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setActivePinIndex(prev => prev + 1)}
                        className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition cursor-pointer"
                        title="Lihat pin lainnya"
                      >
                        <ChevronRight size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const activePin = currentPins[activePinIndex % currentPins.length];
                        handleUnpinMessage(activePin.id);
                      }}
                      className="p-1 rounded hover:bg-gray-800 text-red-400 hover:text-red-300 transition cursor-pointer"
                      title="Lepas pin"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
              <ChatMessages
                messages={messagesList}
                currentUserId={currentUserId}
                activeRoom={activeRoom}
                relations={relations}
                searchQuery={chatSearchQuery}
                chatName={activeChatUser.username}
                chatId={activeChatUser.user_id}
                isGroup={false}
                onPin={handlePinMessage}
                onUnpin={handleUnpinMessage}
                pinnedMessages={currentPins}
                onReact={handleReactMessage}
                reactionsMap={reactionsMap}
              />
              <ChatInput
                activeRoom={activeRoom}
                socket={socket}
                currentUserId={currentUserId}
                activeChatUser={activeChatUser}
              />
            </>
          )}

          {(activeSidebarTabs === "groups" || activeSidebarTabs === "saved" || activeSidebarTabs === "notifications" || activeSidebarTabs === "channels") && activeGroupRoom && (
            <>
              <ChatHeader
                name={activeGroupRoom.room_name}
                details={activeGroupRoom.room_description?.startsWith("[CHANNEL]")
                  ? `${activeGroupRoom.roomMembers?.length || 0} followers`
                  : (activeGroupRoom.room_description || "Public Group Chat")}
                user={null}
                isGroup={true}
                room={activeGroupRoom}
                socket={socket}
                currentUserId={currentUserId}
                onLeaveRoom={() => {
                  if (socket && activeGroupRoom) {
                    socket.emit("leaveRoom", { roomId: activeGroupRoom.room_id }, (response: any) => {
                      if (response && !response.success) {
                        alert(response.error || "Gagal keluar dari grup");
                      } else {
                        setGroups((prev) => prev.map((g) => {
                          if (g.room_id === activeGroupRoom.room_id) {
                            return {
                              ...g,
                              roomMembers: g.roomMembers.filter((m: any) => m.user?.user_id !== currentUserId)
                            };
                          }
                          return g;
                        }));
                        setActiveGroupRoom(null);
                        setActiveRoom(null);
                      }
                    });
                  }
                }}
                relations={relations}
                searchQuery={chatSearchQuery}
                onSearchChange={setChatSearchQuery}
              />
              {currentPins.length > 0 && (
                <div className="bg-[#161b26]/90 border-b border-gray-800 px-4 py-2 flex items-center justify-between text-xs select-none">
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    <Pin size={14} className="text-amber-455 flex-shrink-0 rotate-45" />
                    <div className="min-w-0 cursor-pointer" onClick={() => {
                      const activePin = currentPins[activePinIndex % currentPins.length];
                      const element = document.getElementById(`msg-${activePin.id}`);
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth", block: "center" });
                        element.classList.add("bg-amber-500/10", "duration-1000");
                        setTimeout(() => {
                          element.classList.remove("bg-amber-500/10");
                        }, 2000);
                      }
                    }}>
                      <div className="font-bold text-amber-400">
                        Pesan Disematkan {currentPins.length > 1 ? `#${(activePinIndex % currentPins.length) + 1}` : ""}
                      </div>
                      <div className="text-gray-300 truncate mt-0.5 max-w-lg">
                        {(() => {
                          const pin = currentPins[activePinIndex % currentPins.length];
                          if (pin.type === "image" || pin.content?.startsWith("data:image/")) {
                            return "📷 Photo";
                          }
                          return pin.content;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {currentPins.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setActivePinIndex(prev => prev + 1)}
                        className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition cursor-pointer"
                        title="Lihat pin lainnya"
                      >
                        <ChevronRight size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const activePin = currentPins[activePinIndex % currentPins.length];
                        handleUnpinMessage(activePin.id);
                      }}
                      className="p-1 rounded hover:bg-gray-800 text-red-400 hover:text-red-300 transition cursor-pointer"
                      title="Lepas pin"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
              {(() => {
                const isChannel = activeGroupRoom.room_description?.startsWith("[CHANNEL]");
                const isAdmin = activeGroupRoom.creator?.user_id === currentUserId || activeGroupRoom.creator_id === currentUserId;
                const canPin = !isChannel || isAdmin;
                
                return (
                  <ChatMessages
                    messages={messagesList}
                    currentUserId={currentUserId}
                    activeRoom={activeRoom}
                    relations={relations}
                    searchQuery={chatSearchQuery}
                    chatName={activeGroupRoom.room_name}
                    chatId={activeGroupRoom.room_id}
                    isGroup={true}
                    onPin={canPin ? handlePinMessage : undefined}
                    onUnpin={canPin ? handleUnpinMessage : undefined}
                    pinnedMessages={currentPins}
                    isChannel={isChannel}
                    onReact={handleReactMessage}
                    reactionsMap={reactionsMap}
                  />
                );
              })()}
              {(() => {
                const isChannel = activeGroupRoom.room_description?.startsWith("[CHANNEL]");
                if (isChannel) {
                  const isMember = activeGroupRoom.roomMembers?.some(
                    (m: any) => m.user?.user_id === currentUserId || m.user_id === currentUserId
                  );
                  
                  if (!isMember) {
                    return (
                      <div className="p-4 border-t border-gray-800 bg-[#0d0f14]/90 backdrop-blur-md flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            socket?.emit("joinRoom", { roomId: activeGroupRoom.room_id }, (response: any) => {
                              if (response && response.success) {
                                setActiveGroupRoom(response.data);
                                socket?.emit("findAllRooms", {}, (res: any) => {
                                  if (res && res.success) {
                                    setGroups(res.data || []);
                                  }
                                });
                              }
                            });
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors text-xs uppercase"
                        >
                          Follow / Join Channel
                        </button>
                      </div>
                    );
                  }

                  const isAdmin = activeGroupRoom.creator?.user_id === currentUserId || activeGroupRoom.creator_id === currentUserId;
                  if (!isAdmin) {
                    return (
                      <div className="p-4 border-t border-gray-800 bg-[#0d0f14]/90 backdrop-blur-md flex items-center justify-center text-gray-400 text-xs font-semibold select-none">
                        🔒 Hanya admin yang dapat mengirimkan pesan di channel ini.
                      </div>
                    );
                  }
                }
                
                return (
                  <ChatInput
                    activeRoom={activeRoom}
                    socket={socket}
                    currentUserId={currentUserId}
                    activeChatUser={null}
                  />
                );
              })()}
            </>
          )}

          {!activeChatUser && !activeGroupRoom && activeSidebarTabs !== "groups" && activeSidebarTabs !== "ai" && activeSidebarTabs !== "status" && activeSidebarTabs !== "random" && (
            <div className="flex flex-col items-center justify-center flex-1 p-8 text-center bg-gradient-to-b from-[#121620] to-[#0a0c10] space-y-8 select-none">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 animate-pulse">
                  <MessageSquare size={48} className="text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-white mb-2">SyncUs Dashboard</h3>
                <p className="text-sm text-gray-400 max-w-sm">
                  Pilih teman dari daftar online atau cari pengguna untuk memulai obrolan realtime secara instan.
                </p>
              </div>

              {/* Quick Actions Container */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg w-full">
                <div 
                  onClick={() => setIsCreateGroupOpen(true)}
                  className="flex flex-col items-center p-6 bg-[#161b26]/50 border border-gray-800/80 hover:border-blue-500/40 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-[#161b26]/80 group"
                >
                  <Plus size={32} className="text-blue-500 group-hover:scale-110 transition duration-300 mb-3" />
                  <h4 className="text-sm font-bold text-white">Create Public Group</h4>
                  <p className="text-xs text-gray-400 text-center mt-1">Buat grup obrolan publik baru dan undang pengguna lain.</p>
                </div>

                <div 
                  onClick={startRandomMatch}
                  className="flex flex-col items-center p-6 bg-[#161b26]/50 border border-gray-800/80 hover:border-blue-500/40 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-[#161b26]/80 group"
                >
                  <Shuffle size={32} className="text-blue-500 group-hover:scale-110 transition duration-300 mb-3 animate-pulse" />
                  <h4 className="text-sm font-bold text-white">Match Random Chat</h4>
                  <p className="text-xs text-gray-400 text-center mt-1">Mulai obrolan acak dengan pengguna secara anonim.</p>
                </div>
              </div>
            </div>
          )}

          {activeSidebarTabs === "random" && !showAnonymousModal && (
            <div className="flex flex-col items-center justify-center flex-1 p-8 text-center bg-gradient-to-b from-[#121620] to-[#0a0c10] space-y-6">
              <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-2 animate-pulse">
                <Shuffle size={40} className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Anonymous Random Chat</h3>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                Temukan partner obrolan acak. Identitas, nama, dan foto profil Anda berdua akan disembunyikan secara otomatis.
              </p>
              <button
                onClick={startRandomMatch}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 shadow-md hover:shadow-blue-600/10 active:scale-95 cursor-pointer"
              >
                Match Partner Baru
              </button>
            </div>
          )}

          {activeSidebarTabs === "status" && (
            <StatusDashboard
              setActiveChatUser={setActiveChatUser}
              setActiveGroupRoom={setActiveGroupRoom}
              setActiveSidebarTabs={setActiveSidebarTabs}
              relations={relations}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
          )}

          {activeSidebarTabs === "groups" && !activeGroupRoom && (
            <GroupLobby
              socket={socket}
              currentUserId={currentUserId}
              onJoinGroup={(room) => setActiveGroupRoom(room)}
              groups={groups.filter((g) => !g.room_description?.startsWith("[CHANNEL]"))}
            />
          )}

          {activeSidebarTabs === "ai" && (
            <div className="flex items-center justify-center flex-1 text-gray-500">
              AI Assistant will be here 🤖
            </div>
          )}
        </main>
      </div>
      <ModalsContainer
        isCreateGroupOpen={isCreateGroupOpen}
        setIsCreateGroupOpen={setIsCreateGroupOpen}
        groupName={groupName}
        setGroupName={setGroupName}
        groupDescription={groupDescription}
        setGroupDescription={setGroupDescription}
        groupAgeLimit={groupAgeLimit}
        setGroupAgeLimit={setGroupAgeLimit}
        groupRule={groupRule}
        setGroupRule={setGroupRule}
        handleCreateGroup={handleCreateGroup}
        isMatching={isMatching}
        showAnonymousModal={showAnonymousModal}
        setShowAnonymousModal={setShowAnonymousModal}
        anonymousChatRoom={anonymousChatRoom}
        setAnonymousChatRoom={setAnonymousChatRoom}
        activeRandomPartnerId={activeRandomPartnerId}
        setActiveRandomPartnerId={setActiveRandomPartnerId}
        anonymousMessages={anonymousMessages}
        currentUserId={currentUserId}
        handleSendAnonMessage={handleSendAnonMessage}
      />
    </div>
  );
};

export default ChatLayout;

interface ModalsContainerProps {
  isCreateGroupOpen: boolean;
  setIsCreateGroupOpen: (val: boolean) => void;
  groupName: string;
  setGroupName: (val: string) => void;
  groupDescription: string;
  setGroupDescription: (val: string) => void;
  groupAgeLimit: number;
  setGroupAgeLimit: (val: number) => void;
  groupRule: string;
  setGroupRule: (val: string) => void;
  handleCreateGroup: () => void;
  isMatching: boolean;
  showAnonymousModal: boolean;
  setShowAnonymousModal: (val: boolean) => void;
  anonymousChatRoom: any;
  setAnonymousChatRoom: (val: any) => void;
  activeRandomPartnerId: number | null;
  setActiveRandomPartnerId: (val: number | null) => void;
  anonymousMessages: any[];
  currentUserId: number;
  handleSendAnonMessage: (content: string, type: "text" | "image") => void;
}

// Sub-modals & helper input container at the end of module
export function ModalsContainer({
  isCreateGroupOpen,
  setIsCreateGroupOpen,
  groupName,
  setGroupName,
  groupDescription,
  setGroupDescription,
  groupAgeLimit,
  setGroupAgeLimit,
  groupRule,
  setGroupRule,
  handleCreateGroup,
  isMatching,
  showAnonymousModal,
  setShowAnonymousModal,
  anonymousChatRoom,
  setAnonymousChatRoom,
  activeRandomPartnerId,
  setActiveRandomPartnerId,
  anonymousMessages,
  currentUserId,
  handleSendAnonMessage,
}: ModalsContainerProps) {
  return (
    <>
      {/* Create Group Modal */}
      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121620] border border-gray-800/60 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden select-none">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60">
              <h3 className="font-bold text-lg text-white">Create Public Group</h3>
              <button
                onClick={() => setIsCreateGroupOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Roblox Gamers"
                  className="w-full bg-[#161b26] border border-gray-800 text-white rounded-xl px-4.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-550"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="What is this group about?"
                  rows={3}
                  className="w-full bg-[#161b26] border border-gray-800 text-white rounded-xl px-4.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-550 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Age Limit</label>
                  <input
                    type="number"
                    value={groupAgeLimit}
                    onChange={(e) => setGroupAgeLimit(Number(e.target.value))}
                    min={0}
                    className="w-full bg-[#161b26] border border-gray-800 text-white rounded-xl px-4.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  {/* Spacer Column */}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Group Rules</label>
                <textarea
                  value={groupRule}
                  onChange={(e) => setGroupRule(e.target.value)}
                  placeholder="Describe group rules (one rule per line)..."
                  rows={3}
                  className="w-full bg-[#161b26] border border-gray-800 text-white rounded-xl px-4.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-550 resize-none scrollbar-thin"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#0d0f14]/80 border-t border-gray-800/60">
              <button
                onClick={() => setIsCreateGroupOpen(false)}
                className="px-4.5 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim()}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm transition-all active:scale-95 cursor-pointer"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Matchmaking Scanner Pulse Overlay */}
      {isMatching && (
        <div className="fixed inset-0 z-55 flex flex-col items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute w-36 h-36 border-2 border-blue-500/20 rounded-full animate-ping" />
            <div className="absolute w-24 h-24 border border-blue-500/40 rounded-full animate-pulse" />
            <div className="relative w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Shuffle className="text-white animate-spin" size={24} />
            </div>
          </div>
          <h3 className="text-xl font-bold text-white tracking-wide animate-pulse">SyncUs Matching...</h3>
          <p className="text-xs text-gray-400 mt-2 max-w-xs text-center leading-relaxed">
            Mencari partner obrolan acak secara anonim. Harap tunggu sebentar.
          </p>
        </div>
      )}

      {/* Anonymous Chat Modal Overlay */}
      {showAnonymousModal && anonymousChatRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none">
          <div className="bg-[#121620] border border-gray-800 rounded-3xl w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#0d0f14]/90 border-b border-gray-800/60 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center relative shadow-inner">
                  <CircleUser size={24} className="text-gray-450" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-gray-900 rounded-full shadow-[0_0_6px_#22c55e]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Anonymous Partner #{activeRandomPartnerId}
                  </h3>
                  <p className="text-[10px] text-green-400 font-medium tracking-wide">Obrolan Anonim</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAnonymousModal(false);
                  setAnonymousChatRoom(null);
                  setActiveRandomPartnerId(null);
                }}
                className="text-gray-400 hover:text-white p-1.5 rounded-xl hover:bg-gray-800/80 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Messages Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0a0c10] flex flex-col scrollbar-thin scrollbar-thumb-gray-850 scrollbar-track-transparent">
              {anonymousMessages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-gray-500 italic">
                  Belum ada pesan. Mulailah menyapa partner anonim Anda! 👋
                </div>
              ) : (
                anonymousMessages.map((msg, index) => {
                  const isMe = msg.sender_id === currentUserId || msg.sender?.user_id === currentUserId;
                  const decryptedContent = anonymousChatRoom.room_name?.startsWith("DM_") && msg.type === "text"
                    ? decryptMessage(msg.content, anonymousChatRoom.room_name)
                    : msg.content;
                  
                  return (
                    <div
                      key={msg.id || index}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-md leading-relaxed ${
                          isMe
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-[#161b26] text-gray-250 border border-gray-800/50 rounded-bl-none"
                        }`}
                      >
                        {msg.type === "image" ? (
                          <img
                            src={msg.content}
                            alt="Sent image"
                            className="max-h-60 rounded-lg object-contain cursor-pointer hover:scale-[1.01] transition"
                          />
                        ) : (
                          <p>{decryptedContent}</p>
                        )}
                        <span className="block text-[9px] text-gray-400 text-right mt-1 font-mono">
                          {new Date(msg.created_at || msg.create_at || Date.now()).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Input Footer */}
            <ChatInputWrapper
              onSubmit={(text, img) => {
                if (img) {
                  handleSendAnonMessage(img, "image");
                }
                if (text) {
                  handleSendAnonMessage(text, "text");
                }
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

interface ChatInputWrapperProps {
  onSubmit: (text: string, image: string | null) => void;
}

const emojis = {
  smileys: [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️"
  ],
  gestures: [
    "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏"
  ],
  hearts: [
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "🔥", "✨", "🌟", "⭐", "🎉", "🚀", "💥", "💯"
  ]
};

const ChatInputWrapper: React.FC<ChatInputWrapperProps> = ({ onSubmit }) => {
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiTab, setActiveEmojiTab] = useState<"smileys" | "gestures" | "hearts">("smileys");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close emoji picker on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleSend = () => {
    const hasText = !!text.trim();
    const hasImage = !!imagePreview;

    if (!hasText && !hasImage) return;
    onSubmit(text, imagePreview);
    setText("");
    setImagePreview(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const handleEmojiClick = (emoji: string) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart ?? text.length;
      const end = input.selectionEnd ?? text.length;
      const newText = text.substring(0, start) + emoji + text.substring(end);
      setText(newText);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setText((prev) => prev + emoji);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          setImagePreview(event.target?.result as string);
        };
      } catch (err) {
        console.error("Failed to process image:", err);
      }
    }
    if (e.target) {
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col relative z-25">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {imagePreview && (
        <div className="px-4 py-2 bg-[#0a0c10] border-t border-gray-800/60 flex items-center space-x-3 relative">
          <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-800 shadow-md">
            <img src={imagePreview} alt="Upload preview" className="w-full h-full object-cover" />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/75 hover:bg-black text-white hover:scale-105 transition-all flex items-center justify-center cursor-pointer"
            >
              <X size={10} />
            </button>
          </div>
          <div className="text-[10px] text-gray-400">
            <span className="font-semibold text-gray-300 block">Gambar terpilih</span>
            <span>Akan terkirim setelah menekan tombol Kirim</span>
          </div>
        </div>
      )}

      <div className="p-4 bg-[#0d0f14]/90 border-t border-gray-850 backdrop-blur-md flex items-center space-x-3 relative">
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-20 left-4 z-40 w-72 bg-[#121620]/95 border border-gray-850 rounded-2xl shadow-xl backdrop-blur-md p-3 select-none flex flex-col animate-fadeIn"
          >
            {/* Tabs */}
            <div className="flex border-b border-gray-800/60 pb-2 mb-2 text-[10px] font-semibold gap-1">
              {["smileys", "gestures", "hearts"].map((tab) => (
                <button
                  type="button"
                  key={tab}
                  onClick={() => setActiveEmojiTab(tab as any)}
                  className={`flex-1 py-1 text-center rounded-lg transition cursor-pointer capitalize ${
                    activeEmojiTab === tab
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
              {emojis[activeEmojiTab].map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-lg p-1 hover:bg-[#1b212f] rounded-lg transition text-center cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 h-10 flex items-center bg-[#161b26] border border-gray-800 focus-within:border-blue-500 rounded-xl px-3 transition duration-200">
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition cursor-pointer ${
              showEmojiPicker ? "text-blue-500 bg-blue-500/10" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Smile size={16} />
          </button>

          <input
            type="text"
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan anonim..."
            className="flex-1 h-full px-2 bg-transparent text-white placeholder-gray-500 focus:outline-none border-none text-xs"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:text-white text-gray-400 transition cursor-pointer"
            title="Kirim Foto"
          >
            <Paperclip size={14} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() && !imagePreview}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition shadow-lg cursor-pointer"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};


