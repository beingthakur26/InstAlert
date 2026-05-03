import { io } from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "https://instalert-atbh.onrender.com", {
  withCredentials: true,
  autoConnect: false,
});

export default socket;