import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import InMemoryUserStore from "./userStore.js";
import { randomBytes } from "node:crypto";
import { Field } from "./services/game_logic.js";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();
const roomPlayers = {};

app.prepare().then(() => {
  const randomId = () => randomBytes(8).toString("hex");
  const userStore = new InMemoryUserStore(); // it's a Map of (userID) => {username: string, connected: boolean}

  const httpServer = createServer(handler);
  const io = new Server(httpServer);

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

    socket.on("setAuthSuccessful", () => {
      socket.emit("setAuthSuccessfulAck");
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

    socket.on("kickAllPlayersInRoom", (room_id, user_id) => {
      io.to(room_id).emit("kickAllPlayersInRoom");
    });

    socket.on("room:settings-updated", (data) => {
      console.log(data.settings.bomb_density);
      io.to(data.roomID).emit("roomSettingsUpdate", {
        name: data.settings.name,
        size: data.settings.size,
        bomb_density: data.settings.bomb_density,
        timer: data.settings.timer,
        player_limit: data.settings.player_limit,
        chat_enabled: data.settings.chat_enabled,
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

    socket.on("joinRoom", (room_id) => {
      console.log("Player joinnnnnnn");
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

      console.log("hello");

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

      io.to(room_id).emit("currentPlayers", roomPlayers[room_id]);

      console.log(newPlayer.userID);
      console.log("BBB");
      console.log(roomPlayers[room_id]);
    });

    socket.on("leaveRoom", () => {
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.leave(room);
          if (roomPlayers[room]) {
            roomPlayers[room] = roomPlayers[room].filter(
              (p) => p.userID !== socket.data.userID
            );

            io.to(room).emit("currentPlayers", roomPlayers[room]);
          }
        }
      });
    });

    socket.on("resetNotice", () => {
      console.log("Reset Complete!");
      io.emit("serverRestarts");
    });

    socket.on("pickCell", (index) => {
      if (!state.started) {
        socket.emit("error", { message: "Game hasn't started yet" });
        return;
      }

      if (state.players[state.currentTurnIndex] !== socket.data.userID) {
        socket.emit("error", { message: "It's not your turn!" });
        return;
      }

      if (state.found.has(index)) {
        socket.emit("error", { message: "Cell already revealed" });
        return;
      }

      const cell = state.field.field[index];
      const hit = cell.bomb;
      const hintNumber = cell.number;

      const [x, y] = state.field.index_to_coordinate(index);
      const [flag, success] = state.field.open_cell(x, y);

      if (!success) {
        socket.emit("error", { message: "Failed to reveal cell" });
        return;
      }

      const revealedCells = [];
      for (let i = 0; i < state.field.field.length; i++) {
        if (state.field.field[i].is_open && !state.found.has(i)) {
          revealedCells.push({
            index: i,
            hit: state.field.field[i].bomb,
            hintNumber: state.field.field[i].number,
          });
          state.found.add(i);
        }
      }

      if (hit) {
        state.scores[socket.data.userID] =
          (state.scores[socket.data.userID] || 0) + 1;
      }

      const hits = [...state.found].filter((i) => state.bombs.has(i)).length;

      revealedCells.forEach((cellData) => {
        io.emit("cellResult", {
          index: cellData.index,
          hit: cellData.hit,
          hintNumber: cellData.hintNumber,
          by: cellData.index === index ? socket.data.userID : "auto-reveal",
          bombsFound: hits,
          bombsTotal: state.bombCount,
          scores: state.scores,
        });
      });

      if (hits >= state.bombCount) {
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
        setTimeout(() => {
          resetGame() // เริ่มใหม่ตาหน้า
          io.emit("returnToLobby",{reason: "gameEnded"})
        },10000);

        return;
      }

      if (!hit) {
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
