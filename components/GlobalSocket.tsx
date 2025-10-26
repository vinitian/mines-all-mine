"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import socket from "@/socket";
import LoadingModal from "./LoadingModal";

export default function GlobalSocket({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [deletedRoomPopup, setDeletedRoomPopup] = useState(false);

  useEffect(() => {
    socket.on("kickAllPlayersInEveryRoom", () => {
      socket.emit("leaveRoom");
      setDeletedRoomPopup(true);
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
          text={"The server has restarted. Redirecting you to the homepage."}
        />
      )}
    </>
  );
}
