(() => {
  const canUseCustomCursor = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!canUseCustomCursor || reduceMotion) {
    return;
  }

  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor is-hidden';
  cursor.dataset.kind = 'bottle';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = `
    <div class="custom-cursor__shape">
      <svg class="cursor-bottle" viewBox="0 0 64 64" focusable="false">
        <path d="M26 5h12v9l5 5v31c0 6-5 10-11 10s-11-4-11-10V19l5-5V5Z" fill="#fff8ef" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
        <path d="M27 5h10" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
        <path d="M21 30h22" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <path d="M26 42h12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      </svg>
      <svg class="cursor-ladle" viewBox="0 0 64 64" focusable="false">
        <path d="M48 8 23 33" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
        <path d="M15 35c7-7 22 4 15 14-5 7-17 7-22 2-4-4-1-11 7-16Z" fill="#fff8ef" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
        <path d="M48 8c4-4 10 2 6 6" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
      </svg>
    </div>
  `;

  document.body.appendChild(cursor);
  document.body.classList.add('has-custom-cursor');

  let targetX = -80;
  let targetY = -80;
  let currentX = -80;
  let currentY = -80;

  function animate() {
    currentX += (targetX - currentX) * 0.22;
    currentY += (targetY - currentY) * 0.22;
    cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    window.requestAnimationFrame(animate);
  }

  function setKind(target) {
    if (!target?.closest) {
      cursor.dataset.kind = 'bottle';
      return;
    }

    const formTarget = target.closest('input, textarea, select, label, form, .form-panel, .auth-layout');
    const foodTarget = target.closest('[data-kind="food"], .request-card, .request-action, .help-card, .quick-help-card, .materials-mini-card, .material-card, .donate-card, .photo-card, #help, #materials');
    cursor.dataset.kind = foodTarget && !formTarget ? 'ladle' : 'bottle';
  }

  document.addEventListener('pointermove', (event) => {
    targetX = event.clientX + 12;
    targetY = event.clientY + 12;
    cursor.classList.remove('is-hidden');
    setKind(event.target);
  });

  document.addEventListener('pointerdown', () => {
    cursor.classList.add('is-pressed');
  });

  document.addEventListener('pointerup', () => {
    cursor.classList.remove('is-pressed');
  });

  document.documentElement.addEventListener('mouseleave', () => {
    cursor.classList.add('is-hidden');
  });

  document.documentElement.addEventListener('mouseenter', () => {
    cursor.classList.remove('is-hidden');
  });

  animate();
})();
