const jose = require("jose");
const firebase = require('firebase-admin');
const firebaseCredential = require("./firebase-adminsdk.json");
require('dotenv').config();

const config = {
  username: process.env.USERNAME_QUIME,
  password: process.env.PASSWORD,
  testMode: process.env.TEST_MODE,
  frontend: {
    public: "../../frontend/public"
  },
  privKeyJWK: jose.JWK.generateSync("EC", "secp256k1"),
  databaseURL: process.env.DATABASE_URL,
  credential: firebaseCredential,
  collection: process.env.COLLECTION || "test-collection",
  port: process.env.PORT || 8080,
};

firebase.initializeApp({
  credential: firebase.credential.cert(config.credential),
  databaseURL: config.databaseURL,
});

module.exports = {
  ...config,
}
