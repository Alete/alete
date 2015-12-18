var mongoose = require('mongoose');

var blogSchema = new mongoose.Schema({
    url: String,
    customDomain: String,
    followers: Number
});

module.exports = mongoose.model('Blog', blogSchema);
