"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import socket from "@/socket";
import LoadingModal from "@/components/LoadingModal";

export default function CheckAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const needRedirect =
    (!socket.auth || !socket.connected) &&
    pathname !== "/" &&
    !pathname.startsWith("/invite");

  useEffect(() => {
    if (needRedirect) {
      router.push("/");
    }
  });

  // Remove the direct navigation and just show loading
  if (needRedirect) {
    return (
      <LoadingModal text={"No socket auth.Redirecting you to home page"} />
    );
  } else {
    return children;
  }
}
