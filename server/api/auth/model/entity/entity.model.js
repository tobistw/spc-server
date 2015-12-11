'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');

var EntitySchema = new Schema({
  _id: {type: Schema.Types.ObjectId, default: function() { return new mongoose.Types.ObjectId() }},
  name: {
    type: String, required: true
  },
  email: {type: String, lowercase: true, required: true},
  hashedPassword: {type: String, required: true},
  provider: String,
  salt: String,
  secondFactor: Boolean,
  membership: [String],
  roles: {type: [String], required: true}
}, {collection: 'auth.entities'});

/**
 * Virtuals
 */
EntitySchema
  .virtual('password')
  .set(function (password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashedPassword = this.encryptPassword(password);
  })
  .get(function () {
    return this._password;
  });

EntitySchema
  .virtual('role')
  .set(function (role) {
    this.roles = [role];
  });

// Public profile information
EntitySchema
  .virtual('profile')
  .get(function () {
    return {
      'name': this.name,
      'role': this.role
    };
  });


/**
 * Validations
 */

// Validate empty email
EntitySchema
  .path('email')
  .validate(function (email) {
    return email.length;
  }, 'Email cannot be blank');

// Validate empty password
EntitySchema
  .path('hashedPassword')
  .validate(function (hashedPassword) {
    if (typeof hashedPassword === 'undefined') {
      return false;
    }
    return hashedPassword.length;
  }, 'Password cannot be blank');

// Validate email is not taken
EntitySchema
  .path('email')
  .validate(function (value, respond) {
    var self = this;
    this.constructor.findOne({email: value}, function (err, user) {
      if (err) throw err;
      if (user) {
        if (self.id === user.id) return respond(true);
        return respond(false);
      }
      respond(true);
    });
  }, 'The specified email address is already in use.');

var validatePresenceOf = function (value) {
  return value && value.length;
};

/**
 * Pre-save hook
 */
EntitySchema
  .pre('save', function (next) {
    if (!this.isNew) return next();

    if (!validatePresenceOf(this.hashedPassword))
      next(new Error('Invalid password'));
    else
      next();
  });

/**
 * Methods
 */
EntitySchema.methods = {
  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */
  authenticate: function (plainText) {
    return this.encryptPassword(plainText) === this.hashedPassword;
  },

  /**
   * Make salt
   *
   * @return {String}
   * @api public
   */
  makeSalt: function () {
    return crypto.randomBytes(16).toString('base64');
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */
  encryptPassword: function (password) {
    if (!password || !this.salt) return '';
    var salt = new Buffer(this.salt, 'base64');
    return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
  }
};

module.exports = mongoose.model('Entity', EntitySchema);
