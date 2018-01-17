/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* globals self, Util */

class CategoryRenderer {
  /**
   * @param {!DOM} dom
   * @param {!DetailsRenderer} detailsRenderer
   */
  constructor(dom, detailsRenderer) {
    /** @private {!DOM} */
    this._dom = dom;
    /** @private {!DetailsRenderer} */
    this._detailsRenderer = detailsRenderer;
    /** @private {!Document|!Element} */
    this._templateContext = this._dom.document();

    this._detailsRenderer.setTemplateContext(this._templateContext);
  }

  /**
   * @param {!ReportRenderer.AuditJSON} audit
   * @return {!Element}
   */
  _renderAuditScore(audit) {
    const tmpl = this._dom.cloneTemplate('#tmpl-lh-audit-score', this._templateContext);

    const scoringMode = audit.result.scoringMode;
    const description = audit.result.helpText;
    let title = audit.result.description;

    if (audit.result.displayValue) {
      title += `:  ${audit.result.displayValue}`;
    }

    if (audit.result.debugString) {
      const debugStrEl = tmpl.appendChild(this._dom.createElement('div', 'lh-debug'));
      debugStrEl.textContent = audit.result.debugString;
    }

    // Append audit details to header section so the entire audit is within a <details>.
    const header = /** @type {!HTMLDetailsElement} */ (this._dom.find('.lh-score__header', tmpl));
    if (audit.result.details) {
      header.appendChild(this._detailsRenderer.render(audit.result.details));
    }

    const scoreEl = this._dom.find('.lh-score', tmpl);
    if (audit.result.informative) {
      scoreEl.classList.add('lh-score--informative');
    }
    if (audit.result.manual) {
      scoreEl.classList.add('lh-score--manual');
    }

    return this._populateScore(tmpl, audit.score, scoringMode, title, description);
  }

  /**
   * @param {!DocumentFragment|!Element} element DOM node to populate with values.
   * @param {number} score
   * @param {string} scoringMode
   * @param {string} title
   * @param {string} description
   * @return {!Element}
   */
  _populateScore(element, score, scoringMode, title, description) {
    // Fill in the blanks.
    const valueEl = this._dom.find('.lh-score__value', element);
    valueEl.textContent = Util.formatNumber(score);
    valueEl.classList.add(`lh-score__value--${Util.calculateRating(score)}`,
        `lh-score__value--${scoringMode}`);

    this._dom.find('.lh-score__title', element).appendChild(
        this._dom.convertMarkdownCodeSnippets(title));
    this._dom.find('.lh-score__description', element)
        .appendChild(this._dom.convertMarkdownLinkSnippets(description));

    return /** @type {!Element} **/ (element);
  }

  /**
   * @param {!ReportRenderer.CategoryJSON} category
   * @return {!Element}
   */
  _renderCategoryScore(category) {
    const tmpl = this._dom.cloneTemplate('#tmpl-lh-category-score', this._templateContext);
    const score = Math.round(category.score);

    const gaugeContainerEl = this._dom.find('.lh-score__gauge', tmpl);
    const gaugeEl = this.renderScoreGauge(category);
    gaugeContainerEl.appendChild(gaugeEl);

    return this._populateScore(tmpl, score, 'numeric', category.name, category.description);
  }

  /**
   * @param {!ReportRenderer.AuditJSON} audit
   * @return {!Element}
   */
  _renderAudit(audit) {
    const element = this._dom.createElement('div', 'lh-audit');
    element.appendChild(this._renderAuditScore(audit));
    return element;
  }

  /**
   * Renders the group container for a group of audits. Individual audit elements can be added
   * directly to the returned element.
   * @param {!ReportRenderer.GroupJSON} group
   * @param {{expandable: boolean}} opts
   * @return {!Element}
   */
  _renderAuditGroup(group, opts) {
    const expandable = opts.expandable;
    const element = this._dom.createElement(expandable ? 'details' : 'div', 'lh-audit-group');
    const summmaryEl = this._dom.createChildOf(element, 'summary', 'lh-audit-group__summary');
    const headerEl = this._dom.createChildOf(summmaryEl, 'div', 'lh-audit-group__header');
    this._dom.createChildOf(summmaryEl, 'div',
      `lh-toggle-arrow  ${expandable ? '' : ' lh-toggle-arrow-unexpandable'}`, {
        title: 'See audits',
      });

    if (group.description) {
      const auditGroupDescription = this._dom.createElement('div', 'lh-audit-group__description');
      auditGroupDescription.appendChild(this._dom.convertMarkdownLinkSnippets(group.description));
      element.appendChild(auditGroupDescription);
    }
    headerEl.textContent = group.title;

    return element;
  }

  /**
   * Find the total number of audits contained within a section.
   * Accounts for nested subsections like Accessibility.
   * @param {!Array<!Element>} elements
   * @return {number}
   */
  _getTotalAuditsLength(elements) {
    // Create a scratch element to append sections to so we can reuse querySelectorAll().
    const scratch = this._dom.createElement('div');
    elements.forEach(function(element) {
      scratch.appendChild(element);
    });
    const subAudits = scratch.querySelectorAll('.lh-audit');
    if (subAudits.length) {
      return subAudits.length;
    } else {
      return elements.length;
    }
  }

