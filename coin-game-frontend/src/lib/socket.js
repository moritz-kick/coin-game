import { io } from "socket.io-client";

let socket;

export const initSocket = () => {
  const socketUrl = import.meta.env.VITE_SOCKET_URL;
  socket = io(socketUrl);
};

export const getSocket = () => {
  return socket;
};
