/**
 * 入口
 * @author john.gao
 */
'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./lib/yuso-mobile-native.min.js');
} else {
  module.exports = require('./lib/yuso-mobile-native.js');
}