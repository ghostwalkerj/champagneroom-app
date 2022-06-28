import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const directory = {};


io.on('connection', socket => {
  const userId = socket.handshake.query.userId;
  const userName = socket.handshake.query.userName;

  directory[userId] = { userName: userName, socketId: socket.id };

  socket.emit("socketId", socket.id);
  console.log("User connected: ", userName);

  socket.on('disconnect', () => {
    try {
      delete directory[userId];
      socket.broadcast.emit("user disconnected");
      console.log("User disconnected: ", userName);
    }
    catch (e) {
      console.log(e);
    }
  });

  socket.on("makeCall", (data) => {
    try {
      const { userName, socketId } = directory[data.receiverId];

      io.to(socketId).emit('incomingCall', { signal: data.signalData, callerId: data.callerId, callerName: data.callerName });
      console.log("\nCall made from: ", data.callerName);
      console.log("to: ", userName);
    }
    catch (e) {
      console.log(e);
    }

  });

  socket.on("acceptCall", (data) => {
    try {
      const { userName, socketId } = directory[data.callerId];
      io.to(socketId).emit('callAccepted', data.signal);
      console.log("Call accepted to: ", userName);
    }
    catch (e) {
      console.log(e);
    }
  });

  socket.on("cancelCall", (data) => {
    try {
      const { userName, socketId } = directory[data.receiverId];
      io.to(socketId).emit('callCanceled');
      console.log("Call canceled to: ", userName);
    }
    catch (e) {
      console.log(e);
    }
  });

  socket.on("disconnectCall", (data) => {
    console.log("disconnetCall", data);
    try {

      const { userName, socketId } = directory[data.userId];
      io.to(socketId).emit('callDisconnected');
      console.log("Call disconnected to: ", userName);
    }
    catch (e) {
      console.log(e);
    }
  });


  socket.on("rejectCall", (data) => {
    try {
      const { userName, socketId } = directory[data.callerId];
      io.to(socketId).emit('callRejected', data.signal);
      console.log("Call rejected from: ", userName);
    }
    catch (e) {
      console.log(e);
    }
  });
});

server.listen(8000, () => console.log('server is running on port 8000'));


