require('dotenv').config()
//dependencies
const express = require('express')
const fetch = require('node-fetch')
const multer = require('multer')
const {
    Pool
} = require('pg')
const utils = require('./utils.js')

//express router
const router = express.Router()

//connection to postgres pool
const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
})

//image upload options
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, process.env.IMAGE_PATH)
    },
    filename: function (req, file, cb) {
        if (req.user) cb(null, req.user.replace(/\W/g, '') + '.png')
        else cb(null, req.body.email.replace(/\W/g, '') + '.png')
    }
})

//image upload middleware
var upload = multer({
    storage: storage
})

//array containing currently logged in users
var authTokens = {};

//auth middleware
router.use((req, res, next) => {
    const authToken = req.cookies['AuthToken']
    req.user = authTokens[authToken]
    next()
})

//get home page
router.get('/', (req, res) => {
    console.log('getHome')
    pool.query('SELECT DISTINCT songartist, songtitle, album, coverlink, COUNT(*) AS popularity FROM songs GROUP BY songartist, songtitle, album, coverlink ORDER BY popularity DESC LIMIT 10')
        .then(result => {
            res.render('index', {
                message: req.flash('message'),
                type: req.flash('type'),
                songs: result.rows
            })
        }).catch(err => console.log(err.message))
})

//alternative get home page
router.get('/index', (req, res) => res.redirect('/'))

//get registration page
router.get('/register', (req, res) => res.render('register', {
    message: req.flash('message'),
    type: req.flash('type')
}))

//get login page
router.get('/login', (req, res) => res.render('login', {
    message: req.flash('message'),
    type: req.flash('type')
}))

//get song page
router.get('/song', (req, res) => {
    var song = req.query.song
    console.log("Get song", song)
    var redir = utils.pathExtractor(req).substring(7)
    var artist = song.split(' - ')[1]
    var title = song.split(' - ')[0]
    //if the query is malformed
    if (!artist || !title) {
        req.flash('message', 'Artist or Title missing. Select a song from the search list')
        req.flash('type', 'alert-warning')
        res.redirect(redir)
        return
    }
    pool.query('SELECT DISTINCT songartist, songtitle, lyrics, coverlink FROM songs')
        .then(result => {
            var found = false
            result.rows.forEach(row => {
                //searches songs chached in database
                if (!found && row.songartist === artist && row.songtitle === title && row.lyrics !== null) {
                    res.render('song', {
                        message: req.flash('message'),
                        type: req.flash('type'),
                        songdisplay: title + " By " + artist,
                        songtitle: title,
                        songartist: artist,
                        songlyrics: row.lyrics.replace(/[\r\n]+/g, '<br />'),
                        coverlink: row.coverlink
                    })
                    found = true
                }
            })
            if (!found) {
                //calls API if song is not found in the database
                fetch('https://api.lyrics.ovh/v1/' + artist + '/' + title)
                    .then(result => result.json())
                    .then(json => {
                        res.render('song', {
                            message: req.flash('message'),
                            type: req.flash('type'),
                            songdisplay: title + " By " + artist,
                            songtitle: title,
                            songartist: artist,
                            songlyrics: json.lyrics.replace(/[\r\n]+/g, '<br />'),
                            coverlink: undefined
                        })
                    }).catch(err => {
                        console.log(err)
                        req.flash('message', 'Song not found')
                        req.flash('type', 'alert-danger')
                        res.redirect('/')
                    })
            }
        }).catch(err => {
            console.log(err)
            req.flash('message', 'Something went wrong')
            req.flash('type', 'alert-danger')
            res.redirect('/')
        })
})

//gets lyrics page for a random song
router.get('/randomSong', (req, res) => {
    console.log("Get random song")
    pool.query('SELECT DISTINCT songartist, songtitle FROM songs')
        .then(result => {
            var index = Math.floor(Math.random() * (result.rowCount - 1))
            res.redirect('/song?song=' + result.rows[index].songtitle.trim() + ' - ' + result.rows[index].songartist.trim())
        }).catch(err => console.log(err.message))
})

