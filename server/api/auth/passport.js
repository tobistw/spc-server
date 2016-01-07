'use strict';

var passport = require('passport');
var config = require('../../config/environment');
var LocalStrategy = require('passport-local').Strategy;
var LocalAPIKeyStrategy = require('passport-localapikey').Strategy;
var TotpStrategy = require('passport-totp').Strategy;
var User = require('./model/entity/entity.model');
var Client = require('./model/client/client.model');
var Totp = require('./model/totpkey/totpkey.model');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var LdapStrategy = require('passport-ldapauth').Strategy;


exports.setup = function () {

    passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password' // this is the virtual field on the model
        },
        function (email, password, done) {
            User.findOne({
                email: email.toLowerCase(),
                provider: 'spc'
            }, function (err, user) {
                if (err) return done(err);

                if (!user) {
                    return done(null, false, {message: 'This email is not registered.'});
                }
                if (!user.authenticate(password)) {
                    return done(null, false, {message: 'This password is not correct.'});
                }
                return done(null, user);
            });
        }
    ));

    passport.use(new LocalAPIKeyStrategy(
        function (apikey, done) {
            Client.findOne({clientKey: apikey}, function (err, client) {
                if (err) {
                    return done(err);
                }
                if (!client) {
                    return done(null, false);
                }
                return done(null, client);
            });
        }
    ));

    passport.use(new TotpStrategy(
        function (user, done) {
            Totp.findOne({userId: user.userId}, function (err, totp) {
                if (err) return done(null, false, {message: 'This code is not correct.'});

                if (!totp) return done(null, false, {message: 'You are not allowed to log in.'});

                return done(null, totp.key, totp.period);
            });
        }
    ));

    // Use the GoogleStrategy within Passport.
    // Strategies in Passport require a `verify` function, which accept
    // credentials (in this case, an accessToken, refreshToken, and Google
    // profile), and invoke a callback with a user object.
    passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_ID,
            clientSecret: process.env.GOOGLE_SECRET,
            callbackURL: "http://localhost:9000/api/auth/google/callback"
        },
        function (accessToken, refreshToken, profile, done) {
            var emailAdresses = profile.emails[0].value;
            User.findOne({email: emailAdresses, provider: 'google'}, function (err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    return done(null, false, {message: 'This email is not registered.'});
                }

                return done(null, user);
            });
        }
    ));

    var getLDAPConfiguration = function (req, callback) {
        // Fetching things from database or whatever
        process.nextTick(function () {
            var opts = config.ldapServer;

            callback(null, opts);
        });
    };

    passport.use(new LdapStrategy(getLDAPConfiguration, function (user, done) {
            if (!user) {
                return done(null, false, {message: 'This email is not registered.'});
            }
            User.findOne({email: user.mail, provider: 'ldap'}, function (err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    return done(null, false, {message: 'This email is not registered.'});
                }

                return done(null, user);
            });
        }
    ));
};
