var publicController = require('./publicpayload.controller.js');
var auth = require('../../auth.service.js');

var express = require('express');
var router = express.Router();

router.get('/', auth.isClientAuthorized, auth.isAuthenticated(), publicController.show);
router.post('/', auth.isClientAuthorized, auth.isAuthenticated(), publicController.create);
router.put('/', auth.isClientAuthorized, auth.isAuthenticated(), publicController.update);
router.delete('/', auth.isClientAuthorized, auth.isAuthenticated(), publicController.destroy);

module.exports = router;
