var mongoose = require('mongoose');

var accessTokenSchema = new mongoose.Schema({
    used: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('AccessToken', accessTokenSchema);
