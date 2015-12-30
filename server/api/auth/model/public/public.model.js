/**
 * Created by tobi on 17.08.2015.
 */
'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var PublicPayloadSchema = new Schema({
  _id: {type: Schema.Types.ObjectId, required: true},
  fieldName1: String,
  fieldName2: String,
  fieldName3: String
}, {collection: 'auth.publicpayload'});

module.exports = mongoose.model('PublicPayload', PublicPayloadSchema);
