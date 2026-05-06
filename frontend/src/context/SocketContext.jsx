import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";

const SocketContext = createContext(null);

const SOCKET_URL =
  import.meta.env.VITE_APP_SOCKET_URL || "http://localhost:8000";

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      // Defer clearing state so it doesn't run synchronously inside the effect
      const timer = setTimeout(() => {
        setOnlineUsers([]);
        setSocket(null);
      }, 0);
      return () => clearTimeout(timer);
    }

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
    });

    newSocket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => useContext(SocketContext);
