//server.js
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    // ...
     console.log("User connected", socket.id);

     if (!state.players.includes(socket.id)) {
      state.players.push(socket.id);
      console.log(`Player ${socket.id} joined. Total players: ${state.players.length}`);
     }

     socket.emit("playersUpdated", {
      players: state.players,
      currentPlayer: state.started ? state.players[state.currentTurnIndex] : null,
    });

      io.emit("playersUpdated", {
        players: state.players,
        currentPlayer: state.started ? state.players[state.currentTurnIndex] : null,
      });
    

    socket.on("message", (msg) => {
        socket.broadcast.emit("message", msg); // Send message to all except sender
    });

    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);
        // remove player
        const playerIndex = state.players.indexOf(socket.id);
        if (playerIndex !== -1) {
          state.players.splice(playerIndex, 1);
          if (state.currentTurnIndex >= state.players.length && state.players.length > 0) {
            state.currentTurnIndex = 0;
          }
          io.emit("playersUpdated", {
            players: state.players,
            currentPlayer: state.started && state.players.length > 0 
              ? state.players[state.currentTurnIndex] 
              : null,
          });
          if (playerIndex === state.currentTurnIndex && state.started && state.players.length > 0) {
            nextTurn("playerLeft");
          }
        }
    });

    if (state.started) {
      const hits = [...state.found].filter(i => state.bombs.has(i)).length;
      socket.emit("map:ready", {
        size: state.size, bombsTotal: state.bombCount, bombsFound: hits, turnLimit: state.turnLimit ?? 10,
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
        const { size, bombCount, turnLimit} = payload || {};
    
        if (state.started) {
          throw new Error("Game already started; cannot change settings");
        }
    
        if (size) state.size = Number(size);
        if (typeof bombCount === "number") state.bombCount = bombCount;
        if (typeof turnLimit === "number") state.turnLimit = turnLimit;
        //if (typeof playerLimit === "number") state.playerLimit = playerLimit;
    
        // broadcast latest settings so all clients/lobby UIs sync
        io.emit("settings:updated", {
          size: state.size,
          bombCount: state.bombCount,
          turnLimit: state.turnLimit ?? 10,
          //playerLimit: state.playerLimit ?? 2,
        });
    
        cb?.({ ok: true });
      } catch (err) {
        cb?.({ ok: false, error: String(err?.message || err) });
      }
    });

    socket.on("startGame", (payload = {}) => {
      const { size, bombCount } = payload;  
    
      if (state.started) return;
    
      if (typeof size === "number") state.size = size;
      if (typeof bombCount === "number") state.bombCount = bombCount;
      if (typeof tl === "number") state.turnLimit = tl;
    
      // ensure defaults
      if (typeof state.size !== "number") state.size = 6;
      if (!Number.isFinite(state.bombCount)) {
        state.bombCount =
          state.size === 6 ? 11 : Math.floor(state.size * state.size * 0.3);
      }
    
      state.bombs = randomize(state.size, state.bombCount);
      state.found = new Set();
      state.scores = {};
      state.started = true;
      state.currentTurnIndex = 0; // Start with first player
    
      io.emit("map:ready", {
        size: state.size,
        bombsTotal: state.bombCount,
        bombsFound: 0,
        turnLimit: state.turnLimit ?? 10,
      });
      nextTurn("start");
    });

    socket.on("pickCell", (index) => {
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
  
  function randomize(size=6, bombCount=11) {
    const bombs = new Set();
    while (bombs.size < bombCount) {
      bombs.add(Math.floor(Math.random() * (size * size)));
    }
    return bombs;
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
  }

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

    state.currentTurnIndex = (state.currentTurnIndex + 1) % state.players.length;

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