const { Traincar } = require("./src/traincar");
const client = new Traincar("localhost", 8080);

client.on("message", (message) => {
    console.log(message);
})

client.on('ready', () => {
    console.log("Ready!");
});


client.login("token");