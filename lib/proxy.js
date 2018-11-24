const _ = require('lodash'),
  debug = require('debug')('express-request-proxy:proxy'),
  request = require('request-promise-native'),
  requestOptions = require('./request-options');

require('simple-errors');

/* eslint-disable consistent-return */
module.exports = function(options) {
  options = _.defaults(options || {}, {
    userAgent: 'simple-express-request-proxy',
    timeout: 5000,
    maxRedirects: 5,
    gzip: true,
    originalQuery: false
  });

  return function(req, res, next) {
    if (!req.ext) {
      req.ext = {};
    }

    req.ext.requestHandler = 'express-request-proxy';

    return makeApiCall(req, res, next);
  };

  async function makeApiCall(req, res, next) {
    let apiRequestOptions;
    try {
      apiRequestOptions = requestOptions(req, options);
    } catch (err) {
      debug('error building request options %s', err.stack);
      return next(Error.http(400, err.message));
    }

    debug('making %s call to %s', apiRequestOptions.method, apiRequestOptions.url);

    try {
      const apiResponse = await request(apiRequestOptions);
      
      if (!next) {
        return apiResponse;
      }

      req.proxyResponse = apiResponse;
      next();
    } catch (err) {
      res.status(500);
    }
  }
};
