import React, { useState, useMemo, useRef } from "react";
import { Radio, Search, Plus, RadioTower, Image as ImageIcon, Sparkles, Loader } from "lucide-react";
import api from "@/features/auth/services/auth.api";
import { resolveAvatarUrl } from "@/shared/utils/avatarUtils";
import { GroupSidebarItem } from "../groupsidebar/groupsidebaritem";

interface ChannelsSidebarViewProps {
  groups: any[];
  activeGroupRoom: any | null;
  setActiveGroupRoom: (room: any | null) => void;
  setActiveChatUser: (user: any | null) => void;
  currentUserId: number;
  socket: any;
  setGroups?: (groups: any[]) => void;
}

export const ChannelsSidebarView: React.FC<ChannelsSidebarViewProps> = ({
  groups,
  activeGroupRoom,
  setActiveGroupRoom,
  setActiveChatUser,
  currentUserId,
  socket,
  setGroups,
}) => {
  const [tab, setTab] = useState<"explore" | "create">("explore");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Create Channel Form State
  const [channelName, setChannelName] = useState("");
  const [channelDesc, setChannelDesc] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter groups that are marked as channels
  const channelsList = useMemo(() => {
    return groups.filter((g) => g.room_description?.startsWith("[CHANNEL]"));
  }, [groups]);

  // Apply search query filter
  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channelsList;
    return channelsList.filter((c) =>
      c.room_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.room_description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [channelsList, searchQuery]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim() || !socket || isSubmitting) return;

    setIsSubmitting(true);
    const descriptionPayload = `[CHANNEL] ${channelDesc.trim()}`;

    socket.emit(
      "createRoom",
      {
        room_name: channelName.trim(),
        room_description: descriptionPayload,
        age_limit: 0,
        rule: "",
        category_room_id: 1, // General Category
        creator_id: currentUserId,
      },
      async (response: any) => {
        if (response && response.success) {
          let newRoom = response.data;

          // If there is an image, upload it using REST endpoint
          if (selectedFile) {
            const formData = new FormData();
            formData.append("picture", selectedFile);
            try {
              const uploadRes = await api.patch(`/rooms/${newRoom.room_id}/picture`, formData, {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              });
              if (uploadRes.data && uploadRes.data.room_picture) {
                newRoom.room_picture = uploadRes.data.room_picture;
              }
            } catch (err) {
              console.error("Gagal mengunggah foto profil channel:", err);
            }
          }

          // Reload the room list
          socket.emit("findAllRooms", {}, (res: any) => {
            if (res && res.success) {
              if (setGroups) setGroups(res.data || []);
            }
            setIsSubmitting(false);
            
            // Switch back to list view and activate new channel
            setActiveChatUser(null);
            setActiveGroupRoom(newRoom);
            setTab("explore");
            
            // Clear form
            setChannelName("");
            setChannelDesc("");
            setSelectedFile(null);
            setImagePreview("");
          });
        } else {
          console.error("Gagal membuat channel:", response?.error || "Error");
          setIsSubmitting(false);
        }
      }
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0d0f14]">
      {/* Header Tabs */}
      <div className="flex border-b border-gray-800 bg-gray-950/40 select-none">
        <button
          type="button"
          onClick={() => setTab("explore")}
          className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors
            ${tab === "explore"
              ? "text-blue-450 border-b-2 border-blue-500"
              : "text-gray-400 hover:text-blue-400"
            }`}
        >
          <Radio size={14} />
          Explore Channels
        </button>
        <button
          type="button"
          onClick={() => setTab("create")}
          className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors
            ${tab === "create"
              ? "text-blue-450 border-b-2 border-blue-500"
              : "text-gray-400 hover:text-blue-400"
            }`}
        >
          <Plus size={14} />
          Create Channel
        </button>
      </div>

      {tab === "explore" ? (
        <>
          {/* Search Box */}
          <div className="p-2.5 bg-[#0d0f14] border-b border-gray-800/40">
            <div className="relative flex items-center">
              <Search className="absolute left-3 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Cari channel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#161a24] text-white placeholder-gray-500 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Channels List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            {filteredChannels.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-500">
                <RadioTower size={32} className="text-gray-600 mb-2" />
                <span className="text-xs italic">
                  {searchQuery ? "Channel tidak ditemukan" : "Belum ada channel publik aktif"}
                </span>
              </div>
            ) : (
              filteredChannels.map((chan) => {
                // Strip [CHANNEL] prefix for clean UI display
                const cleanDesc = chan.room_description?.replace("[CHANNEL]", "").trim() || "Public Channel";
                const followerCount = chan.roomMembers?.length || 0;
                
                return (
                  <GroupSidebarItem
                    key={chan.room_id}
                    nameGroup={chan.room_name}
                    description={cleanDesc}
                    online={followerCount}
                    picture={chan.room_picture}
                    badgeText={`${followerCount} followers`}
                    isActive={activeGroupRoom?.room_id === chan.room_id}
                    onClick={() => {
                      setActiveChatUser(null);
                      setActiveGroupRoom(chan);
                    }}
                  />
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Create Channel Form */
        <form onSubmit={handleCreateChannel} className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          <div className="text-center pb-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <Sparkles size={12} className="text-blue-450" /> Buat Channel Baru
            </h3>
            <p className="text-[10px] text-gray-500 mt-1">Siarkan informasi penting ke pengguna secara satu arah.</p>
          </div>

          {/* Image Upload Input */}
          <div className="flex flex-col items-center space-y-2">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 rounded-full border border-gray-800 bg-[#161a24] hover:bg-[#1f2636] flex items-center justify-center cursor-pointer transition-all overflow-hidden relative group"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={22} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-white transition-opacity font-bold">
                PILIH FOTO
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <span className="text-[10px] text-gray-500 font-medium">Foto Profil Channel</span>
          </div>

          {/* Channel Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Nama Channel</label>
            <input
              type="text"
              placeholder="Masukkan nama channel..."
              required
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              className="w-full bg-[#161a24] text-white border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-600"
            />
          </div>

          {/* Channel Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Deskripsi Channel</label>
            <textarea
              placeholder="Jelaskan apa isi dari channel ini..."
              rows={4}
              value={channelDesc}
              onChange={(e) => setChannelDesc(e.target.value)}
              className="w-full bg-[#161a24] text-white border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-600 resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !channelName.trim()}
            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-505 hover:to-indigo-600 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-500/5 transition-all text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader size={14} className="animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <RadioTower size={14} />
                Publikasikan Channel
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
