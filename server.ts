import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Player {
  id: string;
  name: string;
  role: string;
  basePrice: number;
  status: 'available' | 'bidding' | 'sold' | 'unsold';
  soldTo?: string;
  soldPrice?: number;
}

interface Participant {
  id: string;
  name: string;
  teamName: string;
  budget: number;
  playersBought: Player[];
}

interface Room {
  id: string;
  hostId: string;
  participants: Map<string, Participant>;
  players: Player[];
  currentPlayerIndex: number;
  status: 'waiting' | 'active' | 'finished';
  currentBid: number;
  currentBidderId: string | null;
  timer: number;
  timerInterval: NodeJS.Timeout | null;
}

const rooms = new Map<string, Room>();

const playersPath = path.join(__dirname, "src", "data", "players.json");
const INITIAL_PLAYERS: Omit<Player, 'id'>[] = JSON.parse(fs.readFileSync(playersPath, "utf-8")).map((p: any) => ({ ...p, status: 'available' }));

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("create-room", (name: string) => {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const shuffledPlayers = [...INITIAL_PLAYERS]
        .sort(() => Math.random() - 0.5)
        .map((p, i) => ({ ...p, id: `p-${i}` }));

      const room: Room = {
        id: roomId,
        hostId: socket.id,
        participants: new Map(),
        players: shuffledPlayers,
        currentPlayerIndex: -1,
        status: 'waiting',
        currentBid: 0,
        currentBidderId: null,
        timer: 30,
        timerInterval: null,
      };
      
      rooms.set(roomId, room);
      socket.join(roomId);
      
      const participant: Participant = {
        id: socket.id,
        name,
        teamName: '',
        budget: 100,
        playersBought: [],
      };
      room.participants.set(socket.id, participant);
      
      socket.emit("room-created", { roomId, participant });
      io.to(roomId).emit("room-update", getRoomData(room));
    });

    socket.on("join-room", ({ roomId, name }: { roomId: string, name: string }) => {
      const room = rooms.get(roomId);
      if (!room) {
        return socket.emit("error", "Room not found");
      }
      if (room.status !== 'waiting') {
        return socket.emit("error", "Auction already started");
      }

      const participant: Participant = {
        id: socket.id,
        name,
        teamName: '',
        budget: 100,
        playersBought: [],
      };
      room.participants.set(socket.id, participant);
      socket.join(roomId);
      
      socket.emit("room-joined", { roomId, participant });
      io.to(roomId).emit("room-update", getRoomData(room));
    });

    socket.on("select-team", ({ roomId, teamName }: { roomId: string, teamName: string }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const participant = room.participants.get(socket.id);
      if (!participant) return;

      // Check if team already taken
      const isTaken = Array.from(room.participants.values()).some(p => p.teamName === teamName);
      if (isTaken) return socket.emit("error", "Team already taken");

      participant.teamName = teamName;
      io.to(roomId).emit("room-update", getRoomData(room));
    });

    socket.on("start-auction", (roomId: string) => {
      const room = rooms.get(roomId);
      if (!room || room.hostId !== socket.id) return;

      room.status = 'active';
      nextPlayer(roomId);
    });

    socket.on("place-bid", (roomId: string) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'active') return;

      const participant = room.participants.get(socket.id);
      if (!participant) return;

      const bidAmount = room.currentBid + 0.5;
      if (participant.budget < bidAmount) {
        return socket.emit("error", "Insufficient budget");
      }

      if (room.currentBidderId === socket.id) {
        return socket.emit("error", "You are already the highest bidder");
      }

      room.currentBid = bidAmount;
      room.currentBidderId = socket.id;
      room.timer = 15; // Reset timer on bid

      io.to(roomId).emit("bid-placed", {
        currentBid: room.currentBid,
        currentBidderId: room.currentBidderId,
        timer: room.timer
      });
      io.to(roomId).emit("room-update", getRoomData(room));
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      // Handle cleanup if needed, but for a simple app we can keep the room state
    });
  });

  function nextPlayer(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    if (room.timerInterval) clearInterval(room.timerInterval);

    room.currentPlayerIndex++;
    if (room.currentPlayerIndex >= room.players.length) {
      room.status = 'finished';
      io.to(roomId).emit("room-update", getRoomData(room));
      return;
    }

    const player = room.players[room.currentPlayerIndex];
    player.status = 'bidding';
    room.currentBid = player.basePrice;
    room.currentBidderId = null;
    room.timer = 20;

    io.to(roomId).emit("room-update", getRoomData(room));

    room.timerInterval = setInterval(() => {
      room.timer--;
      if (room.timer <= 0) {
        clearInterval(room.timerInterval!);
        handleAuctionEnd(roomId);
      } else {
        io.to(roomId).emit("timer-update", room.timer);
      }
    }, 1000);
  }

  function handleAuctionEnd(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players[room.currentPlayerIndex];
    if (room.currentBidderId) {
      const winner = room.participants.get(room.currentBidderId);
      if (winner) {
        player.status = 'sold';
        player.soldTo = winner.teamName;
        player.soldPrice = room.currentBid;
        winner.budget -= room.currentBid;
        winner.playersBought.push({ ...player });
      }
    } else {
      player.status = 'unsold';
    }

    io.to(roomId).emit("player-auction-ended", {
      player,
      winnerId: room.currentBidderId
    });

    // Short delay before next player
    setTimeout(() => {
      nextPlayer(roomId);
    }, 3000);
  }

  function getRoomData(room: Room) {
    return {
      id: room.id,
      hostId: room.hostId,
      participants: Array.from(room.participants.values()),
      players: room.players,
      currentPlayerIndex: room.currentPlayerIndex,
      status: room.status,
      currentBid: room.currentBid,
      currentBidderId: room.currentBidderId,
      timer: room.timer
    };
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
