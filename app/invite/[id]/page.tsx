"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import socket from "@/socket";
import { Room } from "@/interface";
import StatisticsButton from "@/components/StatisticsButton";
import DuplicateUserPopup from "@/components/DuplicateConnectedUserPopup";
import handleSignOut from "@/services/handleSignOut";
import getRoom from "@/services/api/getRoom";

export default function InvitePage() {
  const { data: session } = useSession();

  const [username, setUsername] = useState(
    socket.auth ? socket.auth.username : session?.user?.name ?? ""
  ); // check for username in socket first, else get from auth.js, else leave empty
  const [nameErrorMessage, setNameErrorMessage] = useState<string | undefined>(
    undefined
  );
  const [showDuplicateUserPopup, setShowDuplicateUserPopup] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;

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
      setNameErrorMessage("Please enter your username first!");
      return;
    }

    if (username.length > 12) {
      setNameErrorMessage("Username must be 12 characters or less!");
      return;
    }

    connectSocket();
    router.push(`/lobby/${roomId}`);
  };

  // Hide error when user starts typing
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (nameErrorMessage && e.target.value.trim()) {
      setNameErrorMessage(undefined);
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
    };
  }, []);

  // when user logs in, change username to their google name
  useEffect(() => {
    if (session && session.user && session.user.name) {
      setUsername(session.user.name.substring(0, 12));
    }
  }, [session]);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        const response = await getRoom(parseInt(roomId));
        setRoom(response);
      } catch (error) {
        console.error(error);
        setError("Error fetching room");
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      fetchRoom();
    }
  }, [roomId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fffff5] from-30% via-[#ddf7ff] via-71% to-[#dde4ff] to-100% flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-black p-6 w-full max-w-md md:max-w-lg lg:max-w-xl">
          <div className="flex justify-center text-title/16 font-bold text-center my-4">
            Mines, All Mine!
          </div>
          <div className="text-center text-h3">Loading room information...</div>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fffff5] from-30% via-[#ddf7ff] via-71% to-[#dde4ff] to-100% flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-black p-6 w-full max-w-md md:max-w-lg lg:max-w-xl">
          <div className="flex justify-center text-title/16 font-bold text-center my-4">
            Mines, All Mine!
          </div>
          <div className="text-center text-h3 text-red mb-4">{error}</div>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-blue text-white text-h3 border-2 border-border rounded-2xl py-2 hover:bg-[#7388ee] transition-colors duration-200 flex justify-center mt-4 cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffff5] from-30% via-[#ddf7ff] via-71% to-[#dde4ff] to-100% flex items-center justify-center p-4">
      <StatisticsButton />
      <div className="bg-white rounded-3xl border border-black p-6 w-full max-w-md md:max-w-lg lg:max-w-xl">
        <div className="flex justify-center text-title/16 font-bold text-center my-4">
          Mines, All Mine!
        </div>

        <div className="text-center text-h3 text-gray-blue font-bold mb-4">
          You are entering &quot;{room.name}&quot;
        </div>

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
          {nameErrorMessage && (
            <div className="w-[60%] mt-2 p-2 text-red rounded-lg text-center">
              {nameErrorMessage}
            </div>
          )}
        </div>

        <button
          onClick={(e) => {
            if (room.player_id_list.length >= room.player_limit) return; // block full rooms
            handleJoinRoom();
          }}
          disabled={
            room.player_id_list.length >= room.player_limit || room.game_started
          }
          className={`w-full text-h3 border-2 rounded-2xl px-6 py-2 mt-4 transition-colors duration-200 whitespace-nowrap flex-shrink-0
                          ${
                            room.player_id_list.length >= room.player_limit ||
                            room.game_started
                              ? "bg-gray-300 border-gray-dark text-gray-600 cursor-not-allowed"
                              : "bg-[#8499FF] hover:bg-[#7388ee] border-border text-white cursor-pointer"
                          }`}
        >
          {room.player_id_list.length >= room.player_limit
            ? "Room Full"
            : room.game_started
            ? "Game has already started"
            : "Join Room"}
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
    </div>
  );
}
