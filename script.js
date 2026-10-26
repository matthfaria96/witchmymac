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

// Home: listas longas (cartões dos apps e seções) mostram os primeiros itens e o começo do próximo,
// desfocado, com "Ver mais" embaixo. Um link para um item escondido abre a lista antes de rolar até ele.
function setupPeek() {
  document.querySelectorAll('.peek').forEach((box) => {
    const show = Number(box.dataset.show) || 5;
    const peek = Number(box.dataset.peek) || 200;
    const items = [...box.children].filter((el) => el.matches('.card, .feature-row'));
    if (items.length <= show) return;
    const gate = document.createElement('div');
    gate.className = 'peek-gate';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-ghost';
    button.setAttribute('aria-expanded', 'false');
    button.textContent = 'Ver mais apps';
    gate.append(button);
    box.after(gate);
    box.style.setProperty('--peek', peek + 'px');
    const fit = () => {
      if (!box.classList.contains('collapsed')) return;
      const next = items[show];
      box.style.maxHeight = (next.getBoundingClientRect().top - box.getBoundingClientRect().top + peek) + 'px';
    };
    const expand = () => {
      if (!box.classList.contains('collapsed')) return;
      box.style.maxHeight = box.scrollHeight + 'px';
      box.classList.remove('collapsed');
      gate.hidden = true;
      button.setAttribute('aria-expanded', 'true');
      setTimeout(() => { box.style.maxHeight = ''; }, 650);
    };
    box.classList.add('collapsed');
    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('load', fit);
    button.addEventListener('click', expand);
    box.peekExpand = expand;
    box.peekItems = items.slice(show);
  });
  const hiddenTarget = (id) => {
    const el = id && document.getElementById(id);
    const box = el && el.closest('.peek.collapsed');
    return box ? { el, box } : null;
  };
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    const hit = link && hiddenTarget(link.getAttribute('href').slice(1));
    if (!hit) return;
    event.preventDefault();
    hit.box.peekExpand();
    setTimeout(() => hit.el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    history.replaceState(null, '', link.getAttribute('href'));
  });
  const fromUrl = hiddenTarget(location.hash.slice(1));
  if (fromUrl) { fromUrl.box.peekExpand(); setTimeout(() => fromUrl.el.scrollIntoView({ block: 'start' }), 50); }
}
setupPeek();
