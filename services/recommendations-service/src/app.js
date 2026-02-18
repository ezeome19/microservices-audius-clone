const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const express = require('express');
const app = express();

require('./startup/logging')();
require('./startup/db')(app);
require('./startup/routes')(app);
require('./startup/config')();
require('./startup/prod')(app);

module.exports = app;
