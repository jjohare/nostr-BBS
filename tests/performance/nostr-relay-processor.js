/**
 * Artillery processor for Nostr Relay WebSocket tests
 */

import crypto from 'crypto';

export default {
  $randomString: function() {
    return crypto.randomBytes(8).toString('hex');
  },

  $timestamp: function() {
    return Math.floor(Date.now() / 1000);
  },

  beforeRequest: function(requestParams, context, ee, next) {
    context.vars.connectTime = Date.now();
    return next();
  },

  afterResponse: function(requestParams, response, context, ee, next) {
    const duration = Date.now() - context.vars.connectTime;

    ee.emit('customStat', {
      stat: 'websocket.connection_time',
      value: duration
    });

    return next();
  }
};
