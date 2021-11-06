'use strict'
const express = require('express')
const fetch = require('node-fetch')
const pool = require('../config/database')
const {
    ensureAuthenticated
} = require('../util/index')
const router = express.Router()

router.get('/', (req, res) => {
    var song = req.query.song
    var artist = song.split(' - ')[1]
    var title = song.split(' - ')[0]
    //if the query is malformed
    if (!artist || !title) {
        req.flash('message', 'Artist or Title missing. Select a song from the search list')
        req.flash('type', 'alert-warning')
        res.redirect(req.header('Referer') || '/')
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
            throw err
        })
})

//gets lyrics page for a random song
router.get('/random', (req, res) => {
    pool.query('SELECT DISTINCT songartist, songtitle FROM songs')
        .then(result => {
            var index = Math.floor(Math.random() * (result.rowCount - 1))
            res.redirect('/song?song=' + result.rows[index].songtitle.trim() + ' - ' + result.rows[index].songartist.trim())
        }).catch(err => {
            throw err
        })
})

router.post('/add', ensureAuthenticated, (req, res) => {
    var title = req.body.title.trim()
    var artist = req.body.artist.trim()
    //if the query is malformed
    if (!artist || !title) {
        req.flash('message', 'Something went wrong')
        req.flash('type', 'alert-danger')
        res.redirect('/song?song=' + title + ' - ' + artist)
        return
    }
    fetch('https://api.lyrics.ovh/suggest/' + title + ' - ' + artist)
        .then(result => result.json())
        .then(result => {
            pool.query('INSERT INTO songs (username, songartist, songtitle, album, coverlink, artistpicture, lyrics) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [req.user.username, artist, title, result.data[0].album.title, result.data[0].album.cover_medium, result.data[0].artist.picture_medium, req.body.lyrics.trim()])
                .then(res.sendStatus(200))
                .catch(err => {
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
    var artist = song.split(' - ')[1]
    var title = song.split(' - ')[0]
    pool.query('DELETE FROM songs WHERE songartist = $1 AND songtitle = $2 AND username = $3', [artist, title, req.user.username])
        .then(result => {
            req.flash('message', 'Song deleted from your account')
            req.flash('type', 'alert-success')
            res.redirect('/account')
        }).catch(err => {
            throw err
        })
})

module.exports = router