//dependencies
const express = require('express')
const path = require("path")
const cookieParser = require('cookie-parser')
const engine = require('ejs')
const flash = require('connect-flash')
const session = require('express-session')
const routes = require('./routes.js')

//express app
var app = express()

//ejs template engine configuration
app.engine('html', engine.__express)
app.set('views', path.join(__dirname, 'public'))
app.set('view engine', 'html')

//url parser
app.use(express.urlencoded({
    extended: false
}))

//cookie parser
app.use(cookieParser())

//session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}))

//json parser
app.use(express.json())

//flash middleware
app.use(flash())

//static file server for public folder
app.use(express.static(path.join(__dirname, './public'), {
    'index': false
}))

//all routes
app.use(routes)

//if all else fails 404 status
app.all('*', (req, res) => {
    res.status(404).send('Resource not found')
})

//listening for connections
app.listen(process.env.SERVER_PORT, function() {
    console.log('Server listening on port: ' + process.env.SERVER_PORT)
})