module.exports = function(grunt) {
    grunt.initConfig({
        bower_concat: {
            all: {
                dest: './dist/vender.js',
                cssDest: './dist/vender.css',
                bowerOptions: {
                    relative: false
                },
            }
        },
        uglify: {
            my_target: {
                files: {
                    './public/js/vender.min.js': ['./dist/vender.js']
                }
            }
        },
        cssmin: {
            options: {
                shorthandCompacting: false,
                roundingPrecision: -1
            },
            target: {
                files: {
                    './public/css/vender.min.css': ['./dist/vender.css'],
                    './public/css/core.min.css': ['./public/css/core.css']
                }
            }
        },
        jshint: {
            options: {
                eqeqeq: true
            },
            uses_defaults: ['app.js', 'app/**/*.js', 'config/**/*.js']
        }
    });

    grunt.loadNpmTasks('grunt-bower-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('default', ['bower_concat', 'uglify', 'cssmin']);

};
