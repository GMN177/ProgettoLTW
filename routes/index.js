'use strict'
const express = require('express')
const pool = require('../config/database')
const router = express.Router()

router.get('/', (req, res) => {
    pool.query('SELECT DISTINCT songartist, songtitle, album, coverlink, COUNT(*) AS popularity FROM songs GROUP BY songartist, songtitle, album, coverlink ORDER BY popularity DESC LIMIT 10')
        .then(result => {
            res.render('index', {
                user: req.user,
                message: req.flash('message'),
                type: req.flash('type'),
                songs: result.rows
            })
        }).catch(err => {
            throw err
        })
})

module.exports = router