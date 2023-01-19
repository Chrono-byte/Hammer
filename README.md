# Hammer

Hammer is a simple WebSocket-based chat server & client written in JavaScript.

This mono-repo contains both the server and client portions of Hammer.

`boiler` is the chat server implementing all server-side API and WS chat functionalities.

`traincar` is the web-based client. Currently it is raw HTML and JavaScript, no fancy libraries.

## Installation

Install the dependencies:

```bash
npm install
```

## Usage

Run the server:

```bash
cd server/
yarn
node .
```

Run the client open it in your browser

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

Hammer uses different licenses for the server and client.

`boiler`: is licensed under AGPL-3.0-only.
`traincar`: is licensed under zLib with Aknowledgement.
