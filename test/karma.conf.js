module.exports = function (config) {
  'use strict';
  config.set({

    basePath: '',

    frameworks: ['browserify', 'mocha', 'chai'],

    files: [
      // '../node_modules/core-js/shim.js',
      'https://d3js.org/d3.v3.min.js',
      //'../build/ot.interactionsViewer.js',
      // 'index.js',
      '*.spec.js',
    ],

    reporters: ['mocha'],

    preprocessors: {
      '*.spec.js': ['browserify']
    },

    browserify: {
      debug: true,
      bundleDelay: 1000,
      transform: [['babelify', {
        ignore: /node_modules/
      }]],
      extensions: ['.js']
    },

    port: 9876,
    colors: true,
    autoWatch: false,
    singleRun: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    browsers: ['PhantomJS']

  });
};
