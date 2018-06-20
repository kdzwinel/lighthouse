/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const {URL} = require('url');
const jsonld = require('jsonld');
// @ts-ignore
const schemaOrgContext = require('./assets/jsonldcontext');
const SCHEMA_ORG_HOST = 'schema.org';

/**
 * Takes JSON-LD object and normalizes it by following the expansion algorithm
 * (https://json-ld.org/spec/latest/json-ld-api/#expansion).
 *
 * @param {Object} inputObject
 * @returns {Object}
 */
module.exports = function expand(inputObject) {
  /** @type {function(string):void} */
  let resolve;
  /** @type {function(string):void} */
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res; reject = rej;
  });

  jsonld.expand(inputObject, {
    // custom loader prevents network calls and alows us to return local version of the schema.org document
    documentLoader: (
        /** @type {string} **/url,
        /** @type {function(null, Object):void} **/callback
    ) => {
      let urlObj = null;

      try {
        urlObj = new URL(url, 'http://example.com');
      } catch (e) {
        reject('Error parsing URL: ' + url);
      }

      if (urlObj && urlObj.host === SCHEMA_ORG_HOST && urlObj.pathname === '/') {
        callback(null, {
          document: schemaOrgContext,
        });
      } else {
        // We only process schema.org, for other schemas we return an empty object
        callback(null, {
          document: {},
        });
      }
    },
  }, (/** @type {string} */e, /** @type {Object} **/expanded) => {
    if (e) {
      reject('Expansion error: ' + e.toString());
    } else {
      resolve(expanded);
    }
  });

  return promise;
};