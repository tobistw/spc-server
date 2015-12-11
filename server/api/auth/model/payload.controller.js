/**
 * Created by tobi on 13.11.2015.
 */
var Entity = require('./entity/entity.model.js');
var PublicPayload = require('./public/public.model.js');
var PrivatePayload = require('./private/private.model.js');

exports.getPayload = function (req, res, next) {

  var entity = req.entity;
  var publicData = {};
  var privateData = {};

  PublicPayload.findById(req.user_id, function (err, publicPayload) {
    if (err) {
      return handleError(res, err);
    }
    if (!publicPayload || publicPayload.length === 0) {
      console.log("server payload.controller ", "no Public Payload found");
    }
    console.log("server payload.controller ", "Public Payload ", publicPayload);
    publicData = publicPayload;

    var queryPrivatePayloadForClient = PrivatePayload.find({
      user_id: req.user.id,
      client_id: req.query.apikey
    }, {
      _id: 0,
      preferences: 1
    });
    queryPrivatePayloadForClient.exec(function (err, privatePayload) {
      if (err) {
        return handleError(res, err);
      }
      if (!privatePayload ||privatePayload.length === 0) {
        console.log("server payload.controller ", "no Private Payload found");
        console.log("server payload.controller ", "Private Payload ", privatePayload);
        privateData = null;
      } else {
        console.log("server payload.controller ", "Private Payload ", privatePayload);
        privateData = privatePayload[0];
      }

      return res.json(200, {
        entity: {_id: entity._id, name: entity.name, roles: entity.roles},
        publicPayload: publicData,
        privatePayload: privateData
      });
    })
  })
};

function handleError(res, err) {
  return res.status(500).send(err);
}
