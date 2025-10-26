const serverless = require('serverless-http');
// Explicitly require 'ejs' to ensure it's bundled by Netlify.
require('ejs');
const app = require('../index');

module.exports.handler = serverless(app);
