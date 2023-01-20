/*
	Copyright (c) 2023 Michael Gummere
	All rights reserved.
	Redistribution and use in source and binary forms governed under the terms of the zlib/libpng License with Acknowledgement license.
*/

const { WebSocket } = require("ws");
const { EventEmitter } = require("events");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

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

			// set username, id
			this.username = data.username;
			this.id = data.id;

			// connect to websocket
			this.emit("login");
		}).catch(error => {
			console.log(error);
		});


		this.on("login", () => {
			// connect to websocket
			this.socket = new WebSocket(`ws://${this.host}:${this.port}?token=${this.token}`);

			// once the socket is open, emit the ready event
			this.socket.onopen = (event) => {
				this.emit("ready");
			};

			// when socket is closed, emit the close event
			this.socket.onclose = () => {
				this.emit("logout");
			}

			// handle conection errors
			this.socket.onerror = (error) => {
				console.log(`WebSocket error: ${error.message}`);
			}
		});
	}

	joinChannel(channel) {
		// Join channel
		const channelJoinRequest = new XMLHttpRequest();
		channelJoinRequest.open(
			"PUT",
			`http://${this.host}:${this.port}/api/channels/join?channel=${channel}&token=${this.token}`,
			true
		);
		channelJoinRequest.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				const channelJoinData = JSON.parse(this.response);

				// emit join event to client
				this.emit("joinChannel", channelJoinData);
			}
		}
		channelJoinRequest.send();

		// Listen for messages from the server
		this.socket.onmessage = (event) => {

			try {
				var message = JSON.parse(event.data);

				// message = {
				// 	content: message,
				// 	timestamp: timestamp,
				// 	author: author,
				// 	type: type,
				// 	id: id
				// }

				// emit event to client
				this.emit("message", message);
			} catch {
				// throw new Error("Could not parse message");
			}
		};
	}

	leaveChannel(channel) {

	}

	deleteChannel(channel) {
		// delete channel
		const channelDeleteRequest = new XMLHttpRequest();
		channelDeleteRequest.open(
			"DELETE",
			`http://${this.host}:${this.port}/api/channels/delete?channel=${channelName}`,
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

module.exports = { Client };