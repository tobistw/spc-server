/**
 * Created by tobi on 31.08.2015.
 */
'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var PrivatePayloadSchema = new Schema({
  user_id: String,
  client_id: String,
  preferences: [Schema(
    {key: Schema.Types.Mixed, value: Schema.Types.Mixed}, {_id: false})
  ]
}, {collection: 'auth.privatepayload'});

PrivatePayloadSchema.index({ key: 1, value: 1 });

module.exports = mongoose.model('PrivatePayload', PrivatePayloadSchema);
