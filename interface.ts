export interface Message {
  userID: string;
  text: string;
  timestamp: string;
}

export interface Player {
  userID: string;
  username: string;
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
}
