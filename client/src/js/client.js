// Variables for client state
var hostname = "localhost";
var channel = "";
var username;
var socket;
var inChannel = false;

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
    if (hostname == "") return;
    // get channel list from server
    getChannelList();

    if (channel != "" && inChannel == true) {
        // get user list from server
        getUserList();
    }
}

// get channel list every second
setInterval(sync, 1000);

// text input elements
const chatWindow = document.getElementById("chat-window");
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");

// username input elements
const usernameInput = document.getElementById("username-input");
const usernameForm = document.getElementById("username-form");

// channel input elements
const hostfield = document.getElementById("host-input");
const channelInput = document.getElementById("channel-input");
const channelForm = document.getElementById("channel-form");

// check if username is set
const firstRun = !usernameInput.value;

function setHostFromField() {
    // Connect to the server
    setHost(hostfield.value);
}

// Set host for the server, takes string as parameter
function setHost(hostnameIn) {
    hostname = hostnameIn;

    // set host field to hostname
    document.getElementById("host-input").value = hostname;

    // Log if the connection is successful
    console.log("Connecting to server: " + hostname);
}

// append client message to chat window
function appendMessage(message) {
    const messageElement = document.createElement("div");
    messageElement.innerHTML += `<div style="color: blue">${new Date().toLocaleTimeString()}: CLIENT: ${message}</div>`;

    chatWindow.appendChild(messageElement);
}

// function to create a new channel
function createChannel(channelName) {
    // create channel
    const channelCreateRequest = new XMLHttpRequest();
    channelCreateRequest.open(
        "POST",
        `http://${hostname}:8081/api/channels/create?channel=${channelName}`,
        true
    );
    // channelCreateRequest.onload = function () {
    //     const channelCreateData = JSON.parse(this.response);

    //     // send client message to chat window
    //     appendMessage("Channel created: " + channelCreateData.channel);
    // };
    // check the status of the request
    channelCreateRequest.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            const channelCreateData = JSON.parse(this.response);

            // send client message to chat window        
            appendMessage("Channel created: " + channelCreateData.channel);
        } else if (this.readyState == 4 && this.status == 409) {
            // send client message to chat window
            appendMessage("Channel already exists: " + channelName);
        } else if (this.readyState == 4 && this.status == 406) {
            // send client message to chat window
            appendMessage("Channel name is invalid");
        } else if (this.readyState == 4 && this.status == 0) {
            // send client message to chat window
            appendMessage("Server not found");
        } else {
            // send client message to chat window
            appendMessage("Unknown error");
        }
    };
    channelCreateRequest.send();
}

// function to delete a channel
function deleteChannel(channelName) {
    // delete channel
    const channelDeleteRequest = new XMLHttpRequest();
    channelDeleteRequest.open(
        "DELETE",
        `http://${hostname}:8081/api/channels/delete?channel=${channelName}`,
        true
    );
    channelDeleteRequest.onload = function () {
        const channelDeleteData = JSON.parse(this.response);

        // send client message to chat window
        appendMessage("Channel deleted: " + channelDeleteData.channelName);
    };
    channelDeleteRequest.send();
}

// function to join a channel
function joinChannel(channelName) {
    // close the current connection
    if (socket != null)
        socket.close();

    // Join channel
    socket = new WebSocket(
        `ws://${hostname}:8080?channel=${channelName}&username=${username}`
    );

    // Log if the connection is successful
    console.log("Connecting to channel: " + channelName);

    // set inChannel to true
    inChannel = true;

    // Listen for messages from the server
    socket.onmessage = (event) => {
        const { message, timestamp, author, type } = JSON.parse(event.data);
        var string = `<div>${new Date(timestamp).toLocaleTimeString()}</div> `;
        const messageElement = document.createElement("div");


        if (type == "message") {
            messageElement.style.color = "black";
            messageElement.innerText += `${author}: ${message}`;
        } else if (type == "join") {
            messageElement.style.color = "green";
            messageElement.innerText += `${author}: ${message}`;
        } else if (type == "leave") {
            messageElement.style.color = "red";
            messageElement.innerText += `${author}: ${message}`;
        } else if (type == "server") {
            messageElement.style.color = "purple";
            messageElement.innerText += `${author}: ${message}`;
        } else if (type == "error") {
            messageElement.style.color = "red";
            messageElement.innerText += `${author}: ${message}`;
        } else throw new Error("Unknown message type");

        chatWindow.appendChild(messageElement);

        // scroll to bottom of chat window
        chatWindow.scrollTop = chatWindow.scrollHeight;

        // console.log(`Received message: ${message}`);
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
}

// listen for channel name submit
channelForm.onsubmit = (event) => {
    event.preventDefault();

    // set channel variable
    channel = channelInput.value;



    // run join channel function
    // joinChannel(channel);
};

chatForm.onsubmit = (event) => {
    event.preventDefault();

    // check if the message is a command
    if (messageInput.value.startsWith("/")) {
        // check if the command is /create
        if (messageInput.value.startsWith("/create")) {
            var channelName = messageInput.value.split(" ")[1];

            // run create channel function
            createChannel(channelName);
        } else if (messageInput.value.startsWith("/join")) {
            // get channel name from message
            var channelName = messageInput.value.split(" ")[1];

            // run join channel function
            joinChannel(channelName);
        } else if (messageInput.value.startsWith("/leave")) {
            // leave channel
            socket.close();

            // set inChannel to false
            inChannel = false;
        } else if (messageInput.value.startsWith("/delete")) {
            // get channel name from message
            var channelName = messageInput.value.split(" ")[1];

            // run delete channel function
            deleteChannel(channelName);
        } else if (messageInput.value.startsWith("/help")) {
            // send help message to chat window
            chatWindow.innerHTML += `<div style="color: purple">All Commands:</div>`;
            chatWindow.innerHTML += `<div style="color: purple">    /create - create a new channel</div>`;
            chatWindow.innerHTML += `<div style="color: purple">    /join [channel] - join a channel</div>`;
            chatWindow.innerHTML += `<div style="color: purple">    /leave - leave the current channel</div>`;
            chatWindow.innerHTML += `<div style="color: purple">    /help - show this message</div>`;
        } else {
            // send error message to chat window
            chatWindow.innerHTML += `<div style="color: red">Unknown command</div>`;
        }

        // clear message input
        messageInput.value = "";

        return;
    }

    // checkl if channel is set
    if (!channel) {
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

    // send message to server
    const message = messageInput.value;
    socket.send(message);
    messageInput.value = "";
};

if (firstRun) {
    chatWindow.innerHTML += `<div style="color: red">enter username<div>`;

    // handle username input
    usernameForm.onsubmit = (event) => {
        event.preventDefault();

        // set username box to readonly
        usernameInput.readOnly = true;

        // set global username variable
        username = usernameInput.value;

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

// Connect to the server
setHost(hostname);