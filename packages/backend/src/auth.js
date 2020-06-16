const jose = require("jose");
const config = require("./config");
const { BadRequestError, UnauthorizedError, InvalidTokenError } = require("./errors");

class Auth {

static getToken(req) {
  const token = req.get("authorization");
  if (token) return token.replace("Bearer ", "");
  return null;
}

static generateToken() {
  const token = jose.JWT.sign({aud: "api"}, config.privKeyJWK);
  return {token};
}

static validCredential(username, password) {
  console.log("!!!!!".repeat(50));
  return username === config.username && password === config.password;
}

static handleToken(req, res, next) {
  const token = getToken(req);

  if (!token) {
    // No token in the headers. Continue the call as unauthenticated user
    next(new UnauthorizedError("No token present in the headers"));
    return;
  }

  let payload;
  try {
    payload = jose.JWT.verify(token, config.privKeyJWK);
  } catch (error) {
    next(new InvalidTokenError(error.message));
    return;
  }

  req.authenticated = true;
  next();
}

static login(req, res, next) {
  const { username, password } = req.body;
  if(Auth.validCredential(username, password)) {
    const token = Auth.generateToken();
    res.send(token);
  } else {
    next(new BadRequestError("Invalid username or password"));
  }
}

}

module.exports = Auth;
