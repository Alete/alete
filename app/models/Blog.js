var mongoose = require('mongoose');

var blogSchema = new mongoose.Schema({
    url: String,
    customDomain: String,
    followers: {
        type: Number,
        default: 0
    },
    suspended: {
        type: Boolean,
        default: 0
    }
});

module.exports = mongoose.model('Blog', blogSchema);
