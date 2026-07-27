(function () {
  const defaults = {
    title: 'Premium brand copy ready for rollout',
    summary:
      'The group now presents a polished, high-trust visual system designed for modern mobility, reporting, and enterprise communication.',
    bullets: [
      'Refined brand positioning for B2B audiences',
      'Premium digital messaging for product launches',
      'Flexible content layer for future growth and automation'
    ]
  };

  async function loadContent() {
    const target = document.getElementById('genspark-output');
    if (!target) return;

    const config = window.__GENSPARK_CONFIG__ || {};
    const endpoint = config.apiBaseUrl;
    const apiKey = config.apiKey;

    if (endpoint && apiKey) {
      try {
        const response = await fetch(`${endpoint.replace(/\/$/, '')}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            prompt: 'Create premium brand copy for Qvedic for a professional technology company website.',
            tone: 'confident, premium, concise'
          })
        });

        if (response.ok) {
          const data = await response.json();
          renderContent(target, data);
          return;
        }
      } catch (error) {
        console.warn('Content request failed, using local fallback.', error);
      }
    }

    renderContent(target, defaults);
  }

  function renderContent(target, data) {
    const title = data.title || defaults.title;
    const summary = data.summary || defaults.summary;
    const bullets = data.bullets || defaults.bullets;

    target.textContent = '';

    const card = document.createElement('div');
    card.className = 'ai-card';

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = 'Ready-to-use content layer';

    const heading = document.createElement('h3');
    heading.textContent = title;

    const paragraph = document.createElement('p');
    paragraph.textContent = summary;

    const ul = document.createElement('ul');
    (Array.isArray(bullets) ? bullets : defaults.bullets).forEach((item) => {
      const li = document.createElement('li');
      li.textContent = String(item || '');
      ul.appendChild(li);
    });

    card.appendChild(eyebrow);
    card.appendChild(heading);
    card.appendChild(paragraph);
    card.appendChild(ul);
    target.appendChild(card);
  }

  document.addEventListener('DOMContentLoaded', loadContent);
})();
