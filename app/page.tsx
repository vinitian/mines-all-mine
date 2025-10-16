"use client";

import { useEffect, useState } from "react";
import socket from "@/socket";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import StatisticsButton from "@/components/StatisticsButton";
import { useRouter } from "next/navigation";
import createRoom from "@/services/client/createRoom";
import handleSignOut from "@/services/client/handleSignOut";
import DuplicateSessionPopup from "@/components/DuplicateConnectedSessionPopup";

export default function Home() {
  const { data: session } = useSession(); // Auth.js session

  const [username, setUsername] = useState(
    socket.auth ? socket.auth.username : session?.user?.name ?? ""
  ); // check for username in socket first, else get from auth.js, else leave empty
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );
  const [showDuplicateSessionPopup, setShowDuplicateSessionPopup] =
    useState(false);
  const router = useRouter();

  const connectSocket = () => {
    socket.auth = {
      sessionID: localStorage.getItem("sessionID") ?? "",
      userID: session && session.user ? session.user.email : "",
      username: username,
    };

    socket.disconnect().connect();
    socket.on("session", ({ sessionID, userID, username }) => {
      // attach the session ID to the next reconnection attempts
      // set auth for client
      socket.auth = {
        sessionID: sessionID,
        userID: userID,
        username: username,
      };
      localStorage.setItem("sessionID", sessionID);
      console.log("39-connectSocket auth", socket.auth);
    });
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

  const handleCreateRoom = async () => {
    if (!username || !username.trim()) {
      setErrorMessage("Please enter your username first!");
      return;
    }

    if (username.length > 12) {
      setErrorMessage("Username must be 12 characters or less!");
      return;
    }
    setErrorMessage(undefined);
    connectSocket();
    const response = await createRoom({
      id: socket.auth.userID!,
      username: username,
    });
    console.log(response);
    router.push(`/lobby/${response.data.id}`);
  };

  // Hide error when user starts typing
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (errorMessage && e.target.value.trim()) {
      setErrorMessage(undefined);
    }
  };

  useEffect(() => {
    const sessionID = localStorage.getItem("sessionID");
    console.log("localstorage sessionID:", sessionID);
    if (sessionID) {
      socket.auth = { sessionID };
      socket.connect();
      socket.on("duplicateConnectedSession", () => {
        setShowDuplicateSessionPopup(true);
      });
      socket.on("session", ({ sessionID, userID, username }) => {
        socket.auth = { sessionID, userID, username }; // set auth for client
        setUsername(username);
      });
    }
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
      {showDuplicateSessionPopup && <DuplicateSessionPopup />}
    </div>
  );
}
