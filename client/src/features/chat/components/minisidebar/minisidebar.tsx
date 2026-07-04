import React, { useState } from "react";
import { MessageCircle, Phone, Star, Settings, CircleUserRound, LogOut, Info, Bookmark, Bell, Shuffle, Radio, CircleDot } from "lucide-react";
import { ProfileChatDrawer } from "../drawer/profileDrawer";
import { useNavigate } from "react-router-dom";
import { SignUpOnUseChat } from "@/features/auth/pages/signupOnChat";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { topTabsType } from "../bar/topTabs";
import { resolveAvatarUrl } from "@/shared/utils/avatarUtils";

export interface miniSidebarDrawerProps {
    onOpenDrawer: () => void;
    onCloseDrawer: () => void;
    activeSidebarTabs?: topTabsType;
    setActiveSidebarTabs?: (tab: topTabsType) => void;
    unreadCount?: number;
}

export interface OpenInfoDialogProps {
    isOpenDialog?: boolean;
    onClose?: () => void;
}

const items = [
    { id: "chat", icon: MessageCircle },
    { id: "status", icon: CircleDot },
    { id: "favorite", icon: Star },
    { id: "saved", icon: Bookmark },
    { id: "notifications", icon: Bell },
    { id: "random", icon: Shuffle },
    { id: "channels", icon: Radio },
];

