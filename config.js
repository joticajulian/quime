const DB_FILENAME = 'db.json'
const STATE_FILENAME = 'state.json'
const PUBLIC_ROOT = './dist'
const PRIVATE_ROOT = './'
const USERNAME = process.env.USERNAME_QUIME || 'user'
const PASSWORD = process.env.PASSWORD || 'pass'

module.exports = {
  DB_FILENAME,
  STATE_FILENAME,
  PUBLIC_ROOT,
  PRIVATE_ROOT,
  USERNAME,
  PASSWORD
}
