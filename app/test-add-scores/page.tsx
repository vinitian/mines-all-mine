"use client";
import Button from "@/components/Button";
import addScores from "@/services/client/addScores";
import { useState } from "react";
export default function TestAddScoresPage() {
  const [userIdList, setUserIdList] = useState<string[]>([]);

  const handleClick = async () => {
    addScores({ user_id_list: userIdList });
  };
  return (
    <div className="flex flex-col gap-8 m-8">
      <label className="flex flex-col gap-4">
        Input emails/userIds here (separate by comma)
        <input
          type="text"
          className="border-2 bg-white"
          onChange={(e) =>
            setUserIdList(e.target.value.split(",").map((user) => user.trim()))
          }
        />
      </label>
      <div className="flex flex-col gap-0">
        {userIdList.map((user) => {
          return <p key={user}>{user}</p>;
        })}
      </div>
      <Button onClick={() => handleClick()}>Add scores for the list</Button>
    </div>
  );
}
