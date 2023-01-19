var hostname = "localhost";
var channel = "";

// get channel list
const channelList = document.getElementById("channel-list");
const userList = document.getElementById("user-list");

function getChannelList() {
    // get channel list from server
    const channelListRequest = new XMLHttpRequest();
    channelListRequest.open(
        "POST",
        `http://${hostname}:8081/api/channels`,
        true
    );
    channelListRequest.onload = function () {
        const channelListData = JSON.parse(this.response);

        // console.log(channelListData);

        channelList.innerHTML = "";

        for (const channel in channelListData.channels) {
            if (Object.hasOwnProperty.call(channelListData.channels, channel)) {
                const element = channelListData.channels[channel];

                channelList.innerHTML += `<div>#${element}</div>`;
            }
        }
    };
    channelListRequest.send();
}

// get all users in a channel
function getUserList() {
    // get channel list from server
    const userListRequest = new XMLHttpRequest();
    userListRequest.open(
        "POST",
        `http://${hostname}:8081/api/channels/users?channel=${channel}`,
        true
    );
    userListRequest.onload = function () {
        const userListData = JSON.parse(this.response);

        // console.log(userListData);

        userList.innerHTML = "";

        for (const user in userListData.users) {
            if (Object.hasOwnProperty.call(userListData.users, user)) {
                const element = userListData.users[user];

                userList.innerHTML += `<div>${element}</div>`;
            }
        }
    };
    userListRequest.send();
}

// sync function
function sync() {
    // get channel list from server
    getChannelList();

    if (channel != "") {
        // get user list from server
        getUserList();
    }
}

// get channel list every second
setInterval(sync, 1000);

var socket;
// text input elements
const chatWindow = document.getElementById("chat-window");
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");

// username input elements
const usernameInput = document.getElementById("username-input");
const usernameForm = document.getElementById("username-form");

// channel input elements
const channelInput = document.getElementById("channel-input");
const channelForm = document.getElementById("channel-form");

// check if username is set
const firstRun = !usernameInput.value;

function setHostFromField() {
    var hostfield = document.getElementById("host-input").value;

    console.log(hostfield);

    // Connect to the server
    setHost(hostfield);
}

// Set host for the server, takes string as parameter
function setHost(hostnameIn) {
    hostname = hostnameIn;

    // Connect to the server
    socket = new WebSocket(
        `ws://${hostnameIn}:8080?channel=${channelInput.value}&username=${usernameInput.value}`
    );

    // Log if the connection is successful
    console.log("Connecting to server: " + hostname);
}

// listen for channel name submit
channelForm.onsubmit = (event) => {
    event.preventDefault();

    // set channel variable
    channel = channelInput.value;

    // Connect to the server
    socket = new WebSocket(
        `ws://${hostname}:8080?channel=${channelInput.value}&username=${usernameInput.value}`
    );

    // Log if the connection is successful
    console.log("Connecting to server: " + hostname);

    // reload page
    // window.location.reload();
};

chatForm.onsubmit = (event) => {
    event.preventDefault();

    // checkl if channel is set
    if (!channelInput.value) {
        // log an error message to the chat window
        chatWindow.innerHTML += `<div style="color: red">Please enter a channel</div>`;
        return;
    }

    // check that the message and username are not empty
    if (!messageInput.value || !usernameInput.value) {
        // log an error message to the chat window
        chatWindow.innerHTML += `<div style="color: red">Please enter a message</div>`;
        return;
    }

    const message = messageInput.value;
    socket.send(message);
    messageInput.value = "";
};

if (firstRun) {
    chatWindow.innerHTML += `<div style="color: red">enter username (type fast)	</div>`;

    // handle username input
    usernameForm.onsubmit = (event) => {
        event.preventDefault();

        // set username box to readonly
        usernameInput.readOnly = true;

        // output username to chat window
        chatWindow.innerHTML += `<div style="color: green">Username set to ${usernameInput.value}</div>`;
    };

    console.log("waiting for username");
} else if (!firstRun) {
    // set username box to readonly
    usernameInput.readOnly = true;

    // output username to chat window
    chatWindow.innerHTML += `<div style="color: green">Username set to ${usernameInput.value}</div>`;
}

setHost(hostname);

// Listen for messages from the server
socket.onmessage = (event) => {
    const { message, timestamp, author } = JSON.parse(event.data);
    const messageElement = document.createElement("div");
    messageElement.innerText = `${new Date(timestamp).toLocaleTimeString()} ${author}: ${message}`;
    chatWindow.appendChild(messageElement);

    console.log(event.data);

    console.log(`Received message: ${message}`);
};

// Listen for connection open event
socket.onopen = () => {
    // Log that we're connected
    console.log("Connected to server");

    // set global channel variable
    channel = channelInput.value;
};

// Listen for connection close event
socket.onclose = () => {
    console.log("Disconnected from server");
};