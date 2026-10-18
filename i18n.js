// Idiomas do site: português (padrão, o próprio HTML), inglês e espanhol.
// Escolha: ?lang= na URL > escolha salva no seletor > país pelo fuso horário > idioma do navegador > inglês.
(() => {
  const LANGS = ['pt', 'en', 'es'];
  const HTML_LANG = { pt: 'pt-BR', en: 'en', es: 'es' };
  const FLAGS = { pt: '🇧🇷', en: '🇺🇸', es: '🇪🇸' };
  const STORAGE_KEY = 'witchmymac-lang';
  const STRINGS = window.WITCH_STRINGS || {};
  const TRANSLATED_ATTRS = ['alt', 'aria-label'];

  // Fusos de países de língua portuguesa e espanhola. Qualquer outro fuso não decide sozinho.
  const PT_ZONES = new Set([
    'America/Sao_Paulo', 'America/Bahia', 'America/Fortaleza', 'America/Recife', 'America/Maceio', 'America/Belem',
    'America/Manaus', 'America/Cuiaba', 'America/Campo_Grande', 'America/Porto_Velho', 'America/Boa_Vista',
    'America/Rio_Branco', 'America/Araguaina', 'America/Santarem', 'America/Noronha', 'America/Eirunepe',
    'Europe/Lisbon', 'Atlantic/Azores', 'Atlantic/Madeira', 'Africa/Luanda', 'Africa/Maputo', 'Africa/Bissau',
    'Atlantic/Cape_Verde', 'Africa/Sao_Tome', 'Asia/Dili',
  ]);
  const ES_ZONES = new Set([
    'Europe/Madrid', 'Atlantic/Canary', 'Africa/Ceuta', 'Africa/Malabo',
    'America/Mexico_City', 'America/Cancun', 'America/Merida', 'America/Monterrey', 'America/Matamoros',
    'America/Chihuahua', 'America/Ciudad_Juarez', 'America/Ojinaga', 'America/Mazatlan', 'America/Bahia_Banderas',
    'America/Hermosillo', 'America/Tijuana', 'America/Bogota', 'America/Lima', 'America/Santiago',
    'America/Punta_Arenas', 'America/Caracas', 'America/Guayaquil', 'Pacific/Galapagos', 'America/La_Paz',
    'America/Asuncion', 'America/Montevideo', 'America/Havana', 'America/Santo_Domingo', 'America/Puerto_Rico',
    'America/Panama', 'America/Costa_Rica', 'America/Managua', 'America/Tegucigalpa', 'America/El_Salvador',
    'America/Guatemala', 'Pacific/Easter',
  ]);

  const isLang = (value) => LANGS.includes(value);

  function readSaved() {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  }

  function save(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* sem armazenamento: só vale nesta visita */ }
  }

  function langFromTimeZone() {
    let zone = '';
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { return null; }
    if (PT_ZONES.has(zone)) return 'pt';
    if (ES_ZONES.has(zone) || zone.startsWith('America/Argentina/')) return 'es';
    return null;
  }

  function langFromBrowser() {
    const first = ((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase();
    if (!first) return 'pt';
    if (first.startsWith('pt')) return 'pt';
    if (first.startsWith('es')) return 'es';
    return 'en';
  }

  function detect() {
    const fromUrl = new URLSearchParams(location.search).get('lang');
    if (isLang(fromUrl)) return fromUrl;
    const saved = readSaved();
    if (isLang(saved)) return saved;
    return langFromTimeZone() || langFromBrowser();
  }

  // Guarda o português original de cada texto e atributo para poder voltar a ele.
  const textNodes = [];
  const attrNodes = [];
  function collect() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent || parent.closest('script, style, .lang-picker')) return NodeFilter.FILTER_REJECT;
        return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      textNodes.push({ node, original: node.nodeValue });
    }
    document.querySelectorAll(TRANSLATED_ATTRS.map((a) => `[${a}]`).join(',')).forEach((el) => {
      TRANSLATED_ATTRS.filter((a) => el.hasAttribute(a)).forEach((attr) => {
        attrNodes.push({ el, attr, original: el.getAttribute(attr) });
      });
    });
    const description = document.querySelector('meta[name="description"]');
    if (description) attrNodes.push({ el: description, attr: 'content', original: description.content });
  }
  const originalTitle = document.title;

  function translate(text, lang) {
    if (lang === 'pt') return text;
    const key = text.trim();
    const entry = STRINGS[key];
    if (!entry) return text;
    const value = entry[lang === 'en' ? 0 : 1];
    const lead = text.match(/^\s*/)[0];
    const trail = text.match(/\s*$/)[0];
    return lead + value + trail;
  }

  function apply(lang) {
    textNodes.forEach(({ node, original }) => { node.nodeValue = translate(original, lang); });
    attrNodes.forEach(({ el, attr, original }) => { el.setAttribute(attr, translate(original, lang)); });
    document.title = translate(originalTitle, lang);
    document.documentElement.lang = HTML_LANG[lang];
    const select = document.querySelector('.lang-select');
    if (select) select.value = lang;
    const flag = document.querySelector('.lang-flag');
    if (flag) flag.textContent = FLAGS[lang];
  }

  function init() {
    collect();
    apply(detect());
    const select = document.querySelector('.lang-select');
    if (!select) return;
    select.addEventListener('change', () => {
      const lang = select.value;
      if (!isLang(lang)) return;
      save(lang);
      apply(lang);
    });
  }

  init();
})();
