import { Player } from "./interface";
import { Field, Timer } from "./services/game_logic";

// import from game_logic
// interface Timer {
//   interval: typeof setInterval;
//   room_id: number;
//   time_remaining: number;
//   max_time: number; // use this instead of state.turn_limit -- they're redundant. state.timer is not used
//   on_run: () => void;
//   on_complete: () => void;
// }

interface PlayerData {
  userID: string;
  username: string;
  score: number;
}

class Room {
  id: number;
  name: string;
  host_id: string;
  size: number;
  player_limit: number;
  bomb_count: number;
  chat_enabled: boolean;
  game_started: boolean;
  current_turn: number; // index of player_list. to find amout of cycles through all players use division
  prev_winner: string | undefined;
  field: Field;
  timer: Timer;
  player_list: PlayerData[]; // replacing player_id_list,

  constructor({
    id,
    name,
    hostID,
    hostUsername,
  }: {
    id: number;
    name: string;
    hostID: string;
    hostUsername: string;
  }) {
    this.id = id;
    this.name = name;
    this.host_id = hostID;
    this.size = 8; // for both x and y
    this.player_limit = 5;
    this.bomb_count = 19; // TODO: find actual initial bomb count //init bombs count
    this.chat_enabled = true;
    this.game_started = false;
    this.current_turn = 0; //count by player (to find amout of cycles through all players use division)
    this.prev_winner = undefined;
    this.field = new Field();
    this.timer = new Timer();
    this.player_list = [{ userID: hostID, username: hostUsername, score: 0 }];
  }
}

// let roomPlayers: Record<string, Room> = {};

// roomPlayers["132"] = new Room();
