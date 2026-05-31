import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";

// Browser types not available in Node — define minimal shapes inline
type SdpInit = { type: string; sdp?: string };
type IceCandidateInit = { candidate?: string; sdpMid?: string | null; sdpMLineIndex?: number | null };

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
  },
});

// In-memory room and queue state
const rooms = new Map<string, Set<string>>();
const socketToRoom = new Map<string, string>();
const matchQueue: string[] = [];

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getOtherPeer(roomCode: string, mySocketId: string): string | undefined {
  const room = rooms.get(roomCode);
  if (!room) return undefined;
  for (const id of room) {
    if (id !== mySocketId) return id;
  }
  return undefined;
}

function joinRoom(socketId: string, roomCode: string): void {
  // Leave any existing room first
  const prevRoom = socketToRoom.get(socketId);
  if (prevRoom) leaveRoom(socketId, prevRoom);

  if (!rooms.has(roomCode)) rooms.set(roomCode, new Set());
  rooms.get(roomCode)!.add(socketId);
  socketToRoom.set(socketId, roomCode);
}

function leaveRoom(socketId: string, roomCode: string): void {
  const room = rooms.get(roomCode);
  if (room) {
    room.delete(socketId);
    if (room.size === 0) rooms.delete(roomCode);
  }
  socketToRoom.delete(socketId);
}

io.on("connection", (socket) => {
  console.log(`[+] ${socket.id} connected`);

  // Join a specific room by code
  socket.on("join-room", (roomCode: string) => {
    const code = String(roomCode).toUpperCase().trim();
    joinRoom(socket.id, code);
    socket.join(code);

    const peer = getOtherPeer(code, socket.id);
    if (peer) {
      // Notify the new joiner that a peer exists
      socket.emit("peer-joined", { peerId: peer, initiator: false });
      // Notify the existing peer that someone joined
      io.to(peer).emit("peer-joined", { peerId: socket.id, initiator: true });
    }

    console.log(`[room:${code}] ${socket.id} joined (${rooms.get(code)?.size ?? 0} users)`);
  });

  // Random match queue
  socket.on("random-match", () => {
    const idx = matchQueue.indexOf(socket.id);
    if (idx !== -1) return; // already in queue

    if (matchQueue.length > 0) {
      const peerId = matchQueue.shift()!;
      const code = generateRoomCode();
      // Pair them
      joinRoom(socket.id, code);
      joinRoom(peerId, code);
      socket.join(code);
      io.sockets.sockets.get(peerId)?.join(code);

      socket.emit("matched", { roomCode: code, peerId, initiator: false });
      io.to(peerId).emit("matched", { roomCode: code, peerId: socket.id, initiator: true });
    } else {
      matchQueue.push(socket.id);
      socket.emit("waiting-for-match", {});
    }
  });

  socket.on("cancel-match", () => {
    const idx = matchQueue.indexOf(socket.id);
    if (idx !== -1) matchQueue.splice(idx, 1);
  });

  // WebRTC signaling relay
  socket.on("offer", ({ roomCode, sdp }: { roomCode: string; sdp: SdpInit }) => {
    const peer = getOtherPeer(roomCode, socket.id);
    if (peer) io.to(peer).emit("offer", { sdp, from: socket.id });
  });

  socket.on("answer", ({ roomCode, sdp }: { roomCode: string; sdp: SdpInit }) => {
    const peer = getOtherPeer(roomCode, socket.id);
    if (peer) io.to(peer).emit("answer", { sdp, from: socket.id });
  });

  socket.on("ice-candidate", ({ roomCode, candidate }: { roomCode: string; candidate: IceCandidateInit }) => {
    const peer = getOtherPeer(roomCode, socket.id);
    if (peer) io.to(peer).emit("ice-candidate", { candidate, from: socket.id });
  });

  // Timer sync fallback relay
  socket.on("timer-sync", ({ roomCode, message }: { roomCode: string; message: unknown }) => {
    const peer = getOtherPeer(roomCode, socket.id);
    if (peer) io.to(peer).emit("timer-sync", { message, from: socket.id });
  });

  // Disconnect / leave
  socket.on("leave-room", (roomCode: string) => {
    const code = String(roomCode).toUpperCase().trim();
    leaveRoom(socket.id, code);
    socket.leave(code);
    const peer = getOtherPeer(code, socket.id);
    if (peer) io.to(peer).emit("peer-left", {});
  });

  socket.on("disconnect", () => {
    // Remove from match queue
    const idx = matchQueue.indexOf(socket.id);
    if (idx !== -1) matchQueue.splice(idx, 1);

    // Notify room peer
    const roomCode = socketToRoom.get(socket.id);
    if (roomCode) {
      const peer = getOtherPeer(roomCode, socket.id);
      if (peer) io.to(peer).emit("peer-left", {});
      leaveRoom(socket.id, roomCode);
    }

    console.log(`[-] ${socket.id} disconnected`);
  });
});

// Serve static files in production
// __dirname is available natively in CommonJS (tsconfig.server.json uses module: "CommonJS")
app.use(express.static(path.join(__dirname, "../dist")));
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`CubeRoom signaling server running on :${PORT}`);
});
