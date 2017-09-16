/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Gatherer = require('../gatherer');
const DOMHelpers = require('../../../lib/dom-helpers.js');

class FontSize extends Gatherer {

  /**
   * @param {{driver: !Object}} options Run options
   * @return {!Promise<Object<int,int>>} The font-size value of the document body
   */
  afterPass(options) {
    const expression = `(function() {
      ${DOMHelpers.getElementsInDocumentFnString}; // define function on page
      const elements = getElementsInDocument('body *');

      return elements.reduce((result, element) => {
        const textLength = Array.from(element.childNodes)
          .filter(node => node.nodeType === Node.TEXT_NODE)
          .reduce((sum, textNode) => sum + textNode.nodeValue.trim().length, 0);

        if(textLength) {
          const fontSize = parseInt(getComputedStyle(element)["font-size"], 10);

          if (!result[fontSize]) {
            result[fontSize] = {fontSize, textLength: 0, elements: []};
          }

          result[fontSize].textLength += textLength;
          result[fontSize].elements.push(element.tagName);
        }

        return result;
      }, {});
    })()`;

    return options.driver.evaluateAsync(expression);
  }
}

module.exports = FontSize;

