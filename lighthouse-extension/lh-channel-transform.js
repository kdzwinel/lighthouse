/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const through = require('through2');

/**
 * This is a browserify transform replaces LH_CHANNEL node environment variable
 * It should be replaced with envify as soon as it supports object rest/spread properties
 */
module.exports = function(file, options) {
  const fileContents = [];
  return through(function(part, enc, next) {
    fileContents.push(part);
    next();
  }, function(done) {
    let fileContentsString = fileContents.join('');

    fileContentsString = fileContentsString.replace(
      /process\.env\.LH_CHANNEL/g,
      `'${options.channel}'`
    );

    // eslint-disable-next-line no-invalid-this
    this.push(fileContentsString);
    done();
  });
};
