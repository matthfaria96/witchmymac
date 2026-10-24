// Comando que libera o app no Terminal (tira a quarentena do macOS só daquele app).
// O site monta o comando com o nome certo do .app: no guia de instalação (seletor de app)
// e no cartão que aparece ao clicar em "Baixar".
(() => {
  const APPS = window.WITCH_APPS || {};
  const installable = Object.entries(APPS).filter(([, app]) => app.published && app.app);

  const commandFor = (app) => `xattr -dr com.apple.quarantine "/Applications/${app.app}"`;
  const appName = (app) => app.app.replace(/\.app$/, '');

  // Área de transferência moderna; sem ela (http, navegador antigo), seleção + execCommand.
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.cssText = 'position:fixed;opacity:0';
      document.body.append(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    }
  }

  function setupBox(box) {
    const code = box.querySelector('.cmd-text');
    const button = box.querySelector('.cmd-copy');
    let timer = 0;
    button.addEventListener('click', async () => {
      if (!(await copyText(code.textContent))) return;
      button.classList.add('done');
      clearTimeout(timer);
      timer = setTimeout(() => button.classList.remove('done'), 1800);
    });
    return (app) => { code.textContent = commandFor(app); button.classList.remove('done'); };
  }

  function setupGuide() {
    const quick = document.querySelector('.quick');
    const select = quick?.querySelector('.quick-select');
    if (!select || !installable.length) { quick?.remove(); return; }
    const show = setupBox(quick.querySelector('.cmd-box'));
    installable.forEach(([key, app]) => select.add(new Option(appName(app), key)));
    const pick = (key) => {
      if (!APPS[key]) return;
      select.value = key;
      show(APPS[key]);
    };
    select.addEventListener('change', () => pick(select.value));
    pick(installable[0][0]);
    return pick;
  }

  function setupDownloadSheet(pickInGuide) {
    const sheet = document.querySelector('.dl-sheet');
    if (!sheet) return;
    const show = setupBox(sheet.querySelector('.cmd-box'));
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

  setupDownloadSheet(setupGuide());
})();
