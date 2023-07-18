const express = require("express");
const http = require("http");
const app = express();
const path = require("path");
const server = http.createServer(app);
const WebServer = require("socket.io").Server;

const io = new WebServer(server);
let clients = {};
let clientsConnection = {};

app.use(express.static(path.join(__dirname, "../client")));

app.use((req, res, next) => {
  if (req.url === "/dist/bundle.js") {
    res.type("text/javascript");
  }
  next();
});

app.get("/", (req, res) => {
  const FilePath = path.join(__dirname, "../client/client.html");
  return res.sendFile(FilePath);
});

io.on("connection", function (socket) {
  console.log("Client Connection Established Succes fULLY");
  socket.on("ready-connect", (clientId) => {
    console.log("came Here", clientId);
    if (!clients[clientId] && !clientsConnection[clientId]) {
      clients[clientId] = clientId;
      clientsConnection[clientId] = socket;
    }
    if (clients[clientId]) {
      clientsConnection[clientId].emit(
        "ready-connect-success",
        "Successfully connected"
      );
    }
  });

  socket.on("get-all-clients", (clientId) => {
    if (clientId && clients[clientId]) {
      clientsConnection[clientId].emit("get-all-clients-success", clients);
    }
  });

  socket.on("offer", (data) => {
    let offer = data?.offer;
    let clientId = data?.clientId;
    let peerEnd = data?.peerEnd;
    clientsConnection[peerEnd].emit("emit-offer", {
      offer: offer,
      clientId: peerEnd,
      peerEnd: clientId,
    });
  });

  socket.on("answer", (data) => {
    let offer = data?.answer;
    let clientId = data?.clientId;
    console.log(clientId);
    clientsConnection[clientId].emit("emit-answer", {
      answer: offer,
      clientId: clientId,
      id: data?.id,
    });
  });
});

server.listen(5000, () => console.log("Connected To Port 5000"));



