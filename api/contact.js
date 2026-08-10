'use strict';

const { handleContact } = require('./lib/forms');

module.exports = (req, res) => handleContact(req, res);
