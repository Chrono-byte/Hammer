// servers
const { Server, WebSocket } = require("ws");
const express = require("express");

// enviornment settings
const { env } = process;
env.JWT_SECRET = "Once upon a midnight dreary, while I pondered, weak and weary";
env.BOILER_CONFIG = "server-config.json";

// prompt the user for the port
const port = process.argv[2] || 8080;

// import deps for other things, CORS and JWT
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { exists, readFile, existsSync, readFileSync, fstat, writeFile } = require("fs");
const path = require("path");

// create a new websocket server
const wss = new Server({ port: port });
const app = express();

// allow CORS
app.use(cors({ origin: true, credentials: true }));

// initialize data structures
const channels = new Map();
const users = new Map();

// server info 
// MOTD, etc
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

// process.addListener("beforeExit", () => {
//     writeFile(config_local, JSON.stringify(serverConfig), (err) => {
//         if (err) {
//             console.log(err);
//         }
//     }).then(() => {
//         console.log("Saved server config");
//     });
// })

// set the "admin" user, make them an admin
users.set("admin", {
    username: "admin",
    token: jwt.sign({
        username: "admin",
        password: "Once upon a midnight dreary, while I pondered, weak and weary",
        permissions: {
            admin: true,
            createChannel: true,
            deleteChannel: true,
            joinChannel: true,
            leaveChannel: true,
            sendMessage: true
        }
    }, env.JWT_SECRET)
});

// override admin token
// users.get("admin").token = "token";

// log admin's token
console.log(users.get("admin").token);

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

getUserFromToken = (token) => [...users.values()].find((e) => e.token == token)
checkUserAuth = (token) => getUserFromToken(token) != null

class snowflakeGen {
    generateSnowflake() {
        // Get current timestamp in milliseconds
        var timestamp = Date.now();

        // Generate a random number between 0 and 1023
        var random = Math.floor(Math.random() * 1024);

        // Concatenate timestamp and random number
        var snowflake = timestamp + random;

        // Return the snowflake ID
        return snowflake;
    }


    // function to create channel snowflake ID
    createChannelID() {
        let seed = this.generateSnowflake();

        // generate a random number between 0 and 1023
        let random = Math.floor(Math.random() * 1024);

        // concatenate seed and random number
        let snowflake = seed + random;
    }

    // function to create user snowflake ID
    createUserID() {
        let seed = this.generateSnowflake();

        // generate a random number between 0 and 1023
        let random = Math.floor(Math.random() * 2048);

        // concatenate seed and random number
        let snowflake = seed + random;
    }
}

// listen for connections
wss.on("connection", (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    // check that the connection is an authorized user
    const auth = checkUserAuth(token);
    var username;

    // get the username from the token
    try {
        username = jwt.verify(token, env.JWT_SECRET).username;
    } catch (err) {
        // set username to "Unknown"
        username = "Unknown";

        // console.log(err);
    }

    // attach connected status to user
    users.forEach((x) => {
        if (x.token != token) {
            return;
        }

        // user is authorized
        x.connected = true;
    });

    // send the client a message to let them know they are connected
    ws.send(assembleServerMessage(`Welcome to #${serverConfig.server_name}, ${username}!`, "server"));

    if (auth == false) {
        ws.send("Unauthorized");

        ws.close();
        return;
    } else {
        ws.send("Authorized");
    }

    ws.on("message", (message) => {
        message = message.toString();

        // check that the channel still exists
        if (!channels.has(channelName)) {
            ws.send(`Channel '${channelName}' does not exist, closing connection.'`);
            ws.close();
            return;
        } else {
            // check that the channel still has the client
            if (!channel.has(username)) {
                ws.send(`username '${username}' does not exist in channel #${channelName}, closing connection.`);
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

    // log that we've received a login
    console.log("Received connection");
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
    users.set(username, {
        username: username,
        token: jwt.sign({ username: username, password: password }, env.JWT_SECRET),
    });

    // send token
    res.status(200).send(users.get(username).token);
});

// route login
app.post("/api/users/login", (req, res) => {
    // get username and password from request
    const username = req.query.username;
    const password = req.query.password;

    // check if user exists
    if (!users.has(username)) {
        res.status(400).send("User does not exist");
        return;
    }

    // check if password is correct
    if (jwt.sign({ username: username, password: password }, env.JWT_SECRET) == users.get(username).token) {
        res.status(400).send("Incorrect password");
        return;
    }

    // send token
    res.status(200).send(users.get(username).token);
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

    // log jwt.verify(token, env.JWT_SECRET).admin
    console.log(jwt.decode(token, env.JWT_SECRET));

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
        messages: [],
    });

    // send channel
    res.status(200).send(channels.get(channelName));
});

// route to join a channel
app.put("/api/channels/join", (req, res) => {
	const channelName = req.query.channel;
	const token = req.query.token;

	// check that the user is authenticated
	if (!token) {
		res.status(401).send("User not authenticated");
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

	res.send({
		channel: channel
	});
});

var listener = app.listen(`${new Number(port) + 1}`, function () {
    console.log("Server Functions API is listening on port http://localhost:" + listener.address().port);
});

console.log(`Server listening on port http://localhost:${wss.address().port}`);