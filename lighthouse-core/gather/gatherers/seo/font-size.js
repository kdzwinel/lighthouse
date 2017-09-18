/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Gatherer = require('../gatherer');
const TEXT_NODE = 3;

function findBody(node) {
  const queue = [node];

  while(queue.length > 0) {
    const currentNode = queue.shift();

    if(currentNode.nodeName === 'BODY') {
      return currentNode;
    }

    if(currentNode.children) {
      currentNode.children.forEach(child => queue.push(child));
    }
  }

  return null;
}

function flattenTree(node) {
  const flat = [node];

  for (let i = 0; i < flat.length; i++) {
    const currentNode = flat[i];

    if(currentNode.children) {
      currentNode.children.forEach(child => {
        child.parentNode = currentNode;
        flat.push(child);
      });
    }
  }

  return flat;
}

function getAllNodesFromBody(driver) {
  return driver.sendCommand('DOM.getDocument', {depth: -1, pierce: true})
    .then(result => {
      const body = findBody(result.root);
      return body ? flattenTree(body) : [];
    });
}

function getFontSizeRule({inlineStyle, matchedCSSRules, inherited}) {

  // TODO https://cs.chromium.org/chromium/src/third_party/WebKit/Source/devtools/front_end/sdk/CSSMatchedStyles.js?type=cs&q=SDK.CSSMatchedS&sq=package:chromium&l=1

  return {};
}

function getFontSizeInformation(driver, node) {
  const computedStyles = driver.sendCommand('CSS.getComputedStyleForNode', {nodeId: node.nodeId});
  const matchedRules = driver.sendCommand('CSS.getMatchedStylesForNode', {nodeId: node.parentId});

  return Promise.all([computedStyles, matchedRules])
    .then(result => {
      const [{computedStyle}, matchedRules] = result;
      const fontSizeProperty = computedStyle.find(({name}) => name === 'font-size');

      return {
        fontSize: parseInt(fontSizeProperty.value, 10),
        textLength: node.nodeValue.trim().length,
        cssRule: getFontSizeRule(matchedRules)
      };
    });
}

class FontSize extends Gatherer {

  /**
   * @param {{driver: !Object}} options Run options
   * @return {!Promise<Object<int,int>>} The font-size value of the document body
   */
  afterPass(options) {
    const enableDOM = options.driver.sendCommand('DOM.enable');
    const enableCSS = options.driver.sendCommand('CSS.enable');

    return Promise.all([enableDOM, enableCSS])
    .then(() => getAllNodesFromBody(options.driver))
    .then(nodes => nodes.filter(node => node.nodeType === TEXT_NODE && node.nodeValue.trim().length > 0))
    .then(textNodes => Promise.all(textNodes.map(node => getFontSizeInformation(options.driver, node))))
    .then(fontSizeInfo => {
      console.log(fontSizeInfo);
      const result = {};

      options.driver.sendCommand('DOM.disable');
      options.driver.sendCommand('CSS.disable');

      return result;
    });
  }
}

module.exports = FontSize;

