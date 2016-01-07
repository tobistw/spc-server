/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var User = require('../api/auth/model/entity/entity.model');
var Client = require('../api/auth/model/client/client.model');
var PublicPayload = require('../api/auth/model/public/public.model');
var PrivatePayload = require('../api/auth/model/private/private.model');

Client.find({}).remove(function () {
   Client.create({
       name: 'dashboard',
       clientKey: '59559afbdae9e1075e68fa263057653b'
   }, {
       name: 'JavaTestClient',
       clientKey: 'Ub3NZVo0OEzDAh'
   })
}, function () {
    console.log('finished populating clients');
});

PublicPayload.find({}).remove(function () {
   PublicPayload.create({
       _id: '55b88f8b52039228024ead6a',
       fieldName1: 'Public Street 1',
       fieldName2: 'BMW',
       fieldName3: 'Factory 1'
   })
});

PrivatePayload.find({}).remove(function () {
    PrivatePayload.create({
        user_id: '55b88f8b52039228024ead6a',
        client_id: '59559afbdae9e1075e68fa263057653b',
        "preferences" :
            [
                {
                    "key" : "color",
                    "value" : "red"
                },
                {
                    "key" : "accesslevel",
                    "value" : 1
                },
                {
                    "key" : "email",
                    "value" : "max.mustermann@bmw.de"
                }
            ]
    })
}, function () {
    console.log('finished populating payload');
});

User.find({}).remove(function () {
    User.create({
            provider: 'spc',
            _id: '55b88f8b52039228024ead6a',
            name: 'Fake Admin',
            email: 'test@admin.com',
            password: 'password',
            secondFactor: 'false',
            membership: ['crema', 'fips'],
            roles: ['guest', 'user', 'admin']
        }, {
            provider: 'spc',
            name: 'Fake User',
            email: 'test@test.com',
            password: 'password',
            secondFactor: 'true',
            membership: ['crema'],
            roles: ['guest', 'user']
        },
        {
            provider: 'google',
            name: 'Fake Google',
            email: 'spc.ascora@gmail.com',
            password: 'password',
            secondFactor: 'false',
            membership: ['crema'],
            roles: ['guest', 'user']
        },
        {
            provider: 'ldap',
            name: 'riemann',
            email: 'riemann@ldap.forumsys.com',
            password: 'password',
            secondFactor: 'false',
            membership: ['crema'],
            roles: ['guest', 'user']
        },
        {
            provider: 'spc',
            _id: '5655760828e5262c1e483bca',
            name: 'JavaUser',
            email: 'test@java.com',
            password: 'password',
            secondFactor: 'false',
            membership: ['crema'],
            roles: ['guest', 'user']
        }, function () {
            console.log('finished populating users');
        }
    );
});
