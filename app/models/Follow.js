var mongoose = require('mongoose');

var followSchema = new mongoose.Schema({
    followee: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true }, // Person being followed
    follower: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true }, // Person following the user
    date: { type: Date }
});

followSchema.index({
    followee: 1,
    follower: 1
}, {
    unique: true
});

module.exports = mongoose.model('Follow', followSchema);
