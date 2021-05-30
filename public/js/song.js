'use strict';

//copy to clipboard
function copiaTesto() {
    $('#bottone').attr('enabled', 'enabled')
    var range = document.createRange()
    range.selectNode(document.getElementById('songLyrics'))
    window.getSelection().removeAllRanges() // clear current selection
    window.getSelection().addRange(range) // to select text
    document.execCommand('copy')
    window.getSelection().removeAllRanges() // to deselect
    $('#message').attr('class', 'alert alert-success')
    $('#message').text('Testo Copiato!')
}

//gets cookie if present
function getCookie(cname) {
    var name = cname + '='
    var ca = document.cookie.split(';')
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i]
        while (c.charAt(0) == ' ') c = c.substring(1)
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length)
    }
    return ''
}

//save song to user account
function saveSong() {
    //checks if user is logged in
    var auth = getCookie('AuthToken')
    if (auth != '') {
        var artist = $('#song-artist').text().trim()
        var title = $('#song-title').text().trim()
        var lyrics = $('#songLyrics').html().replaceAll('<br>', '\r\n').trim()
        console.log(lyrics)
        //call to server
        $.post('http://localhost:3000/addSong', {
            artist: artist,
            title: title,
            lyrics: lyrics
        }).then((data, status) => {
            $('#message').attr('class', 'alert alert-success')
            $('#message').text('Testo Salvato!')
        }).catch(err => {
            if (err.status === 400) {
                $('#message').attr('class', 'alert alert-warning')
                $('#message').text('Song already saved!')
            } else {
                $('#message').attr('class', 'alert alert-danger')
                $('#message').text('Server Error!')
            }
        })
    } else {
        $('#message').attr('class', 'alert alert-danger')
        $('#message').text('Per salvare canzoni devi prima fare il login')
    }
}