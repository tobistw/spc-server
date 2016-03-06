'use strict';

var should = require('should');
var config = require('../config/environment/index');
var app = require('../app');
var request = require('supertest');
var Client = require('../api/auth/model/client/client.model.js');
var User = require('../api/auth/model/entity/entity.model.js');
var Public = require('../api/auth/model/public/public.model.js');
var Private = require('../api/auth/model/private/private.model.js');
var baseUrl = '/api/auth';
var adminId = '55b88f8b52039228024ead6a';
var apiKey = '59559afbdae9e1075e68fa263057653b';
var jwt = require('jsonwebtoken');
var accessToken;
var refreshToken;
var currentAccessToken;
var userAdmin = new User({
    provider: 'spe',
    _id: '55b88f8b52039228024ead6a',
    name: 'Fake Admin',
    email: 'test@admin.com',
    password: 'password',
    secondFactor: 'false',
    membership: ['crema', 'fips'],
    roles: ["guest", "user", "admin"]
});
var userTest = {
    provider: 'spe',
    name: 'Fake User',
    email: 'test@test.com',
    password: 'password',
    secondFactor: 'true',
    membership: ['crema'],
    roles: ['guest', 'user']
};
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

var clientDashboard = new Client({
    name: 'dashboard',
    clientKey: '59559afbdae9e1075e68fa263057653b'
});
var clientJava = {
    name: 'JavaTestClient',
    clientKey: 'Ub3NZVo0OEzDAh'
};

var publicPayload = {
    fieldName1: 'Public Street 1',
    fieldName2: 'BMW',
    fieldName3: 'Factory 1'
};

var privatePayload = {
    "preferences": [
        {
            "key": "color",
            "value": "red"
        },
        {
            "key": "accesslevel",
            "value": 1
        },
        {
            "key": "email",
            "value": "max.mustermann@bmw.de"
        }
    ]
};

