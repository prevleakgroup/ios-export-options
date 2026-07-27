(function () {
  const templates = {
    field: {
      label: 'Field dispatch',
      title: 'Live field dispatch readiness',
      summary:
        'The experience is designed to turn intake, verification, and service completion into one clear operational workflow for crews and supervisors.',
      metrics: [
        { label: 'Active queues', value: '18' },
        { label: 'Verified jobs', value: '12' },
        { label: 'Escalations', value: '3' }
      ],
      actions: [
        'Auto-route requests to the closest available crew',
        'Surface status updates in one shared view',
        'Flag repeat-risk incidents for immediate review'
      ]
    },
    public: {
      label: 'Public reporting',
      title: 'Community reporting with structured follow-through',
      summary:
        'Residents and officials can submit issues with enough context for the team to triage, assign, and monitor them efficiently.',
      metrics: [
        { label: 'New reports', value: '7' },
        { label: 'Priority cases', value: '4' },
        { label: 'Resolved today', value: '9' }
      ],
      actions: [
        'Capture evidence and service notes in a guided flow',
        'Prioritize high-impact reports for faster action',
        'Keep each case visible until it reaches closure'
      ]
    },
    ai: {
      label: 'AI-ready handoff',
      title: 'Decision support that stays simple and useful',
      summary:
        'The system combines operational context, service history, and reporting patterns to support faster, more informed next steps.',
      metrics: [
        { label: 'Signals reviewed', value: '24' },
        { label: 'Suggested follow-ups', value: '6' },
        { label: 'Confidence score', value: '92%' }
      ],
      actions: [
        'Summarize incidents into a concise next-step brief',
        'Highlight recurring issues for proactive planning',
        'Support human review without adding complexity'
      ]
    }
  };

  function renderPanel(panel, key) {
    const data = templates[key] || templates.field;
    const label = panel.querySelector('[data-ops-label]');
    const title = panel.querySelector('[data-ops-title]');
    const summary = panel.querySelector('[data-ops-summary]');
    const metrics = panel.querySelector('[data-ops-metrics]');
    const list = panel.querySelector('[data-ops-list]');

    if (label) {
      label.textContent = data.label;
    }
    if (title) {
      title.textContent = data.title;
    }
    if (summary) {
      summary.textContent = data.summary;
    }
    if (metrics) {
      metrics.textContent = '';
      data.metrics.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'ops-metric';

        const labelEl = document.createElement('span');
        labelEl.textContent = String(item.label || '');

        const valueEl = document.createElement('strong');
        valueEl.textContent = String(item.value || '');

        row.appendChild(labelEl);
        row.appendChild(valueEl);
        metrics.appendChild(row);
      });
    }
    if (list) {
      list.textContent = '';
      data.actions.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = String(item || '');
        list.appendChild(li);
      });
    }

    panel.querySelectorAll('.ops-tab').forEach((button) => {
      button.classList.toggle('active', button.dataset.opsKey === key);
      button.setAttribute('aria-selected', button.dataset.opsKey === key ? 'true' : 'false');
    });
  }

  function initPanel(panel) {
    const tabs = panel.querySelector('.ops-tabs');
    if (!tabs) return;

    const defaultKey = panel.dataset.opsDefault || 'field';

    Object.entries(templates).forEach(([key, value]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ops-tab';
      button.dataset.opsKey = key;
      button.textContent = value.label;
      button.setAttribute('aria-selected', key === defaultKey ? 'true' : 'false');
      button.addEventListener('click', () => renderPanel(panel, key));
      tabs.appendChild(button);
    });

    renderPanel(panel, defaultKey);
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-ops-panel]').forEach(initPanel);
  });
})();
