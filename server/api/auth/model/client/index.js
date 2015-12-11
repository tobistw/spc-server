'use strict';

var express = require('express');
var controller = require('./client.controller.js');
var auth = require('../../auth.service.js');

var router = express.Router();

router.get('/', auth.isClientAuthorized, auth.hasRole('admin'), controller.index);
router.get('/:id', auth.isClientAuthorized, auth.hasRole('admin'), controller.show);
router.post('/', auth.isClientAuthorized, auth.hasRole('admin'), controller.create);
router.put('/:id',auth.isClientAuthorized, auth.hasRole('admin'), controller.update);
router.patch('/:id', auth.isClientAuthorized, auth.hasRole('admin'), controller.update);
router.delete('/:id', auth.isClientAuthorized, auth.hasRole('admin'), controller.destroy);

module.exports = router;
