/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env mocha */

const FontSizeGather = require('../../../../gather/gatherers/seo/font-size');
const assert = require('assert');
let fontSizeGather;
const body = {
  nodeName: 'BODY',
  children: [
    {nodeValue: ' text ', nodeType: Node.TEXT_NODE, parentId: 1},
    {nodeValue: ' text ', nodeType: Node.ELEMENT_NODE},
    {nodeValue: '      ', nodeType: Node.TEXT_NODE},
    {nodeValue: 'texttext', nodeType: Node.TEXT_NODE, parentId: 2},
  ],
};
const dom = {
  root: {
    nodeName: 'HTML',
    children: [body],
  },
};

describe('Font size gatherer', () => {
  // Reset the Gatherer before each test.
  beforeEach(() => {
    fontSizeGather = new FontSizeGather();
  });

  it('returns information about font size\'s used on page', () => {
    return fontSizeGather.afterPass({
      driver: {
        sendCommand(command, params) {
          let result;
          if (command === 'DOM.getDocument') {
            result = dom;
          } else if (command === 'CSS.getComputedStyleForNode') {
            result = {computedStyle: [
              {name: 'font-size', value: params.nodeId === 1 ? 10 : 20},
            ]};
          } else if (command === 'CSS.getMatchedStylesForNode') {
            result = {
              inlineStyle: null,
              attributesStyle: null,
              matchedCSSRules: [],
              inherited: [],
            };
          }

          return Promise.resolve(result);
        },
      },
    }).then(artifact => {
      assert.deepEqual(artifact, [
        {
          fontSize: 10,
          textLength: 4,
          cssRule: undefined,
          node: body,
        },
        {
          fontSize: 20,
          textLength: 8,
          cssRule: undefined,
          node: body,
        },
      ]);
    });
  });
});
