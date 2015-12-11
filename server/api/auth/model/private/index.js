var privateController = require('./privatepayload.controller.js');
var auth = require('../../auth.service.js');

var express = require('express');
var router = express.Router();

router.get('/', auth.isClientAuthorized, auth.isAuthenticated(), privateController.show);
router.post('/', auth.isClientAuthorized, auth.isAuthenticated(), privateController.create);
router.put('/', auth.isClientAuthorized, auth.isAuthenticated(), privateController.update);
router.delete('/', auth.isClientAuthorized, auth.isAuthenticated(), privateController.destroy);

module.exports = router;
