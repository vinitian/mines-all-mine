"use client";

import { useEffect, useState } from "react";
import socket from "@/socket";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import StatisticsButton from "@/components/StatisticsButton";
import { useRouter } from "next/navigation";
import handleSignOut from "@/services/handleSignOut";
import DuplicateUserPopup from "@/components/DuplicateConnectedUserPopup";
import LoadingModal from "@/components/LoadingModal";

export default function Home() {
  const { data: session } = useSession(); // Auth.js session

  const [username, setUsername] = useState(
    socket.auth ? socket.auth.username : session?.user?.name ?? ""
  ); // check for username in socket first, else get from auth.js, else leave empty
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );
  const [showDuplicateUserPopup, setShowDuplicateUserPopup] = useState(false);
  const [showCreatingRoomPopup, setShowCreatingRoomPopup] = useState(false);
  const router = useRouter();

  const connectSocket = () => {
    const userIdInLocal = localStorage.getItem("userID");
    socket.auth = {
      userID: userIdInLocal
        ? userIdInLocal
        : session && session.user
        ? session.user.email
        : "",
      username: username,
    };

    socket.disconnect().connect();
  };

  const handleJoinRoom = () => {
    if (!username || !username.trim()) {
      setErrorMessage("Please enter your username first!");
      return;
    }

    if (username.length > 12) {
      setErrorMessage("Username must be 12 characters or less!");
      return;
    }

    connectSocket();
    router.push("room");
  };

  const requestCreateRoom = async (creatorData: object) => {
    const promise: Promise<object> = new Promise((resolve, reject) => {
      socket.emit("room:init", creatorData, (response: any) => {
        resolve(response);
      });
    });
    return promise;
  };

  const handleSetAuthSuccessfulAck = async () => {
    try {
      const creatorData = {
        id: socket.auth.userID!,
        username: username,
      };
      const response: any = await requestCreateRoom(creatorData);
      if (response.error) throw new Error(response.error);
      socket.emit("joinRoom", response.data.id);
      router.push(`/lobby/${response.data.id}`);
    } catch (error: any) {
      // console.error(error);
      setErrorMessage(error.message);
    }
    socket.off("setAuthSuccessfulAck");
    setShowCreatingRoomPopup(false);
  };

  const handleCreateRoom = () => {
    if (!username || !username.trim()) {
      setErrorMessage("Please enter your username first!");
      return;
    }

    if (username.length > 12) {
      setErrorMessage("Username must be 12 characters or less!");
      return;
    }
    setShowCreatingRoomPopup(true);
    setErrorMessage(undefined);
    connectSocket();
    socket.on("setAuthSuccessfulAck", handleSetAuthSuccessfulAck);
  };

  // Hide error when user starts typing
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (errorMessage && e.target.value.trim()) {
      setErrorMessage(undefined);
    }
  };

  const handleDuplicateConnectedUser = () => {
    setShowDuplicateUserPopup(true);
  };

  const handleSession = ({
    userID,
    username,
  }: {
    userID: string;
    username: string;
  }) => {
    // set auth for client for the next reconnection attempts
    socket.auth = {
      userID: userID,
      username: username,
    };
    localStorage.setItem("userID", userID);
    console.log("My auth info:", socket.auth);
    socket.emit("setAuthSuccessful");
  };

  useEffect(() => {
    socket.on("duplicateConnectedUser", handleDuplicateConnectedUser);
    socket.on("session", handleSession);
    return () => {
      socket.off("duplicateConnectedUser");
      socket.off("session");
      socket.off("setAuthSuccessfulAck");
    };
  }, []);

  // when user logs in, change username to their google name
  useEffect(() => {
    if (session && session.user && session.user.name) {
      setUsername(session.user.name.substring(0, 12));
    }
  }, [session]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffff5] from-30% via-[#ddf7ff] via-71% to-[#dde4ff] to-100% flex items-center justify-center p-4">
      {socket.connected && <StatisticsButton />}
      <div className="bg-white rounded-3xl border border-black p-6 w-full max-w-md md:max-w-lg lg:max-w-xl">
        <div className="flex justify-center text-title/16 font-bold text-center my-4">
          Mines, All Mine!
        </div>

        {session && (
          <div className="flex flex-col justify-center items-center my-4">
            <Image
              src={session.user?.image ?? ""}
              alt="Profile image"
              width={100}
              height={100}
              referrerPolicy="no-referrer"
              className="rounded-full size-16"
            />
            <div className="text-h1 text-center">
              Welcome, {session.user?.name}!
            </div>
            <div className="text-gray-dark">{session.user?.email}</div>
          </div>
        )}
        <div className="flex justify-center items-center gap-4 mt-2">
          <div className="text-h3">Username</div>
          <input
            type="text"
            placeholder="Type your username here..."
            className="w-full border-2 border-border rounded-2xl px-4 py-2 placeholder-gray-400 text-h4 focus:outline-none focus:border-[#3728BE]"
            value={username}
            onChange={handleUsernameChange}
          />
        </div>

        <div className="flex justify-center">
          {errorMessage && (
            <div className="w-[60%] my-2 text-red-700 rounded-lg text-center">
              {errorMessage}
            </div>
          )}
        </div>

        <button
          onClick={handleJoinRoom}
          className="w-full bg-blue text-white text-h3 border-2 border-border rounded-2xl py-2 hover:bg-[#7388ee] transition-colors duration-200 flex justify-center mt-4 cursor-pointer"
        >
          Join Room
        </button>

        <button
          onClick={handleCreateRoom}
          className="w-full bg-purple text-white text-h3 border-2 border-border rounded-2xl py-2 hover:bg-[#d68ee7] transition-colors duration-200 flex justify-center mt-4 cursor-pointer"
        >
          Create Room
        </button>

        {session ? (
          <button
            className="w-full bg-white text-black text-h3 border-2 border-border rounded-2xl py-2 hover:bg-[#f0f0f0] transition-colors duration-200 flex justify-center mt-4 cursor-pointer"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        ) : (
          <button
            className="w-full bg-white text-black text-h3 border-2 border-border rounded-2xl py-2 hover:bg-[#f0f0f0] transition-colors duration-200 flex justify-center mt-4 cursor-pointer"
            onClick={() => signIn("google")}
          >
            Sign in with Google
          </button>
        )}
      </div>
      {showDuplicateUserPopup && <DuplicateUserPopup />}
      {showCreatingRoomPopup && <LoadingModal text="Creating a room" />}
    </div>
  );
}
