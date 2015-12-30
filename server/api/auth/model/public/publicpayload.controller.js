'use strict';

var PublicPayload = require('./public.model.js');

exports.show = function (req, res) {
  var userId = req.params.userId;

  PublicPayload.findById(userId, function (err, publicData) {
    if (err) {
      return handleError(res, err);
    }

    console.log("publicpayload.controller.js show", "Public data ", publicData);
    return res.json(200, publicData);
  });
};

exports.create = function (req, res) {
  // Look for existing user
  var userId = req.params.userId || req.user.id;

  PublicPayload.findById(userId, function (err, publicdata) {
    if (err) {
      return handleError(res, err);
    }
    // Create new public data for user id and save
    if (publicdata) {
      console.log("publicpayload.controller.js create", "Public data already exists");
      return res.send(409, "Public data already exists");
    }
    var value1 = req.body.fieldName1;
    var value2 = req.body.fieldName2;
    var value3 = req.body.fieldName3;
    var newData = new PublicPayload({
      _id: userId,
      fieldName1: value1,
      fieldName2: value2,
      fieldName3: value3
    });
    newData.save(function (err) {
      if (err) {
        return handleError(res, err)
      }

      console.log("publicpayload.controller.js create", "new Public data created", newData);
      return res.send(201, "Public Data created \n" + newData);
    });
  });
};

exports.update = function (req, res) {
  // Look for existing user
  var userId = req.params.userId || req.user.id;

  //Update Public data
  PublicPayload.findByIdAndUpdate(userId, req.body, function (err, data) {
    if (err) {
      return handleError(res, err);
    }
    return res.send(200, "Public Data updated \n" + data);
  });
};

exports.destroy = function (req, res) {
  var userId = req.params.userId || req.user.id;

  PublicPayload.findByIdAndRemove(userId, function (err, data) {
    if (err) {
      return handleError(res, err);
    }
    return res.send(204, "Public Data deleted \n" + data);
  })
};

function handleError(res, err) {
  return res.send(500, err);
}

var validateError = function (res, err) {
  return res.json(422, err);
};
