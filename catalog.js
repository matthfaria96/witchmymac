// Página inicial: destaques (carrossel), catálogo (categorias, busca) e a prévia rápida.
// O caminho principal é o cartão, que leva à página do app. A prévia é um extra do computador
// (mouse e tela larga), no estilo do Quick Look do Mac: botão "Prévia" sobre a imagem, ou o mouse
// sobre um cartão e a barra de espaço. Ela cresce a partir do cartão (transform/opacity, Web Animations)
// e as capturas são pré-carregadas quando o mouse para sobre um cartão.
// O conteúdo de cada prévia já está no HTML (div.app-detail dentro do cartão), traduzido pelo i18n.js.
(() => {
  const section = document.querySelector('.catalog');
  if (!section) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = window.matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)');

  const grid = section.querySelector('.cat-grid');
  const chipBox = section.querySelector('.cat-chips');
  const chips = [...section.querySelectorAll('.cat-chip')];
  const input = section.querySelector('.cat-input');
  const empty = section.querySelector('.cat-empty');
  const bar = section.querySelector('.cat-bar');

  const cards = [...grid.querySelectorAll('.app-card')].map((el) => ({
    el,
    key: el.dataset.app,
    cats: (el.dataset.cats || '').split(/\s+/).filter(Boolean),
    detail: el.querySelector('.app-detail'),
    media: el.querySelector('.app-media'),
  }));
  const byKey = new Map(cards.map((c) => [c.key, c]));
  const state = { cat: 'all', query: '' };

  // ---------- Filtro e busca ----------
  const fold = (text) => (text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  const searchText = (card) => fold([
    card.el.querySelector('h3')?.textContent,
    card.el.querySelector('.tag')?.textContent,
    card.el.querySelector('.desc')?.textContent,
    card.detail?.querySelector('.eyebrow')?.textContent,
  ].join(' '));
  const matches = (card) => !state.query || searchText(card).includes(state.query);
  const inCat = (card, cat) => cat === 'all' || card.cats.includes(cat);
  const visibleCards = () => cards.filter((c) => !c.el.hidden);

  function render(animate) {
    let shown = 0;
    cards.forEach((card) => {
      const show = inCat(card, state.cat) && matches(card);
      card.el.hidden = !show;
      if (!show) return;
      shown += 1;
      if (animate && !reduceMotion) {
        card.el.classList.remove('enter');
        void card.el.offsetWidth;
        card.el.style.animationDelay = `${Math.min(shown - 1, 8) * 35}ms`;
        card.el.classList.add('enter');
      }
    });
    chips.forEach((chip) => {
      chip.querySelector('.cat-count').textContent = String(cards.filter((c) => inCat(c, chip.dataset.cat) && matches(c)).length);
    });
    empty.hidden = shown > 0;
    requestAnimationFrame(moveIndicator);
  }
  grid.addEventListener('animationend', (event) => {
    const el = event.target;
    if (el.classList.contains('enter')) { el.classList.remove('enter'); el.style.animationDelay = ''; }
    if (el.classList.contains('is-target')) el.classList.remove('is-target');
  });

  // Pílula que desliza até a categoria escolhida.
  const indicator = document.createElement('span');
  indicator.className = 'cat-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  chipBox.prepend(indicator);
  function moveIndicator() {
    const chip = chips.find((c) => c.dataset.cat === state.cat);
    if (!chip) return;
    indicator.style.width = `${chip.offsetWidth}px`;
    indicator.style.transform = `translateX(${chip.offsetLeft}px)`;
  }
  window.addEventListener('resize', moveIndicator);
  document.fonts?.ready.then(moveIndicator);

  function selectCat(cat, focus) {
    state.cat = cat;
    chips.forEach((chip) => {
      const on = chip.dataset.cat === cat;
      chip.setAttribute('aria-selected', String(on));
      chip.tabIndex = on ? 0 : -1;
      if (on && focus) chip.focus();
      if (on && chipBox.scrollWidth > chipBox.clientWidth) {
        chipBox.scrollTo({ left: chip.offsetLeft - 24, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
    render(true);
    // Com a barra presa no topo, volta ao começo da lista para mostrar o resultado.
    if (bar.classList.contains('stuck')) {
      const top = grid.getBoundingClientRect().top + window.scrollY - bar.offsetHeight - 64 - 12;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }
  chips.forEach((chip) => chip.addEventListener('click', () => selectCat(chip.dataset.cat)));
  chipBox.addEventListener('keydown', (event) => {
    const index = chips.findIndex((c) => c.dataset.cat === state.cat);
    const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: chips.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    selectCat(chips[(next + chips.length) % chips.length].dataset.cat, true);
  });

  let typing = 0;
  input.addEventListener('input', () => {
    clearTimeout(typing);
    typing = setTimeout(() => { state.query = fold(input.value); render(true); }, 90);
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && input.value) { event.stopPropagation(); input.value = ''; state.query = ''; render(true); }
  });
  section.querySelector('.cat-reset')?.addEventListener('click', () => {
    input.value = ''; state.query = ''; selectCat('all');
  });

  // Placeholder no idioma da tela; a busca é refeita no texto novo.
  const syncLanguage = () => {
    input.placeholder = input.getAttribute('aria-label') || '';
    if (state.query) render(false);
    requestAnimationFrame(moveIndicator);
  };
  new MutationObserver(syncLanguage).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  syncLanguage();

  // Barra presa: ganha o fundo de vidro só quando encosta no menu (conferido a cada quadro de rolagem).
  let stuckFrame = 0;
  const checkStuck = () => {
    stuckFrame = 0;
    const top = bar.getBoundingClientRect().top;
    const sectionBottom = section.getBoundingClientRect().bottom;
    bar.classList.toggle('stuck', top <= 65 && sectionBottom > 120);
  };
  window.addEventListener('scroll', () => { if (!stuckFrame) stuckFrame = requestAnimationFrame(checkStuck); }, { passive: true });
  checkStuck();

  // Miniatura que ainda não existe: mostra o ícone no lugar.
  cards.forEach((card) => {
    const img = card.media?.querySelector('.app-thumb');
    if (!img) return;
    const fallback = () => {
      if (img.dataset.fallback) return;
      img.dataset.fallback = '1';
      card.media.classList.add('no-shot');
      img.src = card.el.querySelector('.app-icon').getAttribute('src');
    };
    img.addEventListener('error', fallback);
  });

  // ---------- Destaques: carrossel ----------
  // A faixa rola com scroll-snap (o dedo e o trackpad funcionam nativamente). Passa sozinha: a barrinha do
  // ponto ativo enche em 6,5 s (animação CSS) e, ao terminar, vai para o próximo. Mouse em cima, foco dentro,
  // aba escondida ou carrossel fora da tela pausam a barrinha, e com ela o tempo.
  const featured = document.querySelector('.featured');
  if (featured) {
    const track = featured.querySelector('.feat-track');
    const slides = [...track.querySelectorAll('.spot')];
    const dots = [...featured.querySelectorAll('.feat-dot')];
    let index = 0;
    const holds = new Set();
    const hold = (reason, on) => {
      if (on) holds.add(reason); else holds.delete(reason);
      featured.classList.toggle('paused', holds.size > 0);
    };
    if (reduceMotion) featured.classList.add('static');

    const mark = (i) => {
      index = i;
      dots.forEach((dot, n) => {
        const on = n === i;
        dot.setAttribute('aria-current', String(on));
        if (on) { const bar = dot.firstElementChild; bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
      });
      slides.forEach((slide, n) => slide.toggleAttribute('inert', n !== i));
    };
    const go = (i) => {
      const n = (i + slides.length) % slides.length;
      track.scrollTo({ left: slides[n].offsetLeft - track.offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
      mark(n);
    };
    featured.querySelector('.feat-prev').addEventListener('click', () => go(index - 1));
    featured.querySelector('.feat-next').addEventListener('click', () => go(index + 1));
    dots.forEach((dot, n) => dot.addEventListener('click', () => go(n)));
    dots.forEach((dot) => dot.firstElementChild.addEventListener('animationend', () => {
      if (dot.getAttribute('aria-current') === 'true') go(index + 1);
    }));
    // Rolagem pelo dedo ou trackpad: o slide mais visível vira o atual.
    let settle = 0;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(settle);
      settle = requestAnimationFrame(() => {
        const i = Math.round(track.scrollLeft / (slides[0].offsetWidth + 20));
        if (i !== index && slides[i]) mark(i);
      });
    }, { passive: true });
    featured.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hold('hover', true); });
    featured.addEventListener('pointerleave', () => hold('hover', false));
    featured.addEventListener('focusin', () => hold('focus', true));
    featured.addEventListener('focusout', (e) => { if (!featured.contains(e.relatedTarget)) hold('focus', false); });
    track.addEventListener('touchstart', () => hold('touch', true), { passive: true });
    track.addEventListener('touchend', () => setTimeout(() => hold('touch', false), 1200), { passive: true });
    document.addEventListener('visibilitychange', () => hold('hidden', document.hidden));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => hold('offscreen', !entry.isIntersecting), { threshold: 0.35 }).observe(track);
    }
    featured.addEventListener('keydown', (event) => {
      if (event.target.closest('input')) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); go(index + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); go(index - 1); }
    });
    window.addEventListener('resize', () => { track.scrollLeft = slides[index].offsetLeft - track.offsetLeft; });
    mark(0);
  }

  // ---------- Links #<app>: chegam ao cartão e o destacam ----------
  function reveal(key, smooth) {
    const card = byKey.get(key);
    if (!card) return false;
    if (card.el.hidden) { input.value = ''; state.query = ''; selectCat('all'); }
    card.el.scrollIntoView({ block: 'center', behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
    card.el.classList.remove('is-target');
    void card.el.offsetWidth;
    card.el.classList.add('is-target');
    return true;
  }
  window.addEventListener('hashchange', () => reveal(decodeURIComponent(location.hash.slice(1)), true));

  render(false);
  const initial = decodeURIComponent(location.hash.slice(1));
  if (byKey.has(initial)) requestAnimationFrame(() => reveal(initial, false));

  // ---------- Prévia rápida (só no computador) ----------
  const dialog = document.querySelector('dialog.quicklook');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const panel = dialog.querySelector('.ql-panel');
  const content = dialog.querySelector('.ql-content');
  const pos = dialog.querySelector('.ql-pos');
  const prevBtn = dialog.querySelector('.ql-prev');
  const nextBtn = dialog.querySelector('.ql-next');
  const scrim = document.createElement('div');
  scrim.className = 'ql-scrim';
  dialog.prepend(scrim);
  const lightbox = document.querySelector('dialog.lightbox');

  let current = null;
  let opener = null;
  let navList = [];
  let busy = false;
  const EASE = 'cubic-bezier(.2,.8,.2,1)';

  // Capturas: data-src vira src na primeira vez (ou antes, ao parar o mouse sobre o cartão).
  function warm(card, all) {
    if (!card?.detail) return [];
    const imgs = [...card.detail.querySelectorAll('.ql-thumbs img')];
    (all ? imgs : imgs.slice(0, 1)).forEach((img) => {
      if (!img.dataset.src) return;
      img.addEventListener('error', () => img.closest('.shot')?.classList.add('broken'), { once: true });
      img.decoding = 'async';
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
    return imgs;
  }
  const ready = (img, ms = 280) => Promise.race([
    img.decode ? img.decode().catch(() => {}) : Promise.resolve(),
    new Promise((resolve) => setTimeout(resolve, ms)),
  ]);

  // Palco: mostra a captura escolhida, com troca suave.
  function setStage(card, index) {
    const thumbs = [...card.detail.querySelectorAll('.ql-thumbs .shot:not(.broken)')];
    const shot = thumbs[index] || thumbs[0];
    if (!shot) return Promise.resolve();
    const stage = card.detail.querySelector('.ql-stage');
    thumbs.forEach((t) => t.setAttribute('aria-current', String(t === shot)));
    const source = shot.querySelector('img');
    const img = new Image();
    img.decoding = 'async';
    img.src = source.currentSrc || source.src;
    img.alt = source.alt;
    stage.dataset.index = String(thumbs.indexOf(shot));
    return ready(img).then(() => {
      const old = stage.querySelector('img');
      stage.append(img);
      if (old) { old.classList.add('leaving'); setTimeout(() => old.remove(), 300); }
    });
  }

  function park(card) {
    if (!card?.detail) return;
    card.detail.classList.remove('in-next', 'in-prev', 'out');
    card.detail.hidden = true;
    card.el.append(card.detail);
  }

  function updateNav() {
    const index = navList.indexOf(current);
    pos.textContent = navList.length > 1 ? `${index + 1} / ${navList.length}` : '';
    prevBtn.hidden = nextBtn.hidden = navList.length < 2;
  }

  async function show(card, direction) {
    warm(card, true);
    const first = card.detail.querySelector('.ql-thumbs img');
    if (first) await ready(first);
    const leaving = current && current !== card ? current : null;
    current = card;
    panel.style.setProperty('--c', card.el.style.getPropertyValue('--c'));
    card.detail.hidden = false;
    card.detail.classList.remove('in-next', 'in-prev', 'out');
    if (leaving) {
      leaving.detail.classList.add('out');
      setTimeout(() => park(leaving), 200);
    }
    content.append(card.detail);
    if (direction && !reduceMotion) {
      void card.detail.offsetWidth;
      card.detail.classList.add(direction > 0 ? 'in-next' : 'in-prev');
    }
    card.detail.querySelector('.ql-info').scrollTop = 0;
    const title = card.detail.querySelector('h2');
    if (title?.id) dialog.setAttribute('aria-labelledby', title.id);
    updateNav();
    setStage(card, 0);
    // Vizinhos já aquecidos: a troca seguinte é instantânea.
    const i = navList.indexOf(card);
    warm(navList[(i + 1) % navList.length]);
    warm(navList[(i - 1 + navList.length) % navList.length]);
  }

  // A janela cresce a partir da imagem do cartão (e volta para ela ao fechar).
  function fromCardTransform(card) {
    const from = (card.media && card.media.offsetParent ? card.media : card.el).getBoundingClientRect();
    const to = panel.getBoundingClientRect();
    const scale = Math.max(from.width / to.width, 0.2);
    const dx = from.left + from.width / 2 - (to.left + to.width / 2 * scale);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2 * scale);
    return `translate(${dx}px, ${dy}px) scale(${scale})`;
  }

  async function open(card, trigger) {
    if (!desktop.matches || busy || !card?.detail) return;
    busy = true;
    const visible = visibleCards();
    navList = visible.includes(card) ? visible : cards;
    opener = trigger || document.activeElement;
    await show(card, 0);
    dialog.showModal();
    dialog.querySelector('.ql-close').focus({ preventScroll: true });
    if (!reduceMotion) {
      const start = fromCardTransform(card);
      scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' });
      await panel.animate([
        { transform: start, opacity: 0.4, borderRadius: '40px' },
        { transform: 'none', opacity: 1, borderRadius: '28px' },
      ], { duration: 460, easing: EASE }).finished.catch(() => {});
    }
    busy = false;
  }

  async function close() {
    if (!dialog.open || busy) return;
    busy = true;
    const card = current;
    if (!reduceMotion && card) {
      const end = fromCardTransform(card);
      scrim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-in', fill: 'forwards' });
      await panel.animate([
        { transform: 'none', opacity: 1 },
        { transform: end, opacity: 0 },
      ], { duration: 300, easing: 'cubic-bezier(.4,0,.8,.4)', fill: 'forwards' }).finished.catch(() => {});
    }
    dialog.close();
    panel.getAnimations().forEach((a) => a.cancel());
    scrim.getAnimations().forEach((a) => a.cancel());
    busy = false;
  }

  dialog.addEventListener('close', () => {
    park(current);
    current = null;
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    opener = null;
  });
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); close(); });

  function step(delta) {
    if (!current || navList.length < 2 || busy) return;
    const i = navList.indexOf(current);
    show(navList[(i + delta + navList.length) % navList.length], delta);
  }
  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));
  dialog.querySelector('.ql-close').addEventListener('click', close);
  scrim.addEventListener('click', close);
  dialog.addEventListener('keydown', (event) => {
    if (event.target.closest('input, textarea, select')) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
    else if (event.key === ' ' && !event.target.closest('a, button:not(.ql-close)')) { event.preventDefault(); close(); }
  });
  content.addEventListener('click', (event) => {
    if (!current) return;
    const shot = event.target.closest('.ql-thumbs .shot');
    if (shot) {
      event.preventDefault();
      event.stopImmediatePropagation(); // não abre a ampliação: troca o palco
      setStage(current, [...current.detail.querySelectorAll('.ql-thumbs .shot:not(.broken)')].indexOf(shot));
      return;
    }
    const stageImg = event.target.closest('.ql-stage') && current.detail.querySelector('.ql-stage img:not(.leaving)');
    if (stageImg && lightbox) {
      const big = lightbox.querySelector('img');
      big.src = stageImg.src;
      big.alt = stageImg.alt;
      lightbox.showModal();
      return;
    }
    // Baixar: o download segue e a prévia fecha para mostrar o próximo passo.
    if (event.target.closest('[data-download]')?.getAttribute('href')) setTimeout(close, 0);
  }, true);

  // Gatilhos: botão "Prévia" e barra de espaço com o mouse sobre um cartão.
  let hovered = null;
  let warmTimer = 0;
  cards.forEach((card) => {
    card.el.querySelector('[data-preview]')?.addEventListener('click', (event) => {
      event.preventDefault();
      open(card, event.currentTarget);
    });
    card.el.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse') return;
      hovered = card;
      clearTimeout(warmTimer);
      warmTimer = setTimeout(() => warm(card), 140);
    });
    card.el.addEventListener('pointerleave', () => { if (hovered === card) hovered = null; clearTimeout(warmTimer); });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== ' ' || dialog.open || !desktop.matches || event.repeat) return;
    if (event.target.closest('input, textarea, select, button, [contenteditable]')) return;
    const focusedCard = event.target.closest?.('.app-card');
    const card = focusedCard ? byKey.get(focusedCard.dataset.app) : hovered;
    if (!card) return;
    event.preventDefault();
    open(card, focusedCard ? event.target : card.el.querySelector('.app-link'));
  });
  desktop.addEventListener?.('change', () => { if (!desktop.matches && dialog.open) dialog.close(); });
})();
