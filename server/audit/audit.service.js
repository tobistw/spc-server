'use strict';

var winston = require('winston');
var Client = require('../api/auth/model/client/client.model');
var AccessToken = require('../api/auth/model/accesstoken/accesstoken.model');
var AuthUser = require('../api/auth/model/entity/entity.model.js');

exports.logAuthenticate = function (req, res, next) {
  var logObject = {};

  Client.findOne({clientKey : req.query.apikey}, function(err, cli) {
    var clientObject = {};
    if (err != null || cli == null) {
      clientObject.name = "Unknown: " +  req.query.apikey;
      clientObject.valid = false;
    } else {
      clientObject.name = cli.name;
      clientObject.valid = true;
    }
    logObject.client = clientObject;

    AccessToken.findOne({value: req.query.access_token}, function(err, tok) {
      var userObject = {};
      if (err != null || tok == null) {
        userObject.id = "Unknown.";
        tok = { userId : "" };
      } else {
        userObject.id = tok.userId.toString();
      }

      AuthUser.findOne({_id: tok.userId}, function(err, usr) {
        if (err || usr == null) {
          userObject.authenticated = false;
        } else {
          userObject.authenticated = true;
        }
        logObject.user = userObject;
        winston.log('info', req.path, logObject);
        next();
      });

    });
  });
};

exports.logLogin = function (req, res, next) {
  var logObject = {
    email :  req.body.email
  };
  AuthUser.findOne({email : req.body.email}, function(err, usr) {
    console.log(usr);
    if (err || usr == null || !usr.authenticate(req.body.password)) {
      logObject.login = "failure";
    } else {
      logObject.login = "success";
    }

    winston.log('info', req.path, logObject);
    next();
  });
};

exports.logRegister = function (req, res, next) {
  var logObject = {
    email :  req.body.email,
    roles : req.body.roles
  };
  winston.log('info', req.path, logObject);
  next();
};
