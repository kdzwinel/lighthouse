/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const parseURL = require('url').parse;
const Audit = require('../audit');
const ViewportAudit = require('../viewport');
const CSSStyleDeclaration = require('../../lib/web-inspector').CSSStyleDeclaration;
const MINIMAL_LEGIBLE_FONT_SIZE_PX = 16;
const MINIMAL_PERCENTAGE_OF_LEGIBLE_TEXT = 75;

/**
 * @param {!Array<{textLength:number}>} rules
 * @returns number
 */
function getTotalTextLength(rules) {
  return rules.reduce((sum, item) => sum + item.textLength, 0);
}

/**
 * @param {Array<{cssRule: WebInspector.CSSStyleDeclaration, fontSize: number, textLength: number, node: Node}>} fontSizeArtifact
 * @returns {Array<{cssRule: WebInspector.CSSStyleDeclaration, fontSize: number, textLength: number, node: Node}>}
 */
function getFailingRules(fontSizeArtifact) {
  const failingRules = new Map();

  fontSizeArtifact.forEach(({cssRule, fontSize, textLength, node}) => {
    if (fontSize >= MINIMAL_LEGIBLE_FONT_SIZE_PX) {
      return;
    }

    const artifactId = getFontArtifactId(cssRule, node);
    const failingRule = failingRules.get(artifactId);

    if (!failingRule) {
      failingRules.set(artifactId, {
        node,
        cssRule,
        fontSize,
        textLength,
      });
    } else {
      failingRule.textLength += textLength;
    }
  });

  return failingRules.valuesArray();
}

/**
 * @param {Node} node
 * @return {{type:string, snippet:string}}
 */
function nodeToTableNode(node) {
  const attributesString = node.attributes.map((value, idx) =>
    (idx % 2 === 0) ? ` ${value}` : `="${value}"`
  ).join('');

  return {
    type: 'node',
    snippet: `<${node.localName}${attributesString}>`,
  };
}

/**
 * @param {Array<{header:{styleSheetId:string, sourceURL:string}}>} stylesheets
 * @param {string} baseURL
 * @param {WebInspector.CSSStyleDeclaration} styleDeclaration
 * @param {Node} node
 * @returns {{source:!string, selector:string}}
 */
function getOrigin(stylesheets, baseURL, styleDeclaration, node) {
  if (
    !styleDeclaration ||
    styleDeclaration.type === CSSStyleDeclaration.Type.Attributes ||
    styleDeclaration.type === CSSStyleDeclaration.Type.Inline
  ) {
    return {
      source: baseURL,
      selector: nodeToTableNode(node),
    };
  }

  if (styleDeclaration.parentRule &&
    styleDeclaration.parentRule.origin === global.CSSAgent.StyleSheetOrigin.USER_AGENT) {
    return {
      selector: styleDeclaration.parentRule.selectors.map(item => item.text).join(', '),
      source: 'User Agent Stylesheet',
    };
  }

  if (styleDeclaration.type === CSSStyleDeclaration.Type.Regular && styleDeclaration.parentRule) {
    const rule = styleDeclaration.parentRule;
    const stylesheetMeta = stylesheets.find(ss => ss.header.styleSheetId === rule.styleSheetId);

    if (stylesheetMeta) {
      const url = parseURL(stylesheetMeta.header.sourceURL, baseURL);
      const range = styleDeclaration.range;
      const selector = rule.selectors.map(item => item.text).join(', ');
      let source = `${url.href}`;

      if(range) {
        const absoluteStartLine = range.startLine + stylesheetMeta.header.startLine + 1;
        const absoluteStartColumn = range.startColumn + stylesheetMeta.header.startColumn + 1;

        source += `:${absoluteStartLine}:${absoluteStartColumn}`;
      }

      return {
        selector,
        source,
      };
    }
  }

  return {
    source: 'Unknown',
  };
}

/**
 * @param {WebInspector.CSSStyleDeclaration} styleDeclaration
 * @param {Node} node
 * @return string
 */
function getFontArtifactId(styleDeclaration, node) {
  if (styleDeclaration && styleDeclaration.type === CSSStyleDeclaration.Type.Regular) {
    const startLine = styleDeclaration.range ? styleDeclaration.range.startLine : 0;
    const startColumn = styleDeclaration.range ? styleDeclaration.range.startColumn : 0;
    return `${styleDeclaration.styleSheetId}@${startLine}:${startColumn}`;
  } else {
    return `node_${node.nodeId}`;
  }
}

class FontSize extends Audit {
  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      category: 'Mobile friendly',
      name: 'font-size',
      description: 'Document uses legible font sizes.',
      failureDescription: 'Document doesn\'t use legible font sizes.',
      helpText: 'Font sizes less than 16px are too small to be legible and require mobile ' +
      'visitors to “pinch to zoom” in order to read. ' +
      '[Learn more](https://developers.google.com/speed/docs/insights/UseLegibleFontSizes).',
      requiredArtifacts: ['FontSize', 'Styles', 'URL', 'Viewport'],
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

    const totalTextLenght = getTotalTextLength(artifacts.FontSize);

    if (totalTextLenght === 0) {
      return {
        rawValue: true,
      };
    }

    const failingRules = getFailingRules(artifacts.FontSize);
    const failingTextLength = getTotalTextLength(failingRules);
    const percentageOfPassingText = (totalTextLenght - failingTextLength) / totalTextLenght * 100;
    const pageUrl = artifacts.URL.finalUrl;

    const headings = [
      {key: 'source', itemType: 'url', text: 'Source'},
      {key: 'selector', itemType: 'code', text: 'Selector'},
      {key: 'coverage', itemType: 'text', text: 'Coverage'},
      {key: 'fontSize', itemType: 'text', text: 'Font Size'},
    ];

    const tableData = failingRules.sort((a, b) => b.textLength - a.textLength)
      .map(({cssRule, textLength, fontSize, node}) => {
        const percentageOfAffectedText = textLength / totalTextLenght * 100;
        const origin = getOrigin(artifacts.Styles, pageUrl, cssRule, node);

        return {
          source: origin.source,
          selector: origin.selector,
          coverage: `${percentageOfAffectedText.toFixed(2)}%`,
          fontSize: `${fontSize}px`,
        };
      });
    const details = Audit.makeTableDetails(headings, tableData);
    const passed = percentageOfPassingText >= MINIMAL_PERCENTAGE_OF_LEGIBLE_TEXT;
    const debugString = passed ?
      null : `${parseFloat((100 - percentageOfPassingText).toFixed(2))}% of text is too small.`;

    return {
      rawValue: passed,
      details,
      debugString,
    };
  }
}

module.exports = FontSize;
