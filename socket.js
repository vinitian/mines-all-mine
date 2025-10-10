"use client";

import { io } from "socket.io-client";

const socket = io({
  autoConnect: true, // Set to true to auto-connect
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

export default socket;
