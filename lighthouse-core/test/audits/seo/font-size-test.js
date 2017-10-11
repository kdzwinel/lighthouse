/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const FontSizeAudit = require('../../../audits/seo/font-size.js');
const assert = require('assert');
const CSSStyleDeclaration = require('../../../lib/web-inspector').CSSStyleDeclaration;

const URL = 'https://example.com';
const Styles = [];
const validViewport = 'width=device-width';

/* eslint-env mocha */

describe('SEO: Font size audit', () => {
  it('fails when viewport is not set', () => {
    const artifacts = {
      URL,
      Viewport: null,
      Styles,
      FontSize: [],
    };

    const auditResult = FontSizeAudit.audit(artifacts);
    assert.equal(auditResult.rawValue, false);
    assert.ok(auditResult.debugString.includes('missing viewport'));
  });

  it('fails when less than 75% of text is legible', () => {
    const artifacts = {
      URL,
      Viewport: validViewport,
      Styles,
      FontSize: [
        {textLength: 1, fontSize: 15, node: {nodeId: 1, localName: 'p', attributes: []}},
        {textLength: 2, fontSize: 16, node: {nodeId: 2, localName: 'p', attributes: []}},
      ],
    };

    const auditResult = FontSizeAudit.audit(artifacts);
    assert.equal(auditResult.rawValue, false);
    assert.ok(auditResult.debugString.includes('33.33%'));
  });

  it('passes when there is no text', () => {
    const artifacts = {
      URL,
      Viewport: validViewport,
      Styles,
      FontSize: [
        {textLength: 0},
        {textLength: 0},
      ],
    };

    const auditResult = FontSizeAudit.audit(artifacts);
    assert.equal(auditResult.rawValue, true);
  });

  it('passes when more than 75% of text is legible', () => {
    const artifacts = {
      URL,
      Viewport: validViewport,
      Styles,
      FontSize: [
        {textLength: 1, fontSize: 15, node: {nodeId: 1, localName: 'p', attributes: []}},
        {textLength: 2, fontSize: 16, node: {nodeId: 2, localName: 'p', attributes: []}},
        {textLength: 2, fontSize: 24, node: {nodeId: 3, localName: 'p', attributes: []}},
      ],
    };
    const auditResult = FontSizeAudit.audit(artifacts);
    assert.equal(auditResult.rawValue, true);
  });

  it('groups entries with same source, sorts them by coverage', () => {
    const style1 = {
      styleSheetId: 1,
      type: CSSStyleDeclaration.Type.Regular,
      range: {
        startLine: 123,
        startColumn: 10,
      },
    };
    const style2 = {
      styleSheetId: 1,
      type: CSSStyleDeclaration.Type.Regular,
      range: {
        startLine: 0,
        startColumn: 10,
      },
    };
    const artifacts = {
      URL,
      Viewport: validViewport,
      Styles,
      FontSize: [
        {textLength: 3, fontSize: 15, node: {nodeId: 1}, cssRule: style1},
        {textLength: 2, fontSize: 14, node: {nodeId: 2}, cssRule: style2},
        {textLength: 2, fontSize: 14, node: {nodeId: 3}, cssRule: style2},
      ],
    };
    const auditResult = FontSizeAudit.audit(artifacts);

    assert.equal(auditResult.rawValue, false);
    assert.equal(auditResult.details.items.length, 2);
    assert.equal(auditResult.details.items[0][2].text, '57.14%');
  });
});
