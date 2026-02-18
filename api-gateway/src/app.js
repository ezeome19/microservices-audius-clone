const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();

app.use(cookieParser());

require('./startup/logging')();
require('./startup/config')();
require('./startup/prod')(app);
require('./startup/routes')(app);
require('./startup/server')(app);

module.exports = app;
