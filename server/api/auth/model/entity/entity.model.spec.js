'use strict';

var should = require('should');
var app = require('../../../../app');
var User = require('./entity.model.js');

var userAdmin = new User({
  provider: 'spc',
  _id: '55b88f8b52039228024ead6a',
  name: 'Fake Admin',
  email: 'test@admin.com',
  password: 'password',
  secondFactor: 'false',
  membership: ['crema', 'fips'],
  roles: ['guest', 'user', 'admin']
});
var userTest = new User({
  provider: 'spc',
  name: 'Fake User',
  email: 'test@test.com',
  password: 'password',
  secondFactor: 'true',
  membership: ['crema'],
  roles: ['guest', 'user']
});
var userGoogle = new User({
  provider: 'google',
  name: 'Fake Google',
  email: 'spc.ascora@gmail.com',
  password: 'password',
  secondFactor: 'false',
  membership: ['crema'],
  roles: ['guest', 'user']
});
var userLdap = new User({
  provider: 'ldap',
  name: 'riemann',
  email: 'riemann@ldap.forumsys.com',
  password: 'password',
  secondFactor: 'false',
  membership: ['crema'],
  roles: ['guest', 'user']
});
var userJava = new User({
  provider: 'spc',
  _id: '5655760828e5262c1e483bca',
  name: 'JavaUser',
  email: 'test@java.com',
  password: 'password',
  secondFactor: 'false',
  membership: ['crema'],
  roles: ['guest', 'user']
});

describe('Entity Model', function() {
  before(function(done) {
    // Clear users before testing
    User.remove().exec().then(function() {
      done();
    });
  });

  afterEach(function(done) {
    User.remove().exec().then(function() {
      done();
    });
  });

  it('should begin with no users', function(done) {
    User.find({}, function(err, users) {
      users.should.have.length(0);
      done();
    });
  });
  it('should fail when saving a duplicate entity', function(done) {
    userTest.save(function() {
      var userDup = new User(userTest);
      userDup.save(function(err) {
        should.exist(err);
        done();
      });
    });
  });
  it('should save the test admin', function(done) {
    var user = new User(userAdmin);
    user.save(function(err) {
      should.not.exist(err);
      done();
    })
  });
  it('should save the test ldap user', function(done) {
    var user = new User(userLdap);
    user.save(function(err) {
      should.not.exist(err);
      done();
    })
  });
  it('should save the test google user', function(done) {
    var user = new User(userGoogle);
    user.save(function(err) {
      should.not.exist(err);
      done();
    })
  });
  it('should save the test java user', function(done) {
    var user = new User(userJava);
    user.save(function(err) {
      should.not.exist(err);
      done();
    })
  });

  it('should fail when saving without an email', function(done) {
    userTest.email = '';
    userTest.save(function(err) {
      should.exist(err);
      done();
    });
  });

  it("should authenticate entity if password is valid", function() {
    return userTest.authenticate('password').should.be.true;
  });

  it("should not authenticate entity if password is invalid", function() {
    return userTest.authenticate('blah').should.not.be.true;
  });
});
