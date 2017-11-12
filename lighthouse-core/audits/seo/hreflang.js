/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('../audit');
const LinkHeader = require('http-link-header');
const axeCore = require('axe-core');
const LINK_HEADER = 'link';
const NO_LANGUAGE = 'x-default';

/**
 * @param {String} hreflang 
 * @returns {Boolean}
 */
function isValidHreflang(hreflang) {
  if (hreflang.toLowerCase() === NO_LANGUAGE) {
    return true;
  }

  // hreflang can consist of language-region-script, we are validating only language
  const [lang] = hreflang.split('-');
  return axeCore.utils.validLangs().includes(lang.toLowerCase());
}

/**
 * @param {String} headerValue 
 * @returns {Boolean}
 */
function headerHasValidHreflangs(headerValue) {
  const linkHeader = LinkHeader.parse(headerValue);

  return linkHeader.get('rel', 'alternate')
    .every(link => link.hreflang && isValidHreflang(link.hreflang));
}

class Hreflang extends Audit {
  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      name: 'hreflang',
      description: 'Document has a valid `hreflang`',
      failureDescription: 'Document doesn\'t have a valid `hreflang`',
      helpText: 'hreflang allows crawlers to discover alternate translations of the ' +
        'page content. [Learn more]' +
        '(https://support.google.com/webmasters/answer/189077).',
      requiredArtifacts: ['Hreflang'],
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
        /** @type {Array<{source: String|Object}>} */
        const invalidHreflangs = [];

        if (artifacts.Hreflang) {
          artifacts.Hreflang.forEach(({href, hreflang}) => {
            if (!isValidHreflang(hreflang)) {
              invalidHreflangs.push({
                source: {
                  type: 'node',
                  snippet: `<link name="alternate" hreflang="${hreflang}" href="${href}" />`,
                },
              });
            }
          });
        }

        mainResource.responseHeaders
          .filter(h => h.name.toLowerCase() === LINK_HEADER && !headerHasValidHreflangs(h.value))
          .forEach(h => invalidHreflangs.push({source: `${h.name}: ${h.value}`}));

        const headings = [
          {key: 'source', itemType: 'code', text: 'Source'},
        ];
        const details = Audit.makeTableDetails(headings, invalidHreflangs);

        return {
          rawValue: invalidHreflangs.length === 0,
          details,
        };
      });
  }
}

module.exports = Hreflang;
