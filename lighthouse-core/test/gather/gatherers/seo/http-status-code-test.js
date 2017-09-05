/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env mocha */

const HTTPStatusCode = require('../../../../gather/gatherers/seo/http-status-code');
const assert = require('assert');
let httpStatusCode;

describe('HTTP status code gatherer', () => {
  // Reset the Gatherer before each test.
  beforeEach(() => {
    httpStatusCode = new HTTPStatusCode();
  });

  it('returns an artifact', () => {
    const statusCode = 404;
    const traceData = {
      networkRecords: [
        {
          statusCode: statusCode
        }
      ]
    };

    const artifact = httpStatusCode.afterPass(null, traceData);
    assert.equal(artifact, statusCode);
  });

  it('should ignore redirects', () => {
    const statusCode = 200;
    const traceData = {
      networkRecords: [
        {
          statusCode: 301
        },
        {
          statusCode: 302
        },
        {
          statusCode: statusCode
        }
      ]
    };

    const artifact = httpStatusCode.afterPass(null, traceData);
    assert.equal(artifact, statusCode);
  });
});
