var mongoose = require('mongoose');

var followSchema = new mongoose.Schema({
    followee: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true }, // Person being followed
    follower: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true }, // Person following the user
    date: { type: Date }
});

module.exports = mongoose.model('Follow', followSchema);
