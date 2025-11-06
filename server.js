import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import InMemoryUserStore from "./userStore.js";
import { randomBytes } from "node:crypto";
import { Field } from "./services/game_logic.js";
import createRoom from "./services/api/createRoom.js";
import editRoom from "./services/api/editRoom.js";
import addScores from "./services/api/addScores.js";
import updatePlayerList from "./services/api/updatePlayerList.js";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// tracking players (rooms)
const roomPlayers = {};

app.prepare().then(() => {
  const randomId = () => randomBytes(8).toString("hex");
  const userStore = new InMemoryUserStore(); // it's a Map of (userID) => {username: string, connected: boolean}

  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  // Server data (frequently updated)

  /*
  roomData={
    room_id:{
      "timer": Timer,
      "state": Room,
    },
  }   
  */

  const roomData = {};
  const sockets = new Map();

  class Room {
    constructor(id, name, host_id) {
      this.id = id;
      this.name = name;
      this.host_id = host_id;
      this.player_id_list = [host_id];
      this.size = undefined; // for both x and y
      this.player_limit = undefined;
      this.bomb_count = undefined; // initial bomb count
      this.chat_enabled = undefined;
      this.game_started = undefined;
      this.placement = undefined;
      this.current_turn = 0; // index of player_id_list. count by player (to find amout of cycles through all players, use division)
      this.scores = undefined;
      this.turn_limit = undefined; // "timer" field in database
      this.prev_winner = undefined;

      console.log(`Player ID ${host_id} created room ${id}`);
    }

    async updateRoomInDatabase(reason = "unspecified") {
      await editRoom(this.id, {
        name: this.name,
        host_id: this.host_id,
        size: this.size,
        bomb_count: this.bomb_count,
        turn_limit: this.turn_limit,
        player_limit: this.player_limit,
        chat_enabled: this.chat_enabled,
        game_started: this.game_started,
      });
      console.log(`Room ${this.id}: updated database for ${reason} reason`);
      return;
    }

    async addScores(winnerIdList) {
      await addScores({ user_id_list: winnerIdList });
      console.log(
        `Room ${state.id}: updated scores for winners: ${winnerIdList}`
      );
    }

    update(updateJson) {
      for (let key in updateJson) {
        if (this.hasOwnProperty(key) && updateJson[key] !== undefined) {
          this[key] = updateJson[key];
        }
      }
    }
  }

  // Getter (get object reference, can edit, do not forget to update database!)

  function getGameState(room_id, reason = "unspecified") {
    console.log(
      `getting data of room ID ${room_id} for ${reason} reason`
      // JSON.stringify(roomData[room_id]["state"])
    );
    return roomData[room_id]["state"];
  }

  function createRoomObject(room_id, name, host_id) {
    let data = roomData[room_id];
    if (data === undefined) {
      roomData[room_id] = {};
      data = roomData[room_id];
    }
    let state = data["state"];
    if (state === undefined) {
      data["state"] = new Room(room_id, name, host_id);
      state = data["state"];
    }
    return state;
  }

  // Timer data

  class Timer {
    constructor(room_id, max_time, on_run, on_complete) {
      this.interval = undefined;
      this.room_id = room_id;
      this.time_remaining = max_time;
      this.max_time = max_time;
      this.on_run = on_run;
      this.on_complete = on_complete;
    }
    start() {
      if (this.interval) {
        this.reset();
      }
      if (this.max_time != 0) {
        this.on_run();
        console.log(`Room ${this.room_id}: timer starting`);
        clearInterval(this.interval);
        this.interval = setInterval(() => {
          this.time_remaining = this.time_remaining - 1;
          this.on_run();
          if (this.time_remaining <= 0) {
            this.on_complete();
          }
        }, 1000);
      } else {
        this.on_run();
        console.log(`Room ${this.room_id}: timer starting (unlimited mode)`);
        clearInterval(this.interval);
      }
    }
    reset() {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = undefined;
        this.time_remaining = this.max_time;
      }
      this.time_remaining = this.max_time;
      // console.log(`room id ${this.room_id} timer resetting`);
    }
  }

  function createTimer(room_id, max_time) {
    let data = roomData[room_id];
    if (data === undefined) {
      roomData[room_id] = {};
      data = roomData[room_id];
    }
    let timer = data["timer"];
    if (timer === undefined) {
      data["timer"] = new Timer(room_id, max_time, undefined, undefined);
      data["timer"].on_run = () => {
        io.to(room_id).emit("turnTime", {
          timeRemaining: data["timer"].time_remaining,
        });
      };
      data["timer"].on_complete = () => {
        nextTurn(room_id, data["state"], data["timer"], "Times up");
      };
    }
  }

  function getTimer(room_id, reason = "unspecified") {
    console.log(`getting timer of room ID ${room_id} for ${reason} reason`);
    return roomData[room_id]["timer"];
  }

  io.use((socket, next) => {
    const userID = socket.handshake.auth.userID;
    let user;

    if (userID && userID.trim()) {
      user = userStore.findUser(userID);
      if (user && user.connected) {
        socket.emit("duplicateConnectedUser");
      }
    }

    const auth = socket.handshake.auth;
    // prioritise the data that the client sends first, then session from `userStore`, else randomise new ID.
    socket.data.userID =
      auth.userID && auth.userID.trim()
        ? auth.userID
        : user && user.userID
        ? user.userID
        : randomId();
    socket.data.username =
      auth.username && auth.username.trim() ? auth.username : user.username;
    userStore.saveUser(socket.data.userID, {
      username: socket.data.username,
      connected: false,
    });

    // console.log("DONE io.use() socket socket data:", socket.data);

    return next();
  });

  io.on("connection", (socket) => {
    console.log("User connected", socket.data.userID, socket.data.username);
    socket.on("game:request-countdown", ({ roomID, seconds }) => {
      // synchronized start time
      const startAt = Date.now() + seconds * 1000;

      // broadcast to everyone in the room
      io.to(roomID).emit("game:countdown", { seconds, startAt, roomID });
    });

    userStore.saveUser(socket.data.userID, {
      username: socket.data.username,
      connected: true,
    });

    const isLocalhost =
      socket.handshake.headers.origin === "http://localhost:3000" ||
      socket.handshake.headers.host === "localhost:3000" ||
      socket.handshake.address === "::1" ||
      socket.handshake.address === "127.0.0.1";

    console.log(
      `Connection from: ${socket.handshake.headers.origin}, isLocalhost: ${isLocalhost}`
    );

    //Room Management
    let current_room_id = undefined;
    let state = undefined; // class Room
    let timer = undefined;

    //tracking players (global) (upon connect)
    sockets.set(socket.data.userID, socket);

    if (!sockets.has(socket.data.userID)) {
      sockets.set(socket.data.userID, socket);
      console.log(
        `Player ${socket.data.userID} joined. Total players: ${sockets.size}`
      );
    }

    socket.emit("session", {
      userID: socket.data.userID,
      username: socket.data.username,
    });

    socket.on("setAuthSuccessful", () => {
      socket.emit("setAuthSuccessfulAck");
    });

    socket.on("getOnlineCount", () => {
      console.log(
        `getOnlineCount requested by ${socket.data.userID}, current players: ${sockets.size}`
      );

      socket.emit("onlineCountUpdate", {
        count: sockets.size,
        isHost: isLocalhost,
      });
    });

    // Broadcast to all clients
    io.emit("onlineCountUpdate", {
      count: sockets.size,
      isHost: isLocalhost,
    });

    // TODO investigate

    const currentPlayer = state
      ? findCurrentPlayer(state.player_id_list, state.current_turn)
      : undefined;

    io.emit("playersUpdated", {
      players: Array.from(sockets.keys()),
      currentPlayer: state && state.game_started ? currentPlayer : null,
    });

    // convert state.found? convert state.current_turn? may be needed for joining mid game?
    // If game is in progress, send current state to the connecting player
    // dont know if needed
    // if (state && state.game_started) {
    //   const hits = [...state.found].filter((i) => state.bombs.has(i)).length;
    //   socket.emit("map:ready", {
    //     size: state.size,
    //     bombsTotal: state.bomb_count,
    //     bombsFound: hits,
    //     turnLimit: state.turn_limit ?? 10,
    //     currentPlayer: state.player_id_list[state.current_turn] || null,
    //   });

    //   socket.emit("turnChanged", {
    //     currentPlayer: state.player_id_list[state.current_turn],
    //     reason: "joined",
    //   });

    //   if (state.turn_limit > 0) {
    //     socket.emit("turnTime", {
    //       currentPlayer: state.player_id_list[state.current_turn],
    //       timeRemaining: state.turnTimeRemaining,
    //     });
    //   }
    // }

    socket.on("requestState", () => {
      const currentPlayer = findCurrentPlayer(
        state.player_id_list,
        state.current_turn
      );
      socket.emit("playersUpdated", {
        players: state.player_id_list,
        currentPlayer:
          state.game_started && state.player_id_list.length > 0
            ? currentPlayer
            : null,
      });

      if (state.game_started) {
        const field = new Field();
        field.load(state.placement, [state.size, state.size], state.bomb_count);
        const hits = field.get_hit_count();

        socket.emit("map:ready", {
          roomId: state.id,
          roomName: state.name,
          size: state.size,
          bombsTotal: state.bomb_count,
          bombsFound: hits,
          turnLimit: state.turn_limit ?? 10,
          chatEnabled: state.chat_enabled,
          currentPlayer: currentPlayer || null,
          revealed: field.export_display_data(),
        });

        if (state.turn_limit > 0) {
          socket.emit("turnTime", {
            currentPlayer: currentPlayer,
            timeRemaining: timer.time_remaining, // migrate timer (Done)
          });
        }
      }
    });

    socket.on("message", (msg) => {
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.to(room).emit("message", msg);
        }
      });
    });

    socket.on("kickAllPlayersInRoom", (room_id, user_id) => {
      io.to(room_id).emit("kickAllPlayersInRoom");
    });

    //reset button kicking everyone in every room
    socket.on("kickAllPlayersInEveryRoom", () => {
      io.emit("kickAllPlayersInEveryRoom");
    });

    socket.on("kickPlayer", (room_id, user_id) => {
      io.to(room_id).emit("kickPlayer", user_id);
    });

    socket.on("room:update-settings", (payload, callback) => {
      console.log(
        `Room ${current_room_id}: Room setting update request received with payload ${JSON.stringify(
          payload
        )}`
      );
      // TODO handle timer
      // migrate timer
      // TODO not implemeted yet
      state.update(payload);

      try {
        state.updateRoomInDatabase("room settings updated");
      } catch (error) {
        console.log(error);
      }
      // TODO: improve error handling. should we handle here, or inside updateDatabase?
      // TODO: return fail if unable to update DB and revert socket state too

      if ("turn_limit" in payload) {
        timer.max_time = payload.turn_limit;
      }
      //update all players in the room
      io.to(current_room_id).emit("room:update-settings-success", state);
      callback({ ok: true, state: state });
    });

    //Initialize room
    // TODO: error handling
    socket.on("room:init", async (creatorData, callback) => {
      try {
        const response = await createRoom({
          id: creatorData.id,
          username: creatorData.username,
        });
        const data = response.data;
        createRoomObject(data.id, data.name, data.host_id);
        createTimer(data.id, 10); // assuming 10 default, may need to change later, maybe useEffect will take care of this in roomsettings
        // may be needed to set defaults?
        // init state is defined at launch of room Setting
        callback(response);
      } catch (e) {
        callback({ error: "Failed to create room" });
      }
    });

    socket.on("startGame", (payload = {}) => {
      const { size, bombCount, turnLimit } = payload;

      if (state.game_started) {
        resetGame(state, timer);
      }

      if (typeof size === "number") state.size = size;
      if (typeof bombCount === "number") state.bomb_count = bombCount;
      if (typeof turnLimit === "number") state.turn_limit = turnLimit;

      if (typeof state.size !== "number") state.size = 6;
      if (!Number.isFinite(state.bomb_count)) {
        state.bomb_count =
          state.size === 6 ? 11 : Math.floor(state.size * state.size * 0.3);
      }
      if (typeof state.turn_limit !== "number") state.turn_limit = 10;
      timer.max_time = state.turn_limit; // migrate timer (Done)

      const field = new Field();
      field.generate_field([state.size, state.size], state.bomb_count);
      state.placement = field.field;

      state.scores = new Map();
      roomPlayers[current_room_id].forEach((player) => {
        state.scores.set(player.userID, 0);
      });

      state.game_started = true;

      // shuffle players. the winner of the previous game starts first
      state.player_id_list = fisherYatesShuffle(state.player_id_list);
      if (
        state.prev_winner &&
        state.player_id_list.includes(state.prev_winner)
      ) {
        console.log(
          `Room ${state.id}: putting previous winner ${state.prev_winner} first`
        );
        state.player_id_list = state.player_id_list.filter(
          (p) => p !== state.prev_winner
        );
        state.player_id_list = [state.prev_winner, ...state.player_id_list];
        console.log(
          `Room ${state.id}: new player order ${state.player_id_list}`
        );
      }

      console.log(
        `Room ${state.id}: Game started: ${state.size}x${state.size}, ${state.bomb_count} bombs, ${state.turn_limit}s turns`
      );

      // change to room level (changed)
      state.current_turn = 0;
      const currentPlayer = findCurrentPlayer(
        state.player_id_list,
        state.current_turn
      );
      console.log(
        `Room ${state.id}: starting game with current player ${currentPlayer}`
      );

      io.to(current_room_id).emit("toGamePage"); // redirect player to game page

      console.log(
        `Room ${state.id}: Turn changed to player ${currentPlayer} for reason gameStart`
      );
      io.to(current_room_id).emit("turnChanged", {
        currentPlayer: currentPlayer,
        reason: "gameStart",
      });

      //startTurnTimer(); //migrate timer
      timer.start();

      state.updateRoomInDatabase("game start"); // set game_started to true in database
    });

    // this is just like emitting `currentPlayers` but with scores
    socket.on("requestPlayerListOnStartGame", () => {
      roomPlayers[current_room_id].forEach((player) => {
        player.score = state.scores.get(player.userID) || 0;
      });
      io.to(current_room_id).emit(
        "playerListOnStartGame",
        roomPlayers[current_room_id]
      );
    });

    //Room Management

    socket.on("joinRoom", (room_id) => {
      socket.join(room_id);
      // if room doesn't exist
      if (!roomPlayers[room_id]) {
        roomPlayers[room_id] = [];
      }

      const newPlayer = {
        userID: socket.data.userID,
        username: socket.data.username,
      };

      // check if player id is already in the room
      if (!roomPlayers[room_id].some((p) => p.userID === newPlayer.userID)) {
        roomPlayers[room_id].push(newPlayer);
      }
      // add player to socket state
      if (state && !state.player_id_list.includes(socket.data.userID)) {
        state.player_id_list.push(socket.data.userID);
      }

      io.to(room_id).emit("currentPlayers", roomPlayers[room_id]);

      console.log(
        `[ JOIN ] ${newPlayer.userID} joined room ${room_id}. Current players:`,
        roomPlayers[room_id]
      );

      //tracking player room and setting state
      current_room_id = room_id;
      state = getGameState(room_id, "joining room");
      timer = getTimer(room_id, "joining room");
    });

    socket.on("leaveRoom", () => {
      socket.rooms.forEach(async (room) => {
        if (room !== socket.id) {
          socket.leave(room);
          if (roomPlayers[room]) {
            roomPlayers[room] = roomPlayers[room].filter(
              (p) => p.userID !== socket.data.userID
            );

            //if may not be necessary if roomPlayers always sync with this
            if (state && state.player_id_list.includes(socket.data.userID)) {
              state.player_id_list.splice(
                state.player_id_list.indexOf(socket.data.userID),
                1
              );
            }
            // tell other players that a player has left
            io.to(room).emit("currentPlayers", roomPlayers[room]);

            const hostLeaving =
              roomData[room]["state"]["host_id"] === socket.data.userID;

            if (hostLeaving) {
              const newHost = assignNewHost(room);

              io.to(room).emit("hostChanged", newHost.userID);
              // update state

              roomData[room]["state"]["host_id"] = newHost.userID;

              //update new host in database
              try {
                roomData[room]["state"].updateRoomInDatabase("host leaving");
              } catch (error) {
                console.log(error);
              }
            }

            try {
              const response = await updatePlayerList({
                userId: socket.data.userID,
                roomId: parseInt(room),
                addPlayer: false,
              });
            } catch (error) {
              console.error(error);
            }
          }
        }

        if (state.game_started) {
          const currentPlayer = findCurrentPlayer(
            state.player_id_list,
            state.current_turn
          );
          const playerIndex = state.player_id_list.indexOf(socket.data.userID);
          let newCurrentPlayer;
          let leftIsCurrentPlayer;
          if (currentPlayer == socket.data.userID) {
            // is current player
            newCurrentPlayer = findCurrentPlayer(
              state.player_id_list,
              state.current_turn + 1
            );
            leftIsCurrentPlayer = true;
          } else {
            // is not current player
            newCurrentPlayer = currentPlayer;
            leftIsCurrentPlayer = false;
          }

          state.player_id_list = state.player_id_list.filter(
            (p) => p !== socket.data.userID
          );

          state.current_turn = state.player_id_list.indexOf(newCurrentPlayer);

          //emit only if player is in room?
          if (current_room_id) {
            io.to(current_room_id).emit("playersUpdated", {
              players: state.player_id_list,
              currentPlayer: newCurrentPlayer,
            });
          }
          if (
            leftIsCurrentPlayer &&
            state.game_started &&
            state.player_id_list.length > 0
          ) {
            nextTurn(current_room_id, state, timer, "playerLeft");
          }
        }
      });

      //tracking player room and setting state
      current_room_id = undefined;
      state = undefined;
      timer = undefined;
    });

    socket.on("resetNotice", () => {
      console.log("Reset Complete!");
      io.emit("serverRestarts");
    });

    socket.on("pickCell", (index) => {
      // console.log(`Picking cell at index ${index}`);
      if (!state.game_started) {
        socket.emit("error", { message: "Game hasn't started yet" });
        return;
      }

      const currentPlayer = findCurrentPlayer(
        state.player_id_list,
        state.current_turn
      );

      if (currentPlayer !== socket.data.userID) {
        socket.emit("error", { message: "It's not your turn!" });
        return;
      }

      if (state.placement.is_open == true) {
        socket.emit("error", { message: "Cell already revealed" });
        return;
      }

      const field = new Field();
      field.load(state.placement, [state.size, state.size], state.bomb_count);
      const [x, y] = field.index_to_coordinate(index);
      const [flag, success] = field.open_cell(x, y);

      // console.log(`Picking cell at (${x},${y})`);

      const hit = flag == Field.open_cell_flags.BOMB;

      if (!success) {
        socket.emit("error", { message: "Failed to reveal cell" });
        return;
      }

      if (hit) {
        state.scores.set(
          socket.data.userID,
          (state.scores.get(socket.data.userID) || 0) + 1
        );
      }

      const hits = field.get_hit_count();

      // console.log(
      //   "sending pickCellResult",
      //   hits,
      //   state.bomb_count,
      //   state.scores
      // );
      io.to(current_room_id).emit("cellResult", {
        revealMap: field.export_display_data(),
        bombsFound: hits,
        bombsTotal: state.bomb_count,
        scores: Array.from(state.scores.entries()),
      });

      // end game scenario
      if (hits >= state.bomb_count) {
        // migrate timer (Done)
        // if (state.turnTimer) {
        //   clearInterval(state.turnTimer);
        //   state.turnTimer = null;
        // }
        console.log(`Room ${current_room_id}: Game ending`);
        timer.reset();

        state.game_started = false;
        const winners = computeWinners(state.scores);
        state.addScores(winners.map((winner) => winner.id));

        state.prev_winner = winners[0].id;

        //broadcast to current room only?
        io.to(current_room_id).emit("gameOver", {
          winners,
          scores: Array.from(state.scores.entries()), // changed from map to array because socket cant send map
          size: state.size,
          bombCount: state.bomb_count,
        });
        setTimeout(() => {
          console.log(`Room ${current_room_id}: Sending return to lobby `);
          io.to(current_room_id).emit("returnToLobby", { reason: "gameEnded" });
          resetGame(state, timer); // พร้อมเริ่มตาหน้าใหม่
        }, 10000);

        state.updateRoomInDatabase("game over"); // set game_started back to false in database
        return;
      }

      if (!hit) {
        nextTurn(current_room_id, state, timer, "miss");
      } else {
        // console.log("Hit bomb, restarting timer");
        timer.reset();
        timer.start();
      }
    });

    socket.on("disconnect", async () => {
      console.log("User disconnected", socket.data.userID);

      // Automatically removes the player from the room they're in
      outerLoop: for (const [roomId, playersList] of Object.entries(
        roomPlayers
      )) {
        // console.log(`Key: ${parseInt(roomId)}, Value: ${playersList}`);

        for (const player of playersList) {
          if (socket.data.userID == player.userID) {
            roomPlayers[parseInt(roomId)] = roomPlayers[
              parseInt(roomId)
            ].filter((p) => p.userID !== socket.data.userID);

            io.to(parseInt(roomId)).emit(
              "currentPlayers",
              roomPlayers[parseInt(roomId)]
            );

            break outerLoop;
          }
        }
      }

      // assign new host when disconnect (Copied from leaveRoom)
      const hostLeaving =
        roomData[current_room_id]["state"]["host_id"] === socket.data.userID;

      if (hostLeaving) {
        const newHost = assignNewHost(current_room_id);

        io.to(current_room_id).emit("hostChanged", newHost.userID);
        // update state

        roomData[current_room_id]["state"]["host_id"] = newHost.userID;

        //update new host in database
        try {
          roomData[current_room_id]["state"].updateRoomInDatabase(
            "host leaving"
          );
        } catch (error) {
          console.log(error);
        }
      }

      try {
        const response = await updatePlayerList({
          userId: socket.data.userID,
          roomId: parseInt(current_room_id),
          addPlayer: false,
        });
      } catch (error) {
        console.error(error);
      }

      userStore.saveUser(socket.data.userID, {
        username: socket.data.username,
        connected: false,
      });

      // tracking players (global) (upon disconnect)
      sockets.delete(socket.data.userID);

      // TODO still broken needs fixing
      // remove player
      const currentPlayer = findCurrentPlayer(
        state.player_id_list,
        state.current_turn
      );
      const playerIndex = state.player_id_list.indexOf(socket.data.userID); //changed from socket.id
      if (playerIndex != -1) {
        io.emit("onlineCountUpdate", {
          count: sockets.size,
          isHost: false,
        });

        // cases
        let newCurrentPlayer;
        let leftIsCurrentPlayer;
        if (currentPlayer == socket.data.userID) {
          // is current player
          newCurrentPlayer = findCurrentPlayer(
            state.player_id_list,
            state.current_turn + 1
          );
          leftIsCurrentPlayer = true;
        } else {
          // is not current player
          newCurrentPlayer = currentPlayer;
          leftIsCurrentPlayer = false;
        }
        state.player_id_list = state.player_id_list.filter(
          (p) => p !== socket.data.userID
        );

        state.current_turn = state.player_id_list.indexOf(newCurrentPlayer);

        //emit only if player is in room?
        if (current_room_id) {
          io.to(current_room_id).emit("playersUpdated", {
            players: state.player_id_list,
            currentPlayer: newCurrentPlayer,
          });
        }
        if (
          leftIsCurrentPlayer &&
          state.game_started &&
          state.player_id_list.length > 0
        ) {
          nextTurn(current_room_id, state, timer, "playerLeft");
        }
      }
    });

    //init for new client (duplicate of unneeded?)
    // if (state.game_started) {
    //   const hits = [...state.found].filter((i) => state.bombs.has(i)).length;
    //   socket.emit("map:ready", {
    //     size: state.size,
    //     bombsTotal: state.bomb_count,
    //     bombsFound: hits,
    //     turnLimit: state.turn_limit ?? 10,
    //   });
    //   socket.emit("turnChanged", {
    //     currentPlayer: state.player_id_list[state.current_turn],
    //     reason: "reconnect",
    //   });
    //   if (state.turn_limit > 0) {
    //     socket.emit("turnTime", {
    //       currentPlayer: state.player_id_list[state.current_turn],
    //       timeRemaining: timer,
    //     });
    //   }
    // }
  });

  function computeWinners(scores) {
    let max = -Infinity;
    const winners = [];
    for (const [id, score] of scores.entries()) {
      if (score > max) {
        max = score;
        winners.length = 0;
        winners.push({ id, score });
      } else if (score === max) {
        winners.push({ id, score });
      }
    }
    return winners;
  }

  function resetGame(state, timer) {
    state.game_started = false;
    const field = new Field();
    field.generate_field([state.size, state.size], state.bomb_count);
    state.placement = field.field;
    state.scores = new Map();
    roomPlayers[state.id].forEach((player) => {
      state.scores.set(player.userID, 0);
    });
    state.current_turn = 0;
    state.player_id_list = fisherYatesShuffle(state.player_id_list);

    timer.reset();

    state.updateRoomInDatabase("reset game"); // set game_started back to false in database

    console.log(` Room ${state.id}: Game reset`);
  }

  // let state = {
  //   size: 6,
  //   bombCount: 11,
  //   turnLimit: 10,
  //   bombs: new Set(),
  //   found: new Set(),
  //   scores: {},
  //   started: false,
  //   players: [],
  //   currentTurnIndex: 0,
  //   turnTimer: null,
  //   turnTimeRemaining: 10,
  //   field: null,
  // };

  //convert from current turn to old turn index
  function findCurrentPlayer(players, current_turn) {
    const index = current_turn % players.length;
    return players[index];
  }

  function nextTurn(current_room_id, state, timer, reason = "miss") {
    console.log(
      `Room ${current_room_id}: Starting new turn because reason ${reason}`
    );
    timer.reset(); // migrate timer (Done)
    state.current_turn = state.current_turn + 1;
    const currentPlayer = findCurrentPlayer(
      state.player_id_list,
      state.current_turn
    );
    console.log(
      `Room ${current_room_id}: Turn changed to player ${currentPlayer} for reason ${reason}`
    );
    io.to(current_room_id).emit("turnChanged", {
      currentPlayer: currentPlayer,
      reason,
    });
    if (state.game_started) {
      //console.log("Timer Restarting in room", current_room_id);
      timer.start();
    }
  }

  function fisherYatesShuffle(array) {
    let currentIndex = array.length;
    let randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }

    return array;
  }

  function assignNewHost(room_id) {
    // console.log("roomplayer", roomPlayers[room_id]);

    if (!roomPlayers[room_id] || roomPlayers[room_id].length === 0) {
      return null; // no players left
    }
    // randomly select new host from remaining players
    const newHost =
      roomPlayers[room_id][
        Math.floor(Math.random() * roomPlayers[room_id].length)
      ];
    return newHost;
  }

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
