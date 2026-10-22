// Releases de cada app no GitHub, na ordem de prioridade do site.
// O site busca sozinho o .dmg do release mais recente; "tag" e "file" são só o
// link reserva caso a API do GitHub falhe.
// "published: false" mostra o botão como "Em breve" até o repositório e o release estarem públicos.
window.WITCH_APPS = Object.freeze({
  sirena:       Object.freeze({ repo: 'Sirena',        tag: 'v0.4.0',        file: 'Sirena-0.4.0.dmg',       published: true }),
  macdash:      Object.freeze({ repo: 'MacDash',       tag: 'macdash-1.0.0', file: 'MacDash-1.0.0.dmg',      published: true }),
  neorar:       Object.freeze({ repo: 'Neorar',        tag: 'v1.0.0',        file: 'Neorar-1.0.0.dmg',       published: true }),
  rubbishnotes: Object.freeze({ repo: 'rubbish-notes', tag: 'v1.0.0',        file: 'RubbishNotes-1.0.0.dmg', published: true }),
  bunnygrid:    Object.freeze({ repo: 'BunnyGrid',     tag: 'v0.1.0',        file: 'BunnyGrid-0.1.0.dmg',    published: true }),
  wormlink:     Object.freeze({ repo: 'Wormlink',      tag: 'v0.1.0',        file: 'Wormlink-0.1.0.dmg',     published: true }),
});
