import express from "express";
import http from "node:http";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import path from "node:path";
delete process.env.DEBUG_URL;
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.use(cors());

const maxUserLimit = 20;
const roomLimitsMap = new Map<string, number>();
const roomsMap = new Map<string, string>();
const rateLimitMap = new Map();
io.on("connection", (socket) => {
  console.log("User connected to server:", socket.id);
  socket.emit("user-id", socket.id);

  socket.on("create-room", ({ name, userLimit }) => {
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return socket.emit("error", "Invalid name");
    }
    if (name.length > 30) {
      return socket.emit("error", "Name too long");
    }
    const sanitizedName = name.trim().replaceAll("<", "").replaceAll(">", "");
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    socket.join(roomId);

    if (userLimit !== undefined) {
      roomLimitsMap.set(roomId, userLimit);
    }

    roomsMap.set(roomId, socket.id);
    if (userLimit !== undefined) {
      if (
        typeof userLimit !== "number" ||
        userLimit < 2 ||
        userLimit > maxUserLimit
      ) {
        return socket.emit("error", "User limit must be between 2 and 20");
      }
    }
    socket.data.isHost = true;
    socket.data.name = sanitizedName;
    socket.data.roomId = roomId;
    socket.emit("room-created", roomId);
  });

  socket.on("draw-progress", (stroke) => {
    const now = Date.now();
    const limit = rateLimitMap.get(socket.id) || {
      count: 0,
      resetTime: now + 1000,
    };

    if (now > limit.resetTime) {
      limit.count = 0;
      limit.resetTime = now + 1000;
    }

    limit.count++;
    if (limit.count > 100) {
      return;
    }
    rateLimitMap.set(socket.id, limit);

    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room?.has(socket.id)) {
      return socket.emit("error", "Not in room");
    }
    socket.broadcast
      .to(roomId)
      .emit("draw-progress", { ...stroke, senderId: socket.id });
  });

  socket.on("delete-stroke", ({ deleteStroke }) => {
    const roomId = socket.data.roomId;
    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room?.has(socket.id)) {
      return socket.emit("error", "Not in room");
    }
    if (!roomId) return;
    socket.broadcast.to(roomId).emit("remove-stroke", { deleteStroke });
  });
  socket.on("locked-layer", ({ layerId }) => {
    const roomId = socket.data.roomId;
    const hostId = roomsMap.get(roomId);

    if (socket.id !== hostId) return io.to(socket.id).emit("no-permission");
    io.to(roomId).emit("lock-layer", { layerId });
  });
  socket.on("layer-reordered", (draggedLayer, insertAt) => {
    const roomId = socket.data.roomId;
    const hostId = roomsMap.get(roomId);
    if (socket.id !== hostId) return io.to(socket.id).emit("no-permission");
    socket.to(roomId).emit("reorder-layer", draggedLayer, insertAt);
  });
  socket.on("renamed-layer", (layerId, newName) => {
    const roomId = socket.data.roomId;
    const hostId = roomsMap.get(roomId);
    if (socket.id !== hostId) return io.to(socket.id).emit("no-permission");
    socket.to(roomId).emit("rename-layer", layerId, newName);
  });

  socket.on("delete-layer", ({ layerId }) => {
    const roomId = socket.data.roomId;
    const hostId = roomsMap.get(roomId);
    if (socket.id !== hostId) return io.to(socket.id).emit("no-permission");
    io.to(roomId).emit("remove-layer", { layerId });
  });
  socket.on("user-move", ({ position }) => {
    const roomId = socket.data.roomId;
    const guestId = socket.id;

    if (!roomId || !guestId) return;
    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room?.has(socket.id)) {
      return socket.emit("error", "Not in room");
    }
    socket.broadcast.to(roomId).emit("user-moved", { guestId, position });
  });

  socket.on("join-room", ({ roomId, name }) => {
    if (
      !roomId ||
      typeof roomId !== "string" ||
      !/^[A-Z0-9]{6}$/.test(roomId)
    ) {
      return socket.emit("error", "Invalid room ID");
    }
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return socket.emit("error", "Invalid name");
    }
    if (!roomsMap.has(roomId)) {
      socket.emit("room-not-found");
      return;
    }
    const room = io.sockets.adapter.rooms.get(roomId);
    const userLimit = roomLimitsMap.get(roomId) || maxUserLimit;
    if (room && room.size >= userLimit) {
      return socket.emit("error", { reason: "Room is full" });
    }

    socket.join(roomId);
    socket.data.roomId = roomId;
    const sanitizedName = name.trim().replaceAll("<", "").replaceAll(">", "");
    socket.data.name = sanitizedName;

    console.log(roomId, "users now:", [
      ...(io.sockets.adapter.rooms.get(roomId) || []),
    ]);

    socket.emit("joined-room", { roomId });
    socket.broadcast
      .to(roomId)
      .emit("user-joined", { name, guestId: socket.id });
  });
  socket.on("update-limit", (newLimit) => {
    const roomId = socket.data.roomId;
    const hostId = roomsMap.get(roomId);
    console.log("updating limit", newLimit);
    if (socket.id !== hostId) {
      return io
        .to(socket.id)
        .emit("no-permission", "Only the host can change user limit.");
    }

    if (
      typeof newLimit !== "number" ||
      newLimit < 2 ||
      newLimit > maxUserLimit
    ) {
      return socket.emit("error", "User limit must be between 2 and 20");
    }

    const room = io.sockets.adapter.rooms.get(roomId);
    const currentUsers = room ? room.size : 0;

    if (newLimit < currentUsers) {
      return socket.emit("error", "Cannot set limit below current user count");
    }

    roomLimitsMap.set(roomId, newLimit);
    io.to(roomId).emit("user-updated", { userLimit: newLimit });
  });

  socket.on("new-layer", ({ layerId, layerName, imageDataUrl }) => {
    if (!layerId || typeof layerId !== "string") return;
    if (!layerName || typeof layerName !== "string") return;
    if (layerName.length > 50) return;
    const roomId = socket.data.roomId;
    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room?.has(socket.id)) {
      return socket.emit("error", "Not in room");
    }
    socket.broadcast
      .to(roomId)
      .emit("add-layer", { layerId, layerName, imageDataUrl });
  });
  socket.on("send-name", ({ name, userId, guestId }) => {
    console.log("name Sent:", name, userId);
    const username = name;

    socket.to(guestId).emit("add-name", { username, userId });
  });

  socket.on("request-state", ({ to }) => {
    const roomId = socket.data.roomId;
    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room?.has(socket.id)) {
      return socket.emit("error", "Not in room");
    }
    io.to(to).emit("request-state", { from: socket.id });
  });

  socket.on("send-state", ({ to, strokes, layers, canvasSize }) => {
    if (socket.id === to) return;
    const roomId = socket.data.roomId;
    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room?.has(socket.id)) {
      return socket.emit("error", "Not in room");
    }
    if (to === "all") {
      socket.broadcast.to(roomId).emit("init", { strokes, layers, canvasSize });
    } else {
      io.to(to).emit("init", { strokes, layers, canvasSize });
    }
  });
  socket.on("new-size", (canvasSize) => {
    const roomId = socket.data.roomId;
    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room?.has(socket.id)) {
      return socket.emit("error", "Not in room");
    }
    const hostId = roomsMap.get(roomId);

    if (socket.id !== hostId) {
      return io
        .to(socket.id)
        .emit("no-permission", "Only the host can change canvas size.");
    }
    socket.broadcast.to(roomId).emit("canvas-size", canvasSize);
  });

  socket.on("remove-user", ({ guestId }) => {
    const roomId = socket.data.roomId;

    if (!roomId) return;
    const hostId = roomsMap.get(roomId);
    if (socket.id !== hostId) {
      return io
        .to(socket.id)
        .emit("no-permission", "Only the host can remove users.");
    }

    const guestSocket = io.sockets.sockets.get(guestId);
    if (!guestSocket) return;
    guestSocket.leave(roomId);
    console.log(
      `User ${guestId} removed from room ${roomId} by host ${socket.id}`
    );
    const name = guestSocket.data.name;

    delete guestSocket.data.roomId;
    guestSocket.emit("user-removed", { reason: "removed by host" });
    io.to(roomId).emit("user-kicked", { guestId, name });
  });

  socket.on("leave-room", () => {
    const roomId = socket.data.roomId;
    const name = socket.data.name;

    if (!roomId) return;

    const hostId = roomsMap.get(roomId);
    const isHost = socket.id === hostId;

    socket.leave(roomId);
    delete socket.data.roomId;

    console.log(`User ${socket.id} left room ${roomId}`);

    if (isHost) {
      roomsMap.delete(roomId);
      io.to(roomId).emit("user-removed", { reason: "room closed" });
      io.to(socket.id).emit("user-removed", {
        reason: "left by choice and room closed",
      });
    } else {
      io.to(roomId).emit("user-left", { guestId: socket.id, name });
      io.to(socket.id).emit("user-removed", { reason: "left by choice" });
    }
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    const name = socket.data.name;
    rateLimitMap.delete(socket.id);
    if (!roomId) return;

    const hostId = roomsMap.get(roomId);
    if (socket.id === hostId) {
      roomsMap.delete(roomId);
      io.to(roomId).emit("user-removed", { reason: "room closed" });
    } else {
      const guestId = socket.id;
      io.to(roomId).emit("user-left", { guestId, name });
    }
  });
});

app.use(express.static(path.join(__dirname, "../client/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
