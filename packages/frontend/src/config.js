var SERVER = 'http://localhost:3000/'
var SERVER_API = 'http://localhost:3000/api/'

if(process.env.NODE_ENV === "production"){
  var SERVER = '/'
  var SERVER_API = '/api/'
}

export default{
  SERVER,
  SERVER_API
}
