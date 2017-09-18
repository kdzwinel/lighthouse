/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* global document ClipboardEvent getOuterHTMLSnippet */

const Gatherer = require('../gatherer');
const DOMHelpers = require('../../../lib/dom-helpers');

// This is run in the page, not Lighthouse itself.
/* istanbul ignore next */
function findPasswordInputsWithPreventedPaste() {
  return Array.from(document.querySelectorAll('input[type="password"]'))
    .filter(passwordInput =>
      !passwordInput.dispatchEvent(
        new ClipboardEvent('paste', {cancelable: true})
      )
    )
    .map(passwordInput => ({
      snippet: getOuterHTMLSnippet(passwordInput)
    }));
}

class PasswordInputsWithPreventedPaste extends Gatherer {
  /**
   * @param {!Object} options
   * @return {!Promise<!Array<{name: string, id: string}>>}
   */
  afterPass(options) {
    const driver = options.driver;
    return driver.evaluateAsync(`(function () {
      ${DOMHelpers.getOuterHTMLSnippet};
      return (${findPasswordInputsWithPreventedPaste.toString()}());
    })()`);
  }
}


module.exports = PasswordInputsWithPreventedPaste;
