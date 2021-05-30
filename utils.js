const {
    createHash,
    randomBytes
} = require('crypto')

//password hashing
exports.getHashedPassword = (password) => {
    const sha256 = createHash('sha256')
    const hash = sha256.update(password).digest('base64')
    return hash
}

//generate random login token
exports.generateAuthToken = () => {
    return randomBytes(30).toString('hex')
}

//extracts path from url
exports.pathExtractor = (req) => {
    function escapeRegExp(str) {
        return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
    }
    function replaceAll(str, find, replace) {
        return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
    }
    return replaceAll(req.get('referrer'), req.get('host'), '');
}