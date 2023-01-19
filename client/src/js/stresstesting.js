/* eslint-disable no-undef */
// Variables for client state
var hostname = "localhost";
var channel = "";
var username;
var socket;
var inChannel = false;



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
// setInterval(sync, 1000);

// Set host for the server, takes string as parameter
function setHost(hostnameIn) {
	hostname = hostnameIn;

	// set host field to hostname
	hostfield.value = hostname;

	// Log if the connection is successful
	console.log("Connecting to server: " + hostname);
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
			string += `${author}: ${message}`;
		} else if (type == "join") {
			messageElement.style.color = "green";
			string += `${author}: ${message}`;
		} else if (type == "leave") {
			messageElement.style.color = "red";
			string += `${author}: ${message}`;
		} else if (type == "server") {
			messageElement.style.color = "purple";
			string += `${author}: ${message}`;
		} else if (type == "error") {
			messageElement.style.color = "red";
			string += `${author}: ${message}`;
		} else throw new Error("Unknown message type");

		messageElement.innerHTML += string;

		chatWindow.appendChild(messageElement);

		chatWindow.scrollTop = chatWindow.scrollHeight;
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

// function to leave a channel
function leaveChannel() {
	// close the current connection
	if (socket != null) return;
	socket.close();

	// set inChannel to false
	inChannel = false;

	// set global channel variable
	channel = null;
}

// Connect to the server
setHost(hostname);