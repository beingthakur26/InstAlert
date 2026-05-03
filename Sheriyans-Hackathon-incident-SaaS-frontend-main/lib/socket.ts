import { io } from "socket.io-client";

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://instalert-atbh.onrender.com";

// Get token from localStorage for Socket.io auth
const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
};

const socket = io(socketUrl, {
  withCredentials: true,
  autoConnect: false,
  auth: {
    token: getAuthToken(),
  },
});

// Update auth token when user logs in/out
export const updateSocketAuth = (token: string | null) => {
  if (token) {
    socket.auth = { token };
  } else {
    socket.auth = {};
  }
};

export default socket;