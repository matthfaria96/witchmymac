// Comparador antes/depois: a alça (um range invisível por cima) recorta a imagem colorida.
(function () {
  document.querySelectorAll('.mf-compare').forEach((box) => {
    const range = box.querySelector('input[type=range]');
    const set = () => box.style.setProperty('--pos', range.value + '%');
    range.addEventListener('input', set);
    set();
  });
})();
