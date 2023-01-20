/*
	Copyright (c) 2023 Michael Gummere
	All rights reserved.
	Redistribution and use in source and binary forms governed under the terms of the zlib/libpng License with Acknowledgement license.
*/

const { WebSocket } = require("ws");
const { EventEmitter } = require("events");

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
		console.log(`ws://${this.host}:${this.port}?token=${token}`)

		this.socket = new WebSocket(`ws://${this.host}:${this.port}?token=${token}`);

		// once the socket is open, emit the ready event
		this.socket.onopen = () => {
			// go through all the channels the user is a member of and join them
			

			// go through all the users the user is a member of and join them


			this.emit("ready");
		};
	}

	joinChannel(channel) {
		try {
			// Join channel
			
		} catch {
			throw new Error("Could not connect to channel");
		}

		// Listen for messages from the server
		this.socket.onmessage = (event) => {
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

module.exports = { Traincar };