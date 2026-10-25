// Instalar e liberar os apps. Três caminhos, um por vez (seletor no topo do guia):
// - Pelo Terminal (padrão): uma linha roda o install.sh, que baixa do GitHub, confere e instala;
// - Baixar + comando: depois de baixar o .dmg, um comando tira a quarentena só daquele app;
// - Baixar + Ajustes: o guia visual (gatekeeper.js).
// O site monta o comando certo para cada app, no guia e no cartão que aparece ao clicar em "Baixar".
(() => {
  const APPS = window.WITCH_APPS || {};
  const SITE = 'https://witchmymac.com';
  const installable = Object.entries(APPS).filter(([, app]) => app.published && app.app);
  const appName = (app) => app.app.replace(/\.app$/, '');
  const commandFor = (key, app, mode) => (mode === 'install'
    ? `curl -fsSL ${SITE}/install.sh | bash -s ${key}`
    : `xattr -dr com.apple.quarantine "/Applications/${app.app}"`);

  // Comando colorido; cada parte não quebra por dentro (a quebra fica entre elas).
  function renderCommand(code, key, app, mode) {
    const part = (cls, text) => Object.assign(document.createElement('span'), { className: cls, textContent: text });
    const parts = mode === 'install'
      ? [part('t-bin', 'curl'), ' ', part('t-flag', '-fsSL'), ' ', part('t-attr', `${SITE}/install.sh`), ' ',
        part('t-flag', '|'), ' ', part('t-bin', 'bash'), ' ', part('t-flag', '-s'), ' ', part('t-path', key)]
      : [part('t-bin', 'xattr'), ' ', part('t-flag', '-dr'), ' ', part('t-attr', 'com.apple.quarantine'), ' ',
        part('t-path', `"/Applications/${app.app}"`)];
    code.replaceChildren(part('t-prompt', '~ %'), ' ', ...parts, part('t-caret', ''));
    code.dataset.command = commandFor(key, app, mode);
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

  // Uma janela de Terminal (.term): devolve a função que troca o app e o tipo de comando mostrados.
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
    return (key, app, mode) => { renderCommand(code, key, app, mode); term.classList.remove('copied'); };
  }

  // Guia: app escolhido + modo atual. Os dois primeiros modos usam a mesma janela de Terminal.
  const guide = { key: null, mode: 'install', show: null };
  const refresh = () => {
    if (guide.show && guide.key) guide.show(guide.key, APPS[guide.key], guide.mode);
    // Dica discreta no fim do guia dos Ajustes: o mesmo app, aprovado por comando.
    const tip = document.querySelector('.gk-tip-cmd');
    if (tip && guide.key) tip.textContent = commandFor(guide.key, APPS[guide.key], 'unblock');
  };
  document.querySelector('.gk-tip-cmd')?.addEventListener('click', async (event) => {
    const tip = event.currentTarget;
    if (!(await copyText(tip.textContent))) return;
    tip.classList.add('copied');
    setTimeout(() => tip.classList.remove('copied'), 1400);
  });

  function setupModes() {
    const root = document.querySelector('.gk');
    const tabs = [...(root?.querySelectorAll('.gk-switch [data-mode]') || [])];
    const panels = [...(root?.querySelectorAll('.gk-panel') || [])];
    const variants = [...(root?.querySelectorAll('[data-for]') || [])];
    const toggle = root?.querySelector('.gk-switch');
    // A pílula acompanha o botão ativo (a largura muda com o idioma).
    const placePill = () => {
      const active = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true');
      if (!toggle || !active) return;
      toggle.style.setProperty('--sw', `${active.offsetWidth}px`);
      toggle.style.setProperty('--sx', `${active.offsetLeft}px`);
    };
    const setMode = (mode) => {
      const terminal = mode === 'install' || mode === 'unblock';
      tabs.forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.mode === mode)));
      panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== (terminal ? 'terminal' : mode); });
      variants.forEach((el) => { el.hidden = el.dataset.for !== mode; });
      root?.setAttribute('data-mode', mode);
      guide.mode = mode;
      refresh();
      placePill();
    };
    if (toggle && 'ResizeObserver' in window) new ResizeObserver(placePill).observe(toggle);
    tabs.forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
    document.querySelectorAll('[data-install-mode]').forEach((link) => {
      link.addEventListener('click', () => setMode(link.dataset.installMode));
    });
    setMode('install');
  }

  function setupGuide() {
    const stage = document.querySelector('.term-stage');
    const picker = stage?.querySelector('.term-apps');
    if (!picker || !installable.length) return null;
    guide.show = setupTerm(stage.querySelector('.term'));
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
      guide.key = key;
      refresh();
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

  // Cartão do download: o .dmg já está vindo, então o próximo passo é liberar (comando xattr).
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
        const key = link.dataset.download;
        const app = APPS[key];
        if (!app || !app.published || !app.app) return;
        sheet.querySelector('.dl-app').textContent = appName(app);
        show(key, app, 'unblock');
        pickInGuide?.(key);
        sheet.hidden = false;
      });
    });
  }

  // Páginas de app: janelas de Terminal fixas (`.term[data-app][data-mode]`), versão e link de novidades.
  function setupAppPage() {
    document.querySelectorAll('.term[data-app][data-mode]').forEach((term) => {
      const app = APPS[term.dataset.app];
      if (app?.published) setupTerm(term)(term.dataset.app, app, term.dataset.mode);
    });
    document.querySelectorAll('[data-version]').forEach((el) => {
      const app = APPS[el.dataset.version];
      if (app?.tag) el.textContent = app.tag.replace(/^[^0-9]*/, '');
    });
    document.querySelectorAll('[data-releases]').forEach((link) => {
      const app = APPS[link.dataset.releases];
      if (!app) return;
      link.href = `https://github.com/matthfaria96/${app.repo}/releases`;
      link.target = '_blank';
      link.rel = 'noopener';
    });
  }

  setupAppPage();
  setupGuide();
  setupModes();
  setupDownloadSheet((key) => document.querySelector(`.term-app[data-app="${key}"]`)?.click());
})();
