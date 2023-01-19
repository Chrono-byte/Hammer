exports = TrainCar;
const { WebSocket } = require("ws");
const { EventEmitter } = require("events");

// hammer client
class TrainCar extends EventEmitter {
	constructor(token, host, port) {
		this.token = token;

		this.channels = new Map();
		this.users = new Map();
	}

	login(token) {
		this.socket = new WebSocket(`ws://${host}:${port}?token=${token}`);

		// once the socket is open, emit the ready event
		this.socket.onopen = () => {
			// go through all the channels the user is a member of and join them


			// go through all the users the user is a member of and join them


			this.emit("ready");
		}
	}

	joinChannel(channel) {
		try {
			// Join channel
			this.channels.set(channel, new WebSocket(`ws://${hostname}:8080?channel=${channel}&username=${usernameInput.value}`));
		} catch {
			throw new Error("Could not connect to channel");
		}

		// Listen for messages from the server
		socket.onmessage = (event) => {
			const { message, timestamp, author, type } = JSON.parse(event.data);

			// emit event to client
			this.emit("message", { message, timestamp, author, type });
		};
	}

	leaveChannel(channel) {

	}

	deleteChannel(channel) {
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

	sendMessage(channel, message) {

	}

	createChannel(channel) {
		// create channel
		const channelCreateRequest = new XMLHttpRequest();
		channelCreateRequest.open(
			"POST",
			`http://${hostname}:8081/api/channels/create?channel=${channel}&token=${this.token}`,
			true
		);
		channelCreateRequest.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				const channelCreateData = JSON.parse(this.response);

				// send client message to chat window        
				this.EventEmitter.emit("channelCreated", channelCreateData.channelName);
			} else if (this.readyState == 4 && this.status == 409) {
				// send client message to chat window
				throw new Error(`Channel ${channel} already exists`);
			} else if (this.readyState == 4 && this.status == 406) {
				// send client message to chat window
				throw new Error("Channel name must be alphanumeric andlowercase");
			} else if (this.readyState == 4 && this.status == 0) {
				// send client message to chat window
				throw new Error("Could not connect to server");
			} else {
				// send client message to chat window
				throw new Error("Unknown error");
			}
		};
		channelCreateRequest.send();
	}
}