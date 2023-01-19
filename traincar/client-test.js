const { TrainCar } = require("./src/index.js");
const client = new TrainCar("token", "localhost", 8080);

client.on("message", (message) => {
    console.log(message);
})

client.on('ready', () => {

});