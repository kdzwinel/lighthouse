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
 * @param {URL} baseURL
 * @param {string} canonicalHref
 * @returns {boolean}
 */
function isValidCanonicalLink(baseURL, canonicalHref) {
  const canonicalURL = new URL(canonicalHref, baseURL);

  if (canonicalURL.href !== canonicalHref) {
    return false;
  }

  if (
    canonicalURL.pathname === '/' &&
    (baseURL.pathname === '/' || canonicalURL.origin === baseURL.origin)
  ) {
    return false;
  }

  return true;
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
        const base = new URL(mainResource.url);
        const failingHeader = mainResource.responseHeaders
          .find(h => h.name.toLowerCase() === LINK_HEADER);

        if (failingHeader &&
          !isValidCanonicalLink(base, getCanonicalLinkFromHeader(failingHeader.value))) {
          return {
            rawValue: false,
            displayValue: `\`${failingHeader.name}: ${failingHeader.value}\``,
          };
        }

        if (artifacts.Canonical && !isValidCanonicalLink(base, artifacts.Canonical)) {
          return {
            rawValue: false,
            displayValue: `\`<link rel="canonical" href="${artifacts.Canonical}" />\``,
          };
        }

        return {
          rawValue: true,
        };
      });
  }
}

module.exports = Canonical;
