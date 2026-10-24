// Releases de cada app no GitHub, na ordem de prioridade do site.
// O site busca sozinho o .dmg do release mais recente; "tag" e "file" são só o
// link reserva caso a API do GitHub falhe.
// "published: false" mostra o botão como "Em breve" até o repositório e o release estarem públicos.
// "app" é o nome do .app dentro do .dmg: o site monta com ele o comando que libera o app no Terminal.
window.WITCH_APPS = Object.freeze({
  sirena:       Object.freeze({ repo: 'Sirena',        tag: 'v0.4.0',        file: 'Sirena-0.4.0.dmg',       published: true, app: 'Sirena.app' }),
  macdash:      Object.freeze({ repo: 'MacDash',       tag: 'macdash-1.0.0', file: 'MacDash-1.0.0.dmg',      published: true, app: 'MacDash.app' }),
  neorar:       Object.freeze({ repo: 'Neorar',        tag: 'v1.0.0',        file: 'Neorar-1.0.0.dmg',       published: true, app: 'Neorar.app' }),
  rubbishnotes: Object.freeze({ repo: 'rubbish-notes', tag: 'v1.0.0',        file: 'RubbishNotes-1.0.0.dmg', published: true, app: 'Rubbish Notes.app' }),
  bunnygrid:    Object.freeze({ repo: 'BunnyGrid',     tag: 'v0.1.0',        file: 'BunnyGrid-0.1.0.dmg',    published: true, app: 'BunnyGrid.app' }),
  wormlink:     Object.freeze({ repo: 'Wormlink',      tag: 'v0.1.0',        file: 'Wormlink-0.1.0.dmg',     published: true, app: 'Wormlink.app' }),
  santovideoplayer: Object.freeze({ repo: 'santo-video-player', tag: 'v2.0.0', file: 'SantoVideoPlayer-2.0.0.dmg', published: true, app: 'Santo Video Player.app' }),
  viewtube:     Object.freeze({ repo: 'viewtube-mac',  tag: 'v1.0.1',        file: 'ViewTube-1.0.1.dmg',     published: true, app: 'ViewTube.app' }),
});
