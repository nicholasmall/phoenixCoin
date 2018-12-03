"use strict";
module.exports = {
    "apiConfig": {
        "host": "10.0.0.249",
        "port": "5554"
    },
    "mongoConfig": {
        "url": "mongodb://10.0.0.249:27017/phoenixCoin",
        options: {
            server: {
                socketOptions: {
                    socketTimeoutMS: 0,
                    connectionTimeout: 0
                }
            }, useNewUrlParser: true
        }
    }
};