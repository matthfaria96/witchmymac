// Releases de cada app no GitHub, na ordem do site (provável uso: dos mais procurados aos de nicho).
// O site busca sozinho o .dmg do release mais recente; "tag" e "file" são só o
// link reserva caso a API do GitHub falhe.
// "published: false" mostra o botão como "Em breve" até o repositório e o release estarem públicos.
// "app" é o nome do .app dentro do .dmg: o site monta com ele o comando que libera o app no Terminal.
window.WITCH_APPS = Object.freeze({
  macdash:      Object.freeze({ repo: 'MacDash',       tag: 'macdash-1.1.1', file: 'MacDash-1.1.1.dmg',      published: true, app: 'MacDash.app' }),
  viewtube:     Object.freeze({ repo: 'viewtube-mac',  tag: 'v1.0.9',        file: 'ViewTube-1.0.9.dmg',     published: true, app: 'ViewTube.app' }),
  bettercraft:  Object.freeze({ repo: 'bettercraft-launcher', tag: 'v0.6.4', file: 'BetterCraftLauncher-0.6.4.dmg', published: true, app: 'BetterCraft Launcher.app' }),
  hyperimage:   Object.freeze({ repo: 'hyperimage-converter', tag: 'v1.0.1', file: 'HyperImage-1.0.1.dmg', published: true, app: 'HyperImage Converter.app' }),
  hypervideo:   Object.freeze({ repo: 'hypervideo-converter', tag: 'v1.0.1', file: 'HyperVideo-1.0.1.dmg', published: true, app: 'HyperVideo Converter.app' }),
  neorar:       Object.freeze({ repo: 'Neorar',        tag: 'v1.1.1',        file: 'Neorar-1.1.1.dmg',       published: true, app: 'Neorar.app' }),
  sirena:       Object.freeze({ repo: 'Sirena',        tag: 'v0.5.3',        file: 'Sirena-0.5.3.dmg',       published: true, app: 'Sirena.app' }),
  rubbishnotes: Object.freeze({ repo: 'rubbish-notes', tag: 'v1.2.0',        file: 'RubbishNotes-1.2.0.dmg', published: true, app: 'Rubbish Notes.app' }),
  wineup:       Object.freeze({ repo: 'wineup-player', tag: 'v1.1.1',      file: 'WineupPlayer-1.1.1.dmg', published: true, app: 'Wineup Player.app' }),
  santovideoplayer: Object.freeze({ repo: 'santo-video-player', tag: 'v2.0.1', file: 'SantoVideoPlayer-2.0.1.dmg', published: true, app: 'Santo Video Player.app' }),
  animelocalizationstudio: Object.freeze({ repo: 'anime-localization-studio', tag: 'v0.29.0', file: 'AnimeLocalizationStudio-0.29.0.dmg', published: true, app: 'Anime Localization Studio.app' }),
  wormlink:     Object.freeze({ repo: 'Wormlink',      tag: 'v0.2.1',        file: 'Wormlink-0.2.1.dmg',     published: true, app: 'Wormlink.app' }),
  bunnygrid:    Object.freeze({ repo: 'BunnyGrid',     tag: 'v0.2.1',        file: 'BunnyGrid-0.2.1.dmg',    published: true, app: 'BunnyGrid.app' }),
});
