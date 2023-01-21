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

var serverConfig;
if (existsSync(config_local)) {
	serverConfig = JSON.parse(readFileSync(config_local));
} else {
	serverConfig = {
		motd: "Heyo!",
		server_name: "Hammer Test"
	}
}

// function to generate static token
function generateToken(username, permissions) {
	return jwt.sign({ username: username, permissions: permissions }, env.JWT_SECRET);
}

// function to check password
async function checkUser(username, password) {
	let user = users.get(username);

	const match = await bcrypt.compare(password, user.password);

	if (match) {
		return true;
	}

	return false;
}
// function to assemble user and store the user in database, then encrypt the password and store it
async function assembleUser(username, password, permissions) {
	// assemble the user
	let user = {
		username: username,
		id: snowflakeGen.createUserID(),
		password: password,
		permissions: permissions
	};

	// store the user
	users.set(username, user);

	await bcrypt.hash(password, saltRounds).then(function (hash) {
		// Store hash in your password DB.
		user.password = hash;

		return;
	});
}

assembleUser("admin", "password", {
	admin: true
});

/* example of a user
{
	username: "username",
	id: snowflakeGen.createUserID(),
	password: encryptPassword("password"),
	permissions: {
		admin: false,
		canCreateChannels: true,
		canDeleteChannels: true,
		canBanUsers: false,
		canKickUsers: false,
		canChangePermissions: false,
		canChangeNickname: false
	}
}
*/

// assemble message from "Server" to send to client
function assembleServerMessage(message, type) {
	return JSON.stringify({
		timestamp: new Date().getTime(),
		id: snowflakeGen.createMessageID(),
		author: "Server",
		content: message,
		type: "server"
	});
}

// assemble message from other user to send to client
function assembleUserMessage(message, author, type, channel) {
	if (type == "user") {
		return JSON.stringify({
			timestamp: new Date().getTime(),
			id: snowflakeGen.createMessageID(),
			author: author,
			content: message,
			type: "user",
			channel: channel
		});
	}
}

// create a new channel
function createChannel(channelName, channelID) {
	// check that the channel doesn't already exist
	if (channels.has(channelName)) {
		return false;
	}

	// create the channel
	channels.set(channelName, {
		name: channelName,
		id: channelID,
		messages: []
	});

	// return true
	return true;
}

var getUserFromToken = (token) => [...users.values()].find((e) => e.token == token);
var getUserFromID = (id) => [...users.values()].find((e) => e.id == id);
var checkUserAuth = (token) => getUserFromToken(token) != null;

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

// route create user
app.post("/api/users/create", (req, res) => {
	// get username and password from request
	const username = req.query.username;
	const password = req.query.password;

	// check that the username and password have been provided
	if (username == undefined || password == undefined) {
		res.status(400).send("Username and password must be provided");
		return;
	}

	// check that the username and password are not empty
	if (username == "" || password == "") {
		res.status(400).send("Username and password cannot be empty");
		return;
	}

	// check that the username is a valid email
	if (!username.match(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/)) {
		res.status(400).send("Username must be a valid email");
		return;
	}

	// check if user already exists
	if (users.has(username)) {
		res.status(400).send("User already exists");
		return;
	}

	// create user
	assembleUser(username, password, {
		admin: false,
		canCreateChannels: true,
		canDeleteChannels: true,
		canBanUsers: false,
		canKickUsers: false,
		canChangePermissions: false,
		canChangeNickname: false
	});

	// send confirmation
	res.status(200).send("Success");
});

// route login
app.post("/api/users/login", (req, res) => {
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

// route to promote user to admin
app.post("/api/users/promote", (req, res) => {
	// get username and token from request
	const username = req.query.username;
	const token = req.query.token;

	// get user to be promoted
	const user = users.get(username);

	// check if user exists
	if (!users.has(username)) {
		res.status(400).send("User does not exist");
		return;
	}

	// check if token is valid
	if (jwt.verify(token, env.JWT_SECRET) == null) {
		res.status(400).send("Invalid token");
		return;
	}

	// check if user is admin
	if (jwt.verify(token, env.JWT_SECRET).admin) {
		// promote user
		user.admin = true;
		res.status(200).send("User promoted");
		return;
	}

	// user is not admin
	res.status(400).send("User is not admin");
});

// route create channel
app.post("/api/channels/create", (req, res) => {
	// get token & username from request
	const username = req.query.username;
	const token = req.query.token;

	// get channel name from request
	const channelName = req.query.channelName;

	// check that the channel name has been provided and is not empty
	if (channelName == undefined || channelName == "") {
		res.status(400).send("Channel name must be provided");
		return;
	}

	// check that the user is an admin
	if (!jwt.decode(token, env.JWT_SECRET).permissions.admin) {
		res.status(400).send("User is not admin");
		return;
	}

	// check if channel already exists
	if (channels.has(channelName)) {
		res.status(400).send("Channel already exists");
		return;
	}

	// create channel
	channels.set(channelName, {
		name: channelName,
		messages: new Map(),
		users: new Map()
	});

	// send channel
	res.status(200).send(channels.get(channelName));
});

// route to join a channel
app.put("/api/channels/join", (req, res) => {
	const channelName = req.query.channel;
	const token = req.query.token;

	var auth = checkUserAuth(token);

	if (!auth) {
		res.status(400).send("Invalid token");
		return;
	}

	// check that the channel name was provided
	if (!channelName) {
		res.status(400).send("Channel name not provided");
		return;
	}

	if (!channels.has(channelName)) {
		res.status(400).send("Channel does not exist");
		return;
	}

	const channel = channels.get(channelName);
	const user = getUserFromToken(token);

	res.send(channel);
});

// route to get user info from id
app.get("/api/users/", (req, res) => {
	const token = req.query.token;
	const id = req.url.normalize;

	var auth = checkUserAuth(token);

	if (!auth) {
		res.status(400).send("Invalid token");
		return;
	}

	const user = getUserFromID(auth);

	res.send(user);
});

var listener = app.listen(`${new Number(port) + 1}`, function () {
	console.log("Server Functions API is listening on port http://localhost:" + listener.address().port);
});

console.log(`Server listening on port http://localhost:${wss.address().port}`);