
/*
 * Hammer - A simple WebSocket-based chat server & client written in JavaScript.
 *
 * Copyright (C) 2023 Michael G. <chrono@disilla.org>
 */

// Description: Handles authentication and authorization
const express = require('express');
const router = express.Router();

// import deps for other things, CORS and JWT
const jwt = require("jsonwebtoken");
const { env } = process;
env.JWT_SECRET = "Once upon a midnight dreary, while I pondered, weak and weary";

// bcrypt junk
const bcrypt = require('bcrypt');
const saltRounds = 10;

// middleware that is specific to this router
router.use((req, res, next) => {
  console.log('Time: ', Date.now())
  next()
});

router.post("/login", (req, res) => {
	// get username and password from request
	const username = req.query.username;
	const password = req.query.password;

	// check that the username and password have been provided
	if (username == undefined || password == undefined) {
		res.status(422).send("Username and password must be provided");
		return;
	}

	// check if user exists
	if (!users.has(username)) {
		res.status(422).send("User does not exist");
		return;
	}

	// check that the user has a hashed password
	if (users.get(username).password == undefined) {
		res.status(500).send("User improper");
		return;
	}

	checkUser(username, password).then((result) => {
		if (!result) res.status(411).send("Refused.");

		if (result) {
			// log successful login
			console.log(`User ${username} logged in`);

			// get user object
			const user = users.get(username);
			const token = generateToken(user.username, user.permissions)

			// generate token
			users.get(username).token = token;

			// generate payload
			const loginPayload = {
				username: user.username,
				id: user.id,
				token: token
			}

			// send token
			res.status(200).send(loginPayload);
		}
	});
});

module.exports = router