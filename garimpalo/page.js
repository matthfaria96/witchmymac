// Página do Garimpalo: o botão do Windows aponta para o instalador .exe do release mais recente.
// O nome do arquivo leva a versão, então "releases/latest/download/<nome>" não serve. Se a API do
// GitHub falhar, fica o link fixo do HTML.
(function () {
  const links = document.querySelectorAll('[data-win]');
  if (!links.length) return;
  fetch('https://api.github.com/repos/matthfaria96/garimpalo/releases/latest')
    .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
    .then((release) => {
      const exe = (release.assets || []).find((asset) => asset.name.endsWith('-setup.exe'));
      if (exe) links.forEach((a) => { a.href = exe.browser_download_url; });
    })
    .catch(() => {});
})();
