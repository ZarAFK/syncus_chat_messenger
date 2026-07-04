import React, { useMemo } from "react";
import SidebarItem from "./sidebarItem";
import useChat from "../../hooks/useHooksChat";
import { usePresence } from "../../hooks/useHookPresence";

const SidebarList = () => {
    const token = localStorage.getItem("access_token") || "";
    const { users, loading, error } = useChat();
    const { onlineUsers } = usePresence(token);

    const mergedUsers = useMemo(() => {
        return users.map((user) => {
            const found = onlineUsers.find((o) => o.user_id === user.user_id);
            return {
                ...user,
                is_online: !!found,
                last_seen: found?.last_seen || user.last_seen,
            };
        });
    }, [users, onlineUsers]);

    if (loading) return <div className="text-gray-400 p-4">Memuat pengguna...</div>;
    if (error) return <div className="text-red-500 p-4">{error}</div>;

    return (
        <div className="divide-y divide-gray-200">
            {mergedUsers.map((user) => (
                <SidebarItem key={user.user_id} user={user} />
            ))}
        </div>
    );
};

export default SidebarList;
