import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import InMemorySessionStore from "./sessionStore.js";
import { randomBytes } from "node:crypto";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const randomId = () => randomBytes(8).toString("hex");
  const sessionStore = new InMemorySessionStore();

  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  io.use((socket, next) => {
    console.log("handshake AUTH", socket.handshake.auth);
    const sessionID = socket.handshake.auth.sessionID;
    let session;

    if (sessionID && sessionID.trim()) {
      session = sessionStore.findSession(sessionID); // find existing session
      if (session && session.connected) {
        socket.emit("duplicateConnectedSession");
      }
    }

    const auth = socket.handshake.auth;
    // prioritise the data that the client sends first, then session from `sessionStore`, else randomise new ID.
    socket.data.sessionID =
      sessionID && sessionID.trim() ? sessionID : randomId();
    socket.data.userID =
      auth.userID && auth.userID.trim()
        ? auth.userID
        : session && session.userID
        ? session.userID
        : randomId();
    socket.data.username =
      auth.username && auth.username.trim() ? auth.username : session.username;
    sessionStore.saveSession(socket.data.sessionID, {
      userID: socket.data.userID,
      username: socket.data.username,
      connected: false,
    });

    console.log("DONE io.use() socket socket data:", socket.data);

    return next();
  });

  io.on("connection", (socket) => {
    console.log("User connected", socket.id);

    console.log("User connected", socket.data.sessionID);

    sessionStore.saveSession(socket.data.sessionID, {
      userID: socket.data.userID,
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

    if (!state.players.includes(socket.id)) {
      state.players.push(socket.id);

    socket.emit("session", {
      sessionID: socket.data.sessionID,
      userID: socket.data.userID,
      username: socket.data.username,
    });

    if (!state.players.includes(socket.data.sessionID)) {
      state.players.push(socket.data.sessionID);
      console.log(
        `Player ${socket.data.sessionID} joined. Total players: ${state.players.length}`
      );
    }


    socket.on('getOnlineCount', () => {
      console.log(`getOnlineCount requested by ${socket.id}, current players: ${state.players.length}`);

      const isLocalhost =
        socket.handshake.headers.origin === "http://localhost:3000" ||
        socket.handshake.headers.host === "localhost:3000" ||
        socket.handshake.address === "::1" ||
        socket.handshake.address === "127.0.0.1";

      socket.emit('onlineCountUpdate', {
        count: state.players.length,
        isHost: isLocalhost,
      });
    });

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

    socket.on("message", (msg, id) => {
      socket.to(id).emit("message", msg);

    socket.on("message", (msg) => {
      socket.rooms.forEach(room => {
        if (room !== socket.id) {
          socket.to(room).emit("message", msg);
        }
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected", socket.data.sessionID);
      sessionStore.saveSession(socket.data.sessionID, {
        userID: socket.data.userID,
        username: socket.data.username,
        connected: false,
      });

      // remove player
      const playerIndex = state.players.indexOf(socket.id);
      if (playerIndex !== -1) {
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

      // ensure defaults
      if (typeof state.size !== "number") state.size = 6;
      if (!Number.isFinite(state.bombCount)) {
        state.bombCount =
          state.size === 6 ? 11 : Math.floor(state.size * state.size * 0.3);
      }
      if (typeof state.turnLimit !== "number") state.turnLimit = 10;

      state.bombs = randomize(state.size, state.bombCount);
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
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });
      socket.join(room_id);
    });

    socket.on("leaveRoom", () => {
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });
    });

    socket.on("pickCell", (index) => {
      if (!state.started) return;

      if (!state.started) {
        socket.emit("error", { message: "Game hasn't started yet" });
        return;
      }

      if (state.players[state.currentTurnIndex] !== socket.id) {
        socket.emit("error", { message: "It's not your turn!" });
        return;
      }

      if (state.found.has(index)) {
        socket.emit("error", { message: "Cell already revealed" });
        return;
      }

      const hit = state.bombs.has(index);
      state.found.add(index);

      if (hit) {
        state.scores[socket.id] = (state.scores[socket.id] || 0) + 1;
      }

      const hits = [...state.found].filter((i) => state.bombs.has(i)).length;

      io.emit("cellResult", {
        index,
        hit,
        by: socket.id,
        bombsFound: hits,
        bombsTotal: state.bombCount,
        scores: state.scores,
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
        return;
      }

      if (!hit) {
        nextTurn("miss");
      } else {
        startTurnTimer();
      }
    });
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
        nextTurn("times up");
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