//get account page info
router.get('/account', (req, res) => {
    console.log('getAccount')
    if (typeof req.user === 'undefined') return res.redirect('/login')
    var email = req.user
    pool.query('SELECT username, firstname, lastname, picture FROM users WHERE email = $1', [email])
        .then(result => {
            var username = result.rows[0].username
            var firstname = result.rows[0].firstname
            var lastname = result.rows[0].lastname
            var picture = result.rows[0].picture
            pool.query('SELECT DISTINCT songartist, songtitle, album, coverlink FROM songs WHERE email = $1', [email])
                .then(result => {
                    var songs = result.rows
                    res.render('account', {
                        message: req.flash('message'),
                        type: req.flash('type'),
                        username: username,
                        email: email,
                        firstname: firstname,
                        lastname: lastname,
                        songs: songs,
                        count: result.rowCount,
                        profPicture: (picture) ? 'img/userPictures/' + picture : 'img/stockProfile.jpg'
                    })
                })
        }).catch(err => {
            console.log(err.message)
            res.send(err.message)
        })
})

//get user
router.get('/getUser', (req, res) => {
    var redir = utils.pathExtractor(req).substring(7)
    var email = req.query.email
    console.log('Searching user:', email)
    pool.query('SELECT username, firstname, lastname, picture FROM users WHERE email = $1', [email])
        .then(result => {
            if (result.rowCount === 0) {
                req.flash('message', 'User not found')
                req.flash('type', 'alert-warning')
                res.redirect(redir)
                return
            }
            var username = result.rows[0].username
            var firstname = result.rows[0].firstname
            var lastname = result.rows[0].lastname
            var picture = result.rows[0].picture
            pool.query('SELECT DISTINCT songartist, songtitle, album, coverlink FROM songs WHERE email = $1', [email])
                .then(result => {
                    var songs = result.rows
                    res.render('accountOther', {
                        message: req.flash('message'),
                        type: req.flash('type'),
                        username: username,
                        email: email,
                        firstname: firstname,
                        lastname: lastname,
                        songs: songs,
                        count: result.rowCount,
                        profPicture: (picture) ? 'img/userPictures/' + picture : 'img/stockProfile.jpg'
                    })
                })
        }).catch(err => {
            console.log(err)
            req.flash('message', 'Server Error')
            req.flash('type', 'alert-danger')
            res.redirect(redir)
        })
})

//register a new user
router.post('/register', upload.single('profilepicture'), (req, res) => {
    console.log('createUser')
    var filename = (req.file) ? req.file.filename : undefined
    const password = utils.getHashedPassword(req.body.password);
    //checks if the passwords match
    if (password !== utils.getHashedPassword(req.body.confirmPassword)) {
        req.flash('message', 'The passwords do not match!')
        req.flash('type', 'alert-warning')
        res.redirect('/register')
    }
    pool.query('INSERT INTO users (email, username, firstname, lastname, password, picture) VALUES ($1, $2, $3, $4, $5, $6) RETURNING email', [req.body.email, req.body.username, req.body.firstname, req.body.lastname, password, filename])
        .then(() => {
            req.flash('message', 'Registration successfull, login to access your account!')
            req.flash('type', 'alert-success')
            res.redirect('/login')
        }).catch(err => {
            console.log(err)
            req.flash('message', 'Server Error')
            req.flash('type', 'alert-danger')
            res.redirect('/register')
        })
})

//login a user
router.post('/login', (req, res) => {
    console.log('loginUser')
    pool.query('SELECT email FROM users WHERE email = $1', [req.body.email])
        .then(result => {
            if (result.rowCount === 0) {
                req.flash('message', 'User not registered')
                req.flash('type', 'alert-warning')
                res.redirect('/login')
            } else checkPassword(req.body.email, utils.getHashedPassword(req.body.password), req, res)
        }).catch(err => {
            console.log(err)
            req.flash('message', 'Server Error')
            req.flash('type', 'alert-danger')
            res.redirect('/login')
        })
})

//login helper function
function checkPassword(email, password, req, res) {
    pool.query('SELECT email FROM users WHERE email = $1 AND password= $2', [email, password])
        .then(result => {
            if (result.rowCount === 0) {
                req.flash('message', 'Wrong Password')
                req.flash('type', 'alert-warning')
                res.redirect('/login')
            } else {
                const authToken = utils.generateAuthToken()
                authTokens[authToken] = result.rows[0].email
                res.cookie('AuthToken', authToken)
                req.flash('message', 'Login Successful')
                req.flash('type', 'alert-success')
                res.redirect('/')
            }
        }).catch(err => {
            console.log(err)
            req.flash('message', 'Server Error')
            req.flash('type', 'alert-danger')
            res.redirect('/login')
        })
}

