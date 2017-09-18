/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('../audit');
const ViewportAudit = require('../viewport');
const MINIMAL_LEGIBLE_FONT_SIZE_PX = 16;
const MINIMAL_PERCENTAGE_OF_LEGIBLE_TEXT = 75;

class FontSize extends Audit {
  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      category: 'Mobile friendly',
      name: 'font-size',
      description: 'Document uses legible font sizes.',
      failureDescription: 'Document doesn\'t use legible font sizes: ' +
        '`target <body> font-size >= 16px`, found',
      helpText: 'Font sizes less than 16px are too small to be legible and require mobile ' +
        'visitors to “pinch to zoom” in order to read. ' +
        '[Learn more](https://developers.google.com/speed/docs/insights/UseLegibleFontSizes).',
      requiredArtifacts: ['FontSize', 'Viewport']
    };
  }

  /**
   * @param {!Artifacts} artifacts
   * @return {!AuditResult}
   */
  static audit(artifacts) {
    const hasViewportSet = ViewportAudit.audit(artifacts).rawValue;
    if (!hasViewportSet) {
      return {
        rawValue: false,
        debugString: 'Text is illegible because of a missing viewport config',
      };
    }

    let passingText = 0;
    let failingText = 0;
    const failingElements = [];

    for(const key in artifacts.FontSize) {
      if (!artifacts.FontSize.hasOwnProperty(key)) {
        continue;
      }

      const result = artifacts.FontSize[key];

      if (result.fontSize >= MINIMAL_LEGIBLE_FONT_SIZE_PX) {
        passingText += result.textLength;
      } else {
        failingText += result.textLength;
        result.elements.forEach(element => {
          failingElements.push({element, fontSize: result.fontSize});
        });
      }
    }

    if (passingText === 0 && failingText === 0) {
      return {
        rawValue: true,
        debugString: 'Page contains no text',
      };
    }

    const percentageOfPassingText = passingText / (passingText + failingText) * 100;

    if (percentageOfPassingText < MINIMAL_PERCENTAGE_OF_LEGIBLE_TEXT) {
      const headings = [
        {key: 'element', itemType: 'node', text: 'Element'},
        {key: 'fontSize', itemType: 'text', text: 'Font Size'}
      ];

      const details = Audit.makeTableDetails(headings, failingElements);

      return {
        rawValue: false,
        extendedInfo: {
          value: failingElements
        },
        details,
        debugString: `${(100 - percentageOfPassingText).toFixed(2)}% of text is too small.`,
      };
    }

    return {
      rawValue: true,
      debugString: `${percentageOfPassingText.toFixed(2)}% of text is legible`
    };
  }
}

module.exports = FontSize;
