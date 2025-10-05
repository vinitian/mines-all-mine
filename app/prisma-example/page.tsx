"use client";

import createRoom from "@/services/client/createRoom";
import { socket } from "@/socket";
import { Room } from "../generated/prisma";
import { useEffect, useState } from "react";
import getUsers from "@/services/client/getUsers";
import { User } from "@/interface";

// example for using prisma & REST API
// things to write:
// 1. function handleAction for a button e.g. handleCreateRoom
// 2. a helper function in a separate file e.g. createRoom
// 3. method in api path e.g. POST Method in api path `@/app/api/mission`

// try this and `npx prisma studio` to see the created room
// for prisma CRUD methods, see: www.prisma.io/docs/orm/prisma-client/queries/crud

export default function PrismaExample() {
  const [username, setUsername] = useState("john");
  const [roomDetails, setRoomDetails] = useState<Room>();
  const [error, setError] = useState();
  const [users, setUsers] = useState<User[]>();

  const fetchData = async () => {
    setUsers(await getUsers());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRoom = async () => {
    const response = await createRoom({
      id: socket.id!,
      username: username,
    });
    if (response.success) {
      setRoomDetails(response.data);
    } else {
      setError(response.error);
    }
  };
  return (
    <div>
      <h1 className="text-title">
        This page is an example of using prisma & REST API.
      </h1>
      <h2 className="text-subtitle">creating room</h2>
      <p>my socket id: {socket.id}</p>
      <label>
        your username
        <input
          type="text"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-b-orange"
        />
      </label>

      <button onClick={handleCreateRoom}>Create new room!</button>
      {error && <p className="text-red-400">{error}</p>}
      {roomDetails && <p>{JSON.stringify(roomDetails)}</p>}

      <h2 className="text-subtitle">users signed in with google</h2>
      <p>{JSON.stringify(users)}</p>
    </div>
  );
}
