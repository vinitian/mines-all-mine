import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import InMemoryUserStore from "./userStore.js";
import { randomBytes } from "node:crypto";
import {Cell, Field} from "./services/game_logic.js";
import getGameState from "@/services/client/getGameState";
import createField from "@/services/client/createField";
import getField from "@/services/client/getField";
// import revealCell from "@/services/client/revealCell";
import updateGameState from "@/services/client/updateGameState"

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

  // Server data (frequently updated)
  // time data
  const timeStates = new {}

  //stores "timer"
  // "room_id": {
  //   time_remaining:10,
  //   max_time:10,
  // } 
  function addTimer(room_id,max_time){
    if(room_id in timeStates){
      return(timeStates[room_id]);
    }else{
      timeStates[room_id]={
        time_remaining:max_time,
        max_time:max_time,
      };
      return(timeStates[room_id]);
    }
  }
  function getTimer(room_id){
    return(timeStates[room_id])
  }
  function resetTimer(room_id){
    const timer=timeStates[room_id];
    timer.time_remaining=timer.max_time;
    return(timer)
  }
  function incrementTimer(room_id, amount){
    const timer=timeStates[room_id];
    timer.time_remaining=timer.time_remaining+amount;
    return(timer)
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

    if (!state.players.includes(socket.data.userID)) {
      state.players.push(socket.data.userID);
      console.log(`New player joined: ${socket.data.userID}`);
    }

    socket.emit("session", {
      userID: socket.data.userID,
      username: socket.data.username,
    });

    if (!state.players.includes(socket.data.userID)) {
      state.players.push(socket.data.userID);
      console.log(
        `Player ${socket.data.userID} joined. Total players: ${state.players.length}`
      );
    }

    socket.on("getOnlineCount", () => {
      console.log(
        `getOnlineCount requested by ${socket.data.userID}, current players: ${state.players.length}`
      );

      socket.emit("onlineCountUpdate", {
        count: state.players.length,
        isHost: isLocalhost,
      });
    });

    // Broadcast to all clients
    io.emit("onlineCountUpdate", {
      count: state.players.length,
      isHost: isLocalhost,
    });

    io.emit("playersUpdated", {
      players: state.players,
      currentPlayer: state.started
        ? state.players[state.currentTurnIndex]
        : null,
    });
    
    //Request state

    // If game is in progress, send current state to the connecting player
    if (state.started) {
      const hits = [...state.found].filter((i) => state.bombs.has(i)).length;
      socket.emit("map:ready", {
        size: state.size,
        bombsTotal: state.bombCount,
        bombsFound: hits,
        turnLimit: state.turnLimit ?? 10,
        currentPlayer: state.players[state.currentTurnIndex] || null,
      });

      socket.emit("turnChanged", {
        currentPlayer: state.players[state.currentTurnIndex],
        reason: "joined",
      });

      if (state.turnLimit > 0) {
        socket.emit("turnTime", {
          currentPlayer: state.players[state.currentTurnIndex],
          timeRemaining: state.turnTimeRemaining,
        });
      }
    }

    socket.on("requestState", () => {
      socket.emit("playersUpdated", {
        players: state.players,
        currentPlayer:
          state.started && state.players.length > 0
            ? state.players[state.currentTurnIndex]
            : null,
      });

      if (state.started) {
        const hits = [...state.found].filter((i) => state.bombs.has(i)).length;
        socket.emit("map:ready", {
          size: state.size,
          bombsTotal: state.bombCount,
          bombsFound: hits,
          turnLimit: state.turnLimit ?? 10,
          currentPlayer: state.players[state.currentTurnIndex] || null,
        });

        if (state.turnLimit > 0) {
          socket.emit("turnTime", {
            currentPlayer: state.players[state.currentTurnIndex],
            timeRemaining: state.turnTimeRemaining,
          });
        }
      }
    });

    if (state.started) {
      const hits = [...state.found].filter((i) => state.bombs.has(i)).length;
      socket.emit("map:ready", {
        size: state.size,
        bombsTotal: state.bombCount,
        bombsFound: hits,
        turnLimit: state.turnLimit ?? 10,
        currentPlayer: state.players[state.currentTurnIndex] || null,
      });

      socket.emit("turnChanged", {
        currentPlayer: state.players[state.currentTurnIndex],
        reason: "reconnect",
      });

      if (state.turnLimit > 0) {
        socket.emit("turnTime", {
          currentPlayer: state.players[state.currentTurnIndex],
          timeRemaining: state.turnTimeRemaining,
        });
      }
    }

    socket.on("message", (msg) => {
      socket.rooms.forEach((room) => {
        // TODO: why check room and socket.id??????
        if (room !== socket.id) {
          socket.to(room).emit("message", msg);
        }
      });
    });

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

    socket.on("startGame", (payload = {}) => {
      const { size, bombCount, turnLimit } = payload;

      if (state.started) {
        resetGame();
      }

      if (typeof size === "number") state.size = size;
      if (typeof bombCount === "number") state.bombCount = bombCount;
      if (typeof turnLimit === "number") state.turnLimit = turnLimit;

      if (typeof state.size !== "number") state.size = 6;
      if (!Number.isFinite(state.bombCount)) {
        state.bombCount =
          state.size === 6 ? 11 : Math.floor(state.size * state.size * 0.3);
      }
      if (typeof state.turnLimit !== "number") state.turnLimit = 10;

      state.field = new Field();
      state.field.generate_field([state.size, state.size], state.bombCount);

      state.bombs = new Set();
      for (let i = 0; i < state.field.field.length; i++) {
        if (state.field.field[i].bomb) {
          state.bombs.add(i);
        }
      }

      state.found = new Set();
      state.scores = {};
      state.started = true;
      state.currentTurnIndex = Math.floor(Math.random() * state.players.length);

      console.log(
        `Game started: ${state.size}x${state.size}, ${state.bombCount} bombs, ${state.turnLimit}s turns`
      );

      //this is ack
      io.emit("map:ready", {
        size: state.size,
        bombsTotal: state.bombCount,
        bombsFound: 0,
        turnLimit: state.turnLimit,
        currentPlayer: state.players[state.currentTurnIndex],
      });

      io.emit("turnChanged", {
        currentPlayer: state.players[state.currentTurnIndex],
        reason: "gameStart",
      });

      startTurnTimer();
    });

    // room management
    const currentRoom=undefined;

    socket.on("joinRoom", (room_id) => {
      socket.rooms.forEach((room) => {
        // TODO
        if (room !== socket.id) {
          socket.leave(room);
        }
      });
      socket.join(room_id);
      currentRoom=room_id;
    });

    socket.on("leaveRoom", () => {
      socket.rooms.forEach((room) => {
        // TODO
        if (room !== socket.id) {
          socket.leave(room);
        }
      });
      currentRoom=undefined;
    });

    socket.on("getRoom", () => {
      socket.emit("currentRoom",currentRoom)
    })

    function findCurrentPlayer(players, current_turn){
      const index=current_turn%players.length;
      return({
        id:players[index],
        index: index}
      );
    }

    socket.on("resetNotice", () => {
      console.log("Reset Complete!");
      io.emit("serverRestarts");
    });

    // game
    socket.on("pickCell", (index) => {
      const state=getGameState({room_id:currentRoom});
      
      if (!state.game_started) {
        socket.to(currentRoom).emit("error", { message: "Game hasn't started yet" });
        return;
      }

      const {currentPlayer, currentIndex} =findCurrentPlayer(state.player_id_list,state.current_turn);

      if (currentPlayer !== socket.id) {
        socket.to(currentRoom).emit("error", { message: "It's not your turn!" });
        return;
      }

      if (state.placement.is_open==true) {
        socket.to(currentRoom).emit("error", { message: "Cell already revealed" });
        return;
      }

      const field = new Field();
      field.load(state.placement,state.size,state,bomb_count);
      const [message, success] = field.open_cell(index);

      if (success==true) {
        state.score_list[currentIndex] = (state.score_list[currentIndex]|| 0) + 1;
        console.log("hit : "+message);
      }else{
        console.log("miss : "+message);
      }

      const { new_placement, new_size, new_bombs }=field.export()

      updateGameState(
        {
          id: currentRoom,
          size: new_size,
          bomb_count: new_bombs,
          placement:new_placement,
          score_list:state.score_list,
          current_turn:undefined,
        }
      );

      const hits=field.get_hit_count()

      io.to(currentRoom).emit("pickCellResult", {
        revealMap: field.export_display_data(),
        bombsFound: hits,
        bombsTotal: state.bomb_count,
        scores: state.score_list,
      });


      if (hits >= state.bomb_count) {
        // to here
        if (state.turnTimer) {
          clearInterval(state.turnTimer);
          state.turnTimer = null;
        }

        state.started = false;
        const winners = computeWinners(state.scores);

        io.emit("gameOver", {
          winners,
          scores: state.scores,
          size: state.size,
          bombCount: state.bombCount,
        });
        return;
      }

      if (!success) {
        nextTurn("miss");
      } else {
        startTurnTimer();
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected", socket.data.userID);

      userStore.saveUser(socket.data.userID, {
        username: socket.data.username,
        connected: false,
      });

      // remove player
      const playerIndex = state.players.indexOf(socket.id);
      if (playerIndex != -1) {
        state.players.splice(playerIndex, 1);

        io.emit("onlineCountUpdate", {
          count: state.players.length,
          isHost: false,
        });

        if (
          state.currentTurnIndex >= state.players.length &&
          state.players.length > 0
        ) {
          state.currentTurnIndex = 0;
        }
        io.emit("playersUpdated", {
          players: state.players,
          currentPlayer:
            state.started && state.players.length > 0
              ? state.players[state.currentTurnIndex]
              : null,
        });

        if (
          playerIndex === state.currentTurnIndex &&
          state.started &&
          state.players.length > 0
        ) {
          nextTurn("playerLeft");
        }
      }
    });

    if (state.started) {
      const hits = [...state.found].filter((i) => state.bombs.has(i)).length;
      socket.emit("map:ready", {
        size: state.size,
        bombsTotal: state.bombCount,
        bombsFound: hits,
        turnLimit: state.turnLimit ?? 10,
      });
      socket.emit("turnChanged", {
        currentPlayer: state.players[state.currentTurnIndex],
        reason: "reconnect",
      });
      if (state.turnLimit > 0) {
        socket.emit("turnTime", {
          currentPlayer: state.players[state.currentTurnIndex],
          timeRemaining: state.turnTimeRemaining,
        });
      }
    }
  });

  function computeWinners(scores) {
    let max = -Infinity;
    const winners = [];
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

  function randomize(size = 6, bombCount = 11) {
    const bombs = new Set();
    while (bombs.size < bombCount) {
      bombs.add(Math.floor(Math.random() * (size * size)));
    }
    return bombs;
  }

  function resetGame() {
    state.bombs = new Set();
    state.found = new Set();
    state.scores = {};
    state.started = false;
    state.currentTurnIndex = 0;
    state.turnTimeRemaining = state.turnLimit || 10;
    state.field = null;

    if (state.turnTimer) {
      clearInterval(state.turnTimer);
      state.turnTimer = null;
    }
    console.log("Game reset");
  }

  let state = {
    size: 6,
    bombCount: 11,
    turnLimit: 10,
    bombs: new Set(),
    found: new Set(),
    scores: {},
    started: false,
    players: [],
    currentTurnIndex: 0,
    turnTimer: null,
    turnTimeRemaining: 10,
    field: null,
  };

  function startTurnTimer() {
    if (state.turnTimer) {
      clearInterval(state.turnTimer);
    }
    state.turnTimeRemaining = state.turnLimit;

    io.emit("turnTime", {
      currentPlayer: state.players[state.currentTurnIndex],
      timeRemaining: state.turnTimeRemaining,
    });
    if (state.turnLimit === 0) return;

    state.turnTimer = setInterval(() => {
      state.turnTimeRemaining--;

      io.emit("turnTime", {
        currentPlayer: state.players[state.currentTurnIndex],
        timeRemaining: state.turnTimeRemaining,
      });

      if (state.turnTimeRemaining <= 0) {
        nextTurn("times up"); // TODO: reason should be same format -> timesUp
      }
    }, 1000);
  }

  function nextTurn(reason = "miss") {
    if (state.turnTimer) {
      clearInterval(state.turnTimer);
      state.turnTimer = null;
    }

    state.currentTurnIndex =
      (state.currentTurnIndex + 1) % state.players.length;

    io.emit("turnChanged", {
      currentPlayer: state.players[state.currentTurnIndex],
      reason,
    });

    if (state.started) {
      startTurnTimer();
    }
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
