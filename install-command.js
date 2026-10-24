// Liberar o app na primeira vez. Dois caminhos, um por vez (seletor no topo do guia):
// Terminal (padrão: um comando que tira a quarentena só daquele app) ou Ajustes (guia visual).
// O site monta o comando com o nome certo do .app, no guia e no cartão que aparece ao clicar em "Baixar".
(() => {
  const APPS = window.WITCH_APPS || {};
  const installable = Object.entries(APPS).filter(([, app]) => app.published && app.app);
  const appName = (app) => app.app.replace(/\.app$/, '');
  const commandFor = (app) => `xattr -dr com.apple.quarantine "/Applications/${app.app}"`;

  // Comando colorido; cada parte não quebra por dentro (a quebra fica entre elas).
  function renderCommand(code, app) {
    const part = (cls, text) => Object.assign(document.createElement('span'), { className: cls, textContent: text });
    code.replaceChildren(
      part('t-prompt', '~ %'), ' ',
      part('t-bin', 'xattr'), ' ',
      part('t-flag', '-dr'), ' ',
      part('t-attr', 'com.apple.quarantine'), ' ',
      part('t-path', `"/Applications/${app.app}"`),
      part('t-caret', ''),
    );
    code.dataset.command = commandFor(app);
  }

  // Área de transferência moderna; sem ela (http, navegador antigo), seleção + execCommand.
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = Object.assign(document.createElement('textarea'), { value: text, readOnly: true });
      area.style.cssText = 'position:fixed;opacity:0';
      document.body.append(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    }
  }

  // Uma janela de Terminal (.term): devolve a função que troca o app mostrado.
  function setupTerm(term) {
    const code = term.querySelector('.term-cmd');
    const button = term.querySelector('.term-copy');
    let timer = 0;
    button.addEventListener('click', async () => {
      if (!(await copyText(code.dataset.command || ''))) return;
      term.classList.add('copied');
      clearTimeout(timer);
      timer = setTimeout(() => term.classList.remove('copied'), 1800);
    });
    return (app) => { renderCommand(code, app); term.classList.remove('copied'); };
  }

  function setupModes() {
    const root = document.querySelector('.gk');
    const tabs = [...(root?.querySelectorAll('.gk-switch [data-mode]') || [])];
    const panels = [...(root?.querySelectorAll('.gk-panel') || [])];
    const toggle = root?.querySelector('.gk-switch');
    // A pílula acompanha o botão ativo (a largura muda com o idioma).
    const placePill = () => {
      const active = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true');
      if (!toggle || !active) return;
      toggle.style.setProperty('--sw', `${active.offsetWidth}px`);
      toggle.style.setProperty('--sx', `${active.offsetLeft}px`);
    };
    const setMode = (mode) => {
      tabs.forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.mode === mode)));
      panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== mode; });
      root?.setAttribute('data-mode', mode);
      placePill();
    };
    if (toggle && 'ResizeObserver' in window) new ResizeObserver(placePill).observe(toggle);
    tabs.forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
    document.querySelectorAll('[data-install-mode]').forEach((link) => {
      link.addEventListener('click', () => setMode(link.dataset.installMode));
    });
    setMode('terminal');
  }

  function setupGuide() {
    const stage = document.querySelector('.term-stage');
    const picker = stage?.querySelector('.term-apps');
    if (!picker || !installable.length) return null;
    const show = setupTerm(stage.querySelector('.term'));
    const buttons = installable.map(([key, app]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'term-app';
      button.setAttribute('role', 'radio');
      button.dataset.app = key;
      button.title = appName(app);
      button.setAttribute('aria-label', appName(app));
      const icon = Object.assign(document.createElement('img'), { src: `assets/icons/${key}.png`, alt: '', width: 44, height: 44, loading: 'lazy' });
      button.append(icon);
      picker.append(button);
      return button;
    });
    const pick = (key) => {
      if (!APPS[key]) return;
      buttons.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.app === key)));
      show(APPS[key]);
    };
    buttons.forEach((b) => b.addEventListener('click', () => pick(b.dataset.app)));
    picker.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const index = buttons.findIndex((b) => b.getAttribute('aria-checked') === 'true');
      const next = buttons[(index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length];
      pick(next.dataset.app);
      next.focus();
    });
    pick(installable[0][0]);
    return pick;
  }

  function setupDownloadSheet(pickInGuide) {
    const sheet = document.querySelector('.dl-sheet');
    if (!sheet) return;
    const show = setupTerm(sheet.querySelector('.term'));
    const close = () => { sheet.hidden = true; };
    sheet.querySelector('.dl-close').addEventListener('click', close);
    sheet.querySelector('.dl-alt a')?.addEventListener('click', close);
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
    // O download segue normalmente; o cartão só aparece ao lado com o próximo passo.
    document.querySelectorAll('[data-download]').forEach((link) => {
      link.addEventListener('click', () => {
        const app = APPS[link.dataset.download];
        if (!app || !app.published || !app.app) return;
        sheet.querySelector('.dl-app').textContent = appName(app);
        show(app);
        pickInGuide?.(link.dataset.download);
        sheet.hidden = false;
      });
    });
  }

  setupModes();
  setupDownloadSheet(setupGuide());
})();
