'use strict';

var express = require('express');
var payloadController = require('../auth/model/payload.controller');
var auth = require('../auth/auth.service');
var router = express.Router();

router.get('/',
  auth.isClientAuthorized,
  auth.validateAccessJwt,
  auth.errorHandlingAccessJwt,
  auth.isAuthenticatedForProject(process.env.PROJECT_NAME_CREMA), payloadController.getPayload);
//router.get('/entity', auth.isClientAuthorized, auth.authenticate(), userController.findByToken);


router.use('/*', function (req, res) {
  res.send(404, {error: "resource path missing or resource not found."});
});

module.exports = router;
