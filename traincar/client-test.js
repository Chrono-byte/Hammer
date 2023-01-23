const { Client } = require("./src/Client/client");
const client = new Client("localhost", 8080);

client.on("message", (message) => {
    console.log(message);
})

client.on('ready', () => {
    // log our username and id
    console.log(`Logged in as ${client.username} (${client.id})`);
});

client.on("logout", () => {
    console.log("Logged out");
})

// login
client.login("admin@disilla.org", "password");