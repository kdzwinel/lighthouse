/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const CanonicalAudit = require('../../../audits/seo/canonical.js');
const assert = require('assert');

/* eslint-env mocha */

describe('SEO: Document has valid canonical link', () => {
  it('fails when link is invalid 1', () => {
    const mainResource = {
      url: 'https://example.com/blog/',
      responseHeaders: [],
    };
    const artifacts = {
      devtoolsLogs: {[CanonicalAudit.DEFAULT_PASS]: []},
      requestMainResource: () => Promise.resolve(mainResource),
      Canonical: ['https://example.com/'],
    };

    return CanonicalAudit.audit(artifacts).then(auditResult => {
      assert.equal(auditResult.rawValue, false);
    });
  });

  it('fails when link is invalid 2', () => {
    const mainResource = {
      url: 'https://example.de/',
      responseHeaders: [],
    };
    const artifacts = {
      devtoolsLogs: {[CanonicalAudit.DEFAULT_PASS]: []},
      requestMainResource: () => Promise.resolve(mainResource),
      Canonical: ['https://example.com/'],
    };

    return CanonicalAudit.audit(artifacts).then(auditResult => {
      assert.equal(auditResult.rawValue, false);
    });
  });

  it('fails when link is invalid 3', () => {
    const mainResource = {
      url: 'https://example.com/de/',
      responseHeaders: [],
    };
    const artifacts = {
      devtoolsLogs: {[CanonicalAudit.DEFAULT_PASS]: []},
      requestMainResource: () => Promise.resolve(mainResource),
      Canonical: ['/'],
    };

    return CanonicalAudit.audit(artifacts).then(auditResult => {
      assert.equal(auditResult.rawValue, false);
    });
  });

  it('succeeds when link is valid 1', () => {
    const mainResource = {
      url: 'https://example.de/',
      responseHeaders: [],
    };
    const artifacts = {
      devtoolsLogs: {[CanonicalAudit.DEFAULT_PASS]: []},
      requestMainResource: () => Promise.resolve(mainResource),
      Canonical: ['https://example.com/de/'],
    };

    return CanonicalAudit.audit(artifacts).then(auditResult => {
      assert.equal(auditResult.rawValue, true);
    });
  });

  it('succeeds when link is valid 2', () => {
    const mainResource = {
      url: 'https://example.com/de/',
      responseHeaders: [],
    };
    const artifacts = {
      devtoolsLogs: {[CanonicalAudit.DEFAULT_PASS]: []},
      requestMainResource: () => Promise.resolve(mainResource),
      Canonical: ['https://example.de/'],
    };

    return CanonicalAudit.audit(artifacts).then(auditResult => {
      assert.equal(auditResult.rawValue, true);
    });
  });

});
