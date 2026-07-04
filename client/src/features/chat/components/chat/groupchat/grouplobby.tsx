import React, { useState } from "react";
import { Search, Filter, Plus, X, Users } from "lucide-react";
import { GroupInfoModal } from "./GroupInfoModal";

interface GroupLobbyProps {
  socket: any;
  currentUserId: number;
  onJoinGroup: (room: any) => void;
  groups: any[];
}

export const GroupLobby: React.FC<GroupLobbyProps> = ({
  socket,
  currentUserId,
  onJoinGroup,
  groups = [],
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoomForInfo, setSelectedRoomForInfo] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ageLimit, setAgeLimit] = useState(0);
  const [rule, setRule] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");

  const handleCreate = () => {
    if (!name.trim() || !socket) return;
    setLoading(true);

    socket.emit(
      "createRoom",
      {
        room_name: name.trim(),
        room_description: description.trim(),
        age_limit: Number(ageLimit),
        rule: rule.trim(),
        category_room_id: 1, // General
        creator_id: currentUserId,
      },
      (response: any) => {
        setLoading(false);
        if (response && response.success) {
          const newRoom = response.data;
          setShowCreateModal(false);
          // Reset form
          setName("");
          setDescription("");
          setAgeLimit(0);
          setRule("");
          // Automatically join chat
          onJoinGroup(newRoom);
        } else {
          alert("Gagal membuat grup: " + (response?.error || "Error tidak diketahui"));
        }
      }
    );
  };

  const filteredGroups = groups.filter((g) => {
    const matchesSearch = g.room_name?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (activeTab === "mine") {
      const isCreator = g.creator?.user_id === currentUserId || g.creator_id === currentUserId;
      return isCreator;
    }
    return true;
  });


  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0c10] overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        
        {/* Search & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 bg-[#161b26] border border-gray-800/80 rounded-xl px-4 py-2.5 flex-1 max-w-md">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search active rooms..."
              className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-gray-500"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all active:scale-95 cursor-pointer shadow-lg shadow-blue-500/15"
          >
            <Plus size={18} />
            <span>Create Group</span>
          </button>
        </div>

        {/* Create group banner */}
        <div className="border border-gray-800/60 rounded-2xl p-6 bg-gradient-to-br from-[#121620] to-[#0e1118] relative overflow-hidden shadow-xl">
          <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
          <h3 className="text-xl font-bold text-white tracking-wide">SyncUs Public Rooms</h3>
          <p className="text-sm text-gray-400 mt-2 max-w-lg leading-relaxed">
            Temukan berbagai komunitas menarik atau buat grup obrolan publik Anda sendiri. Undang pengguna lain dan mulailah berdiskusi secara real-time.
          </p>
        </div>

        <div>
          {/* Room Tabs */}
          <div className="border-b border-gray-800 flex items-center justify-between mb-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("all")}
                className={`pb-3 px-1 text-sm font-bold transition-all relative cursor-pointer ${
                  activeTab === "all" ? "text-blue-500" : "text-gray-400 hover:text-white"
                }`}
              >
                Semua Grup
                {activeTab === "all" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("mine")}
                className={`pb-3 px-1 text-sm font-bold transition-all relative cursor-pointer ${
                  activeTab === "mine" ? "text-blue-500" : "text-gray-400 hover:text-white"
                }`}
              >
                Grup Saya
                {activeTab === "mine" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full" />
                )}
              </button>
            </div>
            <button className="p-2 rounded-lg hover:bg-gray-800/50 text-gray-400 mb-2">
              <Filter className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGroups.length === 0 ? (
              <div className="col-span-full border border-dashed border-gray-800 rounded-2xl p-12 text-center text-gray-500">
                <Users size={40} className="mx-auto mb-4 text-gray-600 animate-pulse" />
                <p className="text-sm font-medium">Tidak ada grup obrolan publik ditemukan</p>
                <p className="text-xs text-gray-400 mt-1">Buat grup baru untuk menjadi yang pertama!</p>
              </div>
            ) : (
              filteredGroups.map((g) => (
                <div
                  key={g.room_id}
                  className="flex flex-col justify-between border border-gray-800/60 hover:border-gray-800 rounded-2xl p-5 bg-[#121620]/60 hover:bg-[#121620]/80 transition-all duration-300 shadow-md group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 
                        onClick={() => setSelectedRoomForInfo(g)}
                        className="font-bold text-lg text-white group-hover:text-blue-400 hover:underline transition-colors truncate cursor-pointer"
                      >
                        {g.room_name}
                      </h3>
                      {g.age_limit > 0 && (
                        <span className="text-[10px] bg-red-950/40 border border-red-900/50 text-red-400 px-2 py-0.5 rounded-full font-semibold">
                          {g.age_limit}+
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed min-h-[32px]">
                      {g.room_description || "Tidak ada deskripsi."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-800/60 pt-4 mt-4">
                    <span className="text-[11px] text-gray-400 bg-[#161b26] border border-gray-805 px-3 py-1 rounded-lg truncate max-w-[200px]">
                      Rule: {g.rule || "Sopan & Santun"}
                    </span>
                    <button
                      onClick={() => onJoinGroup(g)}
                      className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4.5 py-2 rounded-xl transition-all cursor-pointer shadow-md shadow-blue-500/5"
                    >
                      Join Chat
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121620] border border-gray-800/60 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60">
              <h3 className="font-bold text-lg text-white">Create Public Group</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Group Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Roblox Gamers"
                  className="w-full bg-[#161b26] border border-gray-800 text-white rounded-xl px-4.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-550"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                    value={ageLimit}
                    onChange={(e) => setAgeLimit(Number(e.target.value))}
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
                  value={rule}
                  onChange={(e) => setRule(e.target.value)}
                  placeholder="Describe group rules (one rule per line)..."
                  rows={3}
                  className="w-full bg-[#161b26] border border-gray-800 text-white rounded-xl px-4.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-550 resize-none scrollbar-thin"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#0d0f14]/80 border-t border-gray-800/60">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4.5 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={loading || !name.trim()}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm transition-all active:scale-95 cursor-pointer"
              >
                {loading ? "Creating..." : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedRoomForInfo && (() => {
        const resolvedSelectedRoom = groups.find(r => r.room_id === selectedRoomForInfo.room_id) || selectedRoomForInfo;
        return (
          <GroupInfoModal
            room={resolvedSelectedRoom}
            currentUserId={currentUserId}
            socket={socket}
            onClose={() => setSelectedRoomForInfo(null)}
          />
        );
      })()}
    </div>
  );
};