  /**
   * @param {!Array<!Element>} elements
   * @return {!Element}
   */
  _renderPassedAuditsSection(elements) {
    const passedElem = this._renderAuditGroup({
      title: `${this._getTotalAuditsLength(elements)} Passed Audits`,
    }, {expandable: true});
    passedElem.classList.add('lh-passed-audits');
    elements.forEach(elem => passedElem.appendChild(elem));
    return passedElem;
  }

  /**
   * @param {!Array<!Element>} elements
   * @return {!Element}
   */
  _renderNotApplicableAuditsSection(elements) {
    const notApplicableElem = this._renderAuditGroup({
      title: `${this._getTotalAuditsLength(elements)} Not Applicable Audits`,
    }, {expandable: true});
    notApplicableElem.classList.add('lh-audit-group--notapplicable');
    elements.forEach(elem => notApplicableElem.appendChild(elem));
    return notApplicableElem;
  }

  /**
   * @param {!Array<!ReportRenderer.AuditJSON>} manualAudits
   * @param {!Object<string, !ReportRenderer.GroupJSON>} groupDefinitions
   * @param {!Element} element Parent container to add the manual audits to.
   */
  _renderManualAudits(manualAudits, groupDefinitions, element) {
    const auditsGroupedByGroup = /** @type {!Object<string,
        !Array<!ReportRenderer.AuditJSON>>} */ ({});
    manualAudits.forEach(audit => {
      const group = auditsGroupedByGroup[audit.group] || [];
      group.push(audit);
      auditsGroupedByGroup[audit.group] = group;
    });

    Object.keys(auditsGroupedByGroup).forEach(groupId => {
      const group = groupDefinitions[groupId];
      const auditGroupElem = this._renderAuditGroup(group, {expandable: true});
      auditGroupElem.classList.add('lh-audit-group--manual');

      auditsGroupedByGroup[groupId].forEach(audit => {
        auditGroupElem.appendChild(this._renderAudit(audit));
      });

      element.appendChild(auditGroupElem);
    });
  }

  /**
   * @param {!Document|!Element} context
   */
  setTemplateContext(context) {
    this._templateContext = context;
    this._detailsRenderer.setTemplateContext(context);
  }

  /**
   * @param {!ReportRenderer.CategoryJSON} category
   * @return {!DocumentFragment}
   */
  renderScoreGauge(category) {
    const tmpl = this._dom.cloneTemplate('#tmpl-lh-gauge', this._templateContext);
    this._dom.find('.lh-gauge__wrapper', tmpl).href = `#${category.id}`;
    this._dom.find('.lh-gauge__label', tmpl).textContent = category.name;

    const score = Math.round(category.score);
    const fillRotation = Math.floor((score / 100) * 180);

    const gauge = this._dom.find('.lh-gauge', tmpl);
    gauge.setAttribute('data-progress', score); // .dataset not supported in jsdom.
    gauge.classList.add(`lh-gauge--${Util.calculateRating(score)}`);

    this._dom.findAll('.lh-gauge__fill', gauge).forEach(el => {
      el.style.transform = `rotate(${fillRotation}deg)`;
    });

    this._dom.find('.lh-gauge__mask--full', gauge).style.transform =
        `rotate(${fillRotation}deg)`;
    this._dom.find('.lh-gauge__fill--fix', gauge).style.transform =
        `rotate(${fillRotation * 2}deg)`;
    this._dom.find('.lh-gauge__percentage', gauge).textContent = score;

    return tmpl;
  }

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
    const passedAudits = nonManualAudits.filter(audit => audit.score === 100 &&
        !audit.result.debugString);
    const nonPassedAudits = nonManualAudits.filter(audit => !passedAudits.includes(audit));

    const nonPassedElem = this._renderAuditGroup({
      title: `${nonPassedAudits.length} Failed Audits`,
    }, {expandable: false});
    nonPassedElem.classList.add('lh-failed-audits');
    nonPassedAudits.forEach(audit => nonPassedElem.appendChild(this._renderAudit(audit)));
    element.appendChild(nonPassedElem);

    // Create a passed section if there are passing audits.
    if (passedAudits.length) {
      const passedElem = this._renderPassedAuditsSection(
        passedAudits.map(audit => this._renderAudit(audit))
      );
      element.appendChild(passedElem);
    }

    // Render manual audits after passing.
    this._renderManualAudits(manualAudits, groupDefinitions, element);

    return element;
  }

  /**
   * Create a non-semantic span used for hash navigation of categories
   * @param {!Element} element
   * @param {string} id
   */
  _createPermalinkSpan(element, id) {
    const permalinkEl = this._dom.createChildOf(element, 'span', 'lh-permalink');
    permalinkEl.id = id;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CategoryRenderer;
} else {
  self.CategoryRenderer = CategoryRenderer;
}
