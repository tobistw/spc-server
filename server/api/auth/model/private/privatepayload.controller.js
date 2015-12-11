/**
 * Created by tobi on 31.08.2015.
 */
'use strict';

var PrivatePayload = require('./private.model.js');


exports.show = function (req, res) {
  //Look for requested user id.
  var userId = req.params.userId || req.user.id;
  //Get the client API key
  var clientId = req.params.apiKey || req.query.apikey;
  var queryShow = queryDataForClient(userId, clientId);

  queryShow.exec(function (err, privateData) {
    if (err) {
      return handleError(res, err)
    }
    res.send(200, privateData);
  })
};

exports.create = function (req, res) {
  // Look for existing user
  var userId = req.params.userId || req.user.id;
  var clientId = req.params.apiKey || req.query.apikey;
  var data = req.body;
  var queryFindPrivateData = queryDataForClient(userId, clientId);

  if (typeof data.preferences === "undefined") {
    return res.send(400, "no preferences for Private Data")
  }

  queryFindPrivateData.exec(function (err, privateData) {
    if (err) {
      return handleError(res, err)
    }
    if (privateData) {
      console.log("privatepayload.controller.js create", "Private data already exists");
      return res.send(409, "Private data already exists");
    }

    var newData = new PrivatePayload({
      user_id: userId,
      client_id: clientId,
      preferences: data.preferences
    });
    newData.save(function (err) {
      if (err) {
        return handleError(res, err)
      }
      console.log("privatepayload.controller.js create", "new Private data created", newData);
      return res.send(201, "Private Data created \n" + newData);
    });
  });
};


exports.update = function (req, res) {
  // Look for existing user and client
  var userId = req.params.userId || req.user.id;
  var clientId = req.params.apiKey || req.query.apikey;
  var data = req.body;
  var updateField;

  var queryDataField = queryPrivateDataPreferences(userId, clientId);

  if (typeof data === "undefined") {
    return res.send(404, "no preferences for Private Data to update")
  }

  queryDataField.exec(function (err, result) {
    if (err) {
      return handleError(res, err)
    }

    if (result.length !== 0) {
      console.log('call update');
      updateField = updatePrivateData(userId, clientId, data);

      updateField.exec(function (err, updatedData) {
        if (err) {
          return handleError(res, err)
        }
        if (updatedData) {
          console.log("privatepayload.controller.js update", "Private data updated", updatedData);
          return res.send(200, "Private Data updated \n" + updatedData)
        }
      })
    }
  })
};

exports.destroy = function (req, res) {
  // Look for existing user and client
  var userId = req.params.userId || req.user.id;
  var clientId = req.params.apiKey || req.query.apikey;
  var data = req.body;

  if (typeof  data.key === "undefined" || typeof data.value === "undefined") {
    // delete all private data
    var removePrivateData = removeDataForClient(userId, clientId);
    removePrivateData.exec(function (err, privateData) {
      if (err) {
        return handleError(res, err)
      }

      console.log("privatepayload.controller.js destroy", "Private Data deleted");
      return res.send(204, "Private Data deleted \n" + privateData);
    });
  } else {
    // delete private field in preferences
    var removePrivateField = updatePrivateData(userId, clientId, data, true);
    removePrivateField.exec(function (err, result) {
      if (err) return handleError(res, err);

      console.log("privatepayload.controller.js destroy", "Private Field deleted");
      return res.send(204, "Private Data Field deleted \n" + result);
    })
  }

};

function handleError(res, err) {
  return res.send(500, err);
}

function queryDataForClient(user, client) {
  return PrivatePayload.findOne({
      user_id: user,
      client_id: client
    }
  )
}

function removeDataForClient(user, client) {
  return PrivatePayload.remove({
      user_id: user,
      client_id: client
    }
  )
}

function queryPrivateDataPreferences(user, client) {
  return PrivatePayload.find({
      user_id: user,
      client_id: client
    },
    {
      _id: 0,
      preferences: 1
    }
  )
}

function updatePrivateData(user, client, prefs, optionalDelete) {
  //var command = (optionalDelete) ? "$unset" : "$set";
  if (optionalDelete !== undefined) {
    return PrivatePayload.update({
        user_id: user,
        client_id: client,
        preferences: {
          $elemMatch: {
            key: prefs.key
          }
        }
      },
      {
        $pull: {
          "preferences": {
            key: prefs.key,
            value: prefs.value
          }
        }
      })
  } else {
    return PrivatePayload.update({
      user_id: user,
      client_id: client
    }, {
      user_id: user,
      client_id: client,
      preferences: prefs
    })
  }
}

function addFieldInPrivateData(user, client, key, value) {
  return PrivatePayload.update({
      user_id: user,
      client_id: client
    },
    {
      $addToSet: {
        preferences: {
          key: key,
          value: value
        }
      }
    })
}
