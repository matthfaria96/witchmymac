// Releases de cada app no GitHub, na ordem do site (provável uso: dos mais procurados aos de nicho).
// O site busca sozinho o .dmg do release mais recente; "tag" e "file" são só o
// link reserva caso a API do GitHub falhe.
// "published: false" mostra o botão como "Em breve" até o repositório e o release estarem públicos.
// "app" é o nome do .app dentro do .dmg: o site monta com ele o comando que libera o app no Terminal.
window.WITCH_APPS = Object.freeze({
  macdash:      Object.freeze({ repo: 'MacDash',       tag: 'macdash-1.6.0', file: 'MacDash-1.6.0.dmg',      published: true, app: 'MacDash.app' }),
  espelho:      Object.freeze({ repo: 'espelho',       tag: 'v1.4.0',        file: 'Espelho-1.4.0.dmg',      published: true, app: 'Espelho.app' }),
  winapps:      Object.freeze({ repo: 'winapps',       tag: 'v2.0.0',        file: 'WinApps-2.0.0.dmg',      published: true, app: 'WinApps.app' }),
  viewtube:     Object.freeze({ repo: 'viewtube-mac',  tag: 'v2.0.0',        file: 'ViewTube-2.0.0.dmg',     published: true, app: 'ViewTube.app' }),
  garimpalo:    Object.freeze({ repo: 'garimpalo',     tag: 'v0.2.0',        file: 'Garimpalo_0.2.0_universal.dmg', published: true, app: 'Garimpalo.app' }),
  instamac:     Object.freeze({ repo: 'instamac',      tag: 'v1.0.0',        file: 'Instamac-1.0.0.dmg',     published: true, app: 'Instamac.app' }),
  neorar:       Object.freeze({ repo: 'Neorar',        tag: 'v1.1.3',        file: 'Neorar-1.1.3.dmg',       published: true, app: 'Neorar.app' }),
  hyperimage:   Object.freeze({ repo: 'hyperimage-converter', tag: 'v1.0.2', file: 'HyperImage-1.0.2.dmg', published: true, app: 'HyperImage Converter.app' }),
  hypervideo:   Object.freeze({ repo: 'hypervideo-converter', tag: 'v1.0.1', file: 'HyperVideo-1.0.1.dmg', published: true, app: 'HyperVideo Converter.app' }),
  bettercraft:  Object.freeze({ repo: 'bettercraft-launcher', tag: 'v0.6.6', file: 'BetterCraftLauncher-0.6.6.dmg', published: true, app: 'BetterCraft Launcher.app' }),
  aitracker:    Object.freeze({ repo: 'Aitracker',     tag: 'v1.0.1',        file: 'Aitracker-1.0.1.dmg',    published: true, app: 'Aitracker.app' }),
  sirena:       Object.freeze({ repo: 'Sirena',        tag: 'v0.9.1',        file: 'Sirena-0.9.1.dmg',       published: true, app: 'Sirena.app' }),
  rubbishnotes: Object.freeze({ repo: 'rubbish-notes', tag: 'v1.2.1',        file: 'RubbishNotes-1.2.1.dmg', published: true, app: 'Rubbish Notes.app' }),
  excaliburforms: Object.freeze({ repo: 'ExcaliburForms', tag: 'v1.0.0',     file: 'ExcaliburForms-1.0.0.dmg', published: true, app: 'ExcaliburForms.app' }),
  wineup:       Object.freeze({ repo: 'wineup-player', tag: 'v1.1.1',      file: 'WineupPlayer-1.1.1.dmg', published: true, app: 'Wineup Player.app' }),
  veocode:      Object.freeze({ repo: 'Veocode',       tag: 'v0.10.0',       file: 'Veocode-0.10.0.dmg',      published: true, app: 'Veocode.app' }),
  kaveelsbook:  Object.freeze({ repo: 'kaveels-book-studio', tag: 'v0.1.2', file: 'KaveelsBookStudio-mac.dmg', published: true, app: "Kaveel's Book Studio.app" }),
  santovideoplayer: Object.freeze({ repo: 'santo-video-player', tag: 'v2.0.2', file: 'SantoVideoPlayer-2.0.2.dmg', published: true, app: 'Santo Video Player.app' }),
  manhwafy:     Object.freeze({ repo: 'ManhwaFy',      tag: 'v0.1.0',        file: 'ManhwaFy-0.1.0.dmg',     published: true, app: 'ManhwaFy.app' }),
  animelocalizationstudio: Object.freeze({ repo: 'anime-localization-studio', tag: 'v0.29.0', file: 'AnimeLocalizationStudio-0.29.0.dmg', published: true, app: 'Anime Localization Studio.app' }),
  wormlink:     Object.freeze({ repo: 'Wormlink',      tag: 'v0.2.2',        file: 'Wormlink-0.2.2.dmg',     published: true, app: 'Wormlink.app' }),
  bunnygrid:    Object.freeze({ repo: 'BunnyGrid',     tag: 'v0.4.0',        file: 'BunnyGrid-0.4.0.dmg',    published: true, app: 'BunnyGrid.app' }),
});
