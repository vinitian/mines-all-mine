export interface Message {
  userID: string;
  text: string;
  timestamp: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  img_url: string;
  win_count: number;
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
  placement: number[];
}
