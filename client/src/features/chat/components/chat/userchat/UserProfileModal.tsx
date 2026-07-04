import React from "react";
import { X, UserPlus, UserMinus, Star, Ban } from "lucide-react";
import { UserRelations } from "../../../hooks/useUserRelations";
import { resolveAvatarUrl } from "@/shared/utils/avatarUtils";

interface UserProfileModalProps {
  user: any;
  relations: UserRelations;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  relations,
  onClose,
}) => {
  if (!user) return null;

  const isFriend = relations.isFriend(user.user_id);
  const isFavorite = relations.isFavorite(user.user_id);
  const isBlocked = relations.isBlocked(user.user_id);
  const isPendingIncoming = relations.isPendingIncoming?.(user.user_id) || false;
  const isPendingOutgoing = relations.isPendingOutgoing?.(user.user_id) || false;
  const rel = relations.getRelation?.(user.user_id);

  // Avatar using resolveAvatarUrl (handles relative paths) or Dicebear fallback
  const avatar = resolveAvatarUrl(user.profile?.avatar_url, user.username);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121620] border border-gray-800/80 rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden flex flex-col relative animate-scaleUp">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800/60 transition cursor-pointer z-10"
        >
          <X size={18} />
        </button>

        {/* Profile Card Header */}
        <div className="relative pt-12 pb-6 px-6 flex flex-col items-center border-b border-gray-800/50 bg-gradient-to-b from-[#161b26]/50 to-transparent">
          {/* Avatar Container */}
          <div className="relative">
            <img
              src={avatar}
              alt={user.username}
              className="w-24 h-24 rounded-full bg-gray-800 border-2 border-blue-500 shadow-xl"
            />
            {user.is_online && (
              <span className="absolute bottom-1 right-1 w-4.5 h-4.5 bg-green-500 border-3 border-[#121620] rounded-full"></span>
            )}
          </div>

          <h3 className="text-xl font-bold text-white mt-4">@{user.username}</h3>
          <span className="text-xs text-gray-400 mt-1">
            {user.role === "admin" ? "🛡️ Admin" : "👤 User"}
          </span>
        </div>

        {/* Profile Details Content */}
        <div className="px-6 py-5 space-y-4 flex-1">
          {/* Bio */}
          <div>
            <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Bio</span>
            <p className="text-sm text-gray-300 mt-1 leading-relaxed">
              {user.profile?.bio || "No bio set yet."}
            </p>
          </div>

          {/* Details Row */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-center">
            <div className="bg-[#161b26] p-2.5 rounded-xl border border-gray-800/40">
              <span className="block text-[9px] text-gray-500 font-bold uppercase">Age</span>
              <span className="text-xs font-semibold text-white mt-0.5 block">{user.age || "N/A"}</span>
            </div>
            <div className="bg-[#161b26] p-2.5 rounded-xl border border-gray-800/40">
              <span className="block text-[9px] text-gray-500 font-bold uppercase">Gender</span>
              <span className="text-xs font-semibold text-white mt-0.5 block capitalize">{user.gender || "Other"}</span>
            </div>
            <div className="bg-[#161b26] p-2.5 rounded-xl border border-gray-800/40">
              <span className="block text-[9px] text-gray-500 font-bold uppercase">Country</span>
              <span className="text-xs font-semibold text-white mt-0.5 block uppercase">{user.country || "ID"}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-[#0d0f14]/80 border-t border-gray-800/60 flex flex-col gap-2.5">
          {/* Add/Remove Friend & Favorite Row */}
          {/* Add/Remove Friend & Favorite Row */}
          <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-2.5 w-full">
              {/* Friend button conditional render */}
              {isFriend ? (
                <button
                  onClick={() => relations.removeFriend(user.user_id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-xs transition active:scale-95 cursor-pointer bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30"
                >
                  <UserMinus size={15} />
                  <span>Unfriend</span>
                </button>
              ) : isPendingOutgoing ? (
                <button
                  onClick={() => relations.removeFriend(user.user_id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-xs transition active:scale-95 cursor-pointer bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30"
                  title="Cancel Request"
                >
                  <X size={15} />
                  <span>Request Sent (Cancel)</span>
                </button>
              ) : isPendingIncoming ? (
                <div className="flex-1 flex gap-2">
                  <button
                    onClick={() => relations.acceptFriendRequest(rel.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 px-2 rounded-xl font-semibold text-[11px] transition active:scale-95 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/10"
                  >
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => relations.rejectFriendRequest(rel.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 px-2 rounded-xl font-semibold text-[11px] transition active:scale-95 cursor-pointer bg-red-650 hover:bg-red-700 text-white shadow-md shadow-red-500/10"
                  >
                    <span>Decline</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => relations.addFriend(user.user_id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-xs transition active:scale-95 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10"
                >
                  <UserPlus size={15} />
                  <span>Add Friend</span>
                </button>
              )}

              {/* Favorite button */}
              <button
                onClick={() => relations.toggleFavorite(user.user_id)}
                className={`flex items-center justify-center p-2.5 w-11 h-11 rounded-xl border transition active:scale-95 cursor-pointer ${
                  isFavorite
                    ? "bg-amber-500/10 border-amber-500 text-amber-500"
                    : "bg-transparent border-gray-800 text-gray-400 hover:text-gray-200"
                }`}
                title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              >
                <Star size={18} fill={isFavorite ? "currentColor" : "none"} />
              </button>
            </div>
          </div>

          {/* Block button */}
          <button
            onClick={() => {
              if (confirm(`Apakah Anda yakin ingin ${isBlocked ? "membuka blokir" : "memblokir"} user ini?`)) {
                relations.toggleBlock(user.user_id);
              }
            }}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-xs transition active:scale-95 cursor-pointer ${
              isBlocked
                ? "bg-emerald-650 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/15"
                : "bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-950/30"
            }`}
          >
            <Ban size={14} />
            <span>{isBlocked ? "Unblock User" : "Block User"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default UserProfileModal;
