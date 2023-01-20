const { Traincar } = require("./src/traincar");
const client = new Traincar("localhost", 8080);

client.on("message", (message) => {
    // console.log(message.text);
})

client.on('ready', () => {
    console.log("Ready!");

    client.joinChannel("general");
});

client.on("joinChannel", (channel) => {
    console.log(`Joined channel ${channel.channelName}`);
});

client.login("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwicGFzc3dvcmQiOiJPbmNlIHVwb24gYSBtaWRuaWdodCBkcmVhcnksIHdoaWxlIEkgcG9uZGVyZWQsIHdlYWsgYW5kIHdlYXJ5IiwicGVybWlzc2lvbnMiOnsiYWRtaW4iOnRydWUsImNyZWF0ZUNoYW5uZWwiOnRydWUsImRlbGV0ZUNoYW5uZWwiOnRydWUsImpvaW5DaGFubmVsIjp0cnVlLCJsZWF2ZUNoYW5uZWwiOnRydWUsInNlbmRNZXNzYWdlIjp0cnVlfSwiaWF0IjoxNjc0MTg1NTU2fQ.J7PyzFXSc5YdDRalKZgaUh7C19Wt40uryB-LZCFECrY");