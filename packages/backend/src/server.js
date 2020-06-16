#!/usr/bin/env node

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
require('dotenv').config()

const config = require('./config')
const apiRecords = require('./records/router')
const apiAccounts = require("./accounts/router");
const Auth = require("./auth");
const errors = require("./errors")
const logger = require("./logger");

class App {
  constructor() {
    this.httpServer = express()

    this.httpServer.use("*", cors());
    this.httpServer.use(bodyParser.json());

    this.httpServer.use((req, res, next) => {
      logger.info(`${req.method} ${req.url}`);
      next();
    });

    this.httpServer.use(express.static(config.frontend.public))

    this.httpServer.get('/', (req, res, next) => {
      res.sendFile('index.html', {root: config.frontend.public})
    })

    this.httpServer.post("/login", Auth.login);

    this.httpServer.use('/api/records', Auth.handleToken, apiRecords);
    this.httpServer.use('/api/accounts', Auth.handleToken, apiAccounts);

    this.httpServer.use((req, res, next) => {
      next(
        new errors.BadRequestError(`Invalid service '${req.method} ${req.url}'`)
      );
    });

    this.httpServer.use(errors.handler);
  }

  start(port) {
    return this.httpServer.listen(port, () => {
      logger.info(`Quime API started at port ${port}`);
    });
  }
}

module.exports = App;
