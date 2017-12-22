/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('../audit');
const LinkHeader = require('http-link-header');
const URL = require('../../lib/url-shim');
const LINK_HEADER = 'link';

/**
 * @param {string} headerValue
 * @returns {Array<string>}
 */
function getCanonicalLinksFromHeader(headerValue) {
  const linkHeader = LinkHeader.parse(headerValue);
  const canonical = linkHeader.get('rel', 'canonical');

  return canonical.map(c => c.uri);
}

/**
 * Returns true if given string is a valid absolute or relative URL
 * @param {string} url
 * @returns {boolean}
 */
function isValidRelativeOrAbsoluteURL(url) {
  try {
    new URL(url, 'https://example.com/');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * @param {URL} url
 * @returns {string}
 */
function getDomain(url) {
  return url.hostname.split('.').slice(-2).join('.');
}

class Canonical extends Audit {
  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      name: 'canonical',
      description: 'Document has a valid `rel=canonical`',
      failureDescription: 'Document does not have a valid `rel=canonical`',
      helpText: 'Canonical links suggest which URL to show in search results. ' +
        'Read more in [Use canonical URLs]' +
        '(https://support.google.com/webmasters/answer/139066).',
      requiredArtifacts: ['Canonical', 'Hreflang'],
    };
  }

  /**
   * @param {!Artifacts} artifacts
   * @return {!AuditResult}
   */
  static audit(artifacts) {
    const devtoolsLogs = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];

    return artifacts.requestMainResource(devtoolsLogs)
      .then(mainResource => {
        const baseURL = new URL(mainResource.url);
        let canonicals = [];

        mainResource.responseHeaders
          .filter(h => h.name.toLowerCase() === LINK_HEADER)
          .forEach(h => canonicals = canonicals.concat(getCanonicalLinksFromHeader(h.value)));

        canonicals = canonicals.concat(artifacts.Canonical);

        if (canonicals.length === 0) {
          return {
            rawValue: true,
          };
        }

        const invalidURL = canonicals.find(c => !isValidRelativeOrAbsoluteURL(c));
        if (invalidURL) {
          return {
            rawValue: false,
            debugString: `invalid URL (${invalidURL})`,
          };
        }

        const relativeURL = canonicals.find(c => !URL.isValid(c));
        if (relativeURL) {
          return {
            rawValue: false,
            debugString: `relative URL (${relativeURL})`,
          };
        }

        canonicals = canonicals.map(c => new URL(c));

        const conflictingURL = canonicals.find(c => c.href === canonicals[0].href);
        if (conflictingURL) {
          return {
            rawValue: false,
            debugString:
              `multiple conflicting URLs (${conflictingURL.href}, ${canonicals[0].href})`,
          };
        }

        const canonicalURL = canonicals[0];

        if (getDomain(canonicalURL) !== getDomain(baseURL)) {
          return {
            rawValue: false,
            debugString: `points to a different domain (${canonicalURL})`,
          };
        }

        // it's a common mistake to point canonical from all pages of the website to its root
        if (canonicalURL.origin === baseURL.origin &&
          canonicalURL.pathname === '/' && baseURL.pathname !== '/') {
          return {
            rawValue: false,
            debugString: 'points to a root of the same origin',
          };
        }

        // const hreflangURLs = artifacts.Hreflang.map(({href}) => URL.isValid(href) && new URL(href)

        // const baseURLIsHreflang = true;
        // const canonicalURLIsHreflang = true;

        // if (baseURLIsHreflang && canonicalURLIsHreflang && baseURL.href !== canonicalURL.href) {
        //   return {
        //     rawValue: false,
        //     debugString: `points to another hreflang location (${})`,
        //   };
        // }

        return {
          rawValue: true,
        };
      });
  }
}

module.exports = Canonical;
