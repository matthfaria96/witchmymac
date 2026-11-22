const GITHUB_USER = 'matthfaria96';
// Repositório público só com os instaladores (o código dos apps é privado).
// Cada release tem a tag "<chave do app>-v<versão>", por exemplo "neorar-v1.1.3".
const RELEASES_REPO = 'witchmymac-release';
const APPS = window.WITCH_APPS || {};

const versionOf = (app) => app.tag.replace(/^[^0-9]*/, '');
const downloadUrl = (key, app) =>
  `https://github.com/${GITHUB_USER}/${RELEASES_REPO}/releases/download/${key}-v${versionOf(app)}/${app.file}`;

function markUnavailable(link, label) {
  link.textContent = label;
  link.classList.add('soon');
  link.setAttribute('aria-disabled', 'true');
  link.removeAttribute('href');
}

// Uma chamada só à API do GitHub para todos os apps da página (vêm do mais novo ao mais antigo).
let releasesPromise = null;
function allReleases() {
  releasesPromise ??= fetch(`https://api.github.com/repos/${GITHUB_USER}/${RELEASES_REPO}/releases?per_page=100`)
    .then((res) => {
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      return res.json();
    });
  return releasesPromise;
}

// Troca o link fixo pelo .dmg do release mais recente. Se a API do GitHub
// falhar (limite de requisições, offline), fica o link de apps.js.
async function latestDmgUrl(key) {
  const release = (await allReleases()).find((r) => r.tag_name.startsWith(`${key}-v`));
  const dmg = (release?.assets || []).find((asset) => asset.name.endsWith('.dmg'));
  if (!dmg) throw new Error(`Nenhum .dmg para ${key}`);
  return dmg.browser_download_url;
}

// Windows no release mais recente que tenha: o instalador (.exe, ou .msi se não houver .exe) ou,
// com portable, o .zip. Um release só de Mac não esconde o último de Windows.
async function latestWindowsUrl(key, portable) {
  const pick = (assets) => (portable
    ? assets.find((a) => /windows.*\.zip$/i.test(a.name))
    : assets.find((a) => a.name.endsWith('.exe')) || assets.find((a) => a.name.endsWith('.msi')));
  for (const release of await allReleases()) {
    if (!release.tag_name.startsWith(`${key}-v`)) continue;
    const file = pick(release.assets || []);
    if (file) return file.browser_download_url;
  }
  throw new Error(`Nada de Windows para ${key}`);
}

// Links data-win="<chave>" (instalador) e data-win-zip="<chave>" (portátil): o href do HTML é
// o reserva, trocado pelo arquivo do release mais novo.
function updateWindowsLinks() {
  document.querySelectorAll('[data-win], [data-win-zip]').forEach((link) => {
    const portable = 'winZip' in link.dataset;
    latestWindowsUrl(portable ? link.dataset.winZip : link.dataset.win, portable)
      .then((url) => { link.href = url; })
      .catch(() => { /* mantém o link do HTML */ });
  });
}

function updateToLatestReleases() {
  document.querySelectorAll('[data-download]').forEach((link) => {
    const key = link.dataset.download;
    const app = APPS[key];
    if (!app || !app.published) return;
    latestDmgUrl(key)
      .then((url) => { link.href = url; })
      .catch(() => { /* mantém o link de apps.js */ });
  });
}

function applyAppLinks() {
  document.querySelectorAll('[data-download]').forEach((link) => {
    const key = link.dataset.download;
    const app = APPS[key];
    if (app && app.published) {
      link.href = downloadUrl(key, app);
    } else {
      markUnavailable(link, 'Em breve');
    }
  });
  updateToLatestReleases();
  updateWindowsLinks();
  // O código-fonte dos apps é privado: os links "código-fonte" saem da página.
  document.querySelectorAll('[data-source]').forEach((link) => link.remove());
}

function setupMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const links = document.querySelector('.links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => links.classList.remove('open')));
}

function setupLightbox() {
  const dialog = document.querySelector('.lightbox');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const image = dialog.querySelector('img');
  document.querySelectorAll('.shot').forEach((shot) => {
    shot.addEventListener('click', () => {
      const source = shot.querySelector('img');
      image.src = source.currentSrc || source.src;
      image.alt = source.alt;
      dialog.showModal();
    });
  });
  dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
}

function setupReveal() {
  // Os cartões do catálogo da página inicial ficam de fora: eles aparecem e somem com os filtros.
  const items = document.querySelectorAll('.card:not(.app-card), .steps li, .faq-item, .section-head');
  if (!('IntersectionObserver' in window)) return;
  items.forEach((el) => el.classList.add('reveal'));
  const observer = new IntersectionObserver((entries) => {
    entries.filter((e) => e.isIntersecting).forEach((e) => {
      e.target.classList.add('in');
      observer.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  items.forEach((el) => observer.observe(el));
}

document.getElementById('year').textContent = String(new Date().getFullYear());
applyAppLinks();
setupMenu();
setupLightbox();
setupReveal();
