import React from "react";
import { Pencil, Lock, MapPin, Mail, Calendar } from "lucide-react";

interface ProfileHeaderProps {
  username: string;
  age?: number;
  country?: string;
  gender?: string;
  about?: string;
  email?: string;
  is_online?: boolean;
  last_seen?: string;
  isUsernameLocked?: boolean;
  remainingDays?: number;
}

const ProfileHeader = ({
  username,
  age,
  country,
  gender,
  about,
  email,
  is_online,
  last_seen,
  isUsernameLocked = false,
  remainingDays = 0,
}: ProfileHeaderProps) => {
  const formatLastSeen = (date?: string) => {
    if (!date) return "No recent activity";
    const d = new Date(date);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const normalizedGender = gender?.toLowerCase();
  const hasBio = about && about.trim() !== "" && about !== "No bio yet";

  return (
    <div className="flex flex-col items-center text-center w-full max-w-md">
      {/* Username */}
      <h3 className="mt-3 text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
        {username || "Unnamed User"}
        {normalizedGender === "male" && (
          <span className="text-blue-400 text-lg" title="Male">♂️</span>
        )}
        {normalizedGender === "female" && (
          <span className="text-pink-400 text-lg" title="Female">♀️</span>
        )}
        {isUsernameLocked ? (
          <span title={`Username locked for ${remainingDays} days`}>
            <Lock size={15} className="text-red-400 cursor-not-allowed ml-0.5" />
          </span>
        ) : (
          <span title="Edit Username">
            <Pencil
              size={14}
              className="text-blue-400 hover:text-blue-300 cursor-pointer ml-0.5 transition duration-150"
            />
          </span>
        )}
      </h3>

      {/* Online Status Badge */}
      <div
        className="flex items-center gap-1.5 mt-2 bg-[#0d0f14]/65 border border-gray-800/80 hover:border-blue-500/50 hover:bg-blue-500/5 px-3 py-1 rounded-full text-xs cursor-pointer transition-all duration-300 group"
        title="Status"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            is_online ? "bg-green-500 shadow-[0_0_6px_#22c55e]" : "bg-gray-500"
          }`}
        />
        <span className="text-gray-300 font-medium group-hover:text-blue-400 transition-colors">
          {is_online ? "Online" : `Last seen: ${formatLastSeen(last_seen)}`}
        </span>
      </div>

      {/* Info Row */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
        {age && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar size={12} className="text-gray-500" />
            <span>{age} years</span>
          </div>
        )}
        {country && country !== "Unknown" && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin size={12} className="text-gray-500" />
            <span>{country}</span>
          </div>
        )}
        {email && (
          <div className="flex items-center gap-1 text-xs text-gray-400 font-mono">
            <Mail size={12} className="text-gray-500" />
            <span className="truncate max-w-[160px]">{email}</span>
          </div>
        )}
      </div>

      {/* Username lock warning */}
      {isUsernameLocked && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
          <Lock size={10} />
          Username locked for {remainingDays} more days
        </div>
      )}

      {/* Bio */}
      {hasBio && (
        <div className="relative w-full bg-[#0d0f14]/55 border border-gray-800/80 p-4 rounded-xl text-gray-300 text-sm mt-4 leading-relaxed shadow-inner max-w-sm group">
          <span className="italic text-gray-400 text-[11px] mb-1 block uppercase tracking-wider">Bio</span>
          {about}
          <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span title="Edit Bio">
              <Pencil size={11} className="text-blue-400 hover:text-blue-300 cursor-pointer" />
            </span>
          </div>
        </div>
      )}

      {!hasBio && (
        <div className="flex items-center gap-1.5 mt-4 cursor-pointer text-gray-500 hover:text-gray-400 italic text-sm">
          <span>No bio yet</span>
          <Pencil size={11} />
        </div>
      )}
    </div>
  );
};

export default ProfileHeader;
