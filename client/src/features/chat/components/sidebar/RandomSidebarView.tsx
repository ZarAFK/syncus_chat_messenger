import React, { useState, useEffect } from "react";
import { Search, Sparkles, MessageSquare, AlertCircle, CircleUser } from "lucide-react";
import { chatService } from "@/features/chat/services/chatServices";

interface RandomSidebarViewProps {
  onSelectPartner: (partnerId: number) => void;
  activePartnerId: number | null;
  onStartMatch: () => void;
}

export const RandomSidebarView: React.FC<RandomSidebarViewProps> = ({
  onSelectPartner,
  activePartnerId,
  onStartMatch,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"all" | "people" | "unread">("all");
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load partners from localStorage and fetch their profiles
  const loadPartners = async () => {
    setLoading(true);
    try {
      const savedIdsStr = localStorage.getItem("syncus_random_chat_partners");
      const savedIds: number[] = savedIdsStr ? JSON.parse(savedIdsStr) : [];

      if (savedIds.length === 0) {
        setPartners([]);
        return;
      }

      // Fetch all users to map IDs to details
      const allUsers = await chatService.getAllUser();
      const matchedUsers = allUsers
        .filter((u: any) => savedIds.includes(u.user_id))
        .map((u: any) => {
          // Mock an unread state for demo purposes if ID is even
          const isUnread = u.user_id % 2 === 0;
          return {
            ...u,
            isUnread,
          };
        });

      setPartners(matchedUsers);
    } catch (err) {
      console.error("Failed to load random partners:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
    // Set up an interval to refresh the partner list in case a new partner is matched
    const interval = setInterval(loadPartners, 3000);
    return () => clearInterval(interval);
  }, []);

  // Filter based on search query and sub-tab selection
  const filteredPartners = partners.filter((p) => {
    // We display them anonymously, but search can match their anonymous name or details
    const anonName = `Anonymous User #${p.user_id}`;
    const matchesSearch = anonName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.country && p.country.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (activeSubTab === "unread") {
      return p.isUnread;
    }
    if (activeSubTab === "people") {
      return p.role === "user"; // filter only users
    }
    return true; // "all"
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d0f14] min-h-0 select-none">
      {/* Search Box */}
      <div className="p-4 border-b border-gray-850">
        <div className="flex items-center gap-2.5 bg-[#161b26] border border-gray-800/80 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search anonymous chats..."
            className="w-full bg-transparent border-none outline-none text-xs text-white placeholder-gray-500"
          />
        </div>
      </div>

      {/* Tabs list (All, People, Unread) */}
      <div className="flex border-b border-gray-850 px-2.5 py-2.5 text-xs font-bold gap-1 bg-gray-950/20">
        <button
          onClick={() => setActiveSubTab("all")}
          className={`flex-1 py-1.5 text-center rounded-lg transition duration-200 cursor-pointer ${
            activeSubTab === "all"
              ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
              : "text-gray-400 hover:text-gray-200 hover:bg-gray-850/30"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveSubTab("people")}
          className={`flex-1 py-1.5 text-center rounded-lg transition duration-200 cursor-pointer ${
            activeSubTab === "people"
              ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
              : "text-gray-400 hover:text-gray-200 hover:bg-gray-850/30"
          }`}
        >
          People
        </button>
        <button
          onClick={() => setActiveSubTab("unread")}
          className={`flex-1 py-1.5 text-center rounded-lg transition duration-200 cursor-pointer relative ${
            activeSubTab === "unread"
              ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
              : "text-gray-400 hover:text-gray-200 hover:bg-gray-850/30"
          }`}
        >
          Unread
          {partners.some((p) => p.isUnread) && (
            <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
          )}
        </button>
      </div>

      {/* List of matched partners */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-850 scrollbar-track-transparent">
        {filteredPartners.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-500 italic flex flex-col items-center gap-2 mt-8">
            <AlertCircle size={28} className="text-gray-600" />
            <span>Belum ada chat random yang aktif</span>
          </div>
        ) : (
          filteredPartners.map((p) => {
            const isActive = activePartnerId === p.user_id;
            return (
              <div
                key={p.user_id}
                onClick={() => onSelectPartner(p.user_id)}
                className={`flex items-center justify-between p-3.5 mx-2.5 my-1.5 rounded-xl cursor-pointer transition-all duration-200 border ${
                  isActive
                    ? "bg-blue-500/10 border-blue-500/25 text-white"
                    : "bg-[#121620]/30 hover:bg-[#121620]/60 border-transparent text-gray-300"
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  {/* Anonymous Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0 relative">
                    <CircleUser size={20} className="text-gray-400" />
                    {p.is_online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-gray-900 rounded-full shadow-[0_0_6px_#22c55e]" />
                    )}
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-gray-200">
                      Anonymous User #{p.user_id}
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {p.gender ? `${p.gender.toUpperCase()} • ` : ""}
                      {p.country || "Unknown"}
                    </p>
                  </div>
                </div>

                {p.isUnread && (
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 ml-2 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Match Button */}
      <div className="p-4 border-t border-gray-850">
        <button
          onClick={onStartMatch}
          className="w-full py-3 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 active:scale-[0.98] cursor-pointer"
        >
          <Sparkles size={14} className="animate-pulse" />
          <span>Match Random Chat</span>
        </button>
      </div>
    </div>
  );
};
