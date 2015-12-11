'use strict';

var express = require('express');
var controller = require('./entity.controller.js');
var config = require('../../../../config/environment');
var auth = require('../../auth.service.js');

var router = express.Router();

router.get('/',auth.isClientAuthorized, auth.hasRole('admin'), controller.index);
router.delete('/:id',auth.isClientAuthorized, auth.hasRole('admin'), controller.destroy);
router.put('/:id/password', auth.isClientAuthorized, auth.isAuthenticated(), controller.changePassword);
router.post('/', auth.isClientAuthorized, auth.hasRole('admin'), controller.create);
router.get('/:id', auth.isAuthenticated(), controller.show);

module.exports = router;
