'use strict'
const express = require('express')
const passport = require('passport')
const multer = require('multer')
const crypto = require('crypto')
const pool = require('../config/database')
const {
    ensureAuthenticated
} = require('../util/index')
const router = express.Router()

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, process.env.IMAGE_PATH)
        },
        filename: (req, file, cb) => {
            crypto.randomBytes(16, function (err, raw) {
                cb(err, err ? undefined : raw.toString('hex') + '.jpg')
            })
        }
    })
})

router.get('/', ensureAuthenticated, (req, res) => {
    pool.query('SELECT DISTINCT songartist, songtitle, album, coverlink FROM usersongs JOIN songs ON songs.id = usersongs.songid WHERE usersongs.userid = $1', [req.user.id])
        .then(result => result.rows)
        .then(songs => {
            res.render('account', {
                user: req.user,
                error: req.flash('error'),
                warn: req.flash('warn'),
                success: req.flash('success'),
                username: req.user.username,
                email: req.user.email,
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                songs: songs,
                count: songs.length,
                profPicture: (req.user.picture) ? '/img/userPictures/' + req.user.picture : '/img/stockProfile.jpg'
            })
        })
        .catch(e => next(e))
})

router.get('/other', (req, res, next) => {
    pool.query('SELECT id, email, firstname, lastname, picture FROM users WHERE username = $1', [req.query.username])
        .then(result => result.rows)
        .then(users => {
            if (users.length === 0) {
                req.flash('warn', 'User not found')
                res.redirect(req.header('Referer') || '/')
                return
            }
            pool.query('SELECT DISTINCT songartist, songtitle, album, coverlink FROM usersongs JOIN songs ON songs.id = usersongs.songid WHERE usersongs.userid = $1', [users[0].id])
                .then(result => result.rows)
                .then(songs => {
                    res.render('accountOther', {
                        user: req.user,
                        error: req.flash('error'),
                        warn: req.flash('warn'),
                        success: req.flash('success'),
                        username: req.query.username,
                        email: users[0].email,
                        firstname: users[0].firstname,
                        lastname: users[0].lastname,
                        songs: songs,
                        count: songs.length,
                        profPicture: (users[0].picture) ? '/img/userPictures/' + users[0].picture : '/img/stockProfile.jpg'
                    })
                })
        })
        .catch(e => next(e))
})

router.post('/changePassword', ensureAuthenticated, (req, res, next) => {
    if (req.body.newpassword != req.body.newpasswordconfirm) {
        req.flash('warn', 'Your password and password confirmation must match.')
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
        req.flash('warn', 'Your username and username confirmation must match.')
        res.redirect('/account')
    } else {
        next()
    }
}, passport.authenticate('updateUsername', {
    successRedirect: '/account',
    failureRedirect: '/account',
    failureFlash: true
}))

router.post('/changePicture', ensureAuthenticated, upload.single('profilepicture'), (req, res, next) => {
    pool.query('UPDATE users SET picture = $1 WHERE username = $2', [req.file.filename, req.user.username])
        .then(result => {
            req.flash('success', 'Profile picture changed!')
            res.redirect('/account')
        })
        .catch(e => next(e))
})

router.post('/delete', ensureAuthenticated, (req, res, next) => {
    pool.query('DELETE FROM users WHERE username = $1', [req.user.username])
        .then(result => {
            console.log('User [' + req.user.username + '] has been deleted.')
            req.logout()
            req.flash('success', 'User deleted')
            res.redirect('/')
        })
        .catch(e => next(e))
})

module.exports = router