describe('API Access Test', function () {
    before(function (done) {
        // Clear clients before testing
        Client.remove().exec().then(function () {
            // Clear Users before testing
            User.remove().exec().then(function () {
                Public.remove().exec().then(function () {
                    Private.remove().exec().then(function () {
                        userAdmin.save(function () {
                            clientDashboard.save(function () {
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    it('should respond access and refresh token for admin id', function (done) {
        request(app)
            .get(baseUrl + '/token/' + adminId + '?apikey=' + apiKey)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) return done(err);
                should.exist(res.body.access_token);
                should.exist(res.body.refresh_token);
                adminId.should.be.equal(res.body.userId);
                accessToken = res.body.access_token;
                refreshToken = res.body.refresh_token;
                done();
            });
    });
    it('should authenticate entity by checking access token', function (done) {
        request(app)
            .get(baseUrl + '/authenticate?apikey=' + apiKey + '&access_token=' + accessToken)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) return done(err);
                should.exist(res.body.id);
                should.exist(res.body.access_token);
                adminId.should.be.equal(res.body.id);
                accessToken.should.be.equal(res.body.access_token);
                done();
            });
    });
    it('should create client', function (done) {
        request(app)
            .post(baseUrl + '/client?apikey=' + apiKey + '&access_token=' + accessToken)
            .send(clientJava)
            .expect(201)
            .end(done)
    });
    it('should create test user', function (done) {
        request(app)
            .post(baseUrl + '/entity?apikey=' + apiKey + '&access_token=' + accessToken)
            .send(userTest)
            .expect(201)
            .end(done)
    });

    it('should respond with JSON array for Client Resource', function (done) {
        request(app)
            .get(baseUrl + '/client?apikey=' + apiKey + '&access_token=' + accessToken)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) return done(err);
                res.body.should.be.instanceof(Array);
                done();
            });
    });
    it('should respond with JSON array for Entity Resource', function (done) {
        request(app)
            .get(baseUrl + '/entity?apikey=' + apiKey + '&access_token=' + accessToken)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) return done(err);
                res.body.should.be.instanceof(Array);
                done();
            });
    });
    it('should create Public Payload', function (done) {
        request(app)
            .post(baseUrl + '/public?apikey=' + apiKey + '&access_token=' + accessToken)
            .send(publicPayload)
            .expect(201)
            .end(done)
    });
    it('should create Private Payload', function (done) {
        request(app)
            .post(baseUrl + '/private?apikey=' + apiKey + '&access_token=' + accessToken)
            .send(privatePayload)
            .expect(201)
            .end(done)
    });
    it('should update Public Payload', function (done) {
        publicPayload.fieldName1 = 'Update Street 1';
        request(app)
            .put(baseUrl + '/public?apikey=' + apiKey + '&access_token=' + accessToken)
            .send(publicPayload)
            .expect(200)
            .end(done)
    });
    it('should update Private Payload', function (done) {
        privatePayload.preferences.push({key: 'options', value: ['small', 'medium', 'large']});
        request(app)
            .put(baseUrl + '/private?apikey=' + apiKey + '&access_token=' + accessToken)
            .send(privatePayload.preferences)
            .expect(200)
            .end(done)
    });
    it('should update specific field Private Payload', function (done) {
        privatePayload.preferences[2].value = 'max.update@bmw.com';
        request(app)
            .put(baseUrl + '/private?apikey=' + apiKey + '&access_token=' + accessToken)
            .send(privatePayload.preferences)
            .expect(200)
            .end(done)
    });
    it('should respond Meta Data for Entity', function (done) {
        request(app)
            .get(baseUrl + '/001?apikey=' + apiKey + '&access_token=' + accessToken)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) return done(err);
                should.exist(res.body.entity);
                should.exist(res.body.publicPayload);
                should.exist(res.body.privatePayload);
                (res.body.entity._id == userAdmin._id).should.be.ok;
                res.body.entity.name.should.be.equal(userAdmin.name);
                res.body.entity.roles[2].should.be.equal(userAdmin.roles[2]);
                res.body.publicPayload.fieldName1.should.be.equal(publicPayload.fieldName1);
                res.body.publicPayload.fieldName2.should.be.equal(publicPayload.fieldName2);
                res.body.publicPayload.fieldName3.should.be.equal(publicPayload.fieldName3);
                res.body.privatePayload.preferences.should.be.instanceof(Array);
                var actualEmail = res.body.privatePayload.preferences[2].value;
                var expectedEmail = privatePayload.preferences[2].value;
                actualEmail.should.be.equal(expectedEmail);
                done();
            });
    });
    it('should delete Public Payload', function (done) {
        request(app)
            .delete(baseUrl + '/public?apikey=' + apiKey + '&access_token=' + accessToken)
            .expect(204)
            .end(done)
    });
    it('should delete Private Payload', function (done) {
        request(app)
            .delete(baseUrl + '/private?apikey=' + apiKey + '&access_token=' + accessToken)
            .expect(204)
            .end(done)
    });
    it('should respond Entity without additional Meta Data', function (done) {
        request(app)
            .get(baseUrl + '/001?apikey=' + apiKey + '&access_token=' + accessToken)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) return done(err);
                should.exist(res.body.entity);
                should.not.exist(res.body.publicPayload);
                should.not.exist(res.body.privatePayload);
                (res.body.entity._id == userAdmin._id).should.be.ok;
                done();
            });
    });
    it('should respond new access token for refresh token', function (done) {
        request(app)
            .get(baseUrl + '/token?apikey=' + apiKey + '&refresh_token=' + refreshToken)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) return done(err);
                should.exist(res.body.id);
                should.exist(res.body.access_token);
                (res.body.id == userAdmin._id).should.be.ok;
                currentAccessToken = res.body.access_token;
                currentAccessToken.should.be.equal(accessToken);
                accessToken = jwt.sign(userAdmin._id, config.secrets.session, {expiresInMinutes: 0});
                currentAccessToken.should.not.be.equal(accessToken);
                done();
            });
    });
    it('should not authenticate entity by checking expired access token', function (done) {
        request(app)
            .get(baseUrl + '/authenticate?apikey=' + apiKey + '&access_token=' + accessToken)
            .expect(401)
            .expect('Content-Type', /json/)
            .end(done)
    });
    it('should authenticate entity by checking current access token', function (done) {
        request(app)
            .get(baseUrl + '/authenticate?apikey=' + apiKey + '&access_token=' + currentAccessToken)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) return done(err);
                should.exist(res.body.id);
                should.exist(res.body.access_token);
                adminId.should.be.equal(res.body.id);
                currentAccessToken.should.be.equal(res.body.access_token);
                done();
            });
    });
    it('should delete the current access token', function (done) {
        request(app)
            .delete(baseUrl + '/token?apikey=' + apiKey + '&access_token=' + currentAccessToken)
            .expect(204)
            .end(done)
    });
});
