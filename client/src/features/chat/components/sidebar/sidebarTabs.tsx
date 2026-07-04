import { useEffect, useMemo, useRef, useState } from "react";
import { Users, Heart, Search, User, Star } from "lucide-react";
import { FaMars, FaVenus, FaTransgender } from "react-icons/fa";
import SidebarItem from "./sidebarItem";
import CountriesApiServices from "@/features/homepage/services/countryApiServices";
import { inputClass } from "@/shared/helper/elementconsistency";
import useChat from "../../hooks/useHooksChat";
import { usePresence } from "../../hooks/useHookPresence";
import { resolveAvatarUrl } from "@/shared/utils/avatarUtils";
import { INotification } from "../../hooks/useNotifications";

const tabs = [
    { id: "online", label: "Online", icon: Users },
    { id: "friend", label: "Friend", icon: User },
    { id: "gender", label: "Gender", icon: Heart },
    { id: "favorite", label: "Favorite", icon: Star },
    { id: "search", label: "Search", icon: Search },
];

const genderOptions = [
    { id: "all", label: "All gender", icon: <FaTransgender className="text-gray-300" /> },
    { id: "female", label: "Female", icon: <FaVenus className="text-pink-400" /> },
    { id: "male", label: "Male", icon: <FaMars className="text-blue-400" /> },
];

import { IChatProfile } from "../../services/chatServices";

