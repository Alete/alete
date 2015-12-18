var mongoose = require('mongoose');

var activitySchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true },
    date: { type: Date, default: Date.now },
    type: String,
    content: { type: mongoose.Schema.Types.Mixed }
});

module.exports = mongoose.model('Activity', activitySchema);
