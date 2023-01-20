/*
	Copyright (c) 2023 Michael Gummere
	All rights reserved.
	Redistribution and use in source and binary forms governed under the terms of the zlib/libpng License with Acknowledgement license.
*/

const { WebSocket } = require("ws");
const { EventEmitter } = require("events");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

// hammer client
class Traincar extends EventEmitter {
	constructor(host, port) {
		super();

		this.host = host;
		this.port = port;

		this.channels = new Map();
		this.users = new Map();
	}

	login(token) {
		// console.log(`ws://${this.host}:${this.port}?token=${token}`)

		this.socket = new WebSocket(`ws://${this.host}:${this.port}?token=${token}`);

		// once the socket is open, emit the ready event
		this.socket.onopen = () => {
			this.emit("ready");
		};

		// when socket is closed, emit the close event
		this.socket.onclose = () => {
			this.emit("logout");
		}

		this.on("logout", () => {
			process.exit(0);
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
				const { message, timestamp, author, type } = JSON.parse(event.data);
				// emit event to client
				this.emit("message", { text: message, timestamp, author, type });
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

module.exports = { Traincar };