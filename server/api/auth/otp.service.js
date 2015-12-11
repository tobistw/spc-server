/**
 * Created by tobi on 14.10.2015.
 */
var passport = require('passport');
var base32 = require('thirty-two');
var utils = require('./utils');
var TotpKey = require('./model/totpkey/totpkey.model');
var User = require('./model/entity/entity.model.js');
var url = require('url');
var auth = require('./auth.service.js');
var AccessToken = require('./model/accesstoken/accesstoken.model');
var Decoder = require('string_decoder').StringDecoder,
  decoder = new Decoder('utf-8');

exports.setup = function (req, res) {
  var urlParams = url.parse(req.url, true);
  if (!urlParams.query.userId) return res.json(404);
  var user = urlParams.query;

  var key = utils.randomKey(10);
  var encodedKey = base32.encode(key);
  var stringKey = decoder.write(encodedKey);
  // generate QR code for scanning into Google Authenticator
  // reference: https://code.google.com/p/google-authenticator/wiki/KeyUriFormat
  var otpUrl = 'otpauth://totp/' + user.email + '?secret=' + encodedKey + '&period=30';
  var qrImage = 'https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=' + encodeURIComponent(otpUrl);

  TotpKey.findOne({userId: user.userId}, function (err, totp) {
    if (err) return res.json(404, err);
    if (!totp) {
      var totpKey = new TotpKey({
        userId: urlParams.query.userId,
        key: key,
        period: 30
      });
      totpKey.save(function (err) {
        if (err) return res.json(404, err);
      });
    }
  });

  res.json(200, {user: user, qrCode: qrImage, totpkey: stringKey})
};

exports.checkFingerprint = function (req, res) {
  var urlParams = url.parse(req.url, true);
  var user = urlParams.query;

  TotpKey.findOne(
    {
      userId: user.userId,
      fingerprint: user.fingerprint
    }, {
      'fingerprint.$': 1
    },
    function (err, totp) {
      if (err) return res.json(404, err);
      if (!totp) {
        return res.json(420, {message: 'new fingerprint'});
      }

      var profile = {
        id: user.userId
      };
      var tokens = auth.returnAndSaveNewTokens(profile, res);
      user.access_token = tokens.accessToken;
      user.refresh_token = tokens.refreshToken;

      res.json(200, {
        userId: user._id,
        access_token: user.access_token,
        refresh_token: user.refresh_token,
        roles: user.roles
      });
    });
};

exports.checkTotpKey = function (req, res, next) {
  // get the user from the request
  req.user = req.body.user;

  passport.authenticate('totp', function (err, user, info) {
    var error = err || info;
    if (error) return res.json(401, error);
    if (!user) return res.json(420, {message: 'This code is not correct.'});

    var profile = {
      id: user.userId
    };
    var tokens = auth.returnAndSaveNewTokens(profile, res);
    user.access_token = tokens.accessToken;
    user.refresh_token = tokens.refreshToken;

    res.json(200, {
      userId: user._id,
      access_token: user.access_token,
      refresh_token: user.refresh_token,
      roles: user.roles
    });
  })(req, res, next)
};

exports.loginOtp = function (req, res, next) {
  var user = req.user;
  TotpKey.findOne({userId: user._id}, function (err, result) {
    if (err) return res.json(404, err);
    if (!result && user.provider === "google") {
      //todo: sensitive information: encode at least base64
      res.writeHead(302, {
        'Location': 'http://localhost:9000/google/callback?secondFactor=true&setupOtp=true' +
        '&email=' + user.email + '&_id=' + user._id + '&name=' + user.name + '&roles=' + user.roles
      });
      res.end();
    }
    else if (result && user.provider === "google") {
      //todo: sensitive information: encode at least base64
      res.writeHead(302, {
        'Location': 'http://localhost:9000/google/callback?secondFactor=true' +
        '&email=' + user.email + '&_id=' + user._id + '&name=' + user.name + '&roles=' + user.roles
      });
      res.end();
    } else if (!result) {
      res.json(
        {
          userId: user._id,
          name: user.name,
          email: user.email,
          roles: user.roles,
          secondFactor: user.secondFactor,
          setupOtp: true
        });
    } else {
      res.json(
        {
          userId: user._id,
          name: user.name,
          email: user.email,
          roles: user.roles,
          secondFactor: user.secondFactor
        });
    }
  });
};
