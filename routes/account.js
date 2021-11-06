'use strict'
const express = require('express')
const passport = require('passport')
const multer = require('multer')
const pool = require('../config/database')
const {
    ensureAuthenticated
} = require('../util/index')
const router = express.Router()

var upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, process.env.IMAGE_PATH)
        },
        filename: function (req, file, cb) {
            if (req.user) cb(null, req.user.username.replace(/\W/g, '') + '.png')
            else cb(null, req.body.username.replace(/\W/g, '') + '.png')
        }
    })
})

router.get('/', ensureAuthenticated, (req, res) => {
    pool.query('SELECT username, firstname, lastname, picture FROM users WHERE username = $1', [req.user.username])
        .then(result => {
            var email = result.rows[0].email
            var firstname = result.rows[0].firstname
            var lastname = result.rows[0].lastname
            var picture = result.rows[0].picture
            pool.query('SELECT DISTINCT songartist, songtitle, album, coverlink FROM songs WHERE username = $1', [req.user.username])
                .then(result => {
                    var songs = result.rows
                    res.render('account', {
                        message: req.flash('message'),
                        type: req.flash('type'),
                        username: req.user.username,
                        email: email,
                        firstname: firstname,
                        lastname: lastname,
                        songs: songs,
                        count: result.rowCount,
                        profPicture: (picture) ? '/img/userPictures/' + picture : '/img/stockProfile.jpg'
                    })
                })
        })
        .catch(err => {
            throw err
        })
})

router.get('/other', (req, res) => {
    pool.query('SELECT email, firstname, lastname, picture FROM users WHERE username = $1', [req.query.username])
        .then(result => {
            if (result.rows[0] === null) {
                req.flash('message', 'User not found')
                req.flash('type', 'alert-warning')
                res.redirect(req.header('Referer') || '/')
                return
            }
            var email = result.rows[0].email
            var firstname = result.rows[0].firstname
            var lastname = result.rows[0].lastname
            var picture = result.rows[0].picture
            pool.query('SELECT DISTINCT songartist, songtitle, album, coverlink FROM songs WHERE username = $1', [req.query.username])
                .then(result => {
                    var songs = result.rows
                    res.render('accountOther', {
                        message: req.flash('message'),
                        type: req.flash('type'),
                        username: req.query.username,
                        email: email,
                        firstname: firstname,
                        lastname: lastname,
                        songs: songs,
                        count: result.rowCount,
                        profPicture: (picture) ? '/img/userPictures/' + picture : '/img/stockProfile.jpg'
                    })
                })
        })
        .catch(err => {
            throw err
        })
})

router.post('/changePassword', ensureAuthenticated, (req, res, next) => {
    if (req.body.newpassword != req.body.newpasswordconfirm) {
        req.flash('message', 'Your password and password confirmation must match.')
        res.redirect('/account')
    } else {
        next()
    }
}, passport.authenticate('updatePassword', {
    successRedirect: '/account',
    failureRedirect: '/account',
    failureFlash: true
}))

router.post('/changeUsername', ensureAuthenticated, (req, res, next) => {
    if (req.body.newusername != req.body.newusernameconfirm) {
        req.flash('message', 'Your username and username confirmation must match.')
        res.redirect('/account')
    } else {
        next()
    }
}, passport.authenticate('updateUsername', {
    successRedirect: '/account',
    failureRedirect: '/account',
    failureFlash: true
}))
/*
router.post('/changeUsername', ensureAuthenticated, (req, res) => {
    pool.query('SELECT id FROM users WHERE username = $1', [req.body.username])
        .then(result => {
            if (result.rows[0]) {
                req.flash('message', 'Sorry, the new username is already taken.')
                req.flash('type', 'alert-success')
                res.redirect('/account')
            }
            pool.query('UPDATE users SET username = $1 WHERE username = $2', [req.body.newusername, req.user.username])
                .then(result => {
                    req.flash('message', 'Username changed!')
                    req.flash('type', 'alert-success')
                    res.redirect('/account')
                })
        })
        .catch(err => {
            throw err
        })
})*/

router.post('/changePicture', ensureAuthenticated, upload.single('profilepicture'), (req, res) => {
    pool.query('UPDATE users SET picture = $1 WHERE username = $2', [req.file.filename, req.user.username])
        .then(result => {
            req.flash('message', 'Profile picture changed!')
            req.flash('type', 'alert-success')
            res.redirect('/account')
        })
        .catch(err => {
            throw err
        })
})

router.post('/delete', ensureAuthenticated, (req, res) => {
    pool.query('DELETE FROM users WHERE username = $1', [req.user.username])
        .then(result => {
            console.log('User [' + req.user.username + '] has been deleted.')
            req.logout()
            req.flash('message', 'User deleted')
            req.flash('type', 'alert-success')
            res.redirect('/')
        })
        .catch(err => {
            throw err
        })
})

module.exports = router