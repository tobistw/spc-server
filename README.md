# SPC-SERVER - Security and Privacy Component

The SPC-SERVER secures REST API, handles authentication (also 2FA) and is optimized for distributed web-systems.
This project is an application based on [Angular Fullstack](https://github.com/angular-fullstack/generator-angular-fullstack)
Usually other web components provides a Login UI, like the [SPC-WEB-CLIENT](https://github.com/tobistw/spc-web-client) 
for authenticating users. The Server based on [PassportJS](http://passportjs.org/) and makes use of different authentication strategies:

* Username / Password 
* Google Sign-In
* LDAP Login
* Second Factor with TOTP

Once the setup configurations has been made, a user is able to login with a second factor (TOTP - Google Authenticator).
After successfully logging in with their credentials, the web client (SPC-WEB-CLIENT) will store an access token (in the web browser within a cookie).
For further access this token wil be transmitted with the requests. Components use this token to authenticate and 
authorise the user by calling the SPC’s Security API. For this the components have to transmit an API Key for every call
to the SPC. The response contains the logged in status of the user and also data associated with the user. This data is comprised of two parts:

* Public data that all components may access, containing a unique ID, and data like the user’s name
* Private data, which is data only visible in the context of the calling component

There is also another component written in JAVA, the [SPC-JAVA-CLIENT](https://github.com/tobistw/spc-java-client) for communicating with the SPC-SERVER. 

## Getting Started

To get you started you can simply clone the SPC-SERVER repository install [node][node] and the dependencies:

### Prerequisites

MongoDB - Download and Install [MongoDB](https://www.mongodb.org/downloads#production) -  
you'll need mongoDB to be installed and have the mongod process running.

You need git to clone the spc-server repository. You can get git from
[http://git-scm.com/](http://git-scm.com/).

There are also a number of node.js tools to initialize and test SPC-SERVER. You must have node.js and
its package manager (npm) installed.  You can get them from [http://nodejs.org/](http://nodejs.org/).
The Build Framework [Grunt](http://gruntjs.com/) manages the initialization and testing of the app.
```
npm install -g grunt-cli
```

### Clone SPC-SERVER

Clone the spc-server repository using [git][git]:

```
git clone https://github.com/tobistw/spc-server.git
cd spc-server
```

If you just want to start a new project without the SPC-SERVER commit history then you can do:

```bash
git clone --depth=1 https://github.com/tobistw/spc-server.git <your-project-name>
```

The `depth=1` tells git to only pull down one commit worth of historical data.

### Install Dependencies

Install the dependecies with via `npm`, the [node package manager][npm].

```
npm install
```

* `node_modules` - contains the npm packages for the tools

### Configuring for SPC-SERVER
There is a config directory including following files:

* `environment` - this directory contains general options and specific options for development, production and test environment
* `audit` - options for logging tool winston
* `express` - configuration for express framework and possible options for the environment.
* `local.env.sample` - use this file to define local environment variables and to put secrets (Google Secret etc). Should not be version controlled.
* `seed` - for populating the DB with sample data. 

#### First Step
Rename the `local.env.sample` to `local.env` and define the values for your environment. If you want to use the Google Login 
you must have a Google Account for accessing the [Google Developers Console](https://console.developers.google.com/) and creating a new project.
Furthermore you have to set the callback url for the client. You also define your project name and id in this file.

#### Second Step
The `index` file in the environment directory defines an 'all' config object of default properties that will be included in all environments.
These default properties are used by among other things like in the `express` file. Set the seedDB value to `true` for populating the DB.
If you running a LDAP-Server you have to define the `ldapServer` object. There is already a configuration for an example LDAP Server.

#### Third Step
There a different files for each environment, i. e. development to define specific configuration. In the ´./server/app.js´ file 
the first line `process.env.NODE_ENV = process.env.NODE_ENV || 'development';` tells the app which environment it is in.

#### Fourth Step
If you like to enable two factor authentication for the user you have to set the value for `secondFactor` to `true`. 
Simply use the `seed` file to configure the users option.

### Running SPC-SERVER
You can run the app simply by typing `grunt serve` in the console. There are also other tasks like `grunt test` that will 
run the unit tests.

## Testing
There is an API Access Test including a number of unit tests.

### Running Unit Tests
The easiest way to run the unit tests is to use the grunt task:
```
grunt test
```

## Extending the SPC-SERVER
Note that this application is only a prototype and should not be used in productive environment. There are still some 
missing functionalities and security issues, see the 'TODO' section.

### Adding new Projects
Creating a new project means adding a new endpoint in your project. Open the directory `./server/api/` and you will recognize 
two folders the `auth` folder for managing general authentication and the `crema` folder, this is an example project. 
The easiest way is to copy and paste the `index` file and create a new directory naming it with your project. Dont forget to 
update the project name environment variable in `auth.isAuthenticatedForProject(process.env.PROJECT_NAME_YOUR_PROJECT)`.
After this add a new endpoint in the `./server/api/index` file, i. e. 
`router.use('/auth/' + process.env.PROJECT_YOUR_ID, require('./project/index'));`

### New Authentication Strategies
If you like to have more authentication methods like login with OpenID you have to edit following files:

* `./server/api/auth/auth.service` - define a new function using a passport strategy
* `./server/api/auth/passport` - define your passport configuration
* `./server/api/auth/index` - add a new endpoint with the new authentication strategy


## Security requirements in productive environment
#### Ensuring Endpoint Authenticity

* Prevent man-in-the-middle attacks
* Use of TLS
* Client must validate server´s TLS certificate

#### Encrypting Identity Information
* Use of JSON Web Token (ID Token) with public/private Keypair

#### Cross Site Request Forgery (XSRF)
* State Parameter in the response for the Client
* Hash of the session cookie or random value that the client can verify


## TODO
* asymmetric encryption of tokens
* storing sensitive information (public and private payload) in an ID-Token (JWT)
* OpenID Strategy
* [FIDO](https://fidoalliance.org) - Ready (new Strategy for Passport)
* Management UI - managing tokens, clients and users