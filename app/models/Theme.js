var mongoose = require('mongoose');

var themeSchema = new mongoose.Schema({
    blog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog',
        required: true
    },
    jade: String,
    locals: { type: mongoose.Schema.Types.Mixed },
    date: { type: Date }
});

module.exports = mongoose.model('Theme', themeSchema);
