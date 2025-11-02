"use client";

import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import socket from "@/socket";
import LoadingModal from "./LoadingModal";
import { ChatContext } from "./ChatContext";

export default function GlobalSocket({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [deletedRoomPopup, setDeletedRoomPopup] = useState(false);
  const { messages, setMessages } = useContext(ChatContext);

  useEffect(() => {
    socket.on("kickAllPlayersInEveryRoom", () => {
      socket.emit("leaveRoom");
      setDeletedRoomPopup(true);
      setMessages([]);
      setTimeout(() => {
        setDeletedRoomPopup(false);
        router.replace("/");
      }, 3000);
    });

    return () => {
      socket.off("kickAllPlayersInEveryRoom");
    };
  }, [router]);

  return (
    <>
      {children}

      {deletedRoomPopup && (
        <LoadingModal
          text={"The server has restarted.\nRedirecting you to the homepage."}
        />
      )}
    </>
  );
}
