import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface OnlineUser {
  user_id: number;
  role: string;
  last_seen: string;
}

export const usePresence = (token: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    if (!token) return;

    const newSocket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
    });

    setSocket(newSocket);

    newSocket.on("connect_error", (err) => {
      console.error("🔌 Socket connection error:", err.message);
    });

    const handleOnlineUsers = (data: any) => {
      console.log('✅ Received onlineUsers event:', data);
      const list = data?.data || data;
      if (Array.isArray(list)) {
        const formatted = list.map((ou: any) => ({
          user_id: ou.user?.user_id || ou.user_id,
          role: ou.user?.role || ou.role || 'unknown',
          last_seen: ou.last_seen || new Date().toISOString()
        }));
        setOnlineUsers(formatted);
      }
    };

    // 🔹 Minta daftar online users saat konek
    newSocket.emit('getOnlineUsers', {}, (data: any) => {
      handleOnlineUsers(data);
    });

    // 🔹 Dengarkan broadcast berkala onlineUsers dari server
    newSocket.on('onlineUsers', handleOnlineUsers);

    // 🔹 Dengarkan bila ada user baru online
    newSocket.on('userOnline', ({ userId }) => {
      setOnlineUsers((prev) => {
        if (prev.some((u) => u.user_id === userId)) return prev;
        return [...prev, { user_id: userId, role: 'unknown', last_seen: new Date().toISOString() }];
      });
    });

    // 🔹 Dengarkan bila ada user offline
    newSocket.on('userOffline', ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((u) => u.user_id !== userId));
    });

    return () => {
      newSocket.off('onlineUsers', handleOnlineUsers);
      newSocket.disconnect();
    };
  }, [token]);

  return { socket, onlineUsers };
};
