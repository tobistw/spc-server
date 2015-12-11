'use strict';

var express = require('express');

var router = express.Router();

router.use('/auth', require('./auth'));
// ID for Project: CREMA
router.use('/auth/001', require('./crema/index'));

router.use('/*', function (req, res) {
  res.send(404, {error: "resource path missing or resource not found."});
});

module.exports = router;
