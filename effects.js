// Efeitos leves: barra do topo ao rolar, seção atual no menu, foco de luz nos cartões
// e animações contínuas ligadas só enquanto a seção está visível.
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setupNavShadow() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    let ticking = false;
    const update = () => {
      nav.classList.toggle('scrolled', window.scrollY > 8);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  // Marca no menu a seção que ocupa o meio da tela.
  function setupScrollSpy() {
    if (!('IntersectionObserver' in window)) return;
    const links = [...document.querySelectorAll('.links a[href^="#"]')];
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const sections = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
    // As seções de cada app ficam sob "Apps".
    const appRows = [...document.querySelectorAll('.feature-row[data-app]')];
    const observer = new IntersectionObserver((entries) => {
      entries.filter((e) => e.isIntersecting).forEach((entry) => {
        const id = entry.target.dataset.app ? 'apps' : entry.target.id;
        links.forEach((a) => a.classList.toggle('active', a === byId.get(id)));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    [...sections, ...appRows].forEach((el) => observer.observe(el));
  }

  // Liga .live só enquanto o elemento está na tela, para as animações em loop pararem fora dela.
  function setupLiveSections() {
    const targets = document.querySelectorAll('.hero, .feature-row');
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle('live', e.isIntersecting));
    }, { rootMargin: '80px 0px' });
    targets.forEach((el) => observer.observe(el));
  }

  // Foco de luz que acompanha o mouse nos cartões (só em telas com mouse).
  function setupSpotlight() {
    if (!window.matchMedia('(hover: hover)').matches) return;
    document.querySelectorAll('.card').forEach((card) => {
      let frame = 0;
      card.addEventListener('pointermove', (event) => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
          card.style.setProperty('--my', `${event.clientY - rect.top}px`);
          frame = 0;
        });
      });
    });
  }

  // Menu do celular: fecha ao tocar fora ou com Esc.
  function setupMenuDismiss() {
    const toggle = document.querySelector('.menu-toggle');
    const links = document.querySelector('.links');
    if (!toggle || !links) return;
    const close = () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    document.addEventListener('click', (event) => {
      if (!links.classList.contains('open')) return;
      if (!links.contains(event.target) && !toggle.contains(event.target)) close();
    });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
    links.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
  }

  setupNavShadow();
  setupScrollSpy();
  setupLiveSections();
  setupSpotlight();
  setupMenuDismiss();
})();
