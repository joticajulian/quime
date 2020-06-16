const jose = require("jose");
const firebaseCredential = require("./firebase-adminsdk.json");

const config = {
  username: process.env.USERNAME_QUIME,
  password: process.env.PASSWORD,
  frontend: {
    public: "../../frontend/public"
  },
  privKeyJWK: jose.JWK.generateSync("EC", "secp256k1"),
  databaseURL: "https://quime-fb825.firebaseio.com",
  credential: firebaseCredential,
  collection: "test-collection",
};

module.exports = {
  ...config,
}
