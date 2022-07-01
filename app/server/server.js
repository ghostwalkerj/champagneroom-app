import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { z } from 'zod';

const app = express();

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const directory = {}; // user and sockets
const User = z.object({
  userId: z.string().min(10),
  userName: z.string().min(1).max(30),
});

const Caller = z.object({
  callerId: z.string().min(10),
  callerName: z.string().min(1).max(30),
});


io.on('connection', socket => {
  const userId = socket.handshake.query.userId;
  const userName = socket.handshake.query.userName;

  if (!User.safeParse({ userId, userName })) {
    socket.disconnect(true);
    console.log("connection: Invalid user: ", userId, userName);
  }

  if (directory[userId]) {
    console.log("connection: User already connected: ", userId, directory[userId]);
  }

  directory[userId] = { userName: userName, socketId: socket.id };


  socket.emit("socketId", socket.id);
  console.log("User connected: ", userName);

  socket.on('disconnect', () => {
    try {
      delete directory[userId];
      //socket.broadcast.emit("user disconnected"); // need to send to other user
      console.log("User disconnected: ", userName);
    }
    catch (e) {
      console.log(e);
    }
  });

  socket.on("makeCall", (data) => {
    if (!directory[data.receiverId]) {
      console.log("makeCall: Receiver not in directory: ", data.receiverId);
    }
    else {
      const callerId = data.callerId;
      const callerName = data.callerName;

      if (!Caller.safeParse({ callerId, callerName })) {
        console.log("Invalid caller: ", callerId, callerName);
      }

      else {
        try {
          const { userName, socketId } = directory[data.receiverId];
          io.to(socketId).emit('incomingCall', { signal: data.signalData, callerId, callerName });
          console.log("\nCall made from: ", data.callerName);
          console.log("to: ", userName);
        }
        catch (e) {
          console.log(e);
        }
      }
    }

  });

  socket.on("acceptCall", (data) => {

    if (!directory[data.callerId]) {
      console.log("acceptCall: Caller not in directory: ", data.callerId);
    }

    else {
      try {
        const { userName, socketId } = directory[data.callerId];
        io.to(socketId).emit('callAccepted', data.signal);
        console.log("Call accepted to: ", userName);
      }
      catch (e) {
        console.log(e);
      }
    }
  });

  socket.on("cancelCall", (data) => {

    if (!directory[data.callerId]) {
      console.log("cancelCall: Caller not in directory: ", data.callerId);
    }

    else {
      try {
        const { userName, socketId } = directory[data.receiverId];
        io.to(socketId).emit('callCanceled');
        console.log("Call canceled to: ", userName);
      }
      catch (e) {
        console.log(e);
      }
    }
  });

  socket.on("disconnectCall", (data) => {

    if (!directory[data.userId]) {
      console.log("disconnectCall: User not in directory: ", data.userId);
    }

    else {
      console.log("disconnectCall", data);
      try {

        const { userName, socketId } = directory[data.userId];
        io.to(socketId).emit('callDisconnected');
        console.log("Call disconnected to: ", userName);
      }
      catch (e) {
        console.log(e);
      }
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


