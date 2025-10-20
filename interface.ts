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

const sizes = [6, 8, 10, 20, 30] as const;
const sizes2 = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const sizes3 = [0, 10, 20, 30];

export type MapSize = (typeof sizes)[number];
export type bombDensity = "low" | "medium" | "high";
export type PlayerLimit = (typeof sizes2)[number];
export type TurnLimit = (typeof sizes3)[number];

export interface Settings {
  name: string;
  size: MapSize;
  bomb_density: bombDensity;
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
