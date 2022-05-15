'use strict'
const express = require('express')
//const fetch = require('node-fetch')
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))
const uuidv4 = require('uuid').v4
const pool = require('../config/database')
const {
    ensureAuthenticated,
    findLyrics
} = require('../util/index')
const router = express.Router()

router.get('/', (req, res) => {
    let song = req.query.song
    let artist = song.split(' - ')[1]
    let title = song.split(' - ')[0]
    //if the query is malformed
    if (!artist || !title) {
        req.flash('warn', 'Artist or Title missing. Select a song from the search list')
        res.redirect(req.header('Referer') || '/')
        return
    }
    pool.query('SELECT DISTINCT songartist, songtitle, lyrics, coverlink FROM songs')
        .then(result => {
            let found = false
            result.rows.forEach(row => {
                //searches songs chached in database
                if (!found && row.songartist === artist && row.songtitle === title) {
                    res.render('song', {
                        user: req.user,
                        error: req.flash('error'),
                        warn: req.flash('warn'),
                        success: req.flash('success'),
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
                findLyrics(title, artist)
                    .then(lyrics => {
                        saveSong(artist, title, lyrics)
                        res.render('song', {
                            user: req.user,
                            error: req.flash('error'),
                            warn: req.flash('warn'),
                            success: req.flash('success'),
                            songdisplay: title + " By " + artist,
                            songtitle: title,
                            songartist: artist,
                            songlyrics: lyrics.replace(/[\r\n]+/g, '<br />'),
                            coverlink: undefined
                        })
                    })
                    .catch(err => {
                        console.log(err)
                        req.flash('warn', 'Song not found')
                        res.redirect('/')
                    })
            }
        })
        .catch(err => {
            throw err
        })
})

const saveSong = (artist, title, lyrics) => {
    fetch('https://api.deezer.com/2.0/search?q=' + encodeURIComponent(artist + ' - ' + title))
        .then(result => result.json())
        .then(result => {
            pool.query('INSERT INTO songs (id, songartist, songtitle, album, coverlink, artistpicture, lyrics) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [uuidv4(), artist, title, result.data[0].album.title, result.data[0].album.cover_medium, result.data[0].artist.picture_medium, lyrics.replace(/[\r\n]+/g, '<br />')])
                .then(console.log('Song Saved!'))
                .catch(err => {
                    if (err.code === '23505') console.log('Song already present!')
                    else throw err
                })
        })
        .catch(err => {
            throw err
        })
}

//gets lyrics page for a random song
router.get('/random', (req, res) => {
    pool.query('SELECT DISTINCT songartist, songtitle FROM songs')
        .then(result => {
            let index = Math.floor(Math.random() * (result.rowCount - 1))
            res.redirect('/song?song=' + result.rows[index].songtitle.trim() + ' - ' + result.rows[index].songartist.trim())
        })
        .catch(err => {
            throw err
        })
})

router.post('/add', ensureAuthenticated, (req, res) => {
    let title = req.body.title.trim()
    let artist = req.body.artist.trim()
    //if the query is malformed
    if (!artist || !title) {
        req.flash('error', 'Something went wrong')
        res.redirect(req.header('Referer') || '/song?song=' + title + ' - ' + artist)
        return
    }
    pool.query('SELECT id FROM songs WHERE songartist = $1 AND songtitle = $2', [artist, title])
        .then(result => {
            pool.query('INSERT INTO usersongs (userid,songid) VALUES ($1, $2)', [req.user.id, result.rows[0].id])
                .then(() => {
                    req.flash('success', 'Song saved!')
                    res.redirect(req.header('Referer') || '/song?song=' + title + ' - ' + artist)
                    return
                })
                .catch(err => {
                    if (err.code === '23505') {
                        req.flash('warn', 'Song already saved!')
                        res.redirect(req.header('Referer') || '/song?song=' + title + ' - ' + artist)
                        return
                    } else {
                        throw err
                    }
                })
        })
        .catch(err => {
            throw err
        })
})

//remove song from account
router.post('/remove', ensureAuthenticated, (req, res) => {
    let song = req.query.song
    let artist = song.split(' - ')[1]
    let title = song.split(' - ')[0]
    pool.query('DELETE FROM usersongs USING songs WHERE songs.id = usersongs.songid AND songartist = $1 AND songtitle = $2 AND usersongs.userid = $3', [artist, title, req.user.id])
        .then(result => {
            req.flash('success', 'Song deleted from your account')
            res.redirect('/account')
        })
        .catch(err => {
            throw err
        })
})

module.exports = router