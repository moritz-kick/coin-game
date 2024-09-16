import { io } from "socket.io-client";

let socket;

export const initSocket = () => {
  socket = io("http://localhost:5000/");
};

export const getSocket = () => {
  return socket;
};
