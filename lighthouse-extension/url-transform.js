/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const through = require('through2');
const path = require('path');

/**
 * This is a browserify transform that looks for requires to url
 * and replaces them for url-shim.
 */
module.exports = function(file) {
  const fileContents = [];
  return through(function(part, enc, next) {
    fileContents.push(part);
    next();
  }, function(done) {
    let fileContentsString = fileContents.join('');
    const dtmRegExp = /require\(['"]url['"]\)/gim;
    const absoluteShimPath = path.join(__dirname, '../lighthouse-core/lib/url-shim.js');

    // do not modify url-shim itself
    if (absoluteShimPath !== file) {
      const relativeShimPath = path.relative(path.dirname(file), path.dirname(absoluteShimPath));
      const newPath = path.join(relativeShimPath, 'url-shim');

      if (dtmRegExp.test(fileContentsString)) {
        fileContentsString = fileContentsString.replace(dtmRegExp, `require("${newPath}")`);
      }
    }

    // eslint-disable-next-line no-invalid-this
    this.push(fileContentsString);
    done();
  });
};
