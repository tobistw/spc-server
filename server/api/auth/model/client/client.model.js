'use strict';

var KeyGenerator = require('uuid-key-generator');
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
    default: function() {return new KeyGenerator(256, KeyGenerator.BASE62).generateKey() },
    required : true
  }
}, { collection: 'auth.clients'});

/**
 * Virtuals
 */
ClientSchema
    .virtual('apikey')
    .set(function () {
      this.clientKey = this.generateApiKey(256);
    })
    .get(function () {
      return this.clientKey;
    });

ClientSchema.methods = {
  generateApiKey: function(bit) {
    return new KeyGenerator(bit, KeyGenerator.BASE62).generateKey();
  }
};

module.exports = mongoose.model('Client', ClientSchema);
