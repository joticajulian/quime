const { SignJWT } = require('jose/jwt/sign');
const { jwtVerify } = require('jose/jwt/verify');
const { generateKeyPair } = require('jose/util/generate_key_pair')
const config = require("./config");
const { BadRequestError, UnauthorizedError, InvalidTokenError } = require("./errors");

let privateKey = null;

class Auth {

  static getToken(req) {
    const token = req.get("authorization");
    if (token) return token.replace("Bearer ", "");
    return null;
  }

  static async generateToken() {
    if(!privateKey) privateKey = (await generateKeyPair('ES256')).privateKey;

    const token = await new SignJWT({ user: "quime" })
      .setProtectedHeader({ alg: 'ES256' })
      .setIssuedAt()
      .setIssuer("quime")
      .setAudience("quime")
      //.setExpirationTime('2h')
      .sign(privateKey)
    return { token };
  }

  static validCredential(username, password) {
    return username === config.username && password === config.password;
  }

  static async handleToken(req, res, next) {
    if (config.testMode) {
      next();
      return;
    }

    const token = Auth.getToken(req);

    if (!token) {
      // No token in the headers. Continue the call as unauthenticated user
      next(new UnauthorizedError("No token present in the headers"));
      return;
    }

    try {
      await jwtVerify(token, privateKey, {
        issuer: "quime",
        audience: "quime",
      });
    } catch (error) {
      next(new InvalidTokenError(error.message));
      return;
    }

    req.authenticated = true;
    next();
  }

  static async login(req, res, next) {
    const { username, password } = req.body;
    if (Auth.validCredential(username, password)) {
      const token = await Auth.generateToken();
      res.send(token);
    } else {
      next(new BadRequestError("Invalid username or password"));
    }
  }

}

module.exports = Auth;
