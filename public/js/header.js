'use strict';

//calls functions when page is ready
$(() => {
    checkPage()
    autocomplete()
})

//suggestion list for song input
function autocomplete() {
    var inp = $("#myInput")
    var timeoutSuggest

    //event listener for input
    inp.on('input', function () {
        //prevents multiple calls in succession
        if (timeoutSuggest) clearTimeout(timeoutSuggest)
        timeoutSuggest = setTimeout(suggestions, 300)
    })

    //suggestions handler
    function suggestions() {
        var a, b, i, val = inp.val()
        var x = $('#autocmpl')
        if (x) x.remove()
        if (!val) return
        a = document.createElement('datalist')
        a.setAttribute('id', 'autocmpl')
        inp.after(a)
        console.log('Search suggestions for', val)
        //get suggestions
        $.getJSON('https://api.lyrics.ovh/suggest/' + val)
            .done(function (data) {
                var finalResults = []
                var seenResults = []
                //filter top 10 result
                data.data.forEach(function (result) {
                    if (seenResults.length >= 10) return
                    var t = result.title + ' - ' + result.artist.name
                    if (seenResults.indexOf(t) >= 0) return
                    seenResults.push(t)
                    finalResults.push({
                        display: t,
                        artist: result.artist.name,
                        title: result.title
                    })
                })
                var array = finalResults
                for (i = 0; i < array.length; i++) {
                    //filter result if it contains searched value
                    if (array[i].display.toUpperCase().includes(val.toUpperCase())) {
                        b = document.createElement('option')
                        b.setAttribute('value', array[i].display)
                        a.appendChild(b)
                    }
                }
                inp.focus()
            })
    }
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

//checks if auth cookie exists 
function checkPage() {
    var auth = getCookie('AuthToken')
    if (auth != '') {
        if (window.location.pathname === '/login' || window.location.pathname === '/register') window.location.replace('/')
        $('#AOL').html('<a class="btn" id = "loginbtn" href="/account">Account</a>')
    }
}