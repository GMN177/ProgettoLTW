'use strict'
const express = require('express')
const {
    ensureAuthenticated
} = require('../util/index')
const router = express.Router()

router.post('/', ensureAuthenticated, (req, res) => {
    console.log('User [' + req.user.username + '] has logged out.')
    req.logout()
    res.redirect('/')
})

module.exports = router