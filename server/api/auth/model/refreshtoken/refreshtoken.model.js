'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var RefreshtokenSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required : true
  },
  value: {
    type: String,
    required : true
  },
  active: Boolean
}, { collection: 'auth.refreshtokens' });

module.exports = mongoose.model('Refreshtoken', RefreshtokenSchema);
