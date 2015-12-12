var express  = require('express'),
    Follow = require('../models/Follow'),
    Activity = require('../models/Activity');

module.exports = (function() {
    var app = express.Router();

    function ensureAuthenticated(req, res, next) {
        if(req.isAuthenticated()) {
            return next();
        }
        res.redirect('/signin');
    }

    app.get('/', ensureAuthenticated, function(req, res, next){
        if(!res.locals.subDomain){
            Follow.find({
                follower: req.user._id
            }).exec(function(err, following){
                // This will give us the people the signed in user follows
                // We need to get it to an array to use with $in
                // We add the current user otherwise they're missing their own posts
                var activityNeeded = [req.user._id];
                for(var i = 0; i < following.length; i++){
                    activityNeeded.push(following[i].followee);
                }
                Activity.find({
                    owner: {
                        $in: activityNeeded
                    },
                    $or: [
                        {
                            type: 'post'
                        },
                        {
                            type: 'reblog'
                        }
                    ]
                }).sort({
                    _id: 'desc'
                }).limit(20).populate('content.post').exec(function(err, activityFeed){
                    // This is the activity of all of the people the signed in user follows
                    res.render('index', {
                        activityFeed: activityFeed
                    });
                });
            });
        } else {
            next();
        }
    });

    app.get('/user', ensureAuthenticated, function(req, res, next){
        if(!res.locals.subDomain){
            res.send({
                user: req.user
            });
        } else {
            next();
        }
    });

    app.get('/following', ensureAuthenticated, function(req, res, next){
        if(!res.locals.subDomain){
            Follow.find({
                follower: req.user._id
            }).exec(function(err, following){
                res.send(following);
            });
        } else {
            next();
        }
    });

    app.get('/follow/:_id', ensureAuthenticated, function(req, res, next){
        if(!res.locals.subDomain){
            var follow = new Follow({
                followee: req.params._id,
                follower: req.user._id
            });
            follow.save(function(err, follow){
                res.send(follow);
            });
        } else {
            next();
        }
    });

    app.get('/activity/post', ensureAuthenticated, function(req, res, next){
        if(!res.locals.subDomain){
            var activity = new Activity({
                owner: req.user._id,
                type: 'post',
                content: {
                    body: 'This is the post body'
                }
            });
            activity.save(function(err, post){
                res.send({
                    post: post
                });
            });
        } else {
            next();
        }
    });

    app.get('/activity/reblog/:_id', ensureAuthenticated, function(req, res, next){
        if(!res.locals.subDomain){
            var activity = new Activity({
                owner: req.user._id,
                type: 'reblog',
                content: {
                    post: req.params._id
                }
            });
            activity.save(function(err, reblog){
                res.send({
                    reblog: reblog
                });
            });
        } else {
            next();
        }
    });

    app.get('/activity/like/:_id', ensureAuthenticated, function(req, res, next){
        if(!res.locals.subDomain){
            var activity = new Activity({
                owner: req.user._id,
                type: 'like',
                content: {
                    post: req.params._id
                }
            });
            activity.save(function(err, reblog){
                res.send({
                    reblog: reblog
                });
            });
        } else {
            next();
        }
    });

    return app;
})();
