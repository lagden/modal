'use strict'

random = require 'random-js'
serverPort = random().integer 8200, 8500

module.exports = (grunt) ->

  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks)

  grunt.initConfig
    pkg: grunt.file.readJSON "package.json"
    comments: """
/*
modal.js

Modal everywhere

@author      Thiago Lagden <lagden [at] gmail.com>
@copyright   <%= grunt.template.today('yyyy') %> Thiago Lagden
@version     <%= pkg.version %>
*/
\n
"""

    coffeelint:
      plugin: [
        'src/coffee/{,*/}*.coffee'
      ]

    coffee:
      options:
        join: true
      compile:
        files:
          'dist/modal.js': [
            'src/coffee/modal.coffee'
          ]

    concat:
      options:
        banner: "<%= comments %>"
      pkg:
        src: [
          'dist/lib/classie/classie.js'
          'dist/lib/eventEmitter/EventEmitter.js'
          'dist/lib/get-style-property/get-style-property.js'
          'dist/modal.js'
        ]
        dest: 'dist/modal.pkg.js'

    jade:
      plugin:
        options:
          pretty: true
        files:
          'example/index.html': [
            'src/jade/*.jade'
          ]

    sass:
      plugin:
        options:
          style: 'expanded'
          noCache: true
          compass: false
        files:
          'dist/modal.css': 'src/sass/modal.sass'

    autoprefixer:
      dist:
        src: 'dist/modal.css'
        dest: 'dist/modal.css'

    watch:
      scripts:
        files: ['src/coffee/{,*/}*.coffee']
        tasks: ['coffeelint', 'coffee', 'concat']

      sass:
        files: ['src/sass/{,*/}*.sass']
        tasks: ['sass', 'autoprefixer']

      jade:
        files: ['src/jade/*.jade']
        tasks: ['jade']

    clean:
      dist: [
        "dist/{*.css,*.js,*.map}"
        "example/*.html"
      ]

    browserSync:
      dev:
        bsFiles:
          src: 'dist/*.css'
        options:
          notify: true
          watchTask: true,
          port: serverPort
          server:
            baseDir: [
              'example/.'
              'dist/.'
            ]

  grunt.registerTask 'build', [
    'clean'
    'coffeelint'
    'coffee'
    'concat'
    'sass'
    'autoprefixer'
    'jade'
  ]
  grunt.registerTask 'default', ['build']
  grunt.registerTask 'server', [
    'default'
    'browserSync:dev'
    'watch'
  ]

  return
