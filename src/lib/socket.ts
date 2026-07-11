import { io, type Socket } from "socket.io-client";
import { API_ORIGIN } from "./api";

export function connectLiveOrdersSocket(): Socket {
  const token = localStorage.getItem("token");
  return io(API_ORIGIN, { auth: { token } });
}
