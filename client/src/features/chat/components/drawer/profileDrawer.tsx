import React from "react"
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { resolveAvatarUrl } from "@/shared/utils/avatarUtils";

export interface ProfileChatDrawerProps {
    isDrawerOpen: boolean;
    onCloseDrawer: () => void;
    children: React.ReactNode
}

export const ProfileChatDrawer = ({ isDrawerOpen, onCloseDrawer, children}: ProfileChatDrawerProps) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const displayName = user?.username || "Guest";
    const avatarUrl = resolveAvatarUrl(user?.profile?.avatar_url, user?.username);
    const isRegistered = !!user;

    return (
        <AnimatePresence>
            {isDrawerOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onCloseDrawer}
                        className="fixed inset-0 bg-black z-40"
                    />

                    <motion.div
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg z-50 flex flex-col"
                    >
                        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                            <button
                                onClick={() => navigate("/profile")}
                                className="flex items-center space-x-3 group cursor-pointer"
                            >
                                {/* Real user avatar */}
                                <div className="relative w-10 h-10 flex-shrink-0">
                                    <img
                                        src={avatarUrl}
                                        alt={displayName}
                                        className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/40 group-hover:ring-blue-500/70 transition-all"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const parent = target.parentElement;
                                            if (parent) {
                                                const fallback = parent.querySelector('.drawer-avatar-fallback') as HTMLElement;
                                                if (fallback) fallback.style.display = 'flex';
                                            }
                                        }}
                                    />
                                    <div
                                        className="drawer-avatar-fallback absolute inset-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm items-center justify-center"
                                        style={{ display: 'none' }}
                                    >
                                        {displayName[0].toUpperCase()}
                                    </div>
                                </div>
                                <div className="text-left">
                                    <h2 className="font-semibold text-base text-white group-hover:text-blue-300 transition-colors">
                                        {displayName}
                                    </h2>
                                    <p className="text-xs text-gray-400">
                                        {isRegistered ? "Registered" : "Guest"}
                                    </p>
                                </div>
                            </button>
                            <button
                                onClick={onCloseDrawer}
                                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
                            >
                                ✕
                            </button>
                        </div>


                        <div className="flex-1 overflow-y-auto p-4">{children}</div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}