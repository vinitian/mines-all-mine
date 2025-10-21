export interface Message {
  userID: string;
  username: string;
  text: string;
  timestamp: string;
}

export interface Player {
  userID: string;
  username: string;
}

export type MapSize = 6 | 8 | 10 | 20 | 30;
export type BombDensity = "low" | "medium" | "high";
export type PlayerLimit = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type TurnLimit = 0 | 10 | 20 | 30;

export interface Settings {
  name: string;
  size: MapSize;
  bomb_density: BombDensity;
  timer: TurnLimit;
  player_limit: PlayerLimit;
  chat_enabled: boolean;
}

export interface User {
  id: number;
  email: string;
  name: string;
  img_url: string;
  win_count: number;
}

export interface Placement {
  x: number;
  y: number;
  value: number;
  isOpen: boolean;
}
export interface Room {
  id: number;
  name: string;
  host_id: string;
  player_id_list: string[];
  size: number;
  player_limit: number;
  bomb_count: number;
  chat_enabled: boolean;
  timer: number;
  placement: Placement[];
  game_started: boolean;
}
