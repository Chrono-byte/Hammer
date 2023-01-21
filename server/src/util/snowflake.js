let snowflakeGen = {
    generateSnowflake() {
        // Get current timestamp in milliseconds
        var timestamp = Date.now();

        // Generate a random number between 0 and 1023
        var random = Math.floor(Math.random() * 1024);

        // Concatenate timestamp and random number
        var snowflake = timestamp + random;

        // Return the snowflake ID
        return snowflake;
    },

    // function to create message snowflake ID
    createMessageID() {
        // generate seed snowflake
        let seed = this.generateSnowflake();

        // generate a random number between 0 and 1023
        let random = Math.floor(Math.random() * 1024);

        // concatenate seed and random number
        let snowflake = seed + random;

        // return the snowflake ID
        return snowflake;
    },

    // function to create channel snowflake ID
    createChannelID() {
        // generate seed snowflake
        let seed = this.generateSnowflake();

        // generate a random number between 0 and 1023
        let random = Math.floor(Math.random() * 1024);

        // concatenate seed and random number
        let snowflake = seed + random;

        // return the snowflake ID
        return snowflake;
    },

    // function to create user snowflake ID
    createUserID() {
        // generate seed snowflake
        let seed = this.generateSnowflake();

        // generate a random number between 0 and 1023
        let random = Math.floor(Math.random() * 2048);

        // concatenate seed and random number
        let snowflake = seed + random;

        // return the snowflake ID
        return snowflake;
    }
}

module.exports = { snowflakeGen };