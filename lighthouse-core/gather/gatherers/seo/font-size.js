/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const CSSMatchedStyles = require('../../../lib/web-inspector').CSSMatchedStyles;
const Gatherer = require('../gatherer');
const TEXT_NODE = 3;
const FONT_SIZE_PROPERTY_NAME = 'font-size';

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

function getFontSizeRule(node, {inlineStyle, matchedCSSRules, inherited}) {
  const cssModel = {
    styleSheetHeaderForId: id => {
      return {id: id};
    }
  };

  const nodeType = node.nodeType;
  node.nodeType = () => nodeType;
  const matchedStyles = new CSSMatchedStyles(cssModel, node, inlineStyle, null, matchedCSSRules, null, inherited, null);

  const nodeStyles = matchedStyles.nodeStyles();
  const matchingRule = nodeStyles.find(style => {
    const property = style.allProperties.find(property => property.name === FONT_SIZE_PROPERTY_NAME);
    return property &&
      matchedStyles.propertyState(property) !== CSSMatchedStyles.PropertyState.Overloaded;
  });

  return matchingRule;
}

function getFontSizeInformation(driver, node) {
  const computedStyles = driver.sendCommand('CSS.getComputedStyleForNode', {nodeId: node.nodeId});
  const matchedRules = driver.sendCommand('CSS.getMatchedStylesForNode', {nodeId: node.parentId});

  return Promise.all([computedStyles, matchedRules])
    .then(result => {
      const [{computedStyle}, matchedRules] = result;
      const fontSizeProperty = computedStyle.find(({name}) => name === FONT_SIZE_PROPERTY_NAME);

      return {
        fontSize: parseInt(fontSizeProperty.value, 10),
        textLength: node.nodeValue.trim().length,
        cssRule: getFontSizeRule(node, matchedRules)
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
      options.driver.sendCommand('DOM.disable');
      options.driver.sendCommand('CSS.disable');

      return fontSizeInfo;
    });
  }
}

module.exports = FontSize;

