const jose = require("jose");
const firebaseCredential = require("./firebase-adminsdk.json");
require('dotenv').config();

const config = {
  username: process.env.USERNAME_QUIME,
  password: process.env.PASSWORD,
  frontend: {
    public: "../../frontend/public"
  },
  privKeyJWK: jose.JWK.generateSync("EC", "secp256k1"),
  databaseURL: process.env.DATABASE_URL,
  credential: firebaseCredential,
  collection: process.env.COLLECTION || "test-collection",
  port: process.env.PORT || 8080,
};

module.exports = {
  ...config,
}
