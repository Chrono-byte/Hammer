const { Server, WebSocket } = require("ws");
const express = require("express");
const cors = require("cors");
const app = express();

// allow CORS
app.use(cors({ origin: true, credentials: true }));

// prompt the user for the port
const port = process.argv[2] || 8080;

const channels = new Map();

// assemble message from "Server" to send to client
function assembleServerMessage(message) {
	return JSON.stringify({
		timestamp: new Date().getTime(),
		author: "Server",
		message: message,
	});
}


const wss = new Server({ port: port });

wss.on("connection", (ws, req) => {
	console.log("Client connected");

	const url = new URL(req.url, `http://${req.headers.host}`);
	const channelName = url.searchParams.get("channel");
	let username = url.searchParams.get("username");

	if (!channelName || !username) {
		ws.close();

		// log that we rejected the client
		console.log(
			`Client rejected because ${!channelName ? "channelName" : "username"
			} was not provided`
		);

		return;
	}

	if (!channels.has(channelName)) {
		channels.set(channelName, new Map());
	}

	const channel = channels.get(channelName);

	if (channel.has(username)) {
		ws.send(`username '${username}' already taken, please choose another`);

		// log that we rejected the client
		console.log(`Client '${username}' rejected`);
		ws.close();
		return;
	}

	// log what channel the client is connecting to
	console.log(`${username} connecting to: #${channelName}`);

	channel.set(username, ws);

	// send the client a message to let them know they are connected
	ws.send(assembleServerMessage(`Welcome to #${channelName}, ${username}!`));

	// send the client a message with the number of users in the channel
	ws.send(assembleServerMessage(`There are ${channel.size - 1} other users in this channel.`));

	// alert the other clients that a new client has joined
	channel.forEach((client) => {
		if (client !== ws) {
			client.send(`${username} has joined the channel`);
		}
	});

	ws.on("message", (message) => {
		message = message.toString();

		// check that the channel still exists
		if (!channels.has(channelName)) {
			ws.send(`Channel '${channelName}' does not exist, closing connection.'`)
			console.log(
				`Channel '${channelName}' does not exist, closing connection`
			);
			ws.close();
			return;
		} else {
			// check that the channel still has the client
			if (!channel.has(username)) {
				ws.send(`username '${username}' does not exist in channel #${channelName}, closing connection.`)
				console.log(`Client
                '${username}' does not exist in channel '${channelName}', closing connection`);
				ws.close();
				return;
			}

			channel.forEach((client, name) => {
				if (client.readyState === WebSocket.OPEN) {
					client.send(JSON.stringify({
						timestamp: new Date().getTime(),
						author: username,
						message: message,
					}));
				}
			});
		}
	});

	ws.on("close", () => {
		console.log(`Client '${username}' disconnected`);

		// alert the other clients that a client has left
		channel.forEach((client) => {
			if (client !== ws) {
				client.send(`${username} has left the channel`);
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
		res.status(400).send("Channel already exists");
		return;
	}

	channels.set(channelName, new Map());

	res.send("Channel created " + channelName);
})

// route to delete a channel
app.post("/api/channels/delete", (req, res) => {
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

	res.send("Channel deleted " + channelName);
})

// route to get the number of users in a channel
app.post("/api/channels/users/size", (req, res) => {
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

	res.send({ users: channel.size });
});

// route to get all the users in a channel
app.post("/api/channels/users", (req, res) => {
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
		users: [...channel.keys()],
	});
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

setInterval(() => {
	for (const [channelName, channel] of channels) {
		// if the channel is empty, delete it
		if (channel.size < 1) {
			console.log(`Channel '${channelName}' is empty, deleting.`);

			channels.delete(channelName);
			continue;
		}
	}
}, 5000);

var listener = app.listen(port + 1, function () {
	console.log('Server Functions API is listening on port ' + listener.address().port); //Listening on port 8888
});

console.log(`Server listening on port ${wss.address().port}`);

