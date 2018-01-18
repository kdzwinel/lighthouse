/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* globals self */

class AccessibilityCategoryRenderer extends CategoryRenderer {

  /**
   * @param {!ReportRenderer.CategoryJSON} category
   * @param {!Object<string, !ReportRenderer.GroupJSON>} groupDefinitions
   * @return {!Element}
   */
  render(category, groupDefinitions) {
    const element = this._dom.createElement('div', 'lh-category');
    this._createPermalinkSpan(element, category.id);
    element.appendChild(this._renderCategoryScore(category));

    const manualAudits = category.audits.filter(audit => audit.result.manual);
    const nonManualAudits = category.audits.filter(audit => !manualAudits.includes(audit));

    const auditsGroupedByGroup = /** @type {!Object<string,
      {passed: !Array<!ReportRenderer.AuditJSON>,
      failed: !Array<!ReportRenderer.AuditJSON>,
      notApplicable: !Array<!ReportRenderer.AuditJSON>}>} */ ({});
    const auditsUngrouped = {passed: [], failed: [], notApplicable: []};

    nonManualAudits.forEach(audit => {
      let group;

      if (audit.group) {
        const groupId = audit.group;

        if (auditsGroupedByGroup[groupId]) {
          group = auditsGroupedByGroup[groupId];
        } else {
          group = {passed: [], failed: [], notApplicable: []};
          auditsGroupedByGroup[groupId] = group;
        }
      } else {
        group = auditsUngrouped;
      }

      if (audit.result.notApplicable) {
        group.notApplicable.push(audit);
      } else if (audit.score === 100 && !audit.result.debugString) {
        group.passed.push(audit);
      } else {
        group.failed.push(audit);
      }
    });

    const failedElements = /** @type {!Array<!Element>} */ ([]);
    const passedElements = /** @type {!Array<!Element>} */ ([]);
    const notApplicableElements = /** @type {!Array<!Element>} */ ([]);

    auditsUngrouped.failed
      .forEach(audit => failedElements.push(this._renderAudit(audit)));
    auditsUngrouped.passed
      .forEach(audit => passedElements.push(this._renderAudit(audit)));
    auditsUngrouped.notApplicable
      .forEach(audit => notApplicableElements.push(this._renderAudit(audit)));

    let failedAuditsCount = failedElements.length;

    Object.keys(auditsGroupedByGroup).forEach(groupId => {
      const group = groupDefinitions[groupId];
      const groups = auditsGroupedByGroup[groupId];

      failedAuditsCount += groups.failed.length;

      if (groups.failed.length) {
        const auditGroupElem = this._renderAuditGroup(group, {expandable: true});
        groups.failed.forEach(item => auditGroupElem.appendChild(this._renderAudit(item)));
        auditGroupElem.open = true;
        failedElements.push(auditGroupElem);
      }

      if (groups.passed.length) {
        const auditGroupElem = this._renderAuditGroup(group, {expandable: true});
        groups.passed.forEach(item => auditGroupElem.appendChild(this._renderAudit(item)));
        passedElements.push(auditGroupElem);
      }

      if (groups.notApplicable.length) {
        const auditGroupElem = this._renderAuditGroup(group, {expandable: true});
        groups.notApplicable.forEach(item => auditGroupElem.appendChild(this._renderAudit(item)));
        notApplicableElements.push(auditGroupElem);
      }
    });

    if (failedElements.length) {
      const nonPassedElem = this._renderAuditGroup({
        title: `${failedAuditsCount} Failed Audits`,
      }, {expandable: true});
      nonPassedElem.classList.add('lh-failed-audits');
      failedElements.forEach(element => nonPassedElem.appendChild(element));
      element.appendChild(nonPassedElem);
    }

    if (passedElements.length) {
      const passedElem = this._renderPassedAuditsSection(passedElements);
      element.appendChild(passedElem);
    }

    if (notApplicableElements.length) {
      const notApplicableElem = this._renderNotApplicableAuditsSection(notApplicableElements);
      element.appendChild(notApplicableElem);
    }

    // Render manual audits after passing.
    this._renderManualAudits(manualAudits, groupDefinitions, element);

    return element;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityCategoryRenderer;
} else {
  self.AccessibilityCategoryRenderer = AccessibilityCategoryRenderer;
}
