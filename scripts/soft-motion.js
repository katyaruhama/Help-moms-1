(() => {
  const storageKey = 'mamam-motion-enabled';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealSelectors = [
    '.section-head',
    '.section-head-compact',
    '.page-hero .container > *',
    '.hero-content > *',
    '.card',
    '.photo-card',
    '.after-card',
    '.step',
    '.help-card',
    '.quick-help-card',
    '.request-card',
    '.donate-card',
    '.materials-mini-card',
    '.material-card',
    '.analysis-panel',
    '.analysis-result',
    '.intro-panel',
    '.form-panel',
    '.auth-layout > *',
    '.faq-item',
    '.trust-card'
  ];

  const elements = Array.from(document.querySelectorAll(revealSelectors.join(',')));
  const toggle = createToggle();
  let observer = null;
  let enabled = getInitialState();

  document.body.appendChild(toggle);
  setMotion(enabled);

  toggle.addEventListener('click', () => {
    enabled = !enabled;
    writeSavedState(enabled);
    setMotion(enabled);
  });

  function getInitialState() {
    const saved = readSavedState();

    if (saved === 'on') {
      return !reduceMotion;
    }

    if (saved === 'off') {
      return false;
    }

    return !reduceMotion;
  }

  function setMotion(shouldEnable) {
    toggle.dataset.enabled = shouldEnable ? 'true' : 'false';
    toggle.setAttribute('aria-pressed', String(shouldEnable));
    toggle.setAttribute('aria-label', shouldEnable ? 'Выключить мягкую анимацию' : 'Включить мягкую анимацию');
    toggle.title = shouldEnable ? 'Выключить анимацию' : 'Включить анимацию';

    if (!elements.length || !shouldEnable) {
      disableMotion();
      return;
    }

    enableMotion();
  }

  function enableMotion() {
    document.body.classList.remove('motion-disabled');
    document.body.classList.add('motion-ready');

    elements.forEach((element, index) => {
      element.classList.add('motion-reveal');
      element.style.setProperty('--motion-delay', `${Math.min(index % 6, 5) * 55}ms`);
    });

    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => {
        element.classList.add('is-visible');
      });
      return;
    }

    observer?.disconnect();
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.12
    });

    elements.forEach((element) => {
      if (element.getBoundingClientRect().top < window.innerHeight * 0.92) {
        element.classList.add('is-visible');
        return;
      }

      observer.observe(element);
    });
  }

  function disableMotion() {
    observer?.disconnect();
    observer = null;
    document.body.classList.remove('motion-ready');
    document.body.classList.add('motion-disabled');

    elements.forEach((element) => {
      element.classList.remove('motion-reveal', 'is-visible');
      element.style.removeProperty('--motion-delay');
    });
  }

  function createToggle() {
    const button = document.createElement('button');
    button.className = 'motion-toggle';
    button.type = 'button';
    button.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 14c2.6-5.6 6-5.6 8 0s5.4 5.6 8 0" />
        <path d="M4 10c2.6-5.6 6-5.6 8 0s5.4 5.6 8 0" />
      </svg>
    `;
    return button;
  }

  function readSavedState() {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  }

  function writeSavedState(value) {
    try {
      localStorage.setItem(storageKey, value ? 'on' : 'off');
    } catch {
      // The toggle still works for the current page even if storage is blocked.
    }
  }
})();
