/**
 * Created by tobi on 14.10.2015.
 */
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');

var TotpkeySchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  key: String,
  period: Number,
  fingerprint: [String]
}, {collection: 'auth.totpkey'});

module.exports = mongoose.model('Totpkey', TotpkeySchema);
