'use strict'
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs')
const uuidv4 = require('uuid').v4
const pool = require('./database.js')

module.exports = passport => {
    passport.use('login', new LocalStrategy({
            passReqToCallback: true
        },
        function (req, username, password, done) {
            console.log('POST /login')
            pool.query('SELECT id, email, firstname, lastname, password, picture FROM users WHERE username = $1', [username])
                .then(result => {
                    if (result.rowCount === 0) {
                        return done(null, false, req.flash('warn', "Incorrect username or password"))
                    }
                    bcrypt.compare(password, result.rows[0].password)
                        .then(valid => {
                            if (valid) {
                                return done(null, {
                                    id: result.rows[0].id,
                                    username: username,
                                    email: result.rows[0].email,
                                    firstname: result.rows[0].firstname,
                                    lastname: result.rows[0].lastname,
                                    picture: result.rows[0].picture
                                })
                            } else {
                                return done(null, false, req.flash('warn', "Incorrect username or password"))
                            }
                        })
                })
                .catch(err => done(err))
        }))

    passport.use('register', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true
        },
        function (req, username, password, done) {
            let filename = (req.file) ? req.file.filename : undefined
            let passHash = bcrypt.hashSync(password, 8)
            pool.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, req.body.email])
                .then(result => {
                    if (result.rows[0]) {
                        return done(null, false, req.flash('warn', 'Sorry, this username or email is already taken.'))
                    }
                    let uid = uuidv4()
                    pool.query('INSERT INTO users (id, username, email, firstname, lastname, password, picture) VALUES ($1, $2, $3, $4, $5, $6, $7)', [uid, username, req.body.email, req.body.firstname, req.body.lastname, passHash, filename])
                        .then(result => {
                            console.log('User [' + username + '] has registered.')
                            return done(null, {
                                id: uid,
                                username: username,
                                email: req.body.email,
                                firstname: req.body.firstname,
                                lastname: req.body.lastname,
                                picture: filename
                            })
                        })
                })
                .catch(err => done(err))
        }))

    passport.use('updatePassword', new LocalStrategy({
            usernameField: 'oldpassword',
            passwordField: 'newpassword',
            passReqToCallback: true
        },
        function (req, oldpassword, newpassword, done) {
            let newPassHash = bcrypt.hashSync(newpassword, 8)
            pool.query('SELECT password FROM users WHERE username = $1', [req.user.username])
                .then(result => {
                    bcrypt.compare(oldpassword, result.rows[0].password)
                        .then((valid) => {
                            if (valid) {
                                pool.query('UPDATE users SET password = $1 WHERE username = $2', [newPassHash, req.user.username])
                                    .then(() => {
                                        console.log('User [' + req.user.username + '] has updated their password.')
                                        return done(null, req.user, req.flash('success', 'Your password has been updated.'))
                                    })
                            } else {
                                return done(null, false, req.flash('warn', "Incorrect current password entered"))
                            }
                        })
                })
                .catch(err => done(err))
        }))

    passport.use('updateUsername', new LocalStrategy({
            usernameField: 'newusername',
            passwordField: 'newusernameconfirm',
            passReqToCallback: true
        },
        function (req, newusername, newusernameconfirm, done) {
            pool.query('SELECT id FROM users WHERE username = $1', [req.body.username])
                .then(result => {
                    if (result.rows[0]) {
                        return done(null, false, req.flash('warn', "The new username is already taken!"))
                    }
                    pool.query('UPDATE users SET username = $1 WHERE username = $2', [newusername, req.user.username])
                        .then(result => {
                            console.log('User [' + req.user.username + '] has updated their username to [' + newusername + '].')
                            return done(null, {
                                id: req.user.id,
                                username: newusername,
                                email: req.user.email,
                                firstname: req.user.firstname,
                                lastname: req.user.lastname,
                                picture: req.user.picture
                            }, req.flash('success', 'Your password has been updated.'))
                        })
                })
                .catch(err => done(err))
        }))

    passport.serializeUser((user, done) => {
        done(null, user.id)
    })

    passport.deserializeUser((id, done) => {
        pool.query('SELECT username, email, firstname, lastname, password, picture FROM users WHERE id = $1', [id])
            .then(result => result.rows[0])
            .then(user => {
                return done(null, {
                    id: id,
                    username: user.username,
                    email: user.email,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    picture: user.picture
                })
            })
    })
}