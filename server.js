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

    socket.on("message", (msg) => {

      if (socket.rooms.has('ROOM1')) {
        socket.to("ROOM1").emit("message", msg);
      } else {
        socket.to("ROOM2").emit("message", msg);
      }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);
    });

    if (state.started) {
      const hits = [...state.found].filter(i => state.bombs.has(i)).length;
      socket.emit("map:ready", {
        size: state.size, bombsTotal: state.bombCount, bombsFound: hits
      });
    }

    socket.on("startGame", ({ size, bombCount }) => {
      if (state.started) return;
      state.size = size;
      state.bombCount = bombCount ?? (size === 6 ? 11 : Math.floor(size * size * 0.3));
      state.bombs = randomize(size, state.bombCount);
      state.found = new Set();
      state.scores = {};
      state.started = true;
    
      io.emit("map:ready", { size: state.size, bombsTotal: state.bombCount, bombsFound: 0 });
    });

    socket.on("joinRoom1", () => {
        socket.join("ROOM1");
    });

    socket.on("leaveRoom1", () => {
        socket.leave("ROOM1");
    });

    socket.on("joinRoom2", () => {
        socket.join("ROOM2");
    });

    socket.on("leaveRoom2", () => {
        socket.leave("ROOM2");
    });

    socket.on("pickCell", (index) => {
      if (!state.started) return;
    
      const hit = state.bombs.has(index);
      const already = state.found.has(index);
      if (!already) {
        state.found.add(index);
        if (hit) state.scores[socket.id] = (state.scores[socket.id] || 0) + 1;
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
        state.started = false;
        const winners = computeWinners(state.scores);
        console.log("emitting gameOver →", { winners, scores: state.scores }); // DEBUG
        io.emit("gameOver", {
          winners,                 
          scores: state.scores,
          size: state.size,
          bombCount: state.bombCount,
        });
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
    bombs: new Set(),
    found: new Set(),
    scores: {},
    started: false,
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