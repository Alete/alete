var express = require('express'),
    imgur = require('imgur'),
    multer  = require('multer'),
    toobusy = require('toobusy-js'),
    Follow = require('../models/Follow'),
    User = require('../models/User'),
    Activity = require('../models/Activity'),
    AccessToken = require('../models/AccessToken'),
    Blog = require('../models/Blog');

module.exports = (function() {
    var app = express.Router();
    var upload = multer({
        dest: '/tmp/alete/uploads/'
    });

    function ensureAuthenticated(req, res, next) {
        if(req.isAuthenticated()) {
            return next();
        } else {
            res.render('countDown');
        }
    }

    function ensureAdmin(req, res, next) {
        if(req.user.isAdmin) {
            return next();
        }
        return next('route');
    }

    function limitActivity(req, res, next) {
        var midnight = (new Date()).setHours(0, 0, 0, 0),
            now = new Date();
        Activity.count({
            owner: req.user._id,
            date: {
                $gte: midnight,
                $lt: now
            }
        }).exec(function(err, count){
            if(err) { return next(err); }
            if(count < 250){
                return next();
            } else {
                return next('Too many posts!');
            }
        });
    }

    function ensureMainSite(req, res, next) {
        if(!Object.keys(res.locals.blog).length){
            next();
        } else {
            next('route');
        }
    }

    // The absolute first piece of middle-ware we would register, to block requests
    // before we spend any time on them.
    app.use(function(req, res, next) {
        // check if we're toobusy() - note, this call is extremely fast, and returns
        // state that is cached at a fixed interval
        if (toobusy()){
            res.status(503).send("I'm busy right now, sorry.");
        } else {
            next();
        }
    });

    app.get('/', ensureMainSite, ensureAuthenticated, function(req, res){
        var skip = (req.query.page > 0 ? (req.query.page-1) * 20 : 0);
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
                        type: 'reflow'
                    }
                ]
            }).sort({
                _id: 'desc'
            }).skip(skip).limit(20).populate('content.post').exec(function(err, activityFeed){
                // This is the activity of all of the people the signed in user follows
                res.render('index', {
                    activityFeed: activityFeed
                });
            });
        });
    });

    app.get('/blog/:url', ensureMainSite, ensureAuthenticated, function(req, res, next){
        var skip = (req.query.page > 0 ? (req.query.page-1) * 20 : 0);
        Blog.findOne({
            url: req.params.url
        }).exec(function(err, blog){
            if(err) { next(err); }
            if(blog) {
                Activity.find({
                    blog: blog._id,
                    $or: [
                        {
                            type: 'post'
                        },
                        {
                            type: 'reflow'
                        }
                    ]
                }).sort({
                    _id: 'desc'
                }).skip(skip).limit(20).populate('content.post').exec(function(err, activityFeed){
                    // This is the activity of the blog requested
                    // @TODO this should be replaced with a custom page instead of using index's template
                    res.render('index', {
                        activityFeed: activityFeed
                    });
                });
            } else {
                next('Blog doesn\'t exist');
            }
        });
    });

    app.get('/user', ensureMainSite, ensureAuthenticated, function(req, res){
        res.send({
            user: req.user
        });
    });

    app.get('/blogs', ensureMainSite, ensureAuthenticated, function(req, res){
        res.send({
            blogs: req.user.blogs
        });
    });

    app.get('/following/:blogUrl', ensureMainSite, ensureAuthenticated, function(req, res, next){
        Blog.findOne({
            url: req.params.blogUrl
        }).exec(function(err, blog){
            if(err) { next(err); }
            if(blog) {
                Follow.find({
                    follower: blog.id
                }).exec(function(err, following){
                    if(err) { next(err); }
                    res.send({
                        total: following.length,
                        following: following
                    });
                });
            }
        });
    });

    app.get('/followers/:blogUrl', ensureMainSite, ensureAuthenticated, function(req, res, next){
        Blog.findOne({
            url: req.params.blogUrl
        }).exec(function(err, blog){
            if(err) { next(err); }
            if(blog) {
                Follow.find({
                    followee: blog.id
                }).exec(function(err, followers){
                    if(err) { next(err); }
                    res.send({
                        total: followers.length,
                        followers: followers
                    });
                });
            }
        });
    });

    app.get('/follow/:_id', ensureMainSite, ensureAuthenticated, function(req, res){
        var follow = new Follow({
            followee: req.params._id,
            follower: req.user._id
        });
        follow.save(function(err, follow){
            res.send(follow);
        });
    });

    app.post('/activity/post', ensureMainSite, ensureAuthenticated, limitActivity, upload.single('file'), function(req, res, next){
        imgur.setClientId('f7b02cbb57f42b5');
        imgur.uploadFile(req.file.path).then(function(json){
            res.send(json.data);
            var activity = new Activity({
                owner: req.user.blogs[0].id, // @TODO This should be the current blog you're using
                type: 'post',
                content: {
                    image: {
                        link: json.data.link,
                        deleteHash: json.data.deletehash
                    },
                    body: req.body.text,
                    notes: 1
                }
            });
            activity.save(function(err, post){
                res.send({
                    post: post
                });
            });
        }).catch(function(err){
            next(err);
        });
    });

    app.post('/activity/reflow/', ensureMainSite, ensureAuthenticated, limitActivity, function(req, res, next){
        var activity = new Activity({
            owner: req.user.blogs[0].id, // @TODO This should be the current blog you're using
            type: 'reflow',
            content: {
                post: req.body._id
            }
        });
        activity.save(function(err, reflow){
            Activity.update({
                _id: req.body._id,
                type: 'post'
            },{
                $inc: {
                    'content.notes': 1
                }
            }).exec(function(err){
                if(err) { next(err); }
                res.send({
                    reflow: reflow
                });
            });
        });
    });

    app.post('/activity/heart/', ensureMainSite, ensureAuthenticated, limitActivity, function(req, res, next){
        Activity.findOne({
            'content.post': req.body._id,
            type: 'heart'
        }).exec(function(err, heart){
            if(err) { next(err); }
            if(!heart){
                var activity = new Activity({
                    owner: req.user.blogs[0].id, // @TODO This should be the current blog you're using
                    type: 'heart',
                    content: {
                        post: req.body._id
                    }
                });
                activity.save(function(err, heart){
                    if(err) { next(err); }
                    res.send({
                        heart: heart
                    });
                });
            } else {
                res.send({
                    heart: heart
                });
            }
        });
    });

    app.get('/tokenGen', ensureMainSite, ensureAuthenticated, ensureAdmin, function(req, res, next){
        var accessToken = new AccessToken();
        accessToken.save(function(err, accessToken){
            if(err) { next(err); }
            res.send({
                accessToken: accessToken
            });
        });
    });

    app.get('/unusedTokens', ensureMainSite, ensureAuthenticated, ensureAdmin, function(req, res, next){
        AccessToken.find({
            used: false
        }).select('_id').lean().limit(20).exec(function(err, accessTokens){
            if(err) { next(err); }
            res.send({
                accessTokens: accessTokens
            });
        });
    });

    app.get('/pleaseLetMeJoin', ensureMainSite, function(req, res, next){
        User.findOne({}).select('_id').sort({
            _id : -1
        }).exec(function(err, user){
            if(err) { next(err); }
            // If the last user signedup over 10 minutes ago
            // The 60000 is 1 minute
            if((((new Date()) - (new Date(user._id.getTimestamp()))) / 60000) > 10){
                AccessToken.findOne({
                    used: false
                }).select('_id').lean().limit(1).exec(function(err, accessToken){
                    if(err) { next(err); }
                    res.send({
                        accessToken: accessToken._id
                    });
                });
            } else {
                // If the last user signed up less than 10 minutes ago
                // then don't give them a free accessToken
                res.status(200).send('NO!');
            }
        });
    });

    return app;
})();
