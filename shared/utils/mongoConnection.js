const mongoose = require('mongoose');
const winston = require('winston');

// Create MongoDB connection
module.exports = async function (mongoUri, serviceName) {
    try {
        // Add connection pool configuration to prevent exhaustion
        await mongoose.connect(mongoUri, {
            maxPoolSize: 10, // Maximum number of connections in the pool
            minPoolSize: 2,  // Minimum number of connections
            serverSelectionTimeoutMS: 30000, // Timeout for server selection (30 seconds)
            socketTimeoutMS: 300000, // Socket timeout (5 minutes) - prevents idle connection timeouts
            connectTimeoutMS: 30000, // Connection timeout (30 seconds)
            heartbeatFrequencyMS: 10000, // Send heartbeat every 10 seconds to keep connections alive
        });
        // log the information about successful connection to winston logger
        // winston will also handle logging the error if connection fails
        try {
            const admin = mongoose.connection.db.admin();
            const status = await admin.command({ replSetGetStatus: 1 });
            winston.info(`[${serviceName}] connected to mongodb... | replica set status: ok | myState = ${status.myState}`);
        } catch (ex) {
            // If not a replica set (standalone mongod), admin command may fail - log and continue
            winston.warn(`[${serviceName}] Connected to MongoDB, but unable to get replica set status. Running standalone? ` + ex.message);
        }
    } catch (err) {
        winston.error(`[${serviceName}] Could not connect to MongoDB`, err);
        throw err;
    }
}

module.exports.mongoose = mongoose;
