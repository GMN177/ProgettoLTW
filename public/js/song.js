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