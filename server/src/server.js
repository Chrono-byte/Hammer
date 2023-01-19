const { Server, WebSocket } = require("ws");
const express = require("express");

// express server
const cors = require("cors");
const app = express();

// allow CORS
app.use(cors({ origin: true, credentials: true }));

// prompt the user for the port
const port = process.argv[2] || 8080;

const channels = new Map();
const users = new Map();

// assemble message from "Server" to send to client
function assembleServerMessage(message, type) {
	if (type == "server" || type == "error") {
		return JSON.stringify({
			timestamp: new Date().getTime(),
			author: "Server",
			message: message,
			type: "server"
		});
	} else if (type == "join") {
		return JSON.stringify({
			timestamp: new Date().getTime(),
			author: "Server",
			message: message,
			type: "join"
		});

	} else if (type == "leave") {
		return JSON.stringify({
			timestamp: new Date().getTime(),
			author: "Server",
			message: message,
			type: "leave"
		});
	}
}

// assemble message from client to send to other clients
function assembleClientMessage(message, author) {
	return JSON.stringify({
		timestamp: new Date().getTime(),
		author: author,
		message: message,
		type: "message"
	});
}

const wss = new Server({ port: port });

wss.on("connection", (ws, req) => {
	console.log("Client connected");

	const url = new URL(req.url, `http://${req.headers.host}`);
	const channelName = url.searchParams.get("channel");
	let username = url.searchParams.get("username");

	if (!channelName || !username || username.toLocaleLowerCase == "server" || username == undefined || username == null || username == "undefined") {
		ws.close();

		// log that we rejected the client
		console.log(
			`Client rejected because ${!channelName ? "channelName" : "username"
			} was not provided`
		);

		return;
	}

	// if (!channels.has(channelName)) {
	// channels.set(channelName, new Map());
	// }

	// check if channel exists
	if (!channels.has(channelName)) {
		// tell client that channel does not exist

		ws.send(assembleServerMessage(`Channel '${channelName}' does not exist`, "error"));

		// log that we rejected the client
		console.log(`Client rejected because channel '${channelName}' does not exist`);
		ws.close();
		return;
	}

	const channel = channels.get(channelName);

	if (channel.has(username)) {
		// tell client that username is taken
		ws.send(assembleServerMessage(`Username '${username}' is taken`, "error"));

		// log that we rejected the client
		console.log(`Client '${username}' rejected`);
		ws.close();
		return;
	}

	// log what channel the client is connecting to
	console.log(`${username} connecting to: #${channelName}`);

	channel.set(username, ws);

	// send the client a message to let them know they are connected
	ws.send(assembleServerMessage(`Welcome to #${channelName}, ${username}!`, "server"));

	// send the client a message with the number of users in the channel
	ws.send(assembleServerMessage(`There are ${channel.size - 1} other users in this channel.`, "server"));

	// alert the other clients that a new client has joined
	channel.forEach((client) => {
		if (client !== ws) {
			client.send(assembleServerMessage(`${username} has joined the channel`, "join"));
		}
	});

	ws.on("message", (message) => {
		message = message.toString();

		// check that the channel still exists
		if (!channels.has(channelName)) {
			ws.send(`Channel '${channelName}' does not exist, closing connection.'`);
			console.log(
				`Channel '${channelName}' does not exist, closing connection`
			);
			ws.close();
			return;
		} else {
			// check that the channel still has the client
			if (!channel.has(username)) {
				ws.send(`username '${username}' does not exist in channel #${channelName}, closing connection.`);
				console.log(`Client
                '${username}' does not exist in channel '${channelName}', closing connection`);
				ws.close();
				return;
			}

			channel.forEach((client) => {
				if (client.readyState === WebSocket.OPEN) {
					client.send(assembleClientMessage(message, username));
				}
			});
		}
	});

	ws.on("close", () => {
		console.log(`Client '${username}' disconnected`);

		// alert the other clients that a client has left

		channel.forEach((client) => {
			if (client !== ws) {
				// client.send(`${username} has left the channel`);

				client.send(assembleServerMessage(`${username} has left the channel`, "leave"));
			}
		});

		channel.delete(username);
	});
});

