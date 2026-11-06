// Catálogo da página inicial: filtro por categoria, busca e prévia rápida de cada app.
// O conteúdo de cada prévia já está no HTML (div.app-detail dentro do cartão), traduzido pelo i18n.js;
// ao abrir, o bloco é movido para o <dialog class="preview"> e volta para o cartão ao trocar ou fechar.
// As capturas grandes só carregam quando a prévia abre (data-src -> src).
(() => {
  const section = document.querySelector('.catalog');
  const dialog = document.querySelector('dialog.preview');
  if (!section || !dialog) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const grid = section.querySelector('.cat-grid');
  const chips = [...section.querySelectorAll('.cat-chip')];
  const input = section.querySelector('.cat-input');
  const empty = section.querySelector('.cat-empty');
  const content = dialog.querySelector('.pv-content');
  const scroller = dialog.querySelector('.pv-scroll');
  const pos = dialog.querySelector('.pv-pos');
  const prevBtn = dialog.querySelector('.pv-prev');
  const nextBtn = dialog.querySelector('.pv-next');

  const cards = [...grid.querySelectorAll('.app-card')].map((el) => ({
    el,
    key: el.dataset.app,
    cats: (el.dataset.cats || '').split(/\s+/).filter(Boolean),
    detail: el.querySelector('.app-detail'),
  }));
  const byKey = new Map(cards.map((c) => [c.key, c]));
  const state = { cat: 'all', query: '' };

  // Busca sem acento e sem diferença de maiúsculas, no idioma que está na tela.
  const fold = (text) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  const searchText = (card) => fold([
    card.el.querySelector('h3')?.textContent,
    card.el.querySelector('.tag')?.textContent,
    card.el.querySelector('.desc')?.textContent,
    card.detail.querySelector('.eyebrow')?.textContent,
    card.detail.querySelector('h2')?.textContent,
  ].join(' '));
  const matchesQuery = (card) => !state.query || searchText(card).includes(state.query);
  const inCat = (card, cat) => cat === 'all' || card.cats.includes(cat);
  const visibleCards = () => cards.filter((c) => !c.el.hidden);

  function render(animate) {
    let shown = 0;
    cards.forEach((card) => {
      const show = inCat(card, state.cat) && matchesQuery(card);
      const wasHidden = card.el.hidden;
      card.el.hidden = !show;
      if (show) {
        shown += 1;
        if (animate && !reduceMotion && (wasHidden || animate === 'all')) {
          card.el.classList.remove('enter');
          void card.el.offsetWidth; // reinicia a animação
          card.el.style.animationDelay = `${Math.min(shown - 1, 8) * 30}ms`;
          card.el.classList.add('enter');
        }
      }
    });
    // Contagem de cada categoria segue a busca atual.
    chips.forEach((chip) => {
      const count = cards.filter((c) => inCat(c, chip.dataset.cat) && matchesQuery(c)).length;
      chip.querySelector('.cat-count').textContent = String(count);
    });
    empty.hidden = shown > 0;
  }
  grid.addEventListener('animationend', (event) => {
    if (event.target.classList.contains('enter')) {
      event.target.classList.remove('enter');
      event.target.style.animationDelay = '';
    }
  });

  function selectCat(cat, focus) {
    state.cat = cat;
    chips.forEach((chip) => {
      const on = chip.dataset.cat === cat;
      chip.setAttribute('aria-selected', String(on));
      chip.tabIndex = on ? 0 : -1;
      if (on && focus) chip.focus();
      if (on) chip.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    render('all');
  }
  chips.forEach((chip) => chip.addEventListener('click', () => selectCat(chip.dataset.cat)));
  section.querySelector('.cat-chips').addEventListener('keydown', (event) => {
    const index = chips.findIndex((c) => c.dataset.cat === state.cat);
    let next = -1;
    if (event.key === 'ArrowRight') next = (index + 1) % chips.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + chips.length) % chips.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = chips.length - 1;
    if (next < 0) return;
    event.preventDefault();
    selectCat(chips[next].dataset.cat, true);
  });

  let typing = 0;
  input.addEventListener('input', () => {
    clearTimeout(typing);
    typing = setTimeout(() => {
      state.query = fold(input.value);
      render(true);
    }, 80);
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && input.value) { event.stopPropagation(); input.value = ''; state.query = ''; render(true); }
  });
  section.querySelector('.cat-reset')?.addEventListener('click', () => {
    input.value = '';
    state.query = '';
    selectCat('all');
  });

  // O i18n.js traduz alt, aria-label e title; o placeholder acompanha o aria-label.
  // Ao trocar de idioma, a busca é refeita no texto novo.
  const syncLanguage = () => {
    input.placeholder = input.getAttribute('aria-label') || '';
    if (state.query) render(false);
  };
  new MutationObserver(syncLanguage).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  syncLanguage();

  // Miniatura que não existe (app novo antes de rodar tools/make-thumbs.sh): mostra o ícone no lugar.
  cards.forEach((card) => {
    const img = card.el.querySelector('.app-shot img');
    if (!img) return;
    const fallback = () => {
      if (img.dataset.fallback) return;
      img.dataset.fallback = '1';
      img.closest('.app-shot').classList.add('no-shot');
      img.src = card.el.querySelector('.app-icon').getAttribute('src');
    };
    img.addEventListener('error', fallback);
    if (img.complete && img.getAttribute('src') && img.naturalWidth === 0) fallback();
  });

  // ---------- Prévia ----------
  let current = null;
  let opener = null;
  let navList = [];

  function loadShots(card) {
    card.detail.querySelectorAll('img[data-src]').forEach((img) => {
      const shot = img.closest('.shot');
      img.addEventListener('error', () => shot?.classList.add('broken'), { once: true });
      img.decoding = 'async';
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }

  function park(card) {
    if (!card) return;
    card.detail.hidden = true;
    card.el.append(card.detail);
  }

  function updateNav() {
    const index = navList.indexOf(current);
    const many = navList.length > 1;
    pos.textContent = many ? `${index + 1} / ${navList.length}` : '';
    prevBtn.hidden = !many;
    nextBtn.hidden = !many;
  }

  function show(card, direction) {
    if (current && current !== card) park(current);
    current = card;
    loadShots(card);
    card.detail.hidden = false;
    content.replaceChildren(card.detail);
    dialog.dataset.app = card.key;
    const title = card.detail.querySelector('h2');
    if (title?.id) dialog.setAttribute('aria-labelledby', title.id);
    scroller.scrollTop = 0;
    card.detail.querySelector('.pv-gallery')?.scrollTo({ left: 0 });
    content.classList.remove('swap-next', 'swap-prev');
    if (direction && !reduceMotion) {
      void content.offsetWidth;
      content.classList.add(direction > 0 ? 'swap-next' : 'swap-prev');
    }
    updateNav();
    // Pré-carrega a primeira captura dos vizinhos para a troca ficar instantânea.
    const index = navList.indexOf(card);
    [navList[index + 1], navList[index - 1]].forEach((n) => {
      const img = n?.detail.querySelector('img[data-src]');
      if (img) { const pre = new Image(); pre.src = img.dataset.src; }
    });
  }

  function setHash(key) {
    const url = location.pathname + location.search + (key ? `#${key}` : '');
    if (location.hash !== (key ? `#${key}` : '')) history.replaceState(null, '', url);
  }

  function open(key, trigger) {
    const card = byKey.get(key);
    if (!card) return;
    const visible = visibleCards();
    navList = visible.includes(card) ? visible : cards;
    if (!dialog.open) {
      opener = trigger || document.activeElement;
      dialog.showModal();
    }
    show(card, 0);
    setHash(key);
    dialog.querySelector('.pv-close').focus({ preventScroll: true });
  }

  function step(delta) {
    if (!current || navList.length < 2) return;
    const index = navList.indexOf(current);
    const next = navList[(index + delta + navList.length) % navList.length];
    show(next, delta);
    setHash(next.key);
  }

  function close() {
    if (!dialog.open) return;
    dialog.close();
  }
  dialog.addEventListener('close', () => {
    park(current);
    current = null;
    content.replaceChildren();
    if (byKey.has(location.hash.slice(1))) setHash('');
    if (opener && document.contains(opener) && typeof opener.focus === 'function') {
      opener.focus({ preventScroll: true });
    } else {
      section.querySelector('.cat-grid')?.focus?.({ preventScroll: true });
    }
    opener = null;
  });

  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));
  dialog.querySelector('.pv-close').addEventListener('click', close);
  // Clique no fundo escuro fecha.
  dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
  dialog.addEventListener('keydown', (event) => {
    if (event.target.closest('input, textarea, select')) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
  });
  // Baixar dentro da prévia: o download segue e a prévia fecha para mostrar o cartão com o próximo passo.
  content.addEventListener('click', (event) => {
    const link = event.target.closest('[data-download]');
    if (link && link.getAttribute('href')) setTimeout(close, 0);
  });

  // Cartão: clicar em qualquer parte que não seja link ou botão abre a prévia; "Prévia" também.
  cards.forEach((card) => {
    card.el.tabIndex = -1;
    card.el.addEventListener('click', (event) => {
      const control = event.target.closest('a, button');
      if (control && !control.hasAttribute('data-preview')) return;
      event.preventDefault();
      open(card.key, control || card.el.querySelector('[data-preview]'));
    });
  });

  // Links #<app> (dock, páginas dos apps com ../#<app>, links antigos) abrem a prévia.
  const fromHash = () => {
    const key = decodeURIComponent(location.hash.slice(1));
    if (byKey.has(key)) {
      if (!current || current.key !== key) open(key);
    } else if (dialog.open && location.hash) {
      close();
    }
  };
  window.addEventListener('hashchange', fromHash);
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const key = link.getAttribute('href').slice(1);
    if (!byKey.has(key)) return;
    event.preventDefault();
    open(key, link);
  });

  render(false);
  const initial = decodeURIComponent(location.hash.slice(1));
  if (byKey.has(initial)) {
    section.scrollIntoView({ block: 'start' });
    open(initial);
  }
})();
