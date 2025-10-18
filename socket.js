"use client";

import { io } from "socket.io-client";

const socket = io({
  // autoConnect: true,
  // reconnection: true,
  // reconnectionDelay: 1000,
  // reconnectionDelayMax: 5000,
  // reconnectionAttempts: 5,
  autoConnect: false,
  reconnection: false,
  auth: {
    userID: "",
    username: "",
  },
});

export default socket;