// route to get all the channels
app.post("/api/channels", (req, res) => {
	res.send({ channels: [...channels.keys()] });
});

// route to create a channel
app.post("/api/channels/create", (req, res) => {
	const channelName = req.query.channel;

	if (!channelName) {
		res.status(400).send("Channel name not provided");
		return;
	}

	if (channels.has(channelName)) {
		res.status(409).send("Channel already exists");
		return;
	}

	if (channelName.toLocaleLowerCase() != channelName) {
		res.status(406).send("Channel name must be lowercase");
		return;
	}

	// check if channel name is valid
	if (!channelName.match(/^[a-z0-9]+$/)) {
		res.status(406).send("Channel name must be lowercase and contain only letters and numbers");
		return;
	}

	// check that the channel name does not contain the word null or undefined
	if (channelName.includes("null") || channelName.includes("undefined")) {
		if (channelName.includes("null"))
			res.status(406).send("Channel name cannot contain the word 'null'");
		if (channelName.includes("undefined"))
			res.status(406).send("Channel name cannot contain the word 'undefined'");
		return;
	}

	// create the channel
	channels.set(channelName, new Map());

	// var channel = channels.get(channelName);

	res.status(200).send({
		message: "Channel created " + channelName,
		channel: channelName
	});
});

// route to delete a channel
app.delete("/api/channels/delete", (req, res) => {
	const channelName = req.query.channel;

	if (!channelName) {
		res.status(400).send("Channel name not provided");
		return;
	}

	if (!channels.has(channelName)) {
		res.status(400).send("Channel does not exist");
		return;
	}

	channels.delete(channelName);

	// log that we deleted the channel
	console.log(`Channel '${channelName}' deleted`);

	res.send("Channel deleted " + channelName);
});

// route to get a channel
app.post("/api/channels/get", (req, res) => {
	const channelName = req.query.channel;

	if (!channelName) {
		res.status(400).send("Channel name not provided");
		return;
	}

	if (!channels.has(channelName)) {
		res.status(400).send("Channel does not exist");
		return;
	}

	const channel = channels.get(channelName);

	res.send({
		channel: channel,
	});
});

// route to delete a user
app.delete("/api/users/delete", (req, res) => {
	const username = req.query.username;

	if (!username) {
		res.status(400).send("Username not provided");
		return;
	}

	if (!users.has(username)) {
		res.status(400).send("User does not exist");
		return;
	}

	var user = users.get(username);

	// notify the user that their account has been deleted
	user.forEach((client) => {

		client.send(assembleServerMessage("Your account has been deleted", "delete"));

		// delete the user from all channels
		for (const [channel] of channels) {
			if (channel.has(username)) {
				channel.delete(username);
			}

			// notify the clients that the user has left the channel
			channel.forEach((client) => {
				client.send(assembleServerMessage(`${username} has left the channel`, "leave"));
			});

		}
	});

	users.delete(username);

	res.status(200).send({
		message: "User deleted " + username,
		user: username
	});
});

// route to authenticate a user
app.post("/api/users/auth", (req, res) => {
	const username = req.query.username;
	const password = req.query.password;

	if (!username) {
		res.status(400).send("Username not provided");
		return;
	}

	if (!users.has(username)) {
		res.status(400).send("User does not exist");
		return;
	}

	if (!password) {
		res.status(400).send("Password not provided");
		return;
	}

	var user = users.get(username);

	if (user.get("password") != password) {
		res.status(401).send("Incorrect password");
		return;
	}

	res.status(200).send({
		message: "User authenticated " + username,
		user: username
	});
});

setInterval(() => {
	for (const [channelName, channel] of channels) {
		// if the channel is empty, delete it
		if (channel.size < 1) {
			console.log(`Channel '${channelName}' is empty`);

			// notify the clients that the channel has been deleted
			channel.forEach((client) => {
				client.send(assembleServerMessage(`Channel '${channelName}' will been deleted`, "error"));
			});

			setTimeout(() => {
				// channels.delete(channelName);
			}, 5000);

			continue;
		}
	}
}, 10000);

var listener = app.listen(port + 1, function () {
	console.log("Server Functions API is listening on port " + listener.address().port);
});

console.log(`Server listening on port ${wss.address().port}`);

