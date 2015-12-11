'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ClientSchema = new Schema({
  _id: {type: Schema.Types.ObjectId, default: function() { return new mongoose.Types.ObjectId() }},
  name: {
    type : String,
    required : true
  },
  clientKey: {
    type : String,
    required : true
  },
  clientSecret: String
}, { collection: 'auth.clients'});

module.exports = mongoose.model('Client', ClientSchema);
