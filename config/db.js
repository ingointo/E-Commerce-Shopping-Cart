const mongoose = require('mongoose');

module.exports = {
    connect: function () {
        const url = 'mongodb://127.0.0.1:27017/';
        const dbname = 'Shopping';
        return mongoose.connect(url, {
                dbName: dbname
            })
            .then(() => {
                console.log('Connected successfully to MongoDB Atlas cluster.');
            })
            .catch((err) => {
                console.log('Unable to connect to MongoDB Atlas cluster: ' + err.message);
                process.exit(1);
            });
    },
    collection: function (collection) {
        return mongoose.connection.db.collection(collection);
    }
};
