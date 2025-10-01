import express from "express";
import http from "http";
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
const roomsMap = new Map<string, any>();

// add a room
io.on("connection", (socket) => {
  console.log("User connected to server:", socket.id);
  socket.emit("user-id", socket.id);

  socket.on("create-room", ({ name }) => {
    const roomId = `room_${socket.id}`;
    socket.join(roomId);
    roomsMap.set(roomId, null);
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
    socket.on("new-layer", ({ layerId, layerName }) => {
      const roomId = socket.data.roomId;
      socket.broadcast.to(roomId).emit("add-layer", { layerId, layerName });
    });
    socket.emit("joined-room", { roomId });
    socket.broadcast
      .to(roomId)
      .emit("user-joined", { name, guestId: socket.id });
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

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
