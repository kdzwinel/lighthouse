/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('../audit');
const URL = require('../../lib/url-shim');

const JAVA_APPLET_TYPE = 'application/x-java-applet';
const JAVA_BEAN_TYPE = 'application/x-java-bean';
const TYPE_BLOCKLIST = new Set([
  'application/x-shockwave-flash',
  // https://docs.oracle.com/cd/E19683-01/816-0378/using_tags/index.html
  JAVA_APPLET_TYPE,
  JAVA_BEAN_TYPE,
  // https://msdn.microsoft.com/es-es/library/cc265156(v=vs.95).aspx
  'application/x-silverlight',
  'application/x-silverlight-2',
]);
const FILE_EXTENSION_BLOCKLIST = new Set([
  'swf',
  'flv',
  'class',
  'xap',
]);
const SOURCE_PARAMS = new Set([
  'code',
  'movie',
  'source',
  'src',
]);

/**
 * Verifies if given MIME type matches any known plugin MIME type
 * @param {string} type
 */
function isPluginType(type) {
  type = type.trim().toLowerCase();

  return TYPE_BLOCKLIST.has(type) ||
    type.startsWith(JAVA_APPLET_TYPE) || // e.g. "application/x-java-applet;jpi-version=1.4"
    type.startsWith(JAVA_BEAN_TYPE);
}

/**
 * Verifies if given url points to a file that has a known plugin extension
 * @param {string} url
 */
function isPluginURL(url) {
  try {
    const filePath = new URL(url, 'http://example.com').pathname;
    const parts = filePath.split('.');

    return parts.length > 1 && FILE_EXTENSION_BLOCKLIST.has(parts.pop().trim().toLowerCase());
  } catch (e) {
    return false;
  }
}

class Plugins extends Audit {
  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      category: 'Content Best Practices',
      name: 'plugins',
      description: 'Document avoids plugins.',
      failureDescription: 'Document doesn\'t avoid plugins',
      helpText: 'Some types of media or content are not playable on mobile devices. ' +
      '[Learn more](https://developers.google.com/speed/docs/insights/AvoidPlugins).',
      requiredArtifacts: ['ExternalContent'],
    };
  }

  /**
   * @param {!Artifacts} artifacts
   * @return {!AuditResult}
   */
  static audit(artifacts) {
    const plugins = artifacts.ExternalContent
      .filter(item => {
        if (item.tagName === 'APPLET') {
          return true;
        }

        if (
          (item.tagName === 'EMBED' || item.tagName === 'OBJECT') &&
          item.type &&
          isPluginType(item.type)
        ) {
          return true;
        }

        const embedSrc = item.src || item.code;
        if (item.tagName === 'EMBED' && embedSrc && isPluginURL(embedSrc)) {
          return true;
        }

        if (item.tagName === 'OBJECT' && item.data && isPluginURL(item.data)) {
          return true;
        }

        const failingParams = item.params.filter(param =>
          SOURCE_PARAMS.has(param.name.trim().toLowerCase()) && isPluginURL(param.value)
        );

        return failingParams.length > 0;
      })
      .map(plugin => {
        const tagName = plugin.tagName.toLowerCase();
        const attributes = ['src', 'data', 'code', 'type']
          .reduce((result, attr) => {
            if (plugin[attr] !== null) {
              result += ` ${attr}="${plugin[attr]}"`;
            }
            return result;
          }, '');
        const params = plugin.params
          .filter(param => SOURCE_PARAMS.has(param.name.trim().toLowerCase()))
          .map(param => `<param ${param.name}="${param.value}" />`)
          .join('');

        return {
          source: {
            type: 'node',
            snippet: `<${tagName}${attributes}>${params}</${tagName}>`,
          },
        };
      });

    const headings = [
      {key: 'source', itemType: 'code', text: 'Source'},
    ];

    const details = Audit.makeTableDetails(headings, plugins);

    return {
      rawValue: plugins.length === 0,
      details,
    };
  }
}

module.exports = Plugins;
