const { Katana } = require("@chronomly/katana");
const { Server, WebSocket } = require("ws");
const express = require("express");
const cors = require("cors");
const app = express();

// allow CORS
app.use(cors({ origin: true, credentials: true }));

// prompt the user for the port
const port = process.argv[2] || 8080;

const channels = new Map();

// const datastore = new Katana("./database", { encrypt: true, saveToDisk: true });

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
    ws.send(`Welcome to #${channelName}, ${username}`);

    // alert the other clients that a new client has joined
    channel.forEach((client) => {
        if (client !== ws) {
            client.send(`${username} has joined the channel`);
        }
    });

    ws.on("message", (message) => {
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

            // check if the message is a command
            let checkCommand = `${message}}`;
            if (checkCommand.split("")[0] == "/") {
                const command = checkCommand.split(" ")[0].substring(1);
                const args = checkCommand.split(" ").slice(1);

                switch (command) {
                    case "nick":
                        if (args.length < 1) {
                            ws.send("Please provide a username");
                        }

                        if (channel.has(args[0])) {
                            ws.send(`username '${args[0]}' already taken, please choose another`);
                            return;
                        }

                        channel.delete(username);
                        username = args[0];
                        channel.set(username, ws);

                        ws.send(`username changed to '${username}'`);
                    default:
                        break;
                }
            }

            channel.forEach((client, name) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(`${username}: ${message}`);
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

// create a route to get the number of channels
app.get("/api/channels/size", (req, res) => {
    res.send({ channels: channels.size });
});

// route to get all the channels
app.get("/api/channels", (req, res) => {
    res.send({ channels: [...channels.keys()] });

    // log the number of channels
    console.log(`Number of channels: ${channels.size}`);
});

setInterval(() => {
    // log the number of channels
    // console.log(`Number of channels: ${channels.size}`);

    for (const [channelName, channel] of channels) {
        // checking status of channel
        console.log(
            "Channel: " + channelName + " has " + channel.size + " clients"
        );

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

