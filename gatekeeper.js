// Guia visual do Gatekeeper: troca de cena, cursor que vai até o botão certo e avanço automático.
(() => {
  const root = document.querySelector('.gk');
  if (!root) return;
  const screen = root.querySelector('.gk-screen');
  const stage = root.querySelector('.gk-stage');
  const cursor = root.querySelector('.gk-cursor');
  const tabs = [...root.querySelectorAll('.gk-steps [data-step]')];
  const dots = [...root.querySelectorAll('.gk-dots i')];
  const layers = [...root.querySelectorAll('.gk-only')];
  const prevBtn = root.querySelector('[data-gk=prev]');
  const nextBtn = root.querySelector('[data-gk=next]');
  const LAST = tabs.length - 1;
  const DESIGN_WIDTH = 800;
  const AUTO_MS = 4200;
  const REST = { x: 560, y: 330 };
  let step = 0;
  let timer = null;
  let visible = false;
  let userTook = false;

  const scale = () => stage.clientWidth / DESIGN_WIDTH;

  function fitStage() {
    screen.style.setProperty('--s', String(scale()));
  }

  // Posição do alvo em coordenadas do palco de 800x500.
  function targetPoint(index) {
    const target = screen.querySelector(`.gk-target[data-target="${index}"]`);
    if (!target) return REST;
    const s = scale() || 1;
    const box = target.getBoundingClientRect();
    const origin = screen.getBoundingClientRect();
    return { x: (box.left - origin.left + box.width * 0.55) / s, y: (box.top - origin.top + box.height * 0.5) / s };
  }

  function moveCursor(index) {
    const { x, y } = targetPoint(index);
    cursor.style.transform = `translate(${x}px, ${y}px)`;
  }

  function show(index) {
    step = Math.max(0, Math.min(LAST, index));
    screen.dataset.scene = String(step);
    layers.forEach((layer) => {
      layer.classList.toggle('on', layer.dataset.show.split(' ').includes(String(step)));
    });
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === step));
      tab.classList.toggle('done', i < step);
    });
    dots.forEach((dot, i) => dot.classList.toggle('on', i === step));
    prevBtn.disabled = step === 0;
    nextBtn.disabled = step === LAST;
    // Espera a transição da cena (0,35s) terminar para medir o alvo.
    setTimeout(() => moveCursor(step), 380);
    schedule();
  }

  function click() {
    cursor.classList.remove('clicking');
    void cursor.offsetWidth;
    cursor.classList.add('clicking');
  }

  function schedule() {
    clearTimeout(timer);
    if (!visible || userTook) return;
    timer = setTimeout(() => {
      click();
      timer = setTimeout(() => show(step === LAST ? 0 : step + 1), 450);
    }, AUTO_MS);
  }

  // Ao interagir, a pessoa assume o controle e o avanço automático para.
  const take = (fn) => () => { userTook = true; fn(); };

  tabs.forEach((tab, i) => tab.addEventListener('click', take(() => show(i))));
  prevBtn.addEventListener('click', take(() => show(step - 1)));
  nextBtn.addEventListener('click', take(() => show(step + 1)));
  screen.querySelectorAll('.gk-target').forEach((target) => {
    target.addEventListener('click', take(() => { click(); setTimeout(() => show(step + 1), 300); }));
  });
  root.querySelector('.gk-steps').addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const delta = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
    userTook = true;
    show(step + delta);
    tabs[step].focus();
  });

  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { fitStage(); moveCursor(step); }).observe(stage);
  } else {
    window.addEventListener('resize', () => { fitStage(); moveCursor(step); });
  }
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule(); else clearTimeout(timer);
    }, { threshold: 0.4 }).observe(stage);
  }

  cursor.style.transform = `translate(${REST.x}px, ${REST.y}px)`;
  fitStage();
  show(0);
})();
