"use strict";

/*
 * Hammer - A simple WebSocket-based chat server & client written in JavaScript.
 *
 * Copyright (C) 2023 Michael G. <chrono@disilla.org>
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

// listen for connections
wss.on("connection", (ws, req) => {
	const url = new URL(req.url, `http://${req.headers.host}`);
	const token = url.searchParams.get("token");

	// check that token was provided
	if(!token) {
		ws.close();
	}

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

// route login
app.post("/api/login", (req, res) => {
	// get username and password from request
	const username = req.query.username;
	const password = req.query.password;

	// check that the username and password have been provided
	if (username == undefined || password == undefined) {
		res.status(422).send("Username and password must be provided");
		return;
	}

	// check if user exists
	if (!users.has(username)) {
		res.status(422).send("User does not exist");
		return;
	}

	// check that the user has a hashed password
	if (users.get(username).password == undefined) {
		res.status(500).send("User improper");
		return;
	}

	checkUser(username, password).then((result) => {
		if (!result) res.status(411).send("Refused.");

		if (result) {
			// log successful login
			console.log(`User ${username} logged in`);

			// get user object
			const user = users.get(username);
			const token = generateToken(user.username, user.permissions)

			// generate token
			users.get(username).token = token;

			// generate payload
			const loginPayload = {
				username: user.username,
				id: user.id,
				token: token
			}

			// send token
			res.status(200).send(loginPayload);
		}
	});
});

var listener = app.listen(`${new Number(port) + 1}`, function () {
	console.log("Server Functions API is listening on port http://localhost:" + listener.address().port);
});

console.log(`Server listening on port http://localhost:${wss.address().port}`);