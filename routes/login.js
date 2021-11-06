'use strict'
const express = require('express')
const passport = require('passport')
const router = express.Router()

router.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/account')
    } else {
        res.render('login', {
            message: req.flash('message'),
            type: req.flash('type')
        })
    }
})

router.post('/', passport.authenticate('login', {
    successRedirect: '/account',
    failureRedirect: '/login',
    failureFlash: true
}))

module.exports = router