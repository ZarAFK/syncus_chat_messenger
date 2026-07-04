import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Smile, Send, MessageSquare, Activity, Users, PlusCircle, Check, 
  Image as ImageIcon, X, Trash2, Calendar, Plus, Heart, Share2, 
  Play, Pause, ChevronLeft, ChevronRight, Sparkles, Clock, Compass,
  Shuffle, Bookmark
} from "lucide-react";
import { useProfile } from "@/features/userprofile/hooks/useProfileHooks";
import { usePresence } from "../../../hooks/useHookPresence";
import api from "@/features/auth/services/auth.api";
import { IChatProfile } from "../../../services/chatServices";
import { formatDistanceToNow } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { resolveAvatarUrl } from "@/shared/utils/avatarUtils";

interface StatusDashboardProps {
  setActiveChatUser: (user: IChatProfile | null) => void;
  setActiveGroupRoom: (room: any | null) => void;
  setActiveSidebarTabs: (tab: any) => void;
  relations: any;
  statusFilter?: "public" | "friends" | "mine";
  setStatusFilter?: (filter: "public" | "friends" | "mine") => void;
}

const RANDOM_STATUS_TEMPLATES = [
  { emoji: "💻", text: "Sedang merenungkan mengapa bug ini bisa ada..." },
  { emoji: "☕", text: "Kopi dulu biar ga salah paham." },
  { emoji: "😴", text: "Butuh tidur 3 hari berturut-turut." },
  { emoji: "🍕", text: "Diet mulai besok, hari ini makan enak dulu." },
  { emoji: "🎵", text: "Mendengarkan lagu sedih padahal lagi bahagia." },
  { emoji: "🚀", text: "Menuju tak terbatas dan melampauinya!" },
  { emoji: "🎮", text: "Satu game lagi sebelum tidur (bohong)." },
  { emoji: "📚", text: "Sedang belajar menjadi manusia yang lebih sabar." },
  { emoji: "🎨", text: "Mencari inspirasi di balik segelas teh hangat." },
  { emoji: "🐱", text: "Menjadi budak korporat sekaligus budak kucing." },
  { emoji: "🧘", text: "Menjaga kewarasan di tengah kesibukan." },
  { emoji: "🎬", text: "Nonton film seru sambil ngemil keripik." },
  { emoji: "🚶", text: "Jalan-jalan sore cari udara segar." },
  { emoji: "🍩", text: "Manisnya donat ini tidak semanis janji manisnya." },
  { emoji: "🌧️", text: "Hujan di luar, sendu di dalam." },
  { emoji: "🔥", text: "Semangat berkobar demi masa depan cerah!" },
  { emoji: "🤔", text: "Lagi mikirin cara kaya tanpa harus bekerja keras." },
  { emoji: "🌈", text: "Badai pasti berlalu, pelangi akan datang." },
  { emoji: "💼", text: "Kerja keras bagai kuda demi sesuap nasi." },
  { emoji: "🏖️", text: "Otak sudah di pantai, tapi raga masih di meja kerja." },
  { emoji: "🥳", text: "Weekend telah tiba! Waktunya bersenang-senang!" },
  { emoji: "🍜", text: "Mie instan di kala hujan adalah nikmat tiada tara." },
  { emoji: "🔋", text: "Social battery is low. Mohon jangan diganggu." },
  { emoji: "💡", text: "Mendapat ide cemerlang di kamar mandi." },
  { emoji: "👻", text: "Pura-pura sibuk biar ga ditanya kapan nikah." }
];

const STORY_GRADIENTS = [
  "from-rose-500 via-pink-500 to-red-500",
  "from-purple-600 via-fuchsia-500 to-pink-500",
  "from-emerald-400 via-teal-500 to-cyan-600",
  "from-amber-400 via-orange-500 to-red-500",
  "from-blue-600 via-indigo-650 to-violet-750",
  "from-fuchsia-600 via-rose-500 to-yellow-555",
];

const getStoryGradient = (id: number) => {
  return STORY_GRADIENTS[id % STORY_GRADIENTS.length];
};

const compressStatusImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const StatusDashboard: React.FC<StatusDashboardProps> = ({
  setActiveChatUser,
  setActiveGroupRoom,
  setActiveSidebarTabs,
  relations,
  statusFilter,
  setStatusFilter,
}) => {
  const { profile } = useProfile();
  const token = localStorage.getItem("access_token") || "";
  const { onlineUsers } = usePresence(token);

  const [statusText, setStatusText] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [localFeedTab, setLocalFeedTab] = useState<"public" | "friends" | "mine">("public");
  const activeFeedTab = statusFilter ?? localFeedTab;
  const setActiveFeedTab = setStatusFilter ?? setLocalFeedTab;

  const [friendStatuses, setFriendStatuses] = useState<any[]>([]);
  const [myStatuses, setMyStatuses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Likes Local Persistence State
  const [likedStatuses, setLikedStatuses] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem("liked_statuses");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});

  // Fullscreen Story Viewer State
  const [activeStoryUser, setActiveStoryUser] = useState<any | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [activeStoryImageIndex, setActiveStoryImageIndex] = useState<number>(0);
  const [storyProgress, setStoryProgress] = useState<number>(0);
  const [isStoryPaused, setIsStoryPaused] = useState<boolean>(false);
  const [storyCommentText, setStoryCommentText] = useState<string>("");
  const [particles, setParticles] = useState<{ id: number; emoji: string; left: number; rotation: number; delay: number; duration: number }[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const storyTimerRef = useRef<any>(null);
  const composerInputRef = useRef<HTMLTextAreaElement>(null);

  const currentUserId = Number(localStorage.getItem("user_id"));
  const serverBase = "http://localhost:3000";

  const fetchStatuses = async () => {
    try {
      const friendsRes = await api.get("/users/status/friends");
      setFriendStatuses(friendsRes.data || []);

      const meRes = await api.get("/users/status/me");
      setMyStatuses(meRes.data || []);
    } catch (e) {
      console.error("Gagal mengambil status:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();

    // Sync status updates in the background every 15 seconds
    const syncInterval = setInterval(() => {
      fetchStatuses();
    }, 15000);

    return () => clearInterval(syncInterval);
  }, []);

  const onlineSet = useMemo(() => {
    return new Set(onlineUsers?.map((ou) => ou.user_id));
  }, [onlineUsers]);

  // Combined Active Feed list for standard scroll view (Threads-like layout)
  const chronologicalFeed = useMemo(() => {
    const list: any[] = [];
    friendStatuses.forEach((group: any) => {
      const isOnline = onlineSet.has(group.user_id);
      group.statuses.forEach((status: any) => {
        list.push({
          status_id: status.status_id,
          text: status.text,
          emoji: status.emoji,
          image_paths: status.image_paths,
          created_at: status.created_at,
          is_read: status.is_read,
          comments: status.comments || [],
          user: {
            user_id: group.user_id,
            username: group.username,
            avatar: group.avatar,
            country: group.country,
            gender: group.gender,
            role: group.role,
            last_seen: group.last_seen,
            is_online: isOnline,
          },
        });
      });
    });

    return list.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [friendStatuses, onlineSet]);

  const myStatusesMapped = useMemo(() => {
    const avatar = profile?.profile?.avatar_url || "";
    return myStatuses.map((st) => ({
      status_id: st.status_id,
      text: st.text,
      emoji: st.emoji,
      image_paths: st.image_paths,
      created_at: st.created_at,
      is_read: true,
      comments: st.comments || [],
      user: {
        user_id: currentUserId,
        username: profile?.username || "Saya",
        avatar: avatar,
        country: profile?.country || "ID",
        gender: profile?.gender || "Laki-laki",
        role: profile?.role || "user",
        last_seen: new Date().toISOString(),
        is_online: true,
      },
    }));
  }, [myStatuses, profile, currentUserId]);

  const displayedFeed = useMemo(() => {
    if (activeFeedTab === "mine") {
      return myStatusesMapped;
    }
    if (activeFeedTab === "friends") {
      return chronologicalFeed.filter((st) => relations?.isFriend?.(st.user.user_id));
    }
    return chronologicalFeed;
  }, [chronologicalFeed, myStatusesMapped, activeFeedTab, relations]);

  // Construct current user's story group for the slideshow
  const myStoryGroup = useMemo(() => {
    if (myStatuses.length === 0) return null;
    return {
      user_id: currentUserId,
      username: profile?.username || "Saya",
      avatar: profile?.profile?.avatar_url || "",
      is_online: true,
      statuses: [...myStatuses].reverse().map(st => ({
        ...st,
        is_read: true,
      })),
    };
  }, [myStatuses, profile, currentUserId]);

  // Sort active story user's statuses chronologically (oldest to newest) for viewing
  const activeStatusesForViewer = useMemo(() => {
    if (!activeStoryUser) return [];
    return [...activeStoryUser.statuses].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [activeStoryUser]);

  // Handle auto-advancing slides in Story Viewer
  useEffect(() => {
    if (!activeStoryUser || isStoryPaused) {
      if (storyTimerRef.current) clearInterval(storyTimerRef.current);
      return;
    }

    const intervalTime = 40; // update progress every 40ms
    const slideDuration = 5000; // 5 seconds per status slide
    const increment = (intervalTime / slideDuration) * 105;

    storyTimerRef.current = setInterval(() => {
      setStoryProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(storyTimerRef.current);
          handleNextStory();
          return 0;
        }
        return next;
      });
    }, intervalTime);

    return () => {
      if (storyTimerRef.current) clearInterval(storyTimerRef.current);
    };
  }, [activeStoryUser, activeStoryIndex, activeStoryImageIndex, isStoryPaused]);

  // Reset indices when active story changes
  useEffect(() => {
    setActiveStoryImageIndex(0);
    setStoryProgress(0);
  }, [activeStoryIndex]);

  // Mark story as read on opening
  useEffect(() => {
    if (activeStoryUser && activeStoryUser.user_id !== currentUserId) {
      const currentStatus = activeStatusesForViewer[activeStoryIndex];
      if (currentStatus && !currentStatus.is_read) {
        api.post(`/users/status/${currentStatus.status_id}/view`).then(() => {
          fetchStatuses();
        }).catch((err) => console.error(err));
      }
    }
  }, [activeStoryUser, activeStoryIndex]);

  const handleNextStory = () => {
    setStoryProgress(0);
    const currentStatus = activeStatusesForViewer[activeStoryIndex];
    if (!currentStatus) return;

    // Check if there are more slides for the current user
    if (activeStoryIndex < activeStatusesForViewer.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
    } else {
      // Transition to next friend's story
      const allStories = [];
      if (myStoryGroup) allStories.push(myStoryGroup);
      allStories.push(...friendStatuses);

      const currentIdx = allStories.findIndex((u) => u.user_id === activeStoryUser.user_id);
      if (currentIdx !== -1 && currentIdx < allStories.length - 1) {
        setActiveStoryUser(allStories[currentIdx + 1]);
        setActiveStoryIndex(0);
      } else {
        // No more stories, close viewer
        setActiveStoryUser(null);
      }
    }
  };

  const handlePrevStory = () => {
    setStoryProgress(0);
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
    } else {
      // Transition to previous friend's story
      const allStories = [];
      if (myStoryGroup) allStories.push(myStoryGroup);
      allStories.push(...friendStatuses);

      const currentIdx = allStories.findIndex((u) => u.user_id === activeStoryUser.user_id);
      if (currentIdx > 0) {
        const prevUser = allStories[currentIdx - 1];
        setActiveStoryUser(prevUser);
        setActiveStoryIndex(prevUser.statuses.length - 1);
      } else {
        // First slide of first story, restart slide progress
        setStoryProgress(0);
      }
    }
  };

  const handleLeftClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentStatus = activeStatusesForViewer[activeStoryIndex];
    const images = currentStatus?.image_paths || [];

    if (images.length > 1 && activeStoryImageIndex > 0) {
      setActiveStoryImageIndex((prev) => prev - 1);
      setStoryProgress(0);
    } else {
      handlePrevStory();
    }
  };

  const handleRightClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentStatus = activeStatusesForViewer[activeStoryIndex];
    const images = currentStatus?.image_paths || [];

    if (images.length > 1 && activeStoryImageIndex < images.length - 1) {
      setActiveStoryImageIndex((prev) => prev + 1);
      setStoryProgress(0);
    } else {
      handleNextStory();
    }
  };

  const handleLikeToggle = (statusId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedStatuses((prev) => {
      const updated = { ...prev, [statusId]: !prev[statusId] };
      localStorage.setItem("liked_statuses", JSON.stringify(updated));
      return updated;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (imagePreviews.length + files.length > 10) {
      alert("Maksimal 10 gambar yang dapat diunggah");
      return;
    }

    const newPreviews: string[] = [];
    for (const file of files) {
      try {
        const compressed = await compressStatusImage(file);
        newPreviews.push(compressed);
      } catch (err) {
        console.error("Gagal memproses gambar status:", err);
      }
    }
    
    setImagePreviews((prev) => [...prev, ...newPreviews]);

    if (e.target) {
      e.target.value = "";
    }
  };

  const handlePostStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusText.trim() && !selectedEmoji && imagePreviews.length === 0) return;

    setIsSubmitting(true);
    try {
      await api.post("/users/status", {
        text: statusText,
        emoji: selectedEmoji,
        images: imagePreviews,
      });
      setStatusText("");
      setSelectedEmoji("");
      setImagePreviews([]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      fetchStatuses();
    } catch (err) {
      console.error("Gagal posting status:", err);
      alert("Gagal memperbarui status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRandomizeStatus = () => {
    const randomIndex = Math.floor(Math.random() * RANDOM_STATUS_TEMPLATES.length);
    const template = RANDOM_STATUS_TEMPLATES[randomIndex];
    setSelectedEmoji(template.emoji);
    setStatusText(template.text);
    composerInputRef.current?.focus();
  };

  const handleDeleteStatus = async (statusId: number) => {
    if (!window.confirm("Hapus postingan status ini?")) return;
    try {
      await api.delete(`/users/status/${statusId}`);
      fetchStatuses();
    } catch (err) {
      console.error("Gagal menghapus status:", err);
    }
  };

  const handleUserClick = async (usr: any, statusId: number) => {
    try {
      await api.post(`/users/status/${statusId}/view`);
    } catch (e) {}
    setActiveGroupRoom(null);
    setActiveChatUser(usr);
    setActiveSidebarTabs("chat");
  };

  const handlePostComment = async (statusId: number) => {
    const text = commentTexts[statusId];
    if (!text || !text.trim()) return;

    try {
      await api.post(`/users/status/${statusId}/comments`, { text });
      setCommentTexts((prev) => ({ ...prev, [statusId]: "" }));
      fetchStatuses();
    } catch (err) {
      console.error("Gagal menambahkan komentar:", err);
      alert("Gagal menambahkan komentar");
    }
  };

  const handleStoryCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyCommentText.trim()) return;

    const currentStatus = activeStatusesForViewer[activeStoryIndex];
    if (!currentStatus) return;

    try {
      await api.post(`/users/status/${currentStatus.status_id}/comments`, { text: storyCommentText });
      setStoryCommentText("");
      fetchStatuses();
    } catch (err) {
      console.error("Gagal membalas cerita:", err);
    }
  };

  const spawnParticles = (emoji: string) => {
    const newParticles = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      emoji,
      left: 45 + (Math.random() - 0.5) * 30, // center and spread
      rotation: (Math.random() - 0.5) * 75,
      delay: Math.random() * 0.15,
      duration: 1.2 + Math.random() * 0.8,
    }));

    setParticles((prev) => [...prev, ...newParticles].slice(-30));
  };

  const handleQuickReaction = async (emoji: string) => {
    const currentStatus = activeStatusesForViewer[activeStoryIndex];
    if (!currentStatus) return;

    spawnParticles(emoji);

    try {
      await api.post(`/users/status/${currentStatus.status_id}/comments`, { text: emoji });
      fetchStatuses();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostDeleteComment = async (statusId: number, commentId: number) => {
    if (!window.confirm("Hapus komentar ini?")) return;
    try {
      await api.delete(`/users/status/comments/${commentId}`);
      fetchStatuses();
    } catch (err) {
      console.error("Gagal menghapus komentar:", err);
    }
  };

  const formatLastSeen = (dateStr?: string) => {
    if (!dateStr) return "Tidak aktif";
    const parsedDate = new Date(dateStr);
    if (parsedDate instanceof Date && !isNaN(parsedDate.getTime())) {
      return formatDistanceToNow(parsedDate, {
        addSuffix: true,
        locale: localeID,
      });
    }
    return "Tidak aktif";
  };

  const formatDistanceSafe = (dateStr?: string, addSuffix: boolean = true) => {
    if (!dateStr) return "Baru saja";
    const parsedDate = new Date(dateStr);
    if (parsedDate instanceof Date && !isNaN(parsedDate.getTime())) {
      try {
        return formatDistanceToNow(parsedDate, {
          addSuffix,
          locale: localeID,
        });
      } catch {
        return "Baru saja";
      }
    }
    return "Baru saja";
  };

  const formatDateLabel = (dateStr?: string) => {
    if (!dateStr) return "";
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

  const renderCardImages = (paths?: string[], statusId?: number) => {
    if (!paths || paths.length === 0) return null;
    const count = paths.length;
    const handleImageClick = (e: React.MouseEvent, idx: number) => {
      e.stopPropagation();
      // Look up group/user details to display properly in the story modal slideshow
      const matchedFeedStatus = chronologicalFeed.find(s => s.status_id === statusId);
      if (matchedFeedStatus) {
        const groupUser = friendStatuses.find(g => g.user_id === matchedFeedStatus.user.user_id);
        if (groupUser) {
          const statusIdx = groupUser.statuses.findIndex((s: any) => s.status_id === statusId);
          setActiveStoryUser(groupUser);
          setActiveStoryIndex(statusIdx >= 0 ? statusIdx : 0);
          setActiveStoryImageIndex(idx);
        }
      } else {
        // Check myStatuses
        const myStatusIdx = myStatuses.findIndex(s => s.status_id === statusId);
        if (myStatusIdx >= 0 && myStoryGroup) {
          setActiveStoryUser(myStoryGroup);
          // Invert status index due to myStoryGroup array being reversed chronologically (oldest-to-newest)
          setActiveStoryIndex((myStoryGroup.statuses.length - 1) - myStatusIdx);
          setActiveStoryImageIndex(idx);
        }
      }
    };

    if (count === 1) {
      return (
        <div 
          onClick={(e) => handleImageClick(e, 0)}
          className="rounded-2xl overflow-hidden border border-gray-800 bg-[#0d0f14]/50 mt-3 hover:border-blue-500/35 transition-all duration-300 cursor-pointer shadow-lg overflow-hidden group/imgContainer"
        >
          <img 
            src={`${serverBase}${paths[0]}`} 
            alt="Attachment" 
            className="w-full object-cover max-h-72 group-hover/imgContainer:scale-[1.015] transition-all duration-500" 
          />
        </div>
      );
    }

    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden border border-gray-800 mt-3 bg-[#0d0f14]/30 max-h-56">
          {paths.map((p, idx) => (
            <div key={idx} onClick={(e) => handleImageClick(e, idx)} className="h-56 overflow-hidden relative cursor-pointer group/imgContainer">
              <img src={`${serverBase}${p}`} alt="Attachment" className="w-full h-full object-cover group-hover/imgContainer:scale-[1.03] transition-all duration-500" />
            </div>
          ))}
        </div>
      );
    }

    if (count === 3) {
      return (
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl overflow-hidden border border-gray-800 mt-3 bg-[#0d0f14]/30 h-44">
          {paths.map((p, idx) => (
            <div key={idx} onClick={(e) => handleImageClick(e, idx)} className="h-full overflow-hidden relative cursor-pointer group/imgContainer">
              <img src={`${serverBase}${p}`} alt="Attachment" className="w-full h-full object-cover group-hover/imgContainer:scale-[1.03] transition-all duration-500" />
            </div>
          ))}
        </div>
      );
    }

    const displayPaths = paths.slice(0, 4);
    const hasMore = count > 4;

    return (
      <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden border border-gray-800 mt-3 bg-[#0d0f14]/30 max-h-72">
        {displayPaths.map((p, idx) => {
          const isLast = idx === 3 && hasMore;
          return (
            <div key={idx} onClick={(e) => handleImageClick(e, idx)} className="h-36 overflow-hidden relative cursor-pointer group/imgContainer">
              <img src={`${serverBase}${p}`} alt="Attachment" className="w-full h-full object-cover group-hover/imgContainer:scale-[1.03] transition-all duration-500" />
              {isLast && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-white text-xs font-bold select-none backdrop-blur-[1px]">
                  +{count - 3} Foto
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d0f14] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent p-4 lg:p-7 relative select-none">
      
      {/* Custom Styles Injection */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(0.6) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(-380px) scale(1.5) rotate(var(--rot));
            opacity: 0;
          }
        }
        .particle-emoji {
          position: absolute;
          bottom: 80px;
          animation: floatUp 1.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
          pointer-events: none;
          font-size: 2.3rem;
          z-index: 100;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
        }
      `}} />

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />

      {/* Workspace */}
      <div className="max-w-5xl mx-auto w-full space-y-6">
        
        {/* Modern Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-600/10 via-[#161a26]/40 to-transparent border border-blue-500/10 rounded-2xl p-5 shadow-xl relative overflow-hidden flex-shrink-0">
          <div className="absolute right-0 top-0 w-36 h-36 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="flex items-center gap-3.5 z-10">
            <div className="w-11 h-11 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/5">
              <Activity className="text-blue-400" size={22} />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Status Dashboard 
                <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-normal tracking-wide animate-pulse">Stories & Feed</span>
              </h1>
              <p className="text-xs text-gray-400">Bagikan cerita harian, ekspresikan perasaan, dan lihat aktivitas teman Anda.</p>
            </div>
          </div>
        </div>
          
          {/* INSTAGRAM/WHATSAPP STYLE STORIES TRAY */}
          <div className="bg-[#121620]/80 border border-gray-800/80 rounded-2xl p-4 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Stories</span>
              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                <Compass size={11} className="text-blue-400" />
                Ketuk avatar untuk melihat
              </span>
            </div>
            
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1 select-none">
              
              {/* CURRENT USER STORY (MY STORY) */}
              <div className="flex flex-col items-center flex-shrink-0 cursor-pointer group">
                <div 
                  onClick={() => {
                    setActiveFeedTab("mine");
                  }}
                  className="relative"
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center p-[2px] transition-all duration-300 group-hover:scale-105 ${
                    myStatuses.length > 0 
                      ? "bg-gradient-to-tr from-blue-500 via-cyan-400 to-indigo-500" 
                      : "border-2 border-dashed border-gray-700"
                  }`}>
                    <img 
                      src={resolveAvatarUrl(profile?.profile?.avatar_url, profile?.username || "me")} 
                      alt="My Avatar" 
                      className="w-full h-full rounded-full object-cover border-2 border-[#121620]"
                    />
                  </div>
                  {/* Plus Badge */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="absolute bottom-0 right-0 w-5 h-5 bg-blue-600 border-2 border-[#121620] hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg transition-colors cursor-pointer"
                    title="Tambah status"
                  >
                    <Plus size={11} className="stroke-[3]" />
                  </button>
                </div>
                <span className="text-[11px] mt-1.5 text-gray-300 font-medium max-w-[65px] truncate">Cerita Anda</span>
              </div>

              {/* WATCH RANDOM STORY */}
              {chronologicalFeed.length > 0 && (
                <div 
                  onClick={() => {
                    const randomIdx = Math.floor(Math.random() * chronologicalFeed.length);
                    const randomStatus = chronologicalFeed[randomIdx];
                    const matchedGroup = friendStatuses.find(g => g.user_id === randomStatus.user.user_id);
                    if (matchedGroup) {
                      setActiveStoryUser(matchedGroup);
                      const sIdx = matchedGroup.statuses.findIndex((s: any) => s.status_id === randomStatus.status_id);
                      setActiveStoryIndex(sIdx >= 0 ? sIdx : 0);
                    }
                  }}
                  className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center p-[2px] transition-all duration-300 group-hover:scale-105 bg-gradient-to-tr from-yellow-500 via-orange-500 to-red-500">
                      <div className="w-full h-full rounded-full bg-[#121620] flex items-center justify-center border-2 border-[#121620]">
                        <Shuffle size={18} className="text-yellow-400 animate-pulse" />
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] mt-1.5 text-gray-300 font-medium max-w-[65px] truncate">Tonton Acak</span>
                </div>
              )}

              {/* FRIENDS STORIES LIST */}
              {friendStatuses.map((group) => {
                const avatar = resolveAvatarUrl(group.avatar, group.username);
                return (
                  <div 
                    key={group.user_id}
                    onClick={() => {
                      setActiveStoryUser(group);
                      setActiveStoryIndex(0);
                    }}
                    className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
                  >
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center p-[2px] transition-all duration-300 group-hover:scale-105 ${
                        group.has_unread
                          ? "bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500"
                          : "bg-gray-700"
                      }`}>
                        <img 
                          src={avatar} 
                          alt={group.username} 
                          className="w-full h-full rounded-full object-cover border-2 border-[#121620]"
                        />
                      </div>
                      {/* Live Online Badge */}
                      {onlineSet.has(group.user_id) && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#121620] rounded-full" />
                      )}
                    </div>
                    <span className="text-[11px] mt-1.5 text-gray-300 max-w-[65px] truncate font-medium">{group.username}</span>
                  </div>
                );
              })}

              {friendStatuses.length === 0 && (
                <div className="flex items-center h-14 pl-2 text-xs text-gray-500 italic select-none">
                  Belum ada status dari teman...
                </div>
              )}

            </div>
          </div>

          {/* THREADS/TWITTER STYLE COMPOSER */}
          <div className="bg-[#121620]/80 border border-gray-800/80 rounded-2xl p-5 shadow-lg backdrop-blur-md">
            <form onSubmit={handlePostStatus} className="space-y-4">
              <div className="flex gap-4">
                <img 
                  src={resolveAvatarUrl(profile?.profile?.avatar_url, profile?.username || "me")} 
                  alt="My Profile" 
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-800 cursor-pointer hover:opacity-80 transition-all duration-200"
                  onClick={() => setActiveFeedTab("mine")}
                  title="Klik untuk melihat status aktif Anda"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="bg-[#0b0d14]/40 border border-gray-800/80 rounded-xl focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all px-3 py-2 flex flex-col min-h-[65px]">
                    
                    {selectedEmoji && (
                      <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-lg px-2.5 py-1 w-fit mb-2 text-xs">
                        <span>{selectedEmoji}</span>
                        <button type="button" onClick={() => setSelectedEmoji("")} className="text-gray-400 hover:text-red-400 ml-1 cursor-pointer">
                          <X size={10} />
                        </button>
                      </div>
                    )}

                    <textarea
                      ref={composerInputRef}
                      placeholder="Bagikan apa yang sedang Anda lakukan..."
                      value={statusText}
                      onChange={(e) => setStatusText(e.target.value)}
                      className="w-full bg-transparent text-sm text-gray-200 placeholder-gray-500 border-none outline-none focus:outline-none focus:ring-0 resize-none h-8 p-0"
                      maxLength={250}
                    />

                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-5 gap-1.5 my-2">
                        {imagePreviews.map((preview, idx) => (
                          <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-800 bg-[#0d0f14] aspect-square flex items-center justify-center group/preview select-none">
                            <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setImagePreviews((prev) => prev.filter((_, i) => i !== idx))}
                              className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/80 hover:bg-red-600 text-white transition-all shadow-md cursor-pointer"
                            >
                              <X size={9} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-gray-800/40 pt-2.5 mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`flex items-center justify-center w-7 h-7 rounded-lg border transition-all cursor-pointer ${
                            imagePreviews.length > 0
                              ? "bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/20"
                              : "bg-[#121620] border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800"
                          }`}
                          title="Unggah Foto (Maks 10)"
                          disabled={imagePreviews.length >= 10}
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedEmoji(selectedEmoji ? "" : "💻")}
                          className={`flex items-center justify-center w-7 h-7 rounded-lg border transition-all cursor-pointer ${
                            selectedEmoji
                              ? "bg-amber-600/10 border-amber-500/30 text-amber-400"
                              : "bg-[#121620] border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800"
                          }`}
                          title="Pilih Emoji"
                        >
                          <Smile size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={handleRandomizeStatus}
                          className="flex items-center justify-center w-7 h-7 rounded-lg border bg-[#121620] border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 transition-all cursor-pointer"
                          title="Acak Status"
                        >
                          <Shuffle size={14} />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 font-medium">{statusText.length}/250</span>
                        <button
                          type="submit"
                          className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md border border-blue-500/50 transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-40 disabled:hover:scale-100"
                          disabled={isSubmitting || (!statusText.trim() && !selectedEmoji && imagePreviews.length === 0)}
                        >
                          <Send size={11} />
                          <span>Posting</span>
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              {showSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 p-2.5 rounded-xl justify-center animate-fadeIn">
                  <Check size={14} />
                  Status berhasil dibagikan!
                </div>
              )}

            </form>
          </div>

          {/* MAIN SOCIAL TIMELINE FEED */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/60 pb-3">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-blue-400" />
                <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Feed Status</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-400 bg-gray-800/40 px-2.5 py-1 rounded-full border border-gray-800/60">
                  {displayedFeed.length} postingan
                </span>
                
                {/* Feed filter tabs */}
                <div className="flex bg-[#0b0d14] p-0.5 rounded-xl border border-gray-800/60 text-[10px] font-bold gap-0.5 select-none">
                  <button
                    type="button"
                    onClick={() => setActiveFeedTab("public")}
                    className={`px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
                      activeFeedTab === "public"
                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    Semua Status
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFeedTab("friends")}
                    className={`px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
                      activeFeedTab === "friends"
                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    Status Teman
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFeedTab("mine")}
                    className={`px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
                      activeFeedTab === "mine"
                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    Status Saya
                  </button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-[#121620]/30 h-44 rounded-2xl border border-gray-850"></div>
                ))}
              </div>
            ) : displayedFeed.length === 0 ? (
              <div className="bg-[#121620]/30 border border-gray-850 rounded-2xl p-12 text-center text-gray-500 max-w-lg mx-auto">
                <Sparkles className="mx-auto text-gray-650 mb-3" size={32} />
                <p className="text-sm font-medium">Belum ada aktivitas terupdate dari teman Anda.</p>
                <p className="text-xs text-gray-650 mt-1">Status akan kedaluwarsa otomatis setelah 24 jam.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedFeed.map((st) => {
                  const isLiked = !!likedStatuses[st.status_id];
                  const avatar = resolveAvatarUrl(st.user.avatar, st.user.username);
                  
                  return (
                    <div 
                      key={st.status_id} 
                      className={`bg-[#121620]/80 border border-gray-800/85 hover:border-gray-700/60 rounded-2xl p-5 transition-all duration-300 shadow-md flex flex-col justify-between relative group ${
                        st.is_read ? "opacity-[0.88]" : ""
                      }`}
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div 
                            onClick={() => {
                              // Open that user's story
                              const matchedGroup = friendStatuses.find(g => g.user_id === st.user.user_id);
                              if (matchedGroup) {
                                setActiveStoryUser(matchedGroup);
                                const sIdx = matchedGroup.statuses.findIndex((s: any) => s.status_id === st.status_id);
                                setActiveStoryIndex(sIdx >= 0 ? sIdx : 0);
                              }
                            }}
                            className="relative flex-shrink-0 cursor-pointer"
                          >
                            <img 
                              src={avatar} 
                              alt={st.user.username} 
                              className="w-10 h-10 rounded-full object-cover border border-gray-800 shadow-inner" 
                            />
                            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#121620] ${
                              st.user.is_online ? "bg-green-500" : "bg-gray-600"
                            }`}></span>
                          </div>
                          
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-200 truncate hover:text-blue-400 cursor-pointer transition-colors">
                                {st.user.username}
                              </span>
                              {st.user.role === "admin" && (
                                <span className="text-[8px] font-extrabold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">ADMIN</span>
                              )}
                              {!st.is_read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Belum dibaca"></span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              {st.user.is_online ? (
                                <span className="text-green-500 font-medium">Online</span>
                              ) : (
                                <span>Aktif {formatLastSeen(st.user.last_seen)}</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Relative Expiration Time & Delete Option */}
                        <div className="text-[10px] text-gray-500 flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Clock size={10} />
                            {formatDistanceSafe(st.created_at, false)} yang lalu
                          </div>
                          {st.user.user_id === currentUserId && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteStatus(st.status_id);
                              }}
                              className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 transition-all flex-shrink-0 cursor-pointer"
                              title="Hapus Status"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Main Message Body */}
                      <div className="my-4 pl-1">
                        {st.text ? (
                          <p className="text-sm text-gray-300 leading-relaxed break-words font-normal">
                            {st.emoji && <span className="mr-1.5 text-base">{st.emoji}</span>}
                            {st.text}
                          </p>
                        ) : null}
                        {st.image_paths && st.image_paths.length > 0 && (
                          <div className="mt-1">{renderCardImages(st.image_paths, st.status_id)}</div>
                        )}
                      </div>

                      {/* Action Bar (Threads Style) */}
                      <div className="flex items-center gap-4 pt-2.5 border-t border-gray-800/40">
                        <button 
                          onClick={(e) => handleLikeToggle(st.status_id, e)} 
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            isLiked 
                              ? "bg-red-500/10 border-red-500/20 text-red-400 scale-105" 
                              : "bg-[#0b0d14]/30 border-gray-800 text-gray-400 hover:text-red-400 hover:border-red-500/20"
                          }`}
                        >
                          <Heart size={12} className={isLiked ? "fill-current scale-110" : ""} />
                          <span>{isLiked ? 1 : 0}</span>
                        </button>
                        
                        <button 
                          onClick={() => setExpandedComments((prev) => ({ ...prev, [st.status_id]: !prev[st.status_id] }))} 
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            expandedComments[st.status_id] 
                              ? "bg-blue-600/10 border-blue-500/30 text-blue-400" 
                              : "bg-[#0b0d14]/30 border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white"
                          }`}
                        >
                          <MessageSquare size={12} />
                          <span>{st.comments?.length || 0}</span>
                        </button>
                        
                        {relations && st.user.user_id !== currentUserId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const isBookmarked = relations.isStatusSaved(st.status_id);
                              if (isBookmarked) {
                                relations.unsaveStatus(st.status_id);
                              } else {
                                relations.saveStatus({
                                  status_id: st.status_id,
                                  user_id: st.user.user_id,
                                  username: st.user.username,
                                  avatar: avatar,
                                  text: st.text || "",
                                  emoji: st.emoji || "",
                                  image_paths: st.image_paths || [],
                                  created_at: st.created_at,
                                  saved_at: new Date().toISOString()
                                });
                              }
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                              relations.isStatusSaved(st.status_id)
                                ? "bg-amber-600/10 border-amber-500/30 text-amber-400 scale-105"
                                : "bg-[#0b0d14]/30 border-gray-800 hover:border-amber-500/20 text-gray-400 hover:text-amber-400"
                            }`}
                            title="Simpan Status"
                          >
                            <Bookmark size={12} className={relations.isStatusSaved(st.status_id) ? "fill-current" : ""} />
                          </button>
                        )}
                        
                        {st.user.user_id !== currentUserId && (
                          <button 
                            onClick={() => handleUserClick(st.user, st.status_id)} 
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0b0d14]/30 border border-gray-800 hover:border-blue-500/30 text-gray-400 hover:text-blue-400 transition-all text-xs font-semibold cursor-pointer ml-auto"
                          >
                            <Send size={11} />
                            <span>Kirim Pesan</span>
                          </button>
                        )}
                      </div>

                      {/* Comments Collapsible Panel */}
                      {expandedComments[st.status_id] && (
                        <div className="mt-4 pt-3.5 border-t border-gray-800/80 space-y-3">
                          <h4 className="text-[10px] font-bold text-gray-505 uppercase tracking-wider">Komentar</h4>
                          
                          {st.comments && st.comments.length > 0 ? (
                            <div className="space-y-2.5 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-850 pr-1">
                              {st.comments.map((comment: any) => {
                                const commenterAvatar = resolveAvatarUrl(comment.user?.profile?.profile_picture || comment.user?.profile?.avatar_url, comment.user?.username || 'syncus');
                                const canDelete = comment.user?.user_id === currentUserId || st.user.user_id === currentUserId;
                                return (
                                  <div key={comment.comment_id} className="flex gap-2.5 bg-[#0b0d14]/20 p-2.5 rounded-xl border border-gray-850/60 relative group/comment">
                                    <img src={commenterAvatar} alt="Commenter" className="w-7.5 h-7.5 rounded-full object-cover border border-gray-800" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-bold text-gray-300">{comment.user?.username || "User"}</span>
                                        <span className="text-[8px] text-gray-500">{formatDateLabel(comment.created_at)}</span>
                                      </div>
                                      <p className="text-[11px] text-gray-300 mt-0.5 break-words leading-relaxed">{comment.text}</p>
                                    </div>
                                    {canDelete && (
                                      <button 
                                        onClick={() => handlePostDeleteComment(st.status_id, comment.comment_id)} 
                                        className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 opacity-0 group-hover/comment:opacity-100 transition-opacity absolute right-2 top-2 cursor-pointer" 
                                        title="Hapus Komentar"
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-550 italic text-center py-2 select-none">Belum ada komentar. Tulis komentar pertama!</p>
                          )}
                          
                          <form 
                            onSubmit={(e) => { e.preventDefault(); handlePostComment(st.status_id); }} 
                            className="flex items-center gap-2 pt-1.5"
                          >
                            <input 
                              type="text" 
                              placeholder="Tulis komentar..." 
                              value={commentTexts[st.status_id] || ""} 
                              onChange={(e) => setCommentTexts(prev => ({ ...prev, [st.status_id]: e.target.value }))} 
                              className="flex-1 bg-[#0b0d14]/60 border border-gray-800 focus:border-blue-500/60 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none placeholder-gray-500" 
                              maxLength={250} 
                            />
                            <button 
                              type="submit" 
                              className="p-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50 cursor-pointer disabled:opacity-40" 
                              disabled={!(commentTexts[st.status_id] || "").trim()}
                            >
                              <Send size={11} />
                            </button>
                          </form>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[9px] text-gray-500 pt-3 mt-3 border-t border-gray-800/40">
                        <span>{st.user.country || "ID"} · {st.user.gender || "Laki-laki"}</span>
                        {st.created_at && (
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar size={8} />{formatDateLabel(st.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      {/* FULLSCREEN STORIES MODAL SLIDESHOW */}
      {activeStoryUser && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
          
          {/* Particle Animation Layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((p) => (
              <span
                key={p.id}
                className="particle-emoji"
                style={{
                  left: `${p.left}%`,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                  "--rot": `${p.rotation}deg`,
                } as any}
              >
                {p.emoji}
              </span>
            ))}
          </div>

          {/* Close Button */}
          <button 
            onClick={() => setActiveStoryUser(null)} 
            className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-gray-900/80 hover:bg-gray-800 text-white transition-all shadow-md cursor-pointer border border-gray-800 hover:scale-105"
          >
            <X size={20} />
          </button>

          {/* Navigation Controls (chevrons visible on desktop hover) */}
          <button 
            onClick={handleLeftClick}
            className="absolute left-6 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center p-3 rounded-full bg-gray-900/60 text-white hover:bg-gray-800 hover:scale-105 transition-all border border-gray-800 z-50 cursor-pointer"
            title="Cerita Sebelumnya"
          >
            <ChevronLeft size={24} />
          </button>
          
          <button 
            onClick={handleRightClick}
            className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center p-3 rounded-full bg-gray-900/60 text-white hover:bg-gray-800 hover:scale-105 transition-all border border-gray-800 z-50 cursor-pointer"
            title="Cerita Selanjutnya"
          >
            <ChevronRight size={24} />
          </button>

          {/* Main Story Container Card */}
          <div 
            className="relative flex flex-col justify-between w-full max-w-md h-[85vh] max-h-[720px] bg-[#0c0d14] rounded-2xl border border-gray-800 overflow-hidden shadow-2xl"
            onClick={(e) => {
              // Clicking left 30% of card navigates back, right 30% advances
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const width = rect.width;
              if (clickX < width * 0.3) {
                handleLeftClick();
              } else if (clickX > width * 0.7) {
                handleRightClick();
              }
            }}
          >
            
            {/* TOP BAR: Segments and Profile Details */}
            <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/85 via-black/40 to-transparent p-4.5 pt-3.5 z-20 flex flex-col gap-3">
              
              {/* Segmented Progress Indicators */}
              <div className="flex gap-1.5 w-full">
                {activeStatusesForViewer.map((s, idx) => {
                  let fillWidth = "0%";
                  if (idx < activeStoryIndex) {
                    fillWidth = "100%";
                  } else if (idx === activeStoryIndex) {
                    fillWidth = `${storyProgress}%`;
                  }
                  return (
                    <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white transition-all ease-linear"
                        style={{ 
                          width: fillWidth,
                          transitionDuration: idx === activeStoryIndex ? "40ms" : "0ms" 
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* User Identity Details & Control Actions */}
              <div className="flex items-center justify-between select-none">
                <div className="flex items-center gap-2.5">
                  <img 
                    src={activeStoryUser.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${activeStoryUser.username}`} 
                    alt="Active Poster" 
                    className="w-9 h-9 rounded-full object-cover border border-white/20"
                  />
                  <div className="leading-tight">
                    <span className="text-xs font-bold text-white block">{activeStoryUser.username}</span>
                    <span className="text-[9px] text-gray-300">
                      {formatDistanceSafe(activeStatusesForViewer[activeStoryIndex]?.created_at, true)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => setIsStoryPaused(!isStoryPaused)}
                    className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title={isStoryPaused ? "Putar cerita" : "Jeda cerita"}
                  >
                    {isStoryPaused ? <Play size={15} /> : <Pause size={15} />}
                  </button>
                  <button 
                    onClick={() => setActiveStoryUser(null)}
                    className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer md:hidden"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

            </div>

            {/* CENTRAL VIEW AREA: Media Content or Gradient Typography */}
            <div className="flex-1 flex items-center justify-center relative w-full h-full">
              {(() => {
                const currentStatus = activeStatusesForViewer[activeStoryIndex];
                if (!currentStatus) return null;

                const hasImages = currentStatus.image_paths && currentStatus.image_paths.length > 0;
                
                if (hasImages) {
                  const paths = currentStatus.image_paths;
                  const activeImgPath = paths[activeStoryImageIndex];
                  return (
                    <div className="relative w-full h-full flex items-center justify-center bg-[#07080c]">
                      <img 
                        src={`${serverBase}${activeImgPath}`} 
                        alt="Story Attachment Slide" 
                        className="max-w-full max-h-full object-contain"
                      />
                      
                      {/* Image pagination indicator if status contains multiple images */}
                      {paths.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full text-[10px] text-gray-300 font-semibold tracking-wider backdrop-blur-[2px] z-20">
                          Foto {activeStoryImageIndex + 1} / {paths.length}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  // Text-only: display styled gradient banner
                  const gradient = getStoryGradient(currentStatus.status_id);
                  return (
                    <div className={`w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br ${gradient} relative`}>
                      <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
                      <div className="relative z-10 flex flex-col items-center max-w-[85%]">
                        {currentStatus.emoji && (
                          <span className="text-5xl mb-4.5 filter drop-shadow-lg animate-bounce duration-[3s]">
                            {currentStatus.emoji}
                          </span>
                        )}
                        <h2 className="text-xl sm:text-2xl font-bold text-center leading-relaxed text-white tracking-wide font-sans select-text select-none drop-shadow">
                          "{currentStatus.text}"
                        </h2>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>

            {/* BOTTOM PANEL: Direct Reply Composer & Emoji Reaction Bar */}
            <div 
              className="bg-gradient-to-t from-black via-black/85 to-transparent p-4 pb-5 flex flex-col gap-3.5 z-20 select-none"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Quick Emojis Reaction Tray */}
              <div className="flex justify-around items-center px-1.5">
                {["❤️", "😂", "😮", "🔥", "👍", "🎉"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleQuickReaction(emoji)}
                    className="text-2xl hover:scale-130 active:scale-95 transition-transform duration-200 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Chat Input form inside Viewer */}
              <form onSubmit={storyCommentText.trim() ? handleStoryCommentSubmit : (e) => e.preventDefault()} className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder={`Kirim balasan ke ${activeStoryUser.username}...`} 
                  value={storyCommentText}
                  onChange={(e) => setStoryCommentText(e.target.value)}
                  onFocus={() => setIsStoryPaused(true)}
                  onBlur={() => setIsStoryPaused(false)}
                  className="flex-1 bg-[#121620]/90 border border-gray-800 focus:border-blue-500/70 rounded-full px-4.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none backdrop-blur-sm"
                  maxLength={200}
                />
                <button 
                  type="submit" 
                  className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white cursor-pointer disabled:opacity-40 border border-blue-500/30"
                  disabled={!storyCommentText.trim()}
                >
                  <Send size={12} />
                </button>
              </form>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