const SidebarTabs = ({
    compact = false,
    activeChatUser,
    setActiveChatUser,
    relations,
    notifications = [],
    markNotificationAsRead,
}: {
    compact?: boolean;
    activeChatUser: IChatProfile | null;
    setActiveChatUser: (user: IChatProfile | null) => void;
    relations: any;
    notifications?: INotification[];
    markNotificationAsRead?: (id: number) => void;
}) => {
    const [activeTab, setActiveTab] = useState("online");
    const [genderFilter, setGenderFilter] = useState(false);
    const [selectedGender, setSelectedGender] = useState<"all" | "female" | "male">("all");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { countriesApi } = CountriesApiServices();
    const { users, loading, error } = useChat();
    const token = localStorage.getItem("access_token") || "";
    const { onlineUsers } = usePresence(token);

    const unreadMessageNotifications = useMemo(() => {
        return notifications.filter((n) => n.type === "new_message" && !n.is_read);
    }, [notifications]);

    const unreadChats = useMemo(() => {
        const groupsObj: { [key: number]: { sender: any; count: number; notifications: INotification[] } } = {};
        unreadMessageNotifications.forEach((n) => {
            if (n.sender) {
                const sId = n.sender.user_id;
                if (!groupsObj[sId]) {
                    groupsObj[sId] = {
                        sender: n.sender,
                        count: 0,
                        notifications: [],
                    };
                }
                groupsObj[sId].count += 1;
                groupsObj[sId].notifications.push(n);
            }
        });
        return Object.values(groupsObj);
    }, [unreadMessageNotifications]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setGenderFilter(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const currentUserId = Number(localStorage.getItem("user_id"));

    const mergedUser = useMemo(() => {
        if (!users || !Array.isArray(users)) return [];
        const onlineSet = new Set(onlineUsers?.map((ou) => ou.user_id))
        return users
            .filter((u) => u.user_id !== currentUserId && !relations.isBlocked(u.user_id))
            .map((u) => ({
                ...u,
                is_online: onlineSet.has(u.user_id)
            }));
    }, [users, onlineUsers, currentUserId, relations.blocked]);

    const onlineOnlyUsers = useMemo(
        () => mergedUser.filter((u) => u.is_online),
        [mergedUser]
    );

    const formattedUsers = mergedUser.map((u) => ({
        user_id: u.user_id,
        username: u.username,
        age: u.age,
        country: u.country || "ID",
        gender: typeof u.gender === "string" ? u.gender : "other",
        is_online: u.is_online ?? false,
        last_seen: u.last_seen || new Date().toISOString(),
        role: u.role || "",
        profile: {
            avatar_url: u.profile?.avatar_url || "",
            bio: u.profile?.bio || "",
        },
        auth: {
            email: u.auth?.email || "unknown@email.com",
        },
    }));

    const friendUsers = useMemo(
        () => formattedUsers.filter((u) => relations.isFriend(u.user_id)),
        [formattedUsers, relations.friends]
    );

    const favoriteUsers = useMemo(
        () => formattedUsers.filter((u) => relations.isFavorite(u.user_id)),
        [formattedUsers, relations.favorites]
    );

    const genderFilteredUsers = useMemo(() => {
        if (selectedGender === "all") return formattedUsers;
        return formattedUsers.filter((u) => u.gender?.toLowerCase() === selectedGender.toLowerCase());
    }, [formattedUsers, selectedGender]);

    useEffect(() => {
        console.log("📡 Online users from socket:", onlineUsers);
        console.log("💾 All users from DB:", users);
    }, [onlineUsers, users]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                Loading users...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full text-red-500">
                Failed to load users: {error}
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case "online":
                return (
                    <>
                        <div className="p-2 bg-[#0d0f14]">
                            <input
                                type="text"
                                placeholder="Search people"
                                className="w-full bg-[#161a24] text-white placeholder-gray-500 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        {unreadChats.length > 0 && (
                            <div className="px-3 py-2 border-b border-gray-800/60 bg-[#0f131c]/50">
                                <span className="text-[10px] font-bold text-blue-450 uppercase tracking-wider block mb-2 select-none">
                                    Pesan Belum Dibaca ({unreadChats.length})
                                </span>
                                <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                                    {unreadChats.map((uc) => {
                                        const avatarUrl = resolveAvatarUrl(uc.sender.profile?.avatar_url, uc.sender.username);
                                        return (
                                            <div
                                                key={uc.sender.user_id}
                                                onClick={() => {
                                                    uc.notifications.forEach((n) => {
                                                        if (markNotificationAsRead) {
                                                            markNotificationAsRead(n.notification_id);
                                                        }
                                                    });
                                                    const fullUser = formattedUsers.find(u => u.user_id === uc.sender.user_id);
                                                    if (fullUser) {
                                                        setActiveChatUser(fullUser as any);
                                                    } else {
                                                        setActiveChatUser({
                                                            user_id: uc.sender.user_id,
                                                            username: uc.sender.username,
                                                            profile: uc.sender.profile || {},
                                                        } as any);
                                                    }
                                                }}
                                                className="flex items-center gap-2 bg-[#161b26]/80 border border-gray-800/80 rounded-xl px-2.5 py-1.5 cursor-pointer hover:border-blue-500/40 hover:bg-[#1c2333] transition-all flex-shrink-0 select-none max-w-[140px]"
                                            >
                                                <div className="relative flex-shrink-0">
                                                    <img src={avatarUrl} alt={uc.sender.username} className="w-7 h-7 rounded-full bg-gray-800 border border-gray-800 object-cover" />
                                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-extrabold rounded-full min-w-4 h-4 px-1 flex items-center justify-center border border-[#0d0f14]">
                                                        {uc.count}
                                                    </span>
                                                </div>
                                                <div className="text-left min-w-0 pr-1 flex-1">
                                                    <span className="text-[11px] font-bold text-white block truncate">@{uc.sender.username}</span>
                                                    <span className="text-[9px] text-gray-400 block truncate mt-0.5">{uc.notifications[0].message || "New message"}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto">
                            {onlineOnlyUsers.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-gray-400 text-sm italic">
                                    Tidak ada pengguna online
                                </div>
                            ) : (
                                onlineOnlyUsers.map((usr) => (
                                    <SidebarItem
                                        key={usr.user_id}
                                        user={usr}
                                        compact={compact}
                                        isActive={activeChatUser?.user_id === usr.user_id}
                                        onClick={() => setActiveChatUser(usr as any)}
                                    />
                                ))
                            )}
                        </div>
                    </>
                );

            case "friend":
                return (
                    <div className="flex-1 overflow-y-auto">
                        {friendUsers.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 text-sm italic">
                                Belum punya teman
                            </div>
                        ) : (
                            friendUsers.map((usr) => (
                                <SidebarItem
                                    key={usr.user_id}
                                    user={usr}
                                    compact={compact}
                                    isActive={activeChatUser?.user_id === usr.user_id}
                                    onClick={() => setActiveChatUser(usr as any)}
                                />
                            ))
                        )}
                    </div>
                );

            case "gender":
                return (
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-2.5 bg-[#0b0f19] border-b border-gray-800/40 text-xs text-gray-400 flex items-center justify-between px-4">
                            <span>Filtering: <strong className="capitalize text-blue-400">{selectedGender === "all" ? "All Genders" : selectedGender}</strong></span>
                            <button onClick={() => setGenderFilter(true)} className="text-blue-500 hover:text-blue-400 font-semibold hover:underline">Change</button>
                        </div>
                        {genderFilteredUsers.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 text-sm italic">
                                Tidak ada pengguna untuk gender ini
                            </div>
                        ) : (
                            genderFilteredUsers.map((usr) => (
                                <SidebarItem
                                    key={usr.user_id}
                                    user={usr}
                                    compact={compact}
                                    isActive={activeChatUser?.user_id === usr.user_id}
                                    onClick={() => setActiveChatUser(usr as any)}
                                />
                            ))
                        )}
                    </div>
                );

            case "favorite":
                return (
                    <div className="flex-1 overflow-y-auto">
                        {favoriteUsers.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 text-sm italic">
                                ⭐ Daftar favorit masih kosong
                            </div>
                        ) : (
                            favoriteUsers.map((usr) => (
                                <SidebarItem
                                    key={usr.user_id}
                                    user={usr}
                                    compact={compact}
                                    isActive={activeChatUser?.user_id === usr.user_id}
                                    onClick={() => setActiveChatUser(usr as any)}
                                />
                            ))
                        )}
                    </div>
                );

            case "search":
                return (
                    <>
                        <div className="p-2 space-y-2 bg-[#0d0f14]">
                            <input
                                type="text"
                                placeholder="Search people"
                                className="w-full bg-[#161a24] text-white placeholder-gray-500 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <select className="appearance-none border border-gray-800 bg-[#161a24] text-white px-3 py-2 rounded-lg w-full pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                                <option value="" className="bg-[#161a24] text-gray-400">
                                    {countriesApi.length === 0 ? "Loading..." : "Select Country"}
                                </option>
                                {countriesApi.map((c: string) => (
                                    <option key={c} value={c} className="bg-[#161a24] text-white">
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {unreadChats.length > 0 && (
                            <div className="px-3 py-2 border-b border-gray-800/60 bg-[#0f131c]/50">
                                <span className="text-[10px] font-bold text-blue-450 uppercase tracking-wider block mb-2 select-none">
                                    Pesan Belum Dibaca ({unreadChats.length})
                                </span>
                                <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                                    {unreadChats.map((uc) => {
                                        const avatarUrl = resolveAvatarUrl(uc.sender.profile?.avatar_url, uc.sender.username);
                                        return (
                                            <div
                                                key={uc.sender.user_id}
                                                onClick={() => {
                                                    uc.notifications.forEach((n) => {
                                                        if (markNotificationAsRead) {
                                                            markNotificationAsRead(n.notification_id);
                                                        }
                                                    });
                                                    const fullUser = formattedUsers.find(u => u.user_id === uc.sender.user_id);
                                                    if (fullUser) {
                                                        setActiveChatUser(fullUser as any);
                                                    } else {
                                                        setActiveChatUser({
                                                            user_id: uc.sender.user_id,
                                                            username: uc.sender.username,
                                                            profile: uc.sender.profile || {},
                                                        } as any);
                                                    }
                                                }}
                                                className="flex items-center gap-2 bg-[#161b26]/80 border border-gray-800/80 rounded-xl px-2.5 py-1.5 cursor-pointer hover:border-blue-500/40 hover:bg-[#1c2333] transition-all flex-shrink-0 select-none max-w-[140px]"
                                            >
                                                <div className="relative flex-shrink-0">
                                                    <img src={avatarUrl} alt={uc.sender.username} className="w-7 h-7 rounded-full bg-gray-800 border border-gray-800 object-cover" />
                                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-extrabold rounded-full min-w-4 h-4 px-1 flex items-center justify-center border border-[#0d0f14]">
                                                        {uc.count}
                                                    </span>
                                                </div>
                                                <div className="text-left min-w-0 pr-1 flex-1">
                                                    <span className="text-[11px] font-bold text-white block truncate">@{uc.sender.username}</span>
                                                    <span className="text-[9px] text-gray-400 block truncate mt-0.5">{uc.notifications[0].message || "New message"}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto">
                            {formattedUsers.map((usr) => (
                                <SidebarItem
                                    key={usr.user_id}
                                    user={usr}
                                    compact={compact}
                                    isActive={activeChatUser?.user_id === usr.user_id}
                                    onClick={() => setActiveChatUser(usr as any)}
                                />
                            ))}
                        </div>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <div className="relative flex flex-col flex-1 min-h-0">
            {/* Tabs Header */}
            <div className="grid grid-cols-5 border-b border-gray-800 bg-[#0d0f14]">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setGenderFilter(tab.id === "gender" ? (prev) => !prev : false);
                            }}
                            className={`flex items-center justify-center gap-1 py-2 text-xs transition-colors 
                ${isActive
                                    ? "text-blue-450 font-semibold border-b-2 border-blue-500"
                                    : "text-gray-400 hover:text-blue-400"}
                ${compact ? "flex-col" : "flex-row"}`}
                        >
                            <Icon size={18} className={compact ? "mb-1" : ""} />
                            {!compact && <span>{tab.label}</span>}
                        </button>
                    );
                })}
            </div>

            {/* Dropdown Gender */}
            {genderFilter && (
                <div
                    ref={dropdownRef}
                    className="absolute left-0 right-0 top-10 mt-1 mx-auto w-44 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-20"
                >
                    {genderOptions.map((g) => (
                        <button
                            key={g.id}
                            onClick={() => {
                                setSelectedGender(g.id as any);
                                setGenderFilter(false);
                            }}
                            className="flex items-center gap-2 px-3 py-2 w-full text-left text-gray-300 hover:bg-gray-800 text-sm transition-colors"
                        >
                            {g.icon}
                            {g.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Konten Tab */}
            <div className="flex-1 min-h-0 overflow-y-auto">{renderContent()}</div>
        </div>
    );
};

export default SidebarTabs;
