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
 * @returns {string}
 */
function getCanonicalLinkFromHeader(headerValue) {
  const linkHeader = LinkHeader.parse(headerValue);
  const canonical = linkHeader.get('rel', 'canonical');

  return canonical.length && canonical[0].uri;
}

/**
 * @param {string} canonicalHref
 * @param {string} baseHref
 * @returns {boolean}
 */
function isValidCanonicalLink(canonicalHref, baseHref) {
  const baseURL = new URL(baseHref);
  const canonicalURL = new URL(canonicalHref, baseURL);

  if (
    canonicalURL.pathname === '/' &&
    (baseURL.pathname === '/' || baseURL.origin === canonicalURL.origin)
  ) {
    return false;
  }

  return true;
}

/**
 * @param {string} url
 * @param {string|URL} base
 * @returns {boolean}
 */
function isValidURL(url, base) {
  try {
    new URL(url, base);
  } catch (e) {
    return false;
  }

  return true;
}

/**
 * @param {string} url
 * @returns {string}
 */
function getTLD(url) {
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
      requiredArtifacts: ['Canonical'],
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
        const canonicals = [];

        mainResource.responseHeaders
          .filter(h => h.name.toLowerCase() === LINK_HEADER && getCanonicalLinkFromHeader(h.value))
          .forEach(h => canonicals.push({
            source: `${h.name}: ${h.value}`,
            url: getCanonicalLinkFromHeader(h.value),
          }));

        artifacts.Canonical.forEach(url => canonicals.push({
          source: `<link rel="canonical" href="${url}" />`,
          url,
        }));

        if (canonicals.length === 0) {
          return {
            rawValue: true,
          };
        }

        if (!canonicals.every(c => c.url === canonicals[0].url)) {
          return {
            rawValue: false,
            debugString: 'multiple conflicting URLs',
          };
        }

        if (!isValidURL(canonicals[0].url, baseURL)) {
          return {
            rawValue: false,
            debugString: 'invalid URL',
          };
        }

        const canonicalURL = new URL(canonicals[0].url, baseURL);

        if (canonicalURL.href !== canonicals[0].url) {
          return {
            rawValue: false,
            debugString: 'relative URL',
          };
        }

        if (getTLD(canonicalURL) !== getTLD(baseURL)) {
          return {
            rawValue: false,
            debugString: 'points to a different TLD',
          };
        }

        if (!isValidCanonicalLink(canonicalURL, baseURL)) {
          return {
            rawValue: false,
            debugString: 'invalid canonical??',
          };
        }

        return {
          rawValue: true,
        };
      });
  }
}

module.exports = Canonical;
