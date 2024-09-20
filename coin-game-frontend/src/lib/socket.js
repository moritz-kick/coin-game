import { io } from "socket.io-client";

let socket;

export const initSocket = () => {
  const socketUrl = import.meta.env.VITE_BACKEND_URL;
  console.log("Socket URL:", socketUrl);
  socket = io(socketUrl);
};

export const getSocket = () => {
  return socket;
};
