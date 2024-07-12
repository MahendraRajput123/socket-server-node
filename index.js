const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const cloudRoutes = require("./routes/cloudinary");
const socket = require("socket.io");
const https = require("https");
const fs = require("fs");
const app = express();

require("dotenv").config();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connetion Successfull");
  })
  .catch((err) => {
    console.log(err.message);
  });
  
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/cloud", cloudRoutes);

const PORT = process.env.PORT || 2525

const options = {
  key: fs.readFileSync("/etc/letsencrypt/live/ebitsvisionai.in/fullchain.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/ebitsvisionai.in/privkey.pem")
};

const server = https.createServer(options, app);

server.listen(PORT, () => {
  console.log(`Server running on Port ${PORT}`);
});

const io = socket(server,{
  cors :{
    origin : '*',
    credentials : true
  }
})

global.onlineUsers = new Map();

io.on("connection", (socket)=>{
  console.log('connect to socket', socket.id);
  global.chatSocket = socket;

  socket.on("add-user", (userId)=>{
    onlineUsers.set(userId, socket.id);
  })

  socket.on("send-msg", (data)=>{
    const sendUnderSocket = onlineUsers.get(data.to);
    if(sendUnderSocket){
      socket.to(sendUnderSocket).emit("msg-recieve", data.message)
    }
  })

  socket.on("send-notification", (data)=>{
    const sendUnderSocket = onlineUsers.get(data.to);
    if(sendUnderSocket){
      socket.to(sendUnderSocket).emit("notification-recieve",data.message)
    }
  })

  // Add this new event listener for disconnect
  socket.on("disconnect", () => {
    console.log('Disconnected user:', socket.id);
    // // Remove the disconnected user from the onlineUsers map
    // for (const [userId, socketId] of onlineUsers.entries()) {
    //   if (socketId === socket.id) {
    //     onlineUsers.delete(userId);
    //     console.log(`User ${userId} removed from online users`);
    //     break;
    //   }
    // }
  });
})