/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

 /**
  * @fileoverview Returns HTTP status code of the primary resource. Follows redirects.
  */
  'use strict';

  const Gatherer = require('../gatherer');
  const HTTP_REDIRECT_CODE_LOW = 300;
  const HTTP_REDIRECT_CODE_HIGH = 399;

  class HTTPStatusCode extends Gatherer {

    afterPass(options, traceData) {
      const mainResource = traceData.networkRecords
        .find(record => record.statusCode < HTTP_REDIRECT_CODE_LOW ||
          record.statusCode > HTTP_REDIRECT_CODE_HIGH);

      return mainResource && mainResource.statusCode;
    }
  }

  module.exports = HTTPStatusCode;
