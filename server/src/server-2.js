// servers
const { Server, WebSocket } = require("ws");
const express = require("express");

// enviornment settings
const { env } = process;
env.JWT_SECRET = "ssshhhhhhh";
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

// listen for connections
wss.on("connection", (ws) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const channelName = url.searchParams.get("token");
});

// route create user
app.post("/api/users/create", (req, res) => {
    // get username and password from request
    const username = req.query.username;
    const password = req.query.password;

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



var listener = app.listen(port + 1, function () {
    console.log("Server Functions API is listening on port " + listener.address().port);
});

console.log(`Server listening on port ${wss.address().port}`);