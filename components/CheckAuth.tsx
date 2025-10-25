import { useEffect } from "react";
import { useRouter } from "next/navigation";
import socket from "@/socket";
import LoadingModal from "@/components/LoadingModal";

export default function CheckAuth() {
  const router = useRouter();

  useEffect(() => {
    if (!socket.auth || !socket.connected) {
      router.push("/");
    }
  }, [router]);

  // Remove the direct navigation and just show loading
  if (!socket.auth || !socket.connected) {
    return (
      <LoadingModal text={"No socket auth. Redirecting you to home page"} />
    );
  } else {
    return null;
  }
}
