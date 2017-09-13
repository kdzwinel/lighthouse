/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('../audit');
const ViewportAudit = require('../viewport');
const MINIMAL_LEGIBLE_FONT_SIZE_PX = 16;

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
      requiredArtifacts: ['FontSize']
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

    const fontSizePx = artifacts.FontSize && parseInt(artifacts.FontSize, 10);
    if (fontSizePx && fontSizePx < MINIMAL_LEGIBLE_FONT_SIZE_PX) {
      return {
        rawValue: false,
        displayValue: `${fontSizePx}px`,
      };
    }

    return {
      rawValue: true,
    };
  }
}

module.exports = FontSize;
