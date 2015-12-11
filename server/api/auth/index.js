'use strict';

var express = require('express');
var config = require('../../config/environment/index');
var auth = require('./auth.service.js');
var audit = require('../../audit/audit.service.js');
var otp = require('./otp.service.js');

// Passport Configuration
require('./passport').setup();

var router = express.Router();

// only call that should be made without API key
//router.post('/register', auth.register);

router.post('/login', audit.logLogin, auth.login, otp.loginOtp);

router.get('/authenticate', audit.logAuthenticate,
  auth.isClientAuthorized,
  auth.validateAccessJwt,
  auth.errorHandlingAccessJwt,
  auth.authenticate);

router.get('/token', audit.logAuthenticate,
  auth.isClientAuthorized,
  auth.getToken());

router.get('/token/:id', audit.logLogin, auth.isClientAuthorized, auth.getTokensForId);

router.post('/register', audit.logRegister, auth.register);

// OAuth Routes
router.get('/google', auth.loginGoogle);
router.get('/google/callback', auth.loginGoogleCb, otp.loginOtp);

// LDAP
router.post('/ldap', auth.loginLdap, otp.loginOtp);

//Second Factor Authentication
router.get('/setup-otp', otp.setup);
router.post('/login-otp', otp.checkTotpKey);
router.get('/login-otp', otp.checkFingerprint);

// CRUD for Metadata Payload
router.use('/public', require('./model/public'));
router.use('/private', require('./model/private'));

// DEVELOPMENT ROUTES, has to be protect later! For Management UI
router.use('/entity', require('./model/entity'));
router.use('/client', require('./model/client'));

module.exports = router;
