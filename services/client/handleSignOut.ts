import socket from "@/socket";
import { signOut } from "next-auth/react";

export default function handleSignOut() {
  localStorage.removeItem("userID");
  signOut();
  socket.disconnect();
}
