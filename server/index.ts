import "./loadEnv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { createMatchmaking } from "./matchmaking";
import type { QueueEntry } from "./matchmaking";

const app = express();
const httpServer = createServer(app);

const corsOrigins = process.env.SIGNALING_CORS_ORIGINS?.split(",").map((s) => s.trim()) ?? [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const io = new Server(httpServer, {
  cors: { origin: corsOrigins, methods: ["GET", "POST"] },
});

const matchmaking = createMatchmaking();
const socketToRoom = new Map<string, string>();
const socketEvent = new Map<string, string>();

const SKIP_LIMIT = 8;
const skipCounts = new Map<string, { count: number; resetAt: number }>();

function getOtherPeer(roomCode: string, mySocketId: string): string | undefined {
  const room = io.sockets.adapter.rooms.get(roomCode);
  if (!room) return undefined;
  for (const id of room) {
    if (id !== mySocketId) return id;
  }
  return undefined;
}

function joinSocketRoom(socketId: string, roomCode: string, socket: import("socket.io").Socket): void {
  const prev = socketToRoom.get(socketId);
  if (prev) {
    socket.leave(prev);
    socketToRoom.delete(socketId);
  }
  socket.join(roomCode);
  socketToRoom.set(socketId, roomCode);
}

function leaveSocketRoom(socketId: string, roomCode: string, socket: import("socket.io").Socket): void {
  socket.leave(roomCode);
  if (socketToRoom.get(socketId) === roomCode) {
    socketToRoom.delete(socketId);
  }
}

function checkSkipRate(socketId: string): boolean {
  const now = Date.now();
  const entry = skipCounts.get(socketId);
  if (!entry || now > entry.resetAt) {
    skipCounts.set(socketId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= SKIP_LIMIT) return false;
  entry.count += 1;
  return true;
}

async function pairSocket(
  socket: import("socket.io").Socket,
  event: string
): Promise<void> {
  const entry: QueueEntry = {
    socketId: socket.id,
    event,
    enqueuedAt: Date.now(),
  };

  const result = await matchmaking.enqueue(entry);

  if (result.status === "waiting") {
    socket.emit("waiting-for-match", { event });
    return;
  }

  const { roomCode, peerSocketId } = result;
  const peerSocket = io.sockets.sockets.get(peerSocketId);
  if (!peerSocket) {
    await matchmaking.enqueue(entry);
    socket.emit("waiting-for-match", { event });
    return;
  }

  joinSocketRoom(socket.id, roomCode, socket);
  joinSocketRoom(peerSocketId, roomCode, peerSocket);

  socket.emit("matched", { roomCode, peerId: peerSocketId, initiator: false });
  peerSocket.emit("matched", {
    roomCode,
    peerId: socket.id,
    initiator: true,
  });

  console.log(`[match] ${socket.id} + ${peerSocketId} → ${roomCode}`);
}

io.on("connection", (socket) => {
  console.log(`[+] ${socket.id} connected`);

  socket.on("join-room", (roomCode: string) => {
    const code = String(roomCode).toUpperCase().trim();
    joinSocketRoom(socket.id, code, socket);

    const peer = getOtherPeer(code, socket.id);
    if (peer) {
      socket.emit("peer-joined", { peerId: peer, initiator: false });
      io.to(peer).emit("peer-joined", { peerId: socket.id, initiator: true });
    }
  });

  socket.on("random-match", (payload?: { event?: string }) => {
    const event = payload?.event ?? socketEvent.get(socket.id) ?? "333";
    socketEvent.set(socket.id, event);
    void pairSocket(socket, event);
  });

  socket.on("cancel-match", () => {
    void matchmaking.dequeue(socket.id);
    socket.emit("match-cancelled", {});
  });

  socket.on("skip-match", async (payload?: { event?: string }) => {
    if (!checkSkipRate(socket.id)) {
      socket.emit("skip-rate-limited", {});
      return;
    }

    const event = payload?.event ?? socketEvent.get(socket.id) ?? "333";
    socketEvent.set(socket.id, event);

    const roomCode = socketToRoom.get(socket.id);
    if (roomCode) {
      const peer = getOtherPeer(roomCode, socket.id);
      if (peer) io.to(peer).emit("peer-left", { reason: "skip" });
      leaveSocketRoom(socket.id, roomCode, socket);
    }

    await matchmaking.removeFromQueue(socket.id);

    const entry: QueueEntry = {
      socketId: socket.id,
      event,
      enqueuedAt: Date.now(),
    };

    const requeue =
      "requeueAfterSkip" in matchmaking && typeof matchmaking.requeueAfterSkip === "function"
        ? matchmaking.requeueAfterSkip(entry)
        : matchmaking.enqueue(entry);

    const result = await requeue;
    if (result.status === "waiting") {
      socket.emit("waiting-for-match", { event });
      return;
    }

    const peerSocket = io.sockets.sockets.get(result.peerSocketId);
    if (!peerSocket) {
      socket.emit("waiting-for-match", { event });
      return;
    }

    joinSocketRoom(socket.id, result.roomCode, socket);
    joinSocketRoom(result.peerSocketId, result.roomCode, peerSocket);

    socket.emit("matched", {
      roomCode: result.roomCode,
      peerId: result.peerSocketId,
      initiator: false,
    });
    peerSocket.emit("matched", {
      roomCode: result.roomCode,
      peerId: socket.id,
      initiator: true,
    });
  });

  socket.on("leave-room", (roomCode: string) => {
    const code = String(roomCode).toUpperCase().trim();
    const peer = getOtherPeer(code, socket.id);
    if (peer) io.to(peer).emit("peer-left", { reason: "leave" });
    leaveSocketRoom(socket.id, code, socket);
  });

  socket.on("disconnect", () => {
    void matchmaking.dequeue(socket.id);
    skipCounts.delete(socket.id);

    const roomCode = socketToRoom.get(socket.id);
    if (roomCode) {
      const peer = getOtherPeer(roomCode, socket.id);
      if (peer) io.to(peer).emit("peer-left", { reason: "disconnect" });
      socket.leave(roomCode);
      socketToRoom.delete(socket.id);
    }

    console.log(`[-] ${socket.id} disconnected`);
  });

  // Optional queue depth (server-side only, no Redis read from clients)
  socket.on("get-queue-depth", async () => {
    socket.emit("queue-depth", { depth: 0 });
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

const distPath = path.join(__dirname, "../dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`CubeMate signaling server on :${PORT}`);
});