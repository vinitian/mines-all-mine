"use client";
import { useSession } from "next-auth/react";
import { signIn, signOut } from "next-auth/react";
import Image from "next/image";
import { useEffect } from "react";

export default function Dashboard() {
  const { data: session } = useSession();

  //   if (session?.user?.role === "admin") {
  //     return <p>You are an admin, welcome!</p>;
  //   }
  useEffect(() => {
    console.log(session);
  }, [session]);

  return (
    <div>
      <p>home page</p>
      {session && (
        <>
          <h1 className="text-3xl">User Profile</h1>
          <Image
            src={session.user?.image ?? ""}
            alt="Profile image"
            width={100}
            height={100}
            referrerPolicy="no-referrer"
            className="my-4 rounded-full size-24"
          />
          <div className="text-h1">{session.user?.name}</div>
          <div className="text-gray-dark">{session.user?.email}</div>
        </>
      )}
      <div className="flex flex-col gap-4">
        <button
          className="bg-blue rounded-lg p-2"
          onClick={() => signIn("google")}
        >
          Sign In
        </button>
        <button className="bg-blue rounded-lg p-2" onClick={() => signOut()}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
