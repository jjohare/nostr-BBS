/**
 * Artillery processor for embedding API load tests
 * Provides custom functions and metrics processing
 */

import crypto from 'crypto';

export default {
  // Generate random string for test data
  $randomString: function(context, events, done) {
    const words = [
      'performance', 'testing', 'embedding', 'semantic', 'search',
      'nostr', 'protocol', 'message', 'encryption', 'quality',
      'engineering', 'benchmark', 'latency', 'throughput', 'optimization'
    ];

    const randomWords = [];
    const count = Math.floor(Math.random() * 10) + 5;
    for (let i = 0; i < count; i++) {
      randomWords.push(words[Math.floor(Math.random() * words.length)]);
    }

    return done(randomWords.join(' '));
  },

  // Track custom metrics
  beforeRequest: function(requestParams, context, ee, next) {
    context.vars.startTime = Date.now();
    return next();
  },

  afterResponse: function(requestParams, response, context, ee, next) {
    const duration = Date.now() - context.vars.startTime;

    // Emit custom metrics
    ee.emit('customStat', {
      stat: 'embedding.response_time',
      value: duration
    });

    // Track cold start (first request)
    if (!context.vars.firstRequestDone) {
      ee.emit('customStat', {
        stat: 'embedding.cold_start_time',
        value: duration
      });
      context.vars.firstRequestDone = true;
    }

    // Track inference time from response header
    if (response.headers && response.headers['x-inference-time']) {
      const inferenceTime = parseInt(response.headers['x-inference-time']);
      ee.emit('customStat', {
        stat: 'embedding.inference_time',
        value: inferenceTime
      });
    }

    return next();
  },

  // Log errors
  onError: function(error, context, ee, next) {
    console.error('Request error:', error.message);
    return next();
  }
};
