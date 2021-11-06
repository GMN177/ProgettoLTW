'use strict'
const express = require('express')
const passport = require('passport')
const multer = require('multer')
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

router.get('/', function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect('/account')
    } else {
        res.render('register', {
            message: req.flash('message'),
            type: req.flash('type')
        })
    }
})

router.post('/', upload.single('profilepicture'), passport.authenticate('register', {
    successRedirect: '/account',
    failureRedirect: '/register',
    failureFlash: true
}))

module.exports = router