'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AccesstokenSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required : true
  },
  value: {
    type: String,
    required : true
  },
  active: Boolean
}, { collection: 'auth.accesstokens' });

module.exports = mongoose.model('Accesstoken', AccesstokenSchema);