//change profile picture
router.post('/picture', upload.single('profilepicture'), (req, res) => {
    console.log('updatePicture')
    pool.query('UPDATE users SET picture = $1 WHERE email = $2', [req.file.filename, req.user])
        .then(result => {
            req.flash('message', 'Profile picture changed!')
            req.flash('type', 'alert-success')
            res.redirect('/account')
        }).catch(err => {
            console.log(err)
            req.flash('message', 'Server Error')
            req.flash('type', 'alert-danger')
            res.redirect('/account')
        })
})

//change user password
router.post('/changePassword', (req, res) => {
    console.log('updatePassword')
    if (req.body.newpassword !== req.body.newpasswordconfirm) {
        req.flash('message', 'The passwords do not match!')
        req.flash('type', 'alert-warning')
        res.redirect('/account')
        return
    }
    pool.query('SELECT password FROM users WHERE email = $1', [req.user])
        .then(result => {
            if (result.rows[0].password === utils.getHashedPassword(req.body.oldpassword)) {
                pool.query('UPDATE users SET password = $1 WHERE email = $2 RETURNING email', [utils.getHashedPassword(req.body.newpassword), req.user])
                    .then(() => {
                        req.flash('message', 'Password changed!')
                        req.flash('type', 'alert-success')
                        res.redirect('/account')
                    })
            } else {
                req.flash('message', 'Old password incorrect!')
                req.flash('type', 'alert-warning')
                res.redirect('/account')
            }
        }).catch(err => {
            console.log(err)
            req.flash('message', 'Server Error')
            req.flash('type', 'alert-danger')
            res.redirect('/account')
        })
})

//change user username
router.post('/changeUsername', (req, res) => {
    console.log('updateUsername')
    pool.query('UPDATE users SET username = $1 WHERE email = $2', [req.body.newusername, req.user])
        .then(result => {
            req.flash('message', 'Username changed!')
            req.flash('type', 'alert-success')
            res.redirect('/account')
        }).catch(err => {
            console.log(err)
            req.flash('message', 'Server Error')
            req.flash('type', 'alert-danger')
            res.redirect('/account')
        })
})

//logout a user
router.post('/logout', (req, res) => {
    console.log('logoutUser')
    delete authTokens[req.cookies['AuthToken']]
    res.clearCookie('AuthToken')
    console.log('user logged out')
    res.redirect('/')
})

//delete a user
router.post('/delete', (req, res) => {
    console.log('deleteUser')
    pool.query('DELETE FROM users WHERE email = $1 AND password = $2', [req.body.email, utils.getHashedPassword(req.body.password)])
        .then(result => {
            res.clearCookie('AuthToken')
            req.flash('message', 'User deletd')
            req.flash('type', 'alert-success')
            res.redirect('/')
        }).catch(err => {
            console.log(err)
            req.flash('message', 'Server Error')
            req.flash('type', 'alert-danger')
            res.redirect('/account')
        })
})

//add song to account
router.post('/addSong', (req, res) => {
    console.log('addSongtoUser')
    var title = req.body.title
    var artist = req.body.artist
    //if the query is malformed
    if (!artist || !title) {
        req.flash('message', 'Something went wrong')
        req.flash('type', 'alert-danger')
        res.redirect('/song?song=' + result.rows[index].songtitle.trim() + ' - ' + result.rows[index].songartist.trim())
        return
    }
    fetch('https://api.lyrics.ovh/suggest/' + req.body.title + ' - ' + req.body.artist)
        .then(result => result.json())
        .then(result => {
            pool.query('INSERT INTO songs (email, songartist, songtitle, album, coverlink, artistpicture, lyrics) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [req.user, req.body.artist.trim(), req.body.title.trim(), result.data[0].album.title, result.data[0].album.cover_medium, result.data[0].artist.picture_medium, req.body.lyrics.trim()])
                .then(res.sendStatus(200)).catch(err => {
                    if (err.code === '23505') res.sendStatus(400)
                    else res.sendStatus(500)
                })
        }).catch(err => {
            console.log(err)
            res.status(500).send(err.message)
        })
})

//remove song from account
router.post('/remove', (req, res) => {
    var song = req.query.song
    console.log('Deleting:', song)
    var artist = song.split(' - ')[1]
    var title = song.split(' - ')[0]
    pool.query('DELETE FROM songs WHERE songartist = $1 AND songtitle = $2 AND email = $3', [artist, title, req.user])
        .then(result => {
            req.flash('message', 'Song deleted from your account')
            req.flash('type', 'alert-success')
            res.redirect('/account')
        }).catch(err => {
            console.log(err)
            req.flash('message', 'Server Error')
            req.flash('type', 'alert-danger')
            res.redirect('/account')
        })
})

module.exports = router