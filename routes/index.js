'use strict'
const express = require('express')
const pool = require('../config/database')
const router = express.Router()

router.get('/', (req, res, next) => {
    pool.query('SELECT DISTINCT songartist, songtitle, album, coverlink, COUNT(*) AS popularity FROM songs GROUP BY songartist, songtitle, album, coverlink ORDER BY popularity DESC LIMIT 10')
        .then(result => {
            res.render('index', {
                user: req.user,
                error: req.flash('error'),
                warn: req.flash('warn'),
                success: req.flash('success'),
                songs: result.rows
            })
        }).catch(e => next(e))
})

module.exports = router