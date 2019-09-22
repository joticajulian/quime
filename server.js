const fs = require('fs')
const util = require('util')
const express = require('express')
const cookieSession = require('cookie-session')
const bodyParser = require('body-parser')
const passport = require('passport')
const uuidv1 = require('uuidv1')
require('dotenv').config()

const config = require('./config')
const Accounts = require('./accounts')
const DBmodule = require('./database')

const writeFile = util.promisify(fs.writeFile)
const readdir = util.promisify(fs.readdir)

var db = []
var state = {}
var database = DBmodule.Database()

const now = ()=>{ return new Date().toISOString().slice(0,-5) }
const log = (text)=>{ console.log(now() + ' - ' + text) }

const app = express()
const LocalStrategy = require('passport-local').Strategy
const port = process.env.PORT || 3000

app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin','*')
  res.header('Access-Control-Allow-Headers','X-Requested-With, Content-type,Accept,X-Access-Token,X-Key')
  res.header('Access-Control-Allow-Origin', '*')
  next()
})

app.use(express.static(config.PUBLIC_ROOT))
app.use(bodyParser.json())
app.use(cookieSession({
  name: 'mysession',
  keys: ['randomkey'],
  maxAge: 24*60*60*1000 //24 hours
}))
app.use(passport.initialize())
app.use(passport.session())

app.get('/', (req, res, next) => {
  res.sendFile('index.html', {root: config.PUBLIC_ROOT})
})

app.post('/api/login', (req, res, next)=>{
  log('Trying to Login')
  passport.authenticate('local', (err, user, info)=>{
    if(err) return next(err)
    if(!user) return res.status(400).send([user, 'Cannot log in', info])
    req.login(user, (err)=>{ res.send('Logged in') })
  })(req, res, next)
})

app.get('/api/logout', (req, res)=>{
  req.logout()
  log('logout')
  return res.send()
})

const authMiddleware = async (req, res, next) => {
  return next()
  if(!req.isAuthenticated()){
    log('Not authenticated')
    res.status(401).send('You are not authenticated')
  }else{
    return next()
  }
}

app.post('/api/update', authMiddleware, (req, res, next)=>{
  log('Trying to Update')
  var record = req.body.record
  var id = req.body.record.id
  database.removeRecord(id)
  database.insertRecord(record, id)
  database.recalculateBalances(0)
  database.save('db')
  res.send('updated')
  log('updated')
})

app.post('/api/insert', authMiddleware, (req, res, next)=>{
  log('Trying to add')
  var record = req.body.record
  record.id = uuidv1()
  database.insertRecord(record)
  database.recalculateBalances(0)
  save('db')
  res.send('inserted')
  log('inserted')
})

app.post('/api/remove', authMiddleware, (req, res, next)=>{
  log('Trying to remove')
  var id = req.body.id
  database.removeRecord(id)
  database.recalculateBalances(0)
  database.save('db')
  res.send('removed')
  log('removed')
})

app.get('/db.json', authMiddleware, (req, res, next)=>{
  log('db.json request')
  res.sendFile('db.json', {root: config.PRIVATE_ROOT})
})

app.get('/state.json', authMiddleware, (req, res, next)=>{
  log('state.json request')
  res.sendFile('state.json', {root: config.PRIVATE_ROOT})
})

app.get('/api/accounts', authMiddleware, (req, res, next)=>{
  res.send(Accounts.ACCOUNTS)
})

passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'    
  },
  (username, password, done) => {
    (()=>{
      var user = {username, password}
      if(username === config.USERNAME && password === config.PASSWORD)
         done(null, user)
      else
         done(null, false, {message: 'Incorrect username or password'})
    })()
  }
))

passport.serializeUser((user, done) => {
  done(null, user.username)
})

passport.deserializeUser((username, done) => {
  if(username === config.USERNAME){
    done(null, {username: config.USERNAME, password: config.PASSWORD})
  }else{
    console.log('Error user')
    done(null, null)
  }
})

app.listen(port, () => {
  console.log("Server quime listening on port "+port)
})

