'use strict';

var Entity = require('./entity.model.js');
var config = require('../../../../config/environment');
var jwt = require('jsonwebtoken');
var AccessToken = require('../accesstoken/accesstoken.model.js');
var Auth = require('../../auth.service');

var validationError = function(res, err) {
  return res.json(422, err);
};

/**
 * Get list of users / entities
 * restriction: 'admin'
 */
exports.index = function(req, res) {
  Entity.find({}, '-salt -hashedPassword', function (err, entities) {
    if(err) return res.send(500, err);
    res.json(200, entities);
  });
};

/**
 * Creates a new user / entity
 */
exports.create = function (req, res, next) {

  console.log("server entity.controller.create", req.body);

  var newEntity = new Entity(req.body);
  newEntity.save(function(err, entity) {
    console.log("server entity.controller.js", "new entity created", entity);
    if (err) return validationError(res, err);

    var profile = {
      id: entity._id
    };
    var tokens = Auth.returnAndSaveNewTokens(profile, res);
    entity.access_token = tokens.accessToken;
    entity.refresh_token = tokens.refreshToken;

    res.json(201, {
      access_token: entity.access_token,
      refresh_token: entity.refresh_token,
      entityId: entity._id,
      roles: entity.roles });
  });
};

/**
 * Get a single user / entity
 */
exports.show = function (req, res, next) {
  var entityId = req.params.id;

  Entity.findById(entityId, function (err, entity) {
    if (err) return next(err);
    if (!entity) return res.send(401);
    res.json(entity.profile);
  });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {
  Entity.findByIdAndRemove(req.params.id, function(err, entity) {
    if(err) return res.send(500, err);
    return res.send(204);
  });
};

/**
 * Change a users password
 */
exports.changePassword = function(req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  Entity.findById(userId, function (err, user) {
    if(user.authenticate(oldPass)) {
      user.password = newPass;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.send(200);
      });
    } else {
      res.send(403);
    }
  });
};

///**
// * Authentication callback
// */
//exports.authCallback = function(req, res, next) {
//  res.redirect('/');
//};
