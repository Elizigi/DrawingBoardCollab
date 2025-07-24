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

  socket.on("create-room", () => {
    const address  = socket.id;
    socket.join(address );
    socket.emit("room-created", address );
  });

  socket.on("join-room", ({address   }) => {
    socket.join(address);
     socket.emit("joined-room", { roomAddress: address });
    io.to(address).emit("user-joined", { guestId: socket.id });
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
