import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import InMemoryUserStore from "./userStore.js";
import { randomBytes } from "node:crypto";
import { Cell, Field } from "./services/game_logic.js";
import getGameState from "./services/client/getGameState.cjs";
import updateGameState from "./services/client/updateGameState.cjs"
import { Tablet } from "lucide-react";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const randomId = () => randomBytes(8).toString("hex");
  const userStore = new InMemoryUserStore(); // it's a Map of (userID) => {username: string, connected: boolean}

  const httpServer = createServer(handler);
  const io = new Server(httpServer);


  let currentRoom = undefined; // from room management section
  // Server data (frequently updated)

  const roomData = {};
  const sockets = new Map();

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
      if (this.timer) {
        this.reset();
      }
      this.on_run();
      this.timer = setInterval(() => {
        this.time_remaining = this.time_remaining - 1;
        this.on_run();
        if (this.time_remaining <= 0) {
          this.on_complete();
          this.reset();
        }
      }, 1000);
    }
    reset() {
      if (this.timer) {
        clearInterval(this.timer);
        this.interval = undefined;
        this.time_remaining = max_time;
      }
    }
  }

  function createTimer(room_id, max_time) {
    let data = roomData[room_id];
    if (data === undefined) {
      roomData[room_id] = new {};
      data = roomData[room_id]
    }
    let timer = data["timer"];
    if (timer === undefined) {
      data["timer"] = new Timer(
        room_id,
        max_time,
        io.to(room_id).emit("turnTime", {
          timeRemaining: this.timeRemaining,
        }),
        nextTurn("timesUp"),
      );
    }
  }

  // Authen

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

  // Listeners

  io.on("connection", (socket) => {
    console.log("User connected", socket.data.userID);

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

    // if (!state.players.includes(socket.data.userID)) {
    //   state.players.push(socket.data.userID);
    //   console.log(`New player joined: ${socket.data.userID}`);
    // }

    //tracking players
    sockets.set(socket.data.userID, socket);

    socket.emit("session", {
      userID: socket.data.userID,
      username: socket.data.username,
    });

    // if (!state.players.includes(socket.data.userID)) {
    //   state.players.push(socket.data.userID);
    //   console.log(
    //     `Player ${socket.data.userID} joined. Total players: ${state.players.length}`
    //   );
    // }

    socket.on("getOnlineCount", () => {
      console.log(
        `getOnlineCount requested by ${socket.data.userID}, current players: ${sockets.size}` //seperated from game state
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
    let init_state = undefined;
    if (currentRoom) {
      io.emit("playersUpdated", {
        players: state.players,
        currentPlayer: state.started
          ? state.players[state.currentTurnIndex]
          : null,
      });
      init_state = getGameState({ id: currentRoom });
    }

    // If game is in progress, send current state to the connecting player
    if ((init_state != undefined) && (init_state.game_started == true) && (currentRoom != undefined)) {
      const field = new Field();
      field.load(init_state.place, init_state.size, init_state.bomb_count);
      const hits = field.get_hit_count();
      const { id: currentPlayer, index: currentIndex } = findCurrentPlayer(state.player_id_list, state.current_turn);
      socket.emit("map:ready", {
        size: init_state.size,
        bombsTotal: init_state.bomb_count,
        bombsFound: hits,
        turnLimit: init_state.turn_limit ?? 10,
        currentPlayer: currentPlayer || null,
      });

      socket.emit("turnChanged", {
        currentPlayer: currentPlayer,
        reason: "joined",
      });

      if (init_state.turn_limit > 0) {
        socket.emit("turnTime", {
          currentPlayer: currentPlayer,
          timeRemaining: roomData[currentRoom]["timer"].time_remaining,
        });
      }
    }

    //request state

    socket.on("requestState", () => {
      const state = getGameState({ room_id: currentRoom });
      const { id: currentPlayer, index: currentIndex } = findCurrentPlayer(state.player_id_list, state.current_turn);
      socket.emit("playersUpdated", {
        players: state.player_id_list,
        currentPlayer:
          state.game_started && state.player_id_list.length > 0
            ? currentPlayer
            : null,
      });

      if (state.game_started) {
        const field = new Field();
        field.load(init_state.place, init_state.size, init_state.bomb_count);
        const hits = field.get_hit_count();
        socket.emit("map:ready", {
          size: state.size,
          bombsTotal: state.bomb_count,
          bombsFound: hits,
          turnLimit: state.turn_limit ?? 10,
          currentPlayer: currentPlayer || null,
        });

        if (state.turn_limit > 0) {
          socket.emit("turnTime", {
            currentPlayer: currentPlayer,
            timeRemaining: roomData[currentRoom]["timer"].time_remaining,
          });
        }
      }
    });

    socket.on("message", (msg) => {
      socket.rooms.forEach((room) => {
        // TODO: why check room and socket.id??????
        if (room !== socket.id) {
          socket.to(room).emit("message", msg);
        }
      });
    });

    //sent from room setting
    // TODO update to database and update all settings
    socket.on("settings:update", (payload, cb) => {
      try {
        const { size, bombCount, turnLimit } = payload || {};

        if (state.started) {
          console.log("Game in progress, resetting...");
          resetGame();
        }



        if (size) state.size = Number(size);
        if (typeof bombCount === "number") state.bombCount = bombCount;
        if (typeof turnLimit === "number") state.turnLimit = turnLimit;

        io.emit("settings:updated", {
          size: state.size,
          bombCount: state.bombCount,
          turnLimit: state.turnLimit ?? 10,
        });

        cb?.({ ok: true });
      } catch (err) {
        cb?.({ ok: false, error: String(err?.message || err) });
      }
    });

    //Init game

    socket.on("startGame", (payload = {}) => {
      const { size, bombCount, turnLimit } = payload;
      const init_state = getGameState({ room_id: currentRoom })
      if (init_state.game_started) {
        resetGame();
      }

      // create update template
      const temp_state = {
        id: currentRoom,
        size: undefined,
        bomb_count: undefined,
        turn_limit: undefined,
        placement: undefined,
        game_started: undefined,
        player_id_list: undefined,
      }

      //check input
      if (typeof size === "number") temp_state.size = size;
      if (typeof bombCount === "number") temp_state.bomb_count = bombCount;
      if (typeof turnLimit === "number") temp_state.turn_limit = turnLimit;

      if (typeof state.size !== "number") temp_state.size = 6;
      if (!Number.isFinite(temp_state.bomb_count)) {
        temp_state.bomb_count =
          temp_state.size === 6 ? 11 : Math.floor(temp_state.size * temp_state.size * 0.3);
      }
      if (typeof temp_state.turn_limit !== "number") temp_state.turn_limit = 10;

      //generate field
      const temp_field = new Field();
      temp_field.generate_field([temp_state.size, temp_state.size], temp_state.bomb_count);
      temp_state.placement = temp_field;

      //set game flag to start
      temp_state.game_started = true;

      //shuffle players
      //TODO make winner start first
      temp_state.player_id_list = fisherYatesShuffle(init_state.player_id_list);

      //apply states
      updateGameState(temp_state);

      console.log(
        `Game started: ${temp_state.size}x${temp_state.size}, ${temp_state.bomb_count} bombs, ${temp_state.turn_limit}s turns`
      );

      //this is ack?
      io.to(currentRoom).emit("map:ready", {
        size: temp_state.size,
        bombsTotal: temp_state.bomb_count,
        bombsFound: 0,
        turnLimit: temp_state.turn_limit,
        currentPlayer: temp_state.player_id_list[0],//changed from random start to shuffle players and always start at index 0
      });

      // need to check indexing if this uses 0 or 1 current calculations use 0

      io.to(currentRoom).emit("turnChanged", {
        currentPlayer: temp_state.player_id_list[0],
        reason: "gameStart",
      });

      // start timer
      roomData[currentRoom]["timer"].start();
    });

    // room management
    //let currentRoom=undefined; is above

    socket.on("joinRoom", (room_id) => {
      socket.rooms.forEach((room) => {
        // TODO
        if (room !== socket.id) {
          socket.leave(room);
        }
      });
      socket.join(room_id);
      currentRoom = room_id;
    });

    socket.on("leaveRoom", () => {
      socket.rooms.forEach((room) => {
        // TODO
        if (room !== socket.id) {
          socket.leave(room);
        }
      });
      currentRoom = undefined;
    });

    socket.on("getRoom", () => {
      socket.emit("currentRoom", currentRoom)
    })

    socket.on("resetNotice", () => {
      console.log("Reset Complete!");
      io.emit("serverRestarts");
    });

    // game
    socket.on("pickCell", (index) => {
      const state = getGameState({ room_id: currentRoom });

      if (!state.game_started) {
        socket.to(currentRoom).emit("error", { message: "Game hasn't started yet" });
        return;
      }

      const { id: currentPlayer, index: currentIndex } = findCurrentPlayer(state.player_id_list, state.current_turn);

      if (currentPlayer !== socket.id) {
        socket.to(currentRoom).emit("error", { message: "It's not your turn!" });
        return;
      }

      if (state.placement.is_open == true) {
        socket.to(currentRoom).emit("error", { message: "Cell already revealed" });
        return;
      }

      const field = new Field();
      field.load(state.placement, state.size, state, bomb_count);
      const [message, success] = field.open_cell(index);

      if (success == true) {
        state.score_list[currentIndex] = (state.score_list[currentIndex] || 0) + 1;
        console.log("hit : " + message);
      } else {
        console.log("miss : " + message);
      }

      const { new_placement, new_size, new_bombs } = field.export()

      updateGameState(
        {
          id: currentRoom,
          //size: new_size,
          //bomb_count: new_bombs,
          placement: new_placement,
          score_list: state.score_list,
          //current_turn:undefined,
        }
      );

      const hits = field.get_hit_count()

      io.to(currentRoom).emit("pickCellResult", {
        revealMap: field.export_display_data(),
        bombsFound: hits,
        bombsTotal: state.bomb_count,
        scores: state.score_list,
      });

      // end game scenario
      if (hits >= state.bomb_count) {
        const winners = computeWinners(currentRoom);

        io.to(currentRoom).emit("gameOver", {
          winners,
          scores: state.score_list,
          size: state.size,
          bombCount: state.bomb_count,
        });
        resetGame(currentRoom)
        return;
      }
      // continue game
      if (!success) {
        nextTurn("miss");
      } else {
        const timer = roomData[currentRoom]["timer"];
        timer.reset()
        timer.start()
      }
    });
    socket.on("disconnect", () => {
      const state = getGameState({ room_id: currentRoom });
      console.log("User disconnected", socket.data.userID);

      userStore.saveUser(socket.data.userID, {
        username: socket.data.username,
        connected: false,
      });

      const temp_state = {
        player_id_list: undefined,
        current_turn: undefined,
      }

      // remove player
      const { id: currentPlayer, index: currentIndex } = findCurrentPlayer(state.player_id_list, state.current_turn);
      const playerIndex = state.player_id_list.indexOf(socket.data.userID);
      if (playerIndex != -1) {
        temp_state.player_id_list = state.player_id_list.splice(playerIndex, 1);

        io.to(currentRoom).emit("onlineCountUpdate", {
          count: temp_state.player_id_list.length,
          isHost: false,
        });

        // tracking players
        sockets.delete(socket.data.userID);

        // cases
        let newCurrentPlayer;
        let leftIsCurrentPlayer;
        if (currentPlayer == socket.data.userID) {
          // is current player
          ({ id: newCurrentPlayer, index: _ } = findCurrentPlayer(state.player_id_list, state.current_turn + 1));
          leftIsCurrentPlayer = true;
        } else {
          // is not current player
          newCurrentPlayer = currentPlayer;
          leftIsCurrentPlayer = false;
        }
        temp_state.current_turn = temp_state.player_id_list(newCurrentPlayer);
        updateGameState(temp_state);

        io.to(currentRoom).emit("playersUpdated", {
          players: temp_state.player_id_list,
          currentPlayer: newCurrentPlayer,
        });

        if (
          leftIsCurrentPlayer &&
          state.game_started &&
          temp_state.player_id_list.length > 0
        ) {
          nextTurn("playerLeft");
        }
      }
    });
    // end of listeners

    // init for new client
    const state = getGameState({ room_id: currentRoom });
    const { id: currentPlayer, index: currentIndex } = findCurrentPlayer(state.player_id_list, state.current_turn);
    const field = new Field()
    field.load(state.placement, state.size, state.bombCount);
    const hits = field.get_hit_count()
    if (state.game_started) {
      socket.emit("map:ready", {
        size: state.size,
        bombsTotal: state.bomb_count,
        bombsFound: hits,
        turnLimit: state.turn_limit ?? 10,
      });
      socket.emit("turnChanged", {
        currentPlayer: currentPlayer,
        reason: "reconnect",
      });
      if (state.turnLimit > 0) {
        socket.emit("turnTime", {
          currentPlayer: currentPlayer,
          timeRemaining: roomData[currentRoom]["timer"].time_remaining,
        });
      }
    }
  });

  function computeWinners(room_id) {
    const state = getGameState({ room_id: currentRoom });
    let max = -Infinity;
    const winners = [];
    const scores = state.player_id_list.map((val, i) => [val, state.score_list[i]]);
    for (const [id, score] of Object.entries(scores)) {
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

  //Resets game (can be used to refresh new settings too)
  function resetGame(room_id) {
    //Go completely blank? start game will run init?
    //Does resetGame get used when changing settings?
    const state = getGameState({ room_id: currentRoom });
    updateGameState(
      {
        id: room_id,
        name: state.name,
        host_id: state.host_id,
        player_id_list: state.player_id_list,
        size: state.size,
        player_limit: state.player_limit,
        bomb_count: state.bomb_count,
        chat_enabled: state.chat_enabled,
        timer: state.timer,
        game_started: false,
        placement: new Array < Cell > ([]),
        score_list: new Array(state.player_id_list.length).fill(0),
        current_turn: 0, //turn is per person, to get round mod it
      }
    );
    roomData[room_id]["timer"] = undefined;
    createTimer(room_id, state.timer);

    console.log("Room " + room_id + " Game reset");
  }

  // Archieved , replaced by timer class
  // function startTurnTimer(room_id) {
  //   //TODO later add no time case (init time ==0)
  //   if (state.turnTimer) {
  //     clearInterval(state.turnTimer);
  //   }
  //   state.turnTimeRemaining = state.turnLimit;

  //   io.emit("turnTime", {
  //     currentPlayer: state.players[state.currentTurnIndex],
  //     timeRemaining: state.turnTimeRemaining,
  //   });
  //   if (state.turnLimit === 0) return;

  //   state.turnTimer = setInterval(() => {
  //     state.turnTimeRemaining--;

  //     io.emit("turnTime", {
  //       currentPlayer: state.players[state.currentTurnIndex],
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
    return ({
      id: players[index],
      index: index
    }
    );
  }

  function nextTurn(room_id, reason = "miss") {
    const timer = roomData[room_id]["timer"];
    timer.reset();
    const state = getGameState({ room_id: currentRoom });
    updateGameState({
      id: room_id,
      current_turn: state.current_turn + 1,
    })
    const { id: currentPlayer, index: currentIndex } = findCurrentPlayer(state.player_id_list, state.current_turn);
    io.emit("turnChanged", {
      currentPlayer: currentPlayer,
      reason,
    });
    if (state.game_started) {
      timer.start()
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
