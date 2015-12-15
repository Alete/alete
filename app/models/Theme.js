var mongoose = require('mongoose');

var themeSchema = new mongoose.Schema({
    url: String,
    jade: String,
    locals: { type: mongoose.Schema.Types.Mixed },
    date: { type: Date }
});

module.exports = mongoose.model('Theme', themeSchema);
