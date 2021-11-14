'use strict'
const _ = require('lodash')
const fetch = require('node-fetch')
const cheerio = require('cheerio')
const Promise = require('bluebird')

exports.ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next()
    }
    req.flash('warn', 'You have to be logged in to perform that action')
    res.redirect(req.header('Referer') || '/login')
}

exports.findLyrics = (title, artistName) => {
    let promises = []

    const textln = html => {
        html.find('br').replaceWith('\n')
        html.find('script').replaceWith('')
        html.find('#video-musictory').replaceWith('')
        html.find('strong').replaceWith('')
        html = _.trim(html.text())
        html = html.replace(/\r\n\n/g, '\n')
        html = html.replace(/\t/g, '')
        html = html.replace(/\n\r\n/g, '\n')
        html = html.replace(/ +/g, ' ')
        html = html.replace(/\n /g, '\n')
        return html
    }
    const lyricsUrl = title => _.kebabCase(_.trim(_.toLower(_.deburr(title))))

    const lyricsManiaUrl = title =>  _.snakeCase(_.trim(_.toLower(_.deburr(title))))

    const lyricsManiaUrlAlt = title => {
        title = _.trim(_.toLower(title))
        title = title.replace("'", '')
        title = title.replace(' ', '_')
        title = title.replace(/_+/g, '_')
        return title
    }
    const reqParolesNet = fetch('http://www.paroles.net/' + lyricsUrl(artistName) + '/paroles-' + lyricsUrl(title))
        .then(result => result.text())
        .then(body => cheerio.load(body))
        .then($ => {
            if ($('.song-text').length === 0) {
                return Promise.reject('nope')
            }
            return textln($('.song-text'))
        })
    const reqLyricsMania1 = fetch('http://www.lyricsmania.com/' + lyricsManiaUrl(title) + '_lyrics_' + lyricsManiaUrl(artistName) + '.html')
        .then(result => result.text())
        .then(body => cheerio.load(body))
        .then($ => {
            if ($('.lyrics-body').length === 0) {
                return Promise.reject()
            }
            return textln($('.lyrics-body'))
        })
    const reqLyricsMania2 = fetch('http://www.lyricsmania.com/' + lyricsManiaUrl(title) + '_' + lyricsManiaUrl(artistName) + '.html')
        .then(result => result.text())
        .then(body => cheerio.load(body))
        .then($ => {
            if ($('.lyrics-body').length === 0) {
                return Promise.reject()
            }
            return textln($('.lyrics-body'))
        })
    const reqLyricsMania3 = fetch('http://www.lyricsmania.com/' + lyricsManiaUrlAlt(title) + '_lyrics_' + encodeURIComponent(lyricsManiaUrlAlt(artistName)) + '.html')
        .then(result => result.text())
        .then(body => cheerio.load(body))
        .then($ => {
            if ($('.lyrics-body').length === 0) {
                return Promise.reject()
            }
            return textln($('.lyrics-body'))
        })
    
    if (/\(.*\)/.test(title) || /\[.*\]/.test(title)) {
        promises.push(findLyrics(title.replace(/\(.*\)/g, '').replace(/\[.*\]/g, ''), artistName))
    }

    promises.push(reqLyricsMania1)
    promises.push(reqLyricsMania2)
    promises.push(reqLyricsMania3)
    promises.push(reqParolesNet)

    return Promise.any(promises).then(lyrics => {
        return lyrics
    })
}