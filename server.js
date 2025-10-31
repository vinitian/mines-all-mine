import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import InMemoryUserStore from "./userStore.js";
import { randomBytes } from "node:crypto";
import { Field } from "./services/game_logic.js";
import getGameState from "./services/client/getGameState.js";
import updateGameState from "./services/client/updateGameState.js";
import createRoom from "./services/client/createRoom.js";
import editRoom from "./services/client/editRoom.js";

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
      this.bomb_count = undefined; //init bombs count
      this.chat_enabled = undefined;
      this.timer = undefined; //init time amount
      this.game_started = undefined;
      this.placement = undefined;
      //this.score_list = undefined; // list of integers score, index same as player id list
      //VV now this is index?
      this.current_turn = 0; //count by player (to find amout of cycles through all players use division)
      console.log(`player id ${host_id} created room id ${id}`);
      //possibly temp
      this.current_turn_index = undefined; // to be depricated
      this.scores = undefined; // migrate from score_list Map<string, number>
      // also know as timer in db?
      this.turn_limit = undefined;
      this.density = undefined; // for proporgation only
      this.prev_winner = undefined;
    }

    updateRoomInDatabase(socket, reason = "unspecified") {
      //TODO link to database.
      // TODO NEXT - IMPLEMENT server or client
      console.log("805-updateDatabase, state rn:", JSON.stringify(this));
      // return await editRoom({
      //   user_id: socket.data.userID,
      //   name: this.name,
      //   size: this.size,
      //   bomb_count: this.bomb_count,
      //   turn_limit: this.turn_limit,
      //   player_limit: this.player_limit,
      //   chat_enabled: this.chat_enabled,
      // });
      console.log(`updating database for ${reason} reason`);
      return;
    }
    loadDatabase() {
      //TODO link to database.
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
      `getting data of room id ${room_id} for ${reason} reason`,
      JSON.stringify(roomData[room_id]["state"])
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
        console.log(`room id ${this.room_id} timer starting`);
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
        console.log(`room id ${this.room_id} timer starting (unlimited mode)`);
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
      console.log(`room id ${this.room_id} timer resetting`);
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
    console.log(`getting timer of room id ${room_id} for ${reason} reason`);
    return roomData[room_id]["timer"];
  }

  io.use((socket, next) => {
    console.log("handshake AUTH", socket.handshake.auth);
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

    console.log("DONE io.use() socket socket data:", socket.data);

    return next();
  });

  io.on("connection", (socket) => {
    console.log("User connected", socket.data.userID);
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

    const { id: currentPlayer, index: currentIndex } = state
      ? findCurrentPlayer(state.player_id_list, state.current_turn)
      : { id: undefined, index: undefined };

    io.emit("playersUpdated", {
      players: Array.from(sockets.keys()),
      currentPlayer: state && state.game_started ? currentPlayer : null,
    });

    // convert state.found? convert state.current_turn_index? may be needed for joining mid game?
    // If game is in progress, send current state to the connecting player
    // dont know if needed
    // if (state && state.game_started) {
    //   const hits = [...state.found].filter((i) => state.bombs.has(i)).length;
    //   socket.emit("map:ready", {
    //     size: state.size,
    //     bombsTotal: state.bomb_count,
    //     bombsFound: hits,
    //     turnLimit: state.turn_limit ?? 10,
    //     currentPlayer: state.player_id_list[state.current_turn_index] || null,
    //   });

    //   socket.emit("turnChanged", {
    //     currentPlayer: state.player_id_list[state.current_turn_index],
    //     reason: "joined",
    //   });

    //   if (state.turn_limit > 0) {
    //     socket.emit("turnTime", {
    //       currentPlayer: state.player_id_list[state.current_turn_index],
    //       timeRemaining: state.turnTimeRemaining,
    //     });
    //   }
    // }

    socket.on("requestState", () => {
      const { id: currentPlayer, index: currentIndex } = findCurrentPlayer(
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
          size: state.size,
          bombsTotal: state.bomb_count,
          bombsFound: hits,
          turnLimit: state.turn_limit ?? 10,
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

    // runs every adjustment (depricated)
    socket.on("room:settings-updated", (data) => {
      //console.log(data.settings.bomb_density);
      io.to(data.roomID).emit("roomSettingsUpdate", {
        name: data.settings.name,
        size: data.settings.size,
        bomb_density: data.settings.bomb_density,
        timer: data.settings.timer,
        player_limit: data.settings.player_limit,
        chat_enabled: data.settings.chat_enabled,
      });
    });

    // runs on start game (depricated)
    socket.on("settings:update", (payload, cb) => {
      try {
        const { size, bombCount, turnLimit } = payload || {};

        if (state.game_started) {
          console.log("Game in progress, resetting...");
          resetGame(state, timer);
        }

        if (size) state.size = Number(size);
        if (typeof bombCount === "number") state.bomb_count = bombCount;
        if (typeof turnLimit === "number") state.turn_limit = turnLimit;

        //broadcast to current room only?

        io.to(current_room_id).emit("settings:updated", {
          size: state.size,
          bombCount: state.bomb_count,
          turnLimit: state.turn_limit ?? 10,
        });

        cb?.({ ok: true });
      } catch (err) {
        cb?.({ ok: false, error: String(err?.message || err) });
      }
    });

    socket.on("room:update-settings", (payload, updateDb, callback) => {
      console.log(
        `Room setting update request received from ${current_room_id} with payload ${JSON.stringify(
          payload
        )}`
      );
      // TODO handle timer
      // migrate timer
      // TODO not implemeted yet
      state.update(payload);

      if (updateDb) {
        try {
          state.updateRoomInDatabase(state, socket);
        } catch (error) {
          console.log(error);
        }
        // TODO: improve error handling. should we handle here, or inside updateDatabase?
        // TODO: return fail if unable to update DB and revert socket state too
      }

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
        //console.log(response);
        const data = response.data;
        createRoomObject(data.id, data.name, data.host_id);
        createTimer(data.id, 10); // assuming 10 default, may need to change later, maybe useEffect will take care of this in roomsettings
        // may be needed to set defaults?
        //const state = getGameState(data.id, reason = "init values on create room")
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

      // TODO depricate, remove dependence
      // state.bombs = new Set();
      // for (let i = 0; i < state.field.field.length; i++) {
      //   if (state.field.field[i].bomb) {
      //     state.bombs.add(i);
      //   }
      // }

      // state.found = new Set();
      state.scores = new Map();
      state.game_started = true;

      //shuffle players
      //TODO make winner start first
      state.player_id_list = fisherYatesShuffle(state.player_id_list);
      if (
        state.prev_winner &&
        state.player_id_list.includes(state.prev_winner)
      ) {
        console.log(`putting previous winner ${state.prev_winner} first`);
        state.player_id_list = state.player_id_list.filter(
          (p) => p !== state.prev_winner
        );
        state.player_id_list = [state.prev_winner, ...state.player_id_list];
        console.log(`new player order ${state.player_id_list}`);
      }

      console.log(
        `Game started: ${state.size}x${state.size}, ${state.bomb_count} bombs, ${state.turn_limit}s turns`
      );

      // change to room level (chganged)
      state.current_turn = 0;
      const { id: currentPlayer, index: currentIndex } = findCurrentPlayer(
        state.player_id_list,
        state.current_turn
      );
      console.log("starting game with current player", currentPlayer);

      //console.log("startGame map:ready emit");
      io.to(current_room_id).emit("map:ready", {
        size: state.size,
        bombsTotal: state.bomb_count,
        bombsFound: 0,
        turnLimit: state.turn_limit,
        currentPlayer: currentPlayer,
        revealed: field.export_display_data(),
      });

      console.log(
        `Turn changed to player ${currentPlayer} for reason gameStart`
      );
      io.to(current_room_id).emit("turnChanged", {
        currentPlayer: currentPlayer,
        reason: "gameStart",
      });

      //startTurnTimer(); //migrate timer
      timer.start();
    });

    //Room Management

    socket.on("joinRoom", (room_id) => {
      socket.rooms.forEach((room) => {
        // TODO
        if (room !== socket.id) {
          socket.leave(room);
          // leave room
          if (roomPlayers[room]) {
            roomPlayers[room] = roomPlayers[room].filter(
              (p) => p.userID !== socket.data.userID
            );

            io.to(room).emit("currentPlayers", roomPlayers[room]);
          }
        }
      });

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
        `[ JOIN ] ${newPlayer.userID} joined. current players in ${room_id}: ${roomPlayers[room_id]}`
      );

      //tracking player room and setting state
      current_room_id = room_id;
      state = getGameState(room_id, "joining room");
      timer = getTimer(room_id, "joining room");
    });

    socket.on("leaveRoom", () => {
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.leave(room);
          if (roomPlayers[room]) {
            roomPlayers[room] = roomPlayers[room].filter(
              (p) => p.userID !== socket.data.userID
            );

            //if may not be necessay if roomPlayers always sync with this
            if (state && state.player_id_list.includes(socket.data.userID)) {
              state.player_id_list.splice(
                state.player_id_list.indexOf(socket.data.userID),
                1
              );
            }

            io.to(room).emit("currentPlayers", roomPlayers[room]);
            // tell other players that a player has left
            io.to(room).emit("playerLeft", socket.data.userID);
          }
        }
      });

      console.log(
        "leave room run",
        roomPlayers[current_room_id],
        state.player_id_list
      );
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
      console.log(`Picking cell at index ${index}`);
      if (!state.game_started) {
        socket.emit("error", { message: "Game hasn't started yet" });
        return;
      }

      const { id: currentPlayer, index: currentIndex } = findCurrentPlayer(
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
      const [y, x] = field.index_to_coordinate(index); // needed to swap this
      const [flag, success] = field.open_cell(x, y);

      console.log(`Picking cell at (${x},${y})`);

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

      console.log(
        "sending pickCellResult",
        hits,
        state.bomb_count,
        state.scores
      );
      io.to(current_room_id).emit("cellResult", {
        revealMap: field.export_display_data(),
        bombsFound: hits,
        bombsTotal: state.bomb_count,
        scores: state.scores,
      });

      // end game scenario
      if (hits >= state.bomb_count) {
        // migrate timer (Done)
        // if (state.turnTimer) {
        //   clearInterval(state.turnTimer);
        //   state.turnTimer = null;
        // }
        console.log("Game ending");
        timer.reset();

        state.game_started = false;
        const winners = computeWinners(state.scores);
        state.prev_winner = winners[0].id;

        //broadcast to current room only?
        io.to(current_room_id).emit("gameOver", {
          winners,
          scores: Array.from(state.scores.entries()), // changed from map to array because socket cant send map
          size: state.size,
          bombCount: state.bomb_count,
        });
        setTimeout(() => {
          console.log(`Sending return to lobby to room with id ${current_room_id}`);
          io.to(current_room_id).emit("returnToLobby", { reason: "gameEnded" }); // TODO: no .to(room)?? Probably needed so added
          resetGame(state, timer); // เริ่มใหม่ตาหน้า <- added parameters for this func
        }, 10000);

        return;
      }

      if (!hit) {
        nextTurn(current_room_id, state, timer, "miss");
      } else {
        console.log("Hit bomb, restarting timer");
        timer.reset();
        timer.start(); //migrate timer (Done)
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected", socket.data.userID);

      // Automatically removes the player from the room they're in
      outerLoop: for (const [roomId, playersList] of Object.entries(
        roomPlayers
      )) {
        console.log(`Key: ${parseInt(roomId)}, Value: ${playersList}`);

        for (const player of playersList) {
          if (socket.data.userID == player.userID) {
            console.log(player);

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

      userStore.saveUser(socket.data.userID, {
        username: socket.data.username,
        connected: false,
      });

      // tracking players (global) (upon disconnect)
      sockets.delete(socket.data.userID);

      // TODO still broken needs fixing
      // remove player
      const { id: currentPlayer, index: currentIndex } = findCurrentPlayer(
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
          ({ id: newCurrentPlayer, index: _ } = findCurrentPlayer(
            state.player_id_list,
            state.current_turn + 1
          ));
          leftIsCurrentPlayer = true;
        } else {
          // is not current player
          newCurrentPlayer = currentPlayer;
          leftIsCurrentPlayer = false;
        }
        state.player_id_list.splice(playerIndex, 1);

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
    //     currentPlayer: state.player_id_list[state.current_turn_index],
    //     reason: "reconnect",
    //   });
    //   if (state.turn_limit > 0) {
    //     socket.emit("turnTime", {
    //       currentPlayer: state.player_id_list[state.current_turn_index],
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
    console.log("816-state.game_started before", state.game_started);
    state.game_started = false;
    console.log("818-state.game_started after", state.game_started);
    const field = new Field();
    field.generate_field([state.size, state.size], state.bomb_count);
    state.placement = field.field;
    state.scores = new Map();
    state.current_turn = 0;
    state.player_id_list = fisherYatesShuffle(state.player_id_list);
    console.log("825-resetted state", state);
    // if (state.turnTimer) { // migrate timer (Done)
    //   clearInterval(state.turnTimer);
    //   state.turnTimer = null;
    // }
    timer.reset();
    console.log("Game reset");
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

  // TODO replace with new timer object
  // function startTurnTimer() {
  //   if (state.turnTimer) {
  //     clearInterval(state.turnTimer);
  //   }
  //   state.turnTimeRemaining = state.turn_limit;

  //   io.emit("turnTime", {
  //     currentPlayer: state.player_id_list[state.current_turn_index],
  //     timeRemaining: state.turnTimeRemaining,
  //   });
  //   if (state.turn_limit === 0) return;

  //   state.turnTimer = setInterval(() => {
  //     state.turnTimeRemaining--;

  //     io.emit("turnTime", {
  //       currentPlayer: state.player_id_list[state.current_turn_index],
  //       timeRemaining: state.turnTimeRemaining,
  //     });

  //     if (state.turnTimeRemaining <= 0) {
  //       nextTurn("times up"); // TODO: reason should be same format -> timesUp
  //     }
  //   }, 1000);
  // }

  //convert from current turn to old turn index
  function findCurrentPlayer(players, current_turn) {
    const index = current_turn % players.length;
    return {
      id: players[index],
      index: index,
    };
  }

  //TODO redo this remove current_turn_index
  function nextTurn(current_room_id, state, timer, reason = "miss") {
    console.log(`Starting new turn because reason ${reason}`);
    timer.reset(); // migrate timer (Done)
    state.current_turn = state.current_turn + 1;
    const { id: currentPlayer, index: currentIndex } = findCurrentPlayer(
      state.player_id_list,
      state.current_turn
    );
    console.log(`Turn changed to player ${currentPlayer} for reason ${reason}`);
    io.to(current_room_id).emit("turnChanged", {
      currentPlayer: currentPlayer,
      reason,
    });
    if (state.game_started) {
      //console.log("Timer Restarting");
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

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
