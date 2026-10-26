const GITHUB_USER = 'matthfaria96';
const APPS = window.WITCH_APPS || {};

const repoUrl = (app) => `https://github.com/${GITHUB_USER}/${app.repo}`;
const downloadUrl = (app) => `${repoUrl(app)}/releases/download/${app.tag}/${app.file}`;

function markUnavailable(link, label) {
  link.textContent = label;
  link.classList.add('soon');
  link.setAttribute('aria-disabled', 'true');
  link.removeAttribute('href');
}

// Troca o link fixo pelo .dmg do release mais recente. Se a API do GitHub
// falhar (limite de requisições, offline), fica o link de apps.js.
async function latestDmgUrl(app) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${app.repo}/releases/latest`);
  if (!res.ok) throw new Error(`GitHub API ${res.status} para ${app.repo}`);
  const release = await res.json();
  const dmg = (release.assets || []).find((asset) => asset.name.endsWith('.dmg'));
  if (!dmg) throw new Error(`Release sem .dmg em ${app.repo}`);
  return dmg.browser_download_url;
}

function updateToLatestReleases() {
  document.querySelectorAll('[data-download]').forEach((link) => {
    const app = APPS[link.dataset.download];
    if (!app || !app.published) return;
    latestDmgUrl(app)
      .then((url) => { link.href = url; })
      .catch(() => { /* mantém o link de apps.js */ });
  });
}

function applyAppLinks() {
  document.querySelectorAll('[data-download]').forEach((link) => {
    const app = APPS[link.dataset.download];
    if (app && app.published) {
      link.href = downloadUrl(app);
    } else {
      markUnavailable(link, 'Em breve');
    }
  });
  updateToLatestReleases();
  document.querySelectorAll('[data-source]').forEach((link) => {
    const app = APPS[link.dataset.source];
    if (app && app.published) {
      link.href = repoUrl(app);
      link.target = '_blank';
      link.rel = 'noopener';
    } else {
      link.remove();
    }
  });
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
  const items = document.querySelectorAll('.card, .feature-row, .steps li, .faq-item, .section-head');
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

// Home: só as 5 primeiras seções de app aparecem; "Ver mais apps" abre o resto.
// Um link para um app escondido (dock, cartões, URL com #app) abre a lista antes de rolar até ele.
function setupMoreApps() {
  const features = document.querySelector('.features');
  const more = features && features.querySelector('.more-apps');
  const button = features && features.querySelector('.more-btn');
  if (!more || !button) return;
  features.classList.add('collapsed');
  const expand = () => {
    if (!features.classList.contains('collapsed')) return;
    features.classList.remove('collapsed');
    features.classList.add('expanding');
    button.setAttribute('aria-expanded', 'true');
  };
  button.addEventListener('click', () => {
    expand();
    const first = more.querySelector('.feature-row');
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  const hidden = (id) => { const el = id && document.getElementById(id); return el && more.contains(el) ? el : null; };
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    const target = link && hidden(link.getAttribute('href').slice(1));
    if (!target) return;
    expand();
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', link.getAttribute('href'));
  });
  const fromUrl = hidden(location.hash.slice(1));
  if (fromUrl) { expand(); requestAnimationFrame(() => fromUrl.scrollIntoView({ block: 'start' })); }
}
setupMoreApps();
