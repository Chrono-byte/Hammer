/*
	Copyright (c) 2023 Michael Gummere
	All rights reserved.
	Redistribution and use in source and binary forms governed under the terms of the zlib/libpng License with Acknowledgement license.
*/

const { WebSocket } = require("ws");
const { EventEmitter } = require("events");
// hammer client
class Client extends EventEmitter {
	constructor(host, port) {
		super();

		this.host = host;
		this.port = port;

		this.channels = new Map();
		this.users = new Map();
	}

	login(username, password) {
		fetch(`http://${this.host}:${this.port + 1}/api/users/login?username=${username}&password=${password}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		}).then(response => {
			if (response.status === 401) {
				console.log("Invalid username or password");
			} else if (response.status === 200) {
				return response.json();
			}
		}).then(data => {
			this.token = data.token;

			// set username and id
			this.username = data.username;
			this.id = data.id;

			// connect to websocket
			this.emit("login");
		}).catch(error => {
			console.log(error);
		});


		this.on("login", () => {
			// connect to websocket
			try {
				// connect to websocket
				this.socket = new WebSocket(`ws://${this.host}:${this.port}?token=${this.token}`);
			} catch {
				console.log("Failed to connect to server");
				// emit the logout event
				this.emit("logout");
			}

			// once the socket is open, emit the ready event
			this.socket.onopen = (event) => {
				// WIP
			};

			// when socket is closed, emit the close event
			this.socket.onclose = () => {
				this.emit("logout");
			}

			// handle conection errors
			this.socket.onerror = (error) => {
				console.log(`WebSocket error: ${error.message}`);
			}

			// Listen for messages from the server
			this.socket.onmessage = (event) => {
				let message;

				try {
					message = JSON.parse(event.data);
				} catch {
					// throw new Error("Could not parse message");
				}

				switch (message.type) {
					case "payload":
						if (message.content == "Authorized") {
							this.socket.send(JSON.stringify({
								version: 1,
								type: "payload"
							}))

							// emit the ready event
							this.emit("ready");
						}
						break;
					case "heartbeat":
						this.emit("heartbeat", message);
						break;
					case "message":
						this.emit("message", message);
						break;
					case "joinChannel":
						this.emit("joinChannel", message);
						break;
					case "leaveChannel":
						this.emit("leaveChannel", message);
						break;
					case "deleteChannel":
						this.emit("deleteChannel", message);
						break;
					case "createChannel":
						this.emit("createChannel", message);
						break;
					case "updateChannel":
						this.emit("updateChannel", message);
						break;
					case "updateUser":
						this.emit("updateUser", message);
						break;
					case "deleteUser":
						this.emit("deleteUser", message);
						break;
					case "createUser":
						this.emit("createUser", message);
						break;
					case "updateUser":
						this.emit("updateUser", message);
						break;
					default:
						console.log(`Unknown message type from server, most likely a bug or an unimplemented feature ${message.type}`);
						break;
				}
			};
		});
	}

	logout() {
		try {
			this.socket.close();
		} catch {
			console.log("Not connected to a server");
		}
	}

	joinChannel(channel) {
		// fetch(`http://${this.host}:${this.port}/api/channels/join?channel=${channel}&token=${this.token}`, {
		// 	method: 'PUT',
		// 	headers: {
		// 		'Content-Type': 'application/json'
		// 	}
		// }).then(response => {
		// 	if (response.status === 200) {
		// 		return response.json();
		// 	}
		// }).then(data => {
		// 	this.emit("joinChannel", data);
		// }).catch(error => {
		// 	console.log(error);
		// });
	}

	leaveChannel(channel) {

	}

	deleteChannel(channel) {
		fetch(`http://${this.host}:${this.port}/api/channels/delete?channel=${channel}&token=${this.token}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			}
		}).then(response => {
			if (response.status === 200) {
				return response.json();
			}
		}).then(data => {
			appendMessage("Channel deleted: " + data.channelName);
		}).catch(error => {
			console.log(error);
		});
	}

	sendMessage(channel, message) {

	}

	createChannel(channel) {
		fetch(`http://${hostname}:8081/api/channels/create?channel=${channel}&token=${this.token}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		}).then(response => {
			if (response.status === 200) {
				return response.json();
			} else if (response.status === 409) {
				throw new Error(`Channel ${channel} already exists`);
			} else if (response.status === 406) {
				throw new Error("Channel name must be alphanumeric and lowercase");
			} else {
				throw new Error("Unknown error");
			}
		}).then(data => {
			this.emit("channelCreated", data.channelName);
		}).catch(error => {
			console.log(error);
		});
	}
}

module.exports = { Client };