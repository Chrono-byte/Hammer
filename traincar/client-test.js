const { Client } = require("./src/Client/client");
const client = new Client("localhost", 8080);

client.on("message", (message) => {
    console.log(message);
})

client.on('ready', () => {
    // log our username and id
    console.log(`Logged in as ${client.username} (${client.id})`);
});

client.on("joinChannel", (channel) => {
    console.log(`Joined channel ${channel.channelName}`);
});

client.on("leaveChannel", (channel) => {
    console.log(`Left channel ${channel.channelName}`);
});

client.on("logout", () => {
    console.log("Logged out");
})

client.login("admin", "password");