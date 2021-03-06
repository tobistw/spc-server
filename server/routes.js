/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');
var cors = require('cors');

module.exports = function (app) {

  // View engine
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');

  /**
   * Enabling cross domain request to allow requests from origins outside the domain.
   */
  app.use(cors());

  // Insert routes below
  app.use('/api', require('./api'));

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*').get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function (req, res) {
      res.sendfile(app.get('appPath') + '/index.html');
    });
};
