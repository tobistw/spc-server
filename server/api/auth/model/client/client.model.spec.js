/**
 * Created by tobi on 02.12.2015.
 */
'use strict';

var should = require('should');
var app = require('../../../../app');
var Client = require('./client.model.js');


var clientDashboard = new Client ({
  name: 'dashboard',
  clientKey: '59559afbdae9e1075e68fa263057653b'
});
var clientJava = new Client ({
  name: 'JavaTestClient',
  clientKey: 'Ub3NZVo0OEzDAh'
});

describe('Client Model', function() {
  before(function(done) {
    // Clear clients before testing
    Client.remove().exec().then(function() {
      done();
    });
  });

  afterEach(function(done) {
    Client.remove().exec().then(function() {
      done();
    });
  });

  it('should begin with no clients', function(done) {
    Client.find({}, function(err, clients) {
      clients.should.have.length(0);
      done();
    });
  });
  it('should fail when saving a duplicate client', function(done) {
    clientDashboard.save(function() {
      var clientDup = new Client(clientDashboard);
      clientDup.save(function(err) {
        should.exist(err);
        done();
      });
    });
  });
  it('should save the java client', function(done) {
    clientJava.save(function(err) {
      should.not.exist(err);
      done();
    })
  });
});
