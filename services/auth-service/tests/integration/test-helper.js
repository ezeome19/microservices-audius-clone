// Set NODE_ENV to test BEFORE loading any modules
process.env.NODE_ENV = 'test';
const path = require('path');
// Load environment variables BEFORE requiring any modules that use them
// Resolving path from CWD (services/auth-service) to root (.env)
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });



const { getSequelize } = require('../../src/startup/db');
let sequelize; // Will be initialized in beforeAll or helpers

async function cleanupDatabase() {
    // If sequelize isn't connected, nothing to clean
    if (!sequelize || !sequelize.connectionManager.pool || sequelize.connectionManager.pool._count === 0) return;

    // Get all model names and truncate tables
    const models = Object.keys(sequelize.models);
    for (const modelName of models) {
        await sequelize.models[modelName].destroy({
            where: {},
            truncate: true,
            cascade: true,
            force: true
        });
    }
}

// Jasmine global setup
beforeAll(async () => {
    // Set NODE_ENV to test
    process.env.NODE_ENV = 'test';

    // Initialize sequelize after env vars are loaded
    sequelize = getSequelize();

    // Connect to database and sync models
    await sequelize.authenticate();
    console.log('Connected to test database');

    // Sync models without dropping tables
    await sequelize.sync({ alter: false });
    console.log('Models synchronized');

    // Clean database before starting tests
    await cleanupDatabase();
    console.log('Database cleaned');
});

afterEach(async () => {
    await cleanupDatabase();
});

afterAll(async () => {
    // Close database connection
    if (sequelize) {
        await sequelize.close();
    }
});

module.exports = { cleanupDatabase };
