/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('../audit');
const HTTP_UNSUCCESSFUL_CODE_LOW = 400;
const HTTP_UNSUCCESSFUL_CODE_HIGH = 599;

class HTTPStatusCode extends Audit {
  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      category: 'Crawling and Indexing',
      name: 'http-status-code',
      description: 'Page has successful HTTP status code',
      failureDescription: 'Page doesn\'t have a successful HTTP response code',
      helpText: 'The HTTP status code tells crawlers whether a URL leads to a valid page or not. ' +
          'Pages with unsuccessful status codes may not be indexed properly. Learn more about ' +
          'the [HTTP status codes](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes).',
      requiredArtifacts: ['HTTPStatusCode']
    };
  }

  /**
   * @param {!Artifacts} artifacts
   * @return {!AuditResult}
   */
  static audit(artifacts) {
    if (!artifacts.HTTPStatusCode) {
      return {
        rawValue: false,
        debugString: 'No HTTPStatusCode found in trace.'
      };
    }

    if (artifacts.HTTPStatusCode >= HTTP_UNSUCCESSFUL_CODE_LOW &&
      artifacts.HTTPStatusCode <= HTTP_UNSUCCESSFUL_CODE_HIGH) {
      return {
        rawValue: false,
        displayValue: `${artifacts.HTTPStatusCode}`
      };
    }

    return {
      rawValue: true
    };
  }
}

module.exports = HTTPStatusCode;
