// servers
const { Server, WebSocket } = require("ws");
const express = require("express");

// enviornment settings
const { env } = process;
env.JWT_SECRET = "Once upon a midnight dreary, while I pondered, weak and weary";

// prompt the user for the port
const port = process.argv[2] || 8080;

// import deps for other things, CORS and JWT
const cors = require("cors");
const jwt = require("jsonwebtoken");

// create a new websocket server
const wss = new Server({ port: port });
const app = express();

// allow CORS
app.use(cors({ origin: true, credentials: true }));

// initialize data structures
const channels = new Map();
const users = new Map();

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

// log admin's token
console.log(users.get("admin").token);

function checkUserAuth(token) {
    // check that the connection is an authorized user
    var auth = false
    users.forEach((x) => {
        if (x.token != token) {
            return;
        }

        // user is authorized
        return auth = true;
    })

    if (auth == false) {
        return false;
    }
}

function createChannelID() {

}

function createGuildID() {
    
}

// listen for connections
wss.on("connection", (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    const auth = checkUserAuth(token);

    // log that we've received a login

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
    console.log(jwt.verify(token, env.JWT_SECRET));

    // check that the user is an admin
    if (!jwt.verify(token, env.JWT_SECRET).admin) {
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

var listener = app.listen(`${new Number(port) + 1}`, function () {
    console.log("Server Functions API is listening on port http://localhost:" + listener.address().port);
});

console.log(`Server listening on port http://localhost:${wss.address().port}`);