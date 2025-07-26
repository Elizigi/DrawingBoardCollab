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

io.on("connection", (socket) => {
  console.log("User connected to server:", socket.id);

  socket.on("create-room", ({name}) => {
    const roomId = `room_${socket.id}`;
    socket.join(roomId);
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
    const name = socket.data.name;
   
    if (!roomId || !name) return;

    socket.broadcast.to(roomId).emit("user-moved", { name, position });
  });

  socket.on("join-room", ({ roomId, name }) => {
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.name = name;
    socket.emit("joined-room", { roomId });
    socket.to(roomId).emit("user-joined", { name, guestId: socket.id });
  });

  socket.on("send-name", ({ name, guestId }) => {
    socket.to(guestId).emit("add-name", { name });
  });

  socket.on("request-state", ({ to }) => {
    io.to(to).emit("request-state", { from: socket.id });
  });

  socket.on("send-state", ({ to, state }) => {
    io.to(to).emit("init", state);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
