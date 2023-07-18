// we need to install socket io client
const { io } = require("socket.io-client");
const { v4 } = require("uuid");

let clientId = null;
let selected_id = null;
const connectBtn = document.getElementById("connect");
const allClientBtn = document.getElementById("all-clients");
const allClientDiv = document.getElementById("connected-clients");
const sendBtn = document.getElementById("send");

const configuration = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

let dataChannelPeer = null;

let connected = false;
const clientSocket = io("ws://localhost:5000");
let peerEnd = null;
let peerConnection = null;
let remoteConnection = null;

peerConnection = new RTCPeerConnection(configuration);
remoteConnection = new RTCPeerConnection(configuration);
dataChannelPeer = peerConnection.createDataChannel("Message");

clientSocket.on("connect", () => {
  if (clientSocket.id) {
    clientId = v4();
    localStorage.setItem("id", clientId);
  }
});

clientSocket.on("ready-connect-success", (success) => {
  let divEl = document.createElement("div");
  divEl.innerText = success;
  document.body.appendChild(divEl);
  connected = true;
});

clientSocket.on("emit-offer", (data) => {
  const offer = data.offer;
  const id = data.clientId;
  if (id && offer) {
    remoteConnection.setRemoteDescription(JSON.parse(offer));
    peerEnd = data.peerEnd;
    remoteConnection.createAnswer().then((answer) => {
      remoteConnection.setLocalDescription(answer);
    });
  }
});

clientSocket.on("emit-answer", (data) => {
  const answer = data.answer;
  const id = data.clientId;
  if (id && answer) {
    if (peerConnection.signalingState === "stable") {
      return;
    }
    peerConnection.setRemoteDescription(JSON.parse(answer));
    peerEnd = data.id;
  }
  debugger;
});

clientSocket.on("get-all-clients-success", (clients) => {
  //here we are showing all the clients
  Object.keys(clients).forEach((key) => {
    if (clients[clientId] !== key) {
      const clientDivEl = document.createElement("h2");
      clientDivEl.innerText = key;
      clientDivEl.id = key;
      clientDivEl.addEventListener("click", (e) => {
        selected_id = e.target.id;
        if (selected_id) {
          //createDataChannel(peerConnection);
          CreateOffer(peerConnection);
        }
      });
      allClientDiv.appendChild(clientDivEl);
    }
  });
});

//here iam writing Logic For WebRtc Peer Connection
// we need to pass a config with some stun  and Turn Server Details

peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    clientSocket.emit("offer", {
      offer: JSON.stringify(peerConnection.localDescription),
      clientId: clientId,
      peerEnd: selected_id,
    });
  }
};

remoteConnection.onicecandidate = (event) => {
  clientSocket.emit("answer", {
    answer: JSON.stringify(remoteConnection.localDescription),
    clientId: peerEnd,
    id: clientId,
  });
};

remoteConnection.ondatachannel = (event) => {
  dataChannelPeer = event.channel;

  // Set up event handlers for the data channel
  dataChannelPeer.onopen = function () {
    console.log("Data channel is open");
  };

  dataChannelPeer.onmessage = function (event) {
    const message = event.data;
    console.log("Remote Received message:", message);
  };

  dataChannelPeer.onclose = function () {
    console.log("Data channel is closed");
  };
};

dataChannelPeer.onmessage = function (event) {
  const message = event.data;
  console.log("Peer Received message:", message);
};

connectBtn.addEventListener("click", () => {
  if (clientId) {
    clientSocket.emit("ready-connect", clientId);
  } else window.alert("You are not connected Yet!");
});

sendBtn.addEventListener("click", () => {
  const message = `Message Iam Write ${v4()}`;
  if (peerConnection.iceConnectionState == "new") {
    return dataChannelPeer.send(message);
  }
  return dataChannelPeer.send(message);
});
allClientBtn.addEventListener("click", () => {
  if (clientId && connected) {
    // we need to emit a request for get all clients
    clientSocket.emit("get-all-clients", clientId);
  } else {
    window.alert("You are not connected Yet! Please connect First!");
  }
});

//functions For

//create a DataChannel

function createDataChannel(peerConnection) {
  dataChannelPeer = peerConnection.createDataChannel("Message");
}

//create An Offer

function CreateOffer(peerConnection) {
  peerConnection.createOffer().then((offer) => {
    // it will create a first iceCandidate if we add iceCandidate Function It will Trigger
    peerConnection.setLocalDescription(offer);
    // we need to send this Offer To Client With Specific ClientId
  });
}
