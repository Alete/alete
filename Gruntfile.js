module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        bower_concat: { // jshint ignore:line
            vender: {
                dest: './dist/vender.js',
                cssDest: './dist/vender.css',
                bowerOptions: {
                    relative: false
                },
                mainFiles: {
                    'isotope': [
                        "dist/isotope.pkgd.min.js"
                    ],
                    "outlayer": [
                        "item.js",
                        "outlayer.js"
                    ],
                    "font-awesome": [
                        "css/font-awesome.css"
                    ]
                },
                dependencies: {
                    'isotope': [
                        "jquery-bridget",
                        "jquery",
                    ],
                    'outlayer': [
                        "jquery-bridget",
                        "jquery",
                    ]
                }
            }
        },
        uglify: {
            vender: {
                files: {
                    './public/js/vender.min.js': ['./dist/vender.js']
                }
            },
            core: {
                files: {
                    './public/js/core.min.js': ['./public/js/core.js']
                }
            }
        },
        sass: {
            options: {
            },
            core: {
                files: {
                    './dist/core.css': ['./public/scss/core.scss']
                }
            }
        },
        cssmin: {
            options: {
                shorthandCompacting: false,
                roundingPrecision: -1
            },
            vender: {
                files: {
                    './public/css/vender.min.css': [
                        './dist/vender.css'
                    ]
                }
            },
            core: {
                files: {
                    './public/css/core.min.css': [
                        './dist/core.css'
                    ]
                }
            }
        },
        jshint: {
            options: {
                eqeqeq: true
            },
            uses_defaults: [ // jshint ignore:line
                'app.js',
                'app/**/*.js',
                'config/**/*.js'
            ]
        },
        watch: {
            scripts: {
                files: [
                    './public/js/*.js',
                    './public/scss/*.scss',
                    'bower.json'
                ],
                tasks: [
                    'uglify',
                    'sass',
                    'cssmin'
                ],
                options: {
                    spawn: false,
                }
            }
        },
        copy: {
            vender: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: 'bower_components/font-awesome', // change this for font-awesome
                    src: [
                        'fonts/*.*'
                    ],
                    dest: './public/'
                }]
            }
        }
    });

    grunt.loadNpmTasks('grunt-bower-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', [
        'bower_concat',
        'uglify',
        'sass',
        'cssmin'
    ]);

};