const MiniSidebar: React.FC<miniSidebarDrawerProps> = ({
    onOpenDrawer,
    onCloseDrawer,
    activeSidebarTabs,
    setActiveSidebarTabs,
    unreadCount,
}) => {
    const [localActive, setLocalActive] = useState("chat");
    const active = (activeSidebarTabs === "chat" || activeSidebarTabs === "saved" || activeSidebarTabs === "notifications" || activeSidebarTabs === "status" || activeSidebarTabs === "random" || activeSidebarTabs === "channels" || activeSidebarTabs === "favorite") ? activeSidebarTabs : localActive;

    const setActive = (id: string) => {
        setLocalActive(id);
        if (id === "chat" || id === "saved" || id === "notifications" || id === "status" || id === "random" || id === "channels" || id === "favorite") {
            setActiveSidebarTabs?.(id as topTabsType);
        }
    };

    const [activeInfoDialog, setActiveInfoDialog] = useState(false);
    const [activeMenuMiniSidebar, setActiveMenuMiniSidebar] = useState("");
    const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
    const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);

    const nav = useNavigate();
    const [isUserLoggedIn, setIsUserLoggedIn] = useState(
        !!localStorage.getItem("token")
    );
    const { user, logout, loading } = useAuth();
    if (loading) return null;

    const drawerMenuItems = [
        ...(!user
            ? [
                {
                    id: "account",
                    label: "Register",
                    icon: CircleUserRound,
                    onClick: () => setIsRegisterDialogOpen(true),
                },
            ]
            : []),
        ...(user
            ? [
                {
                    id: "logout",
                    label: "Logout",
                    icon: LogOut,
                    onClick: async () => {
                        await logout(); 
                        nav("/");
                    },
                },
            ]
            : []),

        {
            id: "about",
            label: "About Syncus",
            icon: Info,
            onClick: () => setActiveInfoDialog(true),
        },
    ];
    return (
        <>
            <aside className="h-full w-14 bg-gray-950 text-gray-300 flex flex-col items-center justify-between py-4">
                <div className="flex flex-col items-center space-y-4">
                    {items.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActive(item.id)}
                                className={`p-2 rounded-xl transition-all duration-300 relative
                  ${active === item.id
                                        ? "bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/30 scale-105"
                                        : "hover:bg-blue-600/20 hover:text-blue-400"
                                    }`}
                            >
                                <Icon size={22} />
                                {item.id === "notifications" && unreadCount !== undefined && unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4.5 h-4.5 flex items-center justify-center rounded-full font-bold border-2 border-gray-950 animate-pulse">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-col space-y-3 items-center">
                    <button className="p-2 rounded-xl transition-all duration-300 hover:bg-blue-600/20 hover:text-blue-400">
                        <Settings size={20} className="scale-105" />
                    </button>
                    <button onClick={() => setIsProfileDrawerOpen(true)} title={user?.username || "Profile"}>
                        {(() => {
                            const avatarUrl = resolveAvatarUrl(user?.profile?.avatar_url, user?.username);
                            const isGenerated = avatarUrl.includes('dicebear');
                            return (
                                <div className="relative w-[30px] h-[30px]">
                                    <img
                                        src={avatarUrl}
                                        alt={user?.username || "User"}
                                        className="w-[30px] h-[30px] rounded-full object-cover cursor-pointer ring-2 ring-blue-500/30 hover:ring-blue-500/60 transition-all"
                                        onError={(e) => {
                                            // Fallback to initial on image error
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            const parent = (e.target as HTMLImageElement).parentElement;
                                            if (parent) {
                                                const fallback = parent.querySelector('.avatar-fallback') as HTMLElement;
                                                if (fallback) fallback.style.display = 'flex';
                                            }
                                        }}
                                    />
                                    <div
                                        className="avatar-fallback w-[30px] h-[30px] rounded-full bg-blue-600 text-white text-xs font-bold items-center justify-center cursor-pointer absolute inset-0"
                                        style={{ display: 'none' }}
                                    >
                                        {(user?.username || "U")[0].toUpperCase()}
                                    </div>
                                </div>
                            );
                        })()}
                    </button>
                </div>
            </aside>

            <ProfileChatDrawer
                isDrawerOpen={isProfileDrawerOpen}
                onCloseDrawer={() => setIsProfileDrawerOpen(false)}
            >
                <div className="text-gray-700 dark:text-gray-200">
                    <div className="flex flex-col space-y-5 ">
                        {drawerMenuItems.map((i) => {
                            const Icon = i.icon;

                            return (
                                <div
                                    className="flex items-center space-x-3 cursor-pointer"
                                    key={i.id}
                                    onClick={() => {
                                        if (i.id === "about") {
                                            setActiveInfoDialog(true);
                                            if (i.onClick) i.onClick();
                                        } else if (i.id === "account") { // <-- FIXED HERE
                                            setIsRegisterDialogOpen(true);
                                        } else if (i.onClick) {
                                            i.onClick();
                                        }
                                        setIsProfileDrawerOpen(false);
                                        setActiveMenuMiniSidebar(i.id);
                                    }}
                                >
                                    <Icon size={25} className="text-white" />
                                    <h3 className="text-lg text-white">{i.label}</h3>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </ProfileChatDrawer>
            {activeInfoDialog && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-[2px] transition-all duration-300"
                        onClick={() => setActiveInfoDialog(false)}
                    />
                    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                        <div
                            className="bg-white rounded-lg p-6 shadow-lg max-w-[500px] w-[90%] pointer-events-auto animate-fadeIn"
                            onClick={(e) => e.stopPropagation()} // biar klik dalam dialog gak nutup
                        >
                            <h2 className="text-xl font-bold mb-2 text-center">About Syncus Chatting Web</h2>

                            <p className="mb-4 text-gray-700">
                                <span className="font-bold text-blue-600">SyncUs</span> is a web chat platform developed
                                independently under the Syncus Project. It’s built with a focus on simplicity, real-time
                                connection, and smooth user experience. 🚀
                            </p>

                            <p className="mb-4 text-gray-700">
                                Email Support — <span className="font-bold">Azharasykari@gmail.com</span>
                            </p>

                            <ul className="list-disc list-inside text-gray-600 mb-4">
                                <li>Frontend built with React + Tailwind CSS</li>
                                <li>Realtime engine powered by WebSocket / Socket.io</li>
                                <li>Backend architecture designed for scalability</li>
                            </ul>

                            <div className="flex justify-center">
                                <button
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                                    onClick={() => setActiveInfoDialog(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {isRegisterDialogOpen && (
                <>

                    <div
                        className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-[2px] transition-all duration-300"
                        onClick={() => setIsRegisterDialogOpen(false)}
                    />

                    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <div className="pointer-events-auto">
                            <SignUpOnUseChat
                                open={isRegisterDialogOpen}
                                onClose={() => setIsRegisterDialogOpen(false)}
                            />
                        </div>
                    </div>
                </>
            )}

        </>
    );
};

export default MiniSidebar;
