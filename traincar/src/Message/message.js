class Message {
  constructor(message, author, channel) {
    this.message = message;
    this.author = author;
    this.channel = channel;
  }

  reply(message) {
    this.channel.send(message);
  }
}