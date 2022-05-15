'use strict'
const express = require('express')
const passport = require('passport')
const multer = require('multer')
const crypto = require('crypto')
const router = express.Router()

const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, process.env.IMAGE_PATH)
        },
        filename: (req, file, cb) => {
            crypto.randomBytes(16, function (err, raw) {
                cb(err, err ? undefined : raw.toString('hex') + '.jpg')
            })
        }
    })
})

router.get('/', function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect('/account')
    } else {
        res.render('register', {
            user: req.user,
            error: req.flash('error'),
            warn: req.flash('warn'),
            success: req.flash('success'),
        })
    }
})

router.post('/', upload.single('profilepicture'), passport.authenticate('register', {
    successRedirect: '/account',
    failureRedirect: '/register',
    failureFlash: true
}))

module.exports = router