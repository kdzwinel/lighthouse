/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('../audit');
const URL = require('../../lib/url-shim');
const BLOCKLIST = new Set([
  'click here',
  'click this',
  'go',
  'here',
  'this',
  'start',
  'right here',
  'more',
  'learn more',
]);

class AnchorText extends Audit {
  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      category: 'Content Best Practices',
      name: 'anchor-text',
      description: 'Anchors have descriptive text.',
      failureDescription: 'Anchors do not have descriptive text',
      helpText: 'Descriptive anchor text helps search engines understand your content. ' +
      '[Learn more](https://webmasters.googleblog.com/2008/10/importance-of-link-architecture.html)',
      requiredArtifacts: ['URL', 'CrawlableAnchors'],
    };
  }

  /**
   * @param {!Artifacts} artifacts
   * @return {!AuditResult}
   */
  static audit(artifacts) {
    const failingAnchors = artifacts.CrawlableAnchors
      .filter(anchor => {
        if (
          anchor.href.toLowerCase().startsWith('javascript:') ||
          URL.equalWithExcludedFragments(anchor.href, artifacts.URL.finalUrl)
        ) {
          return false;
        }

        return BLOCKLIST.has(anchor.text.trim().toLowerCase());
      });

    const headings = [
      {key: 'href', itemType: 'url', text: 'Link destination'},
      {key: 'text', itemType: 'text', text: 'Link Text'},
    ];

    const details = Audit.makeTableDetails(headings, failingAnchors);
    let displayValue;

    if (failingAnchors.length) {
      displayValue = failingAnchors.length > 1 ?
        `${failingAnchors.length} anchors found` : '1 anchor found';
    }

    return {
      rawValue: failingAnchors.length === 0,
      details,
      displayValue,
    };
  }
}

module.exports = AnchorText;
