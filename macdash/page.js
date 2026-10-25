// Abas de capturas da página do macdash: cada .wu-tabset tem botões [role=tab] e painéis .wu-panel.
// Setas esquerda/direita trocam de aba, como num seletor do macOS.
(function () {
  document.querySelectorAll('.wu-tabset').forEach((set) => {
    const tabs = Array.from(set.querySelectorAll('[role=tab]'));
    const panels = Array.from(set.querySelectorAll('.wu-panel'));
    const select = (index) => {
      tabs.forEach((tab, i) => {
        const on = i === index;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        panels[i].hidden = !on;
      });
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i));
      tab.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        const next = (i + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
        select(next);
        tabs[next].focus();
      });
    });
    // data-default: aba que abre selecionada (índice, começa em 0).
    select(Number(set.dataset.default) || 0);
  });
})();
