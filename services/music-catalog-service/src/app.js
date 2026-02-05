// Force restart for shared middleware update
const path = require('path');
// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const express = require('express');
const app = express();

// Initialize startup modules
require('./startup/logging')();
require('./startup/redis')(app); // Initialize Redis caching
require('./startup/routes')(app);
require('./startup/config')();
require('./startup/prod')(app);
require('./startup/db')(app);

module.exports = app;
