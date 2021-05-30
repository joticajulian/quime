const firebase = require('firebase-admin');
require('dotenv').config();

const config = {
  username: process.env.USERNAME_QUIME,
  password: process.env.PASSWORD,
  testMode: process.env.TEST_MODE,
  frontend: {
    public: "../../packages/frontend/dist"
  },
  databaseURL: process.env.DATABASE_URL,
  credential: JSON.parse(Buffer.from(process.env.CREDENTIAL, 'base64').toString()),
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
