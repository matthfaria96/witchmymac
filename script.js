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

function applyAppLinks() {
  document.querySelectorAll('[data-download]').forEach((link) => {
    const app = APPS[link.dataset.download];
    if (app && app.published) {
      link.href = downloadUrl(app);
    } else {
      markUnavailable(link, 'Em breve');
    }
  });
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
