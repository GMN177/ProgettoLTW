//dependencies
const express = require('express')
const path = require("path")
const cookieParser = require('cookie-parser')
const engine = require('ejs')
const flash = require('connect-flash')
const session = require('express-session')
const logger = require('morgan')
const pg = require('pg')
const cors = require('cors')
const passport = require('passport')
const favicon = require('serve-favicon')

require('./config/passport')(passport)
const routes = require('./routes.js')
const account_routes = require('./routes/account')
const index_routes = require('./routes/index')
const login_routes = require('./routes/login')
const logout_routes = require('./routes/logout')
const song_routes = require('./routes/song')
const register_routes = require('./routes/register')

//express app
const app = express()

//ejs template engine configuration
app.engine('html', engine.__express)
app.set('views', path.join(__dirname, 'public'))
app.set('view engine', 'html')

//logger
app.use(logger('tiny'))

//url parser
app.use(express.urlencoded({
    extended: false
}))

//json parser
app.use(express.json())

//cookie parser
app.use(cookieParser())

//cross origin requests
app.use(cors())

//flash middleware
app.use(flash())

//session middleware
app.use(session({
    store: new(require('connect-pg-simple')(session))({
        pool: new pg.Pool({
            user: process.env.PG_USER,
            host: process.env.PG_HOST,
            database: process.env.PG_DATABASE,
            password: process.env.PG_PASSWORD,
            port: process.env.PG_PORT,
        }),
        createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}))

app.use(passport.initialize())
app.use(passport.session())

app.use(favicon(__dirname + '/public/img/favicon.ico'))

//static file server for public folder
app.use(express.static(path.join(__dirname, './public'), {
    'index': false
}))

//all routes
app.use('/account', account_routes)
app.use('/', index_routes)
app.use('/index', index_routes)
app.use('/login', login_routes)
app.use('/logout', logout_routes)
app.use('/song', song_routes)
app.use('/register', register_routes)

//if all else fails 404 status
app.use((req, res, next) => {
    var err = new Error('Not Found')
    err.status = 404
    next(err)
})

if (app.get('env') === 'development') {
    app.use((err, req, res, next) => {
        res.status(err.status || 500)
        res.render('error', {
            user: req.user,
            message: err.message,
            error: err
        })
    })
} else {
    app.use((err, req, res, next) => {
        res.status(err.status || 500)
        res.render('error', {
            message: err.message,
            error: {}
        })
    })
}

module.exports = app