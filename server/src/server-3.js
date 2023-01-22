/*
 * Hammer - A simple WebSocket-based chat server & client written in JavaScript.
 */

// servers
const { Server, WebSocket } = require("ws");
const express = require("express");
const cors = require("cors");
const { exists, readFile, existsSync, readFileSync, fstat, writeFile } = require("fs");
const path = require("path");

// prompt the user for the port
const port = process.argv[2] || 8080;

// import deps for other things, CORS and JWT
const jwt = require("jsonwebtoken");
const { env } = process;
env.JWT_SECRET = "Once upon a midnight dreary, while I pondered, weak and weary";

// bcrypt junk
const bcrypt = require('bcrypt');
const saltRounds = 10;

// create a new websocket server
const wss = new Server({ port: port });
const app = express();

// allow CORS
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// initialize data structures
const channels = new Map();
const users = new Map();

// import internal deps
const { snowflakeGen } = require("./util/snowflake");

// server info 
// MOTD, etc
env.BOILER_CONFIG = "server-config.json";
const config_local = path.join(__dirname, env.BOILER_CONFIG);

// listen for connections
wss.on("connection", (ws, req) => {
	const url = new URL(req.url, `http://${req.headers.host}`);
	const token = url.searchParams.get("token");

	// check that the connection is an authorized user
	const auth = checkUserAuth(token);
	var username;

	if (auth == false) {
		ws.close();
		return;
	} else {
		// send authorized handshake
		ws.send(JSON.stringify({
			timestamp: new Date().getTime(),
			id: snowflakeGen.createMessageID(),
			content: "Authorized",
			type: "payload"
		}));
	}

	// get the username from the token
	try {
		username = jwt.verify(token, env.JWT_SECRET).username;
	} catch (err) {
		// set username to "Unknown"
		username = "Unknown";
	}

	ws.send(JSON.stringify({
		timestamp: new Date().getTime(),
		id: snowflakeGen.createMessageID(),
		content: "Welcome to Hammer!",
		type: "heartbeat",
		payload: {
			motd: serverConfig.motd,
			server_name: serverConfig.server_name,
			username: username
		}
	}));

	ws.on("message", (message) => {

	});
});

var listener = app.listen(`${new Number(port) + 1}`, function () {
	console.log("Server Functions API is listening on port http://localhost:" + listener.address().port);
});

console.log(`Server listening on port http://localhost:${wss.address().port}`);