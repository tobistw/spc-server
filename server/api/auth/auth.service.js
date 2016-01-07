'use strict';

var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../../config/environment/index');
var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');
var compose = require('composable-middleware');
var Entity = require('./model/entity/entity.model.js');
var PublicPayload = require('./model/public/public.model.js');
var PrivatePayload = require('./model/private/private.model.js');
var AccessToken = require('./model/accesstoken/accesstoken.model');
var RefreshToken = require('./model/refreshtoken/refreshtoken.model');
var validateJwt = expressJwt({secret: config.secrets.session});


/**
 * user login via passport local strategy.
 */
exports.login = function (req, res, next) {

  console.log("server auth.service.js login", req.body);

  if (!req.body.password) {
    // validation for password is broken otherwise
    var answer = {
      "message": "Validation failed",
      "name": "ValidationError",
      "errors": {
        "hashedPassword": {
          "message": "Path `password` is required.",
          "name": "ValidatorError",
          "path": "password",
          "type": "required"
        }
      }
    };
    return res.json(422, answer);
  }

  passport.authenticate('local', function (err, user, info) {
    var error = err || info;
    if (error) return res.json(401, error);
    if (!user) return res.json(404, {message: 'Something went wrong, please try again.'});

    // check for two-factor authentication
    if (user.secondFactor) {
      req.user = user;
      next();
      return;
    }

    var profile = {
      id: user._id
    };
    var tokens = exports.returnAndSaveNewTokens(profile, res);
    user.access_token = tokens.accessToken;
    user.refresh_token = tokens.refreshToken;


    res.json({
      userId: user._id,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      roles: user.roles
    });
  })(req, res, next);
};

/**
 * Login with Google OAuth 2.0
 */

exports.loginGoogle = function (req, res) {
  passport.authenticate('google', {scope: ['https://www.googleapis.com/auth/userinfo.email']},
    function (req, res) {
    })(req, res)
};

exports.loginGoogleCb = function (req, res, next) {

  passport.authenticate('google', function (err, user, info) {
    var error = err || info;
    if (error) return res.json(401, error);
    if (!user) return res.json(404, {message: 'Something went wrong, please try again.'});

    // check for two-factor authentication
    if (user.secondFactor) {
      req.user = user;
      next();
      return;
    }

    console.log('Success Google User logged in', 'User: ' + user);

    var profile = {
      id: user._id
    };
    var tokens = exports.returnAndSaveNewTokens(profile, res);
    user.access_token = tokens.accessToken;
    user.refresh_token = tokens.refreshToken;

    res.writeHead(302, {
      'Location': process.env.GOOGLE_CALLBACK_CLIENT + '?access_token=' + user.access_token +
      "&refresh_token=" + user.refresh_token
    });
    res.end();
  })(req, res, next);
};

/**
 * Login with LDAP Account
 */
exports.loginLdap = function (req, res, next) {
  console.log("server auth.service.js login", req.body);

  passport.authenticate('ldapauth', function (err, user, info) {
    var error = err || info;
    if (error) return res.json(401, error);
    if (!user) return res.json(404, {message: 'Something went wrong, please try again.'});

    console.log('success, ldap user logged in: ', user);

    // check for two-factor authentication
    if (user.secondFactor) {
      req.user = user;
      next();
      return;
    }

    var profile = {
      id: user._id
    };
    var tokens = exports.returnAndSaveNewTokens(profile, res);
    user.access_token = tokens.accessToken;
    user.refresh_token = tokens.refreshToken;


    res.json({
      userId: user._id,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      roles: user.roles
    });

  })(req, res, next);
};

/**
 * register a new user
 */
exports.register = function (req, res) {

  console.log("server auth.service.js register", req.body);

  if (!req.body.password) {
    // validation for password is broken otherwise
    var answer = {
      "message": "Validation failed",
      "name": "ValidationError",
      "errors": {
        "hashedPassword": {
          "message": "Path `password` is required.",
          "name": "ValidatorError",
          "path": "password",
          "type": "required"
        }
      }
    }
    return res.json(422, answer);
  }


  var newUser = new Entity(req.body);
  newUser.save(function (err, user) {

    console.log("server auth.service.js register", "new entity created", user);

    if (err) {
      console.log("server auth.service.js register", "error", err);
      return res.json(422, err);
    }

    var token = exports.signAccessToken(user._id);

    AccessToken.create({userId: user._id, value: token}, function (err, accessToken) {
      if (err)  return res.json(404, err);
    });

    res.json({userId: user._id, access_token: token, roles: user.roles});
  });

};

exports.validateAccessJwt = function (req, res, next) {
  // Validate jwt
  // check for Access Token
  if (req.query && req.query.hasOwnProperty('access_token')) {
    req.headers.authorization = 'Bearer ' + req.query.access_token;
  }
  validateJwt(req, res, next);
};

/**
 * If the validation of the access token fails, the client may able to use
 * the refres h token to obtain a new access token.
 * @param err
 * @param req
 * @param res
 * @param next
 */
exports.errorHandlingAccessJwt = function (err, req, res, next) {
  // check for refresh token
  if (err) {
    if (req.query && req.query.hasOwnProperty('refresh_token')) {
      var token = req.query.refresh_token;
      RefreshToken.findOne({value: token}, function (err, result) {
        if (err) return res.json(404, err);
        if (!result) {
          return res.status(401).send('no refresh token found.');
        }
        // finds and renew access tokens for this entity
        var profile = {
          id: result.userId
        };
        var accessToken = exports.signAccessToken(profile);
        console.log("new access token created: ", accessToken);
        AccessToken.findOne({userId: profile.id}, function (err, result) {
          if (err) return res.json(404, err);
          if (!result) {
            return res.json(404, err);
          }
          result.value = accessToken;
          result.save(function (err) {
            if (err) return handleError(res, err);
            req.query.access_token = accessToken;
            next();
          });
        });
      })
    } else {
      res.status(401).send('invalid access token or no refresh token');
    }
  } else {
    next();
  }
};

/**
 * return current access token by checking the refresh token.
 * If the access token is expired a new token will be created.
 */
exports.getToken = function () {
  return compose()
    .use(function (req, res, next) {
      if (req.query && req.query.hasOwnProperty('refresh_token')) {
        var token = req.query.refresh_token;
        // check for existing Access Token in DB
        RefreshToken.findOne({value: token}, function (err, result) {
          if (err) {
            return handleError(err, res);
          } else {
            console.log("server auth.service.js getToken", "refresh_token found", result);
            req.userId = result.userId;
            next();
          }
        })
      } else {
        return res.json(401, {meassage: 'no valid refresh token found'});
      }
    })
    .use(function (req, res, next) {
      AccessToken.findOne({userId: req.userId}, function (err, result) {
        if (err) {
          return handleError(err, res);
        }
        if (!result) {
          return res.json(401, {meassage: 'no access token found for id'});
        }
          console.log("server auth.service.js getToken", "access_token found", result);
          req.access_token = result.value;
          next();
      })
    })
    .use(function (req, res, next) {
      var currentToken = req.access_token;
      var profile = {
        id: req.userId
      };
      jwt.verify(currentToken, config.secrets.session, function (err, decoded) {
        if (err && err.message == 'jwt expired') {
          console.log("current access token is not valid ", err.message);
          var accessToken = exports.signAccessToken(profile);
          // finds access tokens for this entity
          AccessToken.findOne({userId: profile.id}, function (err, result) {
            if (err) handleError(res, err);
            if (!result) {
              return res.json(401, {meassage: 'no access token found for id'});
            } else {
              result.value = accessToken;
              result.save();
            }
          });
          console.log("new access token created: ", accessToken);
          res.json(200, {id: profile.id, access_token: accessToken});
        } else if (!err) {
          console.log("current access token is valid: ", currentToken);
          return res.json(200, {id: profile.id, access_token: currentToken});
        } else {
          handleError(res, err);
        }
      });
    })
};

/**
 * use to login client applications on the behalf of an entity.
 * returns new access token and refresh token.
 * @param req
 * @param res
 */
exports.getTokensForId = function (req, res) {
  var id = req.url.length > 4 ? req.url[4] : null;
  if (req.params.id) {
    id = req.params.id;
  }

  if (id) {
    Entity.findById( id , function(err, entity) {
      if (err) { return handleError(res, err); }
      if (!entity) {
        return res.json(401, {message: 'no entity found for this id'});
      }
      var profile = {
        id: entity._id
      };
      var tokens = exports.returnAndSaveNewTokens(profile, res);

      res.json({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        userId: entity._id,
        roles: entity.roles
      });
    })
  } else {
    res.status(401).send('Unauthorized Request');
  }
};
/**
 * authenticate if a user is logged in by checking access tokens
 */
exports.authenticate = function (req, res) {
  // check for existing Access Token in DB
  var token = req.query.access_token;
  AccessToken.findOne({value: token}, function (err, result) {
    if (err || !result) {
      return res.json(401, {message: 'could not authenticate entity.'});
    } else {
      console.log("server auth.service.js authenticate1", "access_token found", result);
      res.json(200, {id: result.userId, access_token: token})
    }
  })
};

/**
 * authenticate if a user is member of a project
 */
exports.isAuthenticatedForProject = function (member) {
  return compose()
    .use(function (req, res, next) {
      var token = req.query.access_token;
      AccessToken.findOne({value: token}, function (err, result) {
        if (err || !result) {
          return res.json(401, {message: 'could not authenticate entity.'});
        } else {
          console.log("server auth.service.js authenticate1", "access_token found", result);
          req.user_id = result.userId;
          next();
        }
      })
    })
    .use(function (req, res, next) {
      // find Entity for Project
      var queryEntityForProject = Entity.find({
        "_id": req.user_id,
        "membership": member
      });
      queryEntityForProject.exec(function (err, entity) {
        if (err) {
          return handleError(res, err);
        }
        if (entity.length === 0) {
          return res.json(401, {message: 'Entity not registered for Project'});
        }
        console.log("server auth.service.js authenticate2", "find Project Entity", entity);
        req.entity = entity[0];
        next();
      });
    });
};

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
exports.isAuthenticated = function () {
  return compose()
  // Validate jwt
    .use(function (req, res, next) {
      exports.validateAccessJwt(req, res, next);
    })
    .use(function (err, req, res, next) {
      exports.errorHandlingAccessJwt(err, req, res, next);
    })
    .use(function (req, res, next) {
      var token = req.query.access_token;
      AccessToken.findOne({value: token}, function (err, result) {
        if (err || !result) {
          return res.json(401, {message: 'could not authenticate entity.'});
        } else {
          console.log("server auth.service.js authenticate1", "access_token found", result);
          req.user_id = result.userId;
          next();
        }
      })
    })
    // Attach user to request
    .use(function (req, res, next) {
      Entity.findById(req.user_id, function (err, user) {
        if (err) return next(err);
        if (!user) return res.send(401);

        req.user = user;
        next()
      });
    });
};

/**
 * checks if an api call is actually allowed by testing the api key
 */
exports.isClientAuthorized = function (req, res, next) {
  passport.authenticate('localapikey', function (err, client, info) {
    var error = err || info;
    if (error) return res.json(403, error);
    if (!client) return res.json(403, {message: 'API call not authorized.'});
    next();
  })(req, res, next);
};

/**
 * Checks if the user role meets the minimum requirements of the route
 */
exports.hasRole = function (roleRequired) {
  if (!roleRequired) throw new Error('Required role needs to be set');

  return compose()
    .use(exports.isAuthenticated())
    .use(function meetsRequirements(req, res, next) {
      asyncIsAdmin(req.user.roles, roleRequired, function(err, result) {
        if (err) res.send(403);

        if (result === true) {
          next();
        }
      });
    });
};

function asyncIsAdmin(roles, roleRequired, callback) {
  var isAdmin = false;
  roles.forEach(function(role) {
    if (config.userRoles.indexOf(role) >= config.userRoles.indexOf(roleRequired)) {
      isAdmin = true;
    }
  });
  if (isAdmin) {
    callback(null, isAdmin);
  } else {
    callback(new Error("No admin role found"), isAdmin);
  }
}

/**
 * Returns a jwt token AccessToken signed by the app secret
 */
exports.signAccessToken = function (profile) {
  return jwt.sign(profile, config.secrets.session, {expiresIn: 15 * 60});
};
/**
 * Returns a jwt token RefreshToken signed by the app secret
 */
exports.signRefreshToken = function (profile) {
  return jwt.sign(profile, config.secrets.session, {expiresIn: 24 * 60 * 335});
};
/**
 * Return and Save AccessToken and Refresh Token
 */
exports.returnAndSaveNewTokens = function (profile, res) {
  var accessToken = exports.signAccessToken(profile);
  var refreshToken = exports.signRefreshToken(profile);
  var tokens = {
    accessToken: accessToken,
    refreshToken: refreshToken
  };

  // finds access tokens for this entity
  AccessToken.findOne({userId: profile.id}, function (err, result) {
    if (err) return handleError(err, res);
    if (!result) {
      AccessToken.create({userId: profile.id, value: accessToken}, function (err, accessToken) {
        if (err)  return handleError(err, res);
      });
    } else {
      result.value = accessToken;
      result.save();
    }
  });
  // finds refresh token for this entity
  RefreshToken.findOne({userId: profile.id}, function (err, result) {
    if (err) return handleError(err, res);
    if (!result) {
      RefreshToken.create({userId: profile.id, value: refreshToken}, function (err, refreshToken) {
        if (err)  return handleError(err, res);
      });
    } else {
      result.value = refreshToken;
      result.save();
    }
  });

  return tokens;
};

///**
// * Set token cookie directly for oAuth strategies
// */
//exports.setTokenCookie = function (req, res) {
//  if (!req.user) return res.json(404, {message: 'Something went wrong, please try again.'});
//  var token = signToken(req.user._id, req.user.role);
//  res.cookie('token', JSON.stringify(token));
//  res.redirect('/');
//};

function handleError(res, err) {
  if (typeof err === 'undefined') {
    return res.status(401).send('Unauthorized Request');
  } else {
    return res.status(500).send('Internal Server Error');
  }
}
