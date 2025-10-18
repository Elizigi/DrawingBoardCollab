import express from "express";
import http from "node:http";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());

const roomsMap = new Map<string, string>();

io.on("connection", (socket) => {
  console.log("User connected to server:", socket.id);
  socket.emit("user-id", socket.id);

  socket.on("create-room", ({ name }) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    socket.join(roomId);
    roomsMap.set(roomId, socket.id);
    socket.data.isHost = true;
    socket.data.name = name;
    socket.data.roomId = roomId;
    socket.emit("room-created", roomId);
  });

  socket.on("draw-progress", (stroke) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.broadcast
      .to(roomId)
      .emit("draw-progress", { ...stroke, senderId: socket.id });
  });

  socket.on("delete-stroke", ({ deleteStroke }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.broadcast.to(roomId).emit("remove-stroke", { deleteStroke });
  });
  socket.on("locked-layer", ({ layerId }) => {
    const roomId = socket.data.roomId;
    const hostId = roomsMap.get(roomId);
    if (socket.id !== hostId) return io.to(socket.id).emit("no-permission");
    io.to(roomId).emit("lock-layer", { layerId });
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

    socket.broadcast.to(roomId).emit("user-moved", { guestId, position });
  });

  socket.on("join-room", ({ roomId, name }) => {
    if (!roomsMap.has(roomId)) {
      socket.emit("room-not-found");
      return;
    }
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.name = name;

    console.log("aaaaaaa", roomId, "users now:", [
      ...(io.sockets.adapter.rooms.get(roomId) || []),
    ]);

    socket.emit("joined-room", { roomId });
    socket.broadcast
      .to(roomId)
      .emit("user-joined", { name, guestId: socket.id });
  });

  socket.on("new-layer", ({ layerId, layerName }) => {
    const roomId = socket.data.roomId;
    socket.broadcast.to(roomId).emit("add-layer", { layerId, layerName });
  });
  socket.on("send-name", ({ name, userId, guestId }) => {
    console.log("name Sent:", name, userId);
    const username = name;
    socket.to(guestId).emit("add-name", { username, userId });
  });

  socket.on("request-state", ({ to }) => {
    io.to(to).emit("request-state", { from: socket.id });
  });

  socket.on("send-state", ({ to, strokes, layers }) => {
    if (socket.id === to) return;

    io.to(to).emit("init", { strokes, layers });
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

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
