import React from "react";
import ReactCountryFlag from "react-country-flag";
import { FaMars, FaVenus, FaTransgender } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { resolveAvatarUrl } from "@/shared/utils/avatarUtils";

interface SidebarItemProps {
    user?: {
        user_id?: number;
        username?: string;
        age?: number;
        is_online?: boolean;
        last_seen?: string;
        role?: string;
        country?: string;
        gender?: string;
        profile?: { avatar_url?: string; bio?: string };
        auth?: { email?: string };
    };
    compact?: boolean;
    isActive?: boolean;
    onClick?: () => void;
}

const SidebarItem = ({ user, compact, isActive, onClick }: SidebarItemProps) => {
    if (!user) {
        // ✅ fallback kalau user kosong
        return (
            <div className="flex items-center justify-center p-4 text-gray-400 text-sm italic">
                Pengguna tidak ditemukan
            </div>
        );
    }

    // ✅ fallback default values (anti error semua)
    const username = user.username || "Unknown";
    const country = user.country || "XX";
    const age = user.age ?? "-";
    const is_online = user.is_online ?? false;
    const avatar = resolveAvatarUrl(user.profile?.avatar_url, username);
    const gender =
        typeof user.gender === "string" ? user.gender.toLowerCase() : "other";
    const role = user.role || "";

    // ✅ validasi tanggal (anti RangeError)
    let last_seen = "Baru saja";
    if (!is_online && user.last_seen) {
        const parsedDate = new Date(user.last_seen);
        if (parsedDate instanceof Date && !isNaN(parsedDate.getTime())) {
            last_seen = formatDistanceToNow(parsedDate, {
                addSuffix: true,
                locale: localeID,
            });
        } else {
            last_seen = "Tidak diketahui";
        }
    }

    // ✅ pilih ikon gender aman
    const GenderIcon = (() => {
        switch (gender) {
            case "male":
                return FaMars;
            case "female":
                return FaVenus;
            default:
                return FaTransgender;
        }
    })();

    return (
        <div 
            onClick={onClick}
            className={`flex items-center justify-between px-3 py-2.5 border-b border-gray-800/40 hover:bg-gray-800/30 hover:scale-[1.01] transition-all duration-200 cursor-pointer ${
                isActive ? "bg-blue-950/20 border-l-4 border-l-blue-500 pl-2 text-white" : ""
            }`}
        >
            <div className="flex items-center space-x-2">
                <div className="relative">
                    <img
                        src={avatar}
                        alt={username}
                        className="w-8 h-8 rounded-full object-cover shadow-sm"
                    />
                    <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-[#0d0f14] ${is_online ? "bg-green-500" : "bg-gray-600"
                            }`}
                    ></span>
                </div>

                <div className="leading-tight">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-205 flex items-center">
                            {username}
                            <GenderIcon size={14} className="ml-1 text-gray-400" />
                            {role === "admin" && (
                                <span className="ml-1 text-[10px] font-semibold text-indigo-400 bg-indigo-950/50 px-1.5 py-0.5 rounded">
                                    Admin
                                </span>
                            )}
                        </span>
                        <ReactCountryFlag
                            countryCode={country}
                            svg
                            style={{
                                width: "1.1em",
                                height: "1.1em",
                                borderRadius: "2px",
                            }}
                            className="shadow-sm"
                            title={country}
                        />
                    </div>

                    <span className="text-xs text-gray-400">
                        {age} · {country}
                    </span>
                </div>
            </div>
            <span className="text-[11px] text-gray-400 whitespace-nowrap">
                {is_online ? <span className="text-green-400 font-medium">Online</span> : last_seen}
            </span>
        </div>
    );
};

export default SidebarItem;
