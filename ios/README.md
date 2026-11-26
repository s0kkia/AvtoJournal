# АвтоЖурнал — iOS

iOS-порт того же приложения, что и Android-сборка. Вся логика — это уже
готовое веб-приложение (`Web/`), а iOS-часть представляет собой тонкую
нативную оболочку на **Swift + WKWebView**, которая повторяет Android-мосты.

## Структура

```
ios/
├── project.yml                     # проект для XcodeGen
├── AvtoJournal/
│   ├── AppDelegate.swift           # точка входа, создаёт окно
│   ├── WebViewController.swift     # WKWebView + JS-мост + шаринг файлов
│   ├── Info.plist
│   ├── Assets.xcassets/
│   └── Web/                        # общие веб-ассеты (те же, что в Android APK)
│       ├── index.html
│       ├── styles.css
│       ├── app-core.js / app-views.js / app-pdf.js
│       ├── app-actions.js / app-update.js
│       ├── jspdf.umd.min.js
│       └── fonts.js
└── README.md
```

## Сборка

Нужен macOS с Xcode 15+. Проект генерируется из `project.yml` через
[XcodeGen](https://github.com/yonaskolb/XcodeGen):

```bash
brew install xcodegen
cd ios
xcodegen generate
open AvtoJournal.xcodeproj
```

Затем в Xcode:

1. Выберите таргет **AvtoJournal → Signing & Capabilities**.
2. Укажите свою **Team** (Development Team) — либо пропишите `DEVELOPMENT_TEAM`
   в `project.yml` и перегенерируйте проект.
3. Запустите на симуляторе или устройстве.

Bundle ID: `ru.freedgi.autojournal`, версия `2.5` (`CURRENT_PROJECT_VERSION` 16).

## Как работает мост

Android-код выставляет в WebView два объекта — `AndroidBridge` и
`UpdateBridge`. iOS-оболочка создаёт их заново через `WKUserScript` (до
загрузки страницы) и проксирует вызовы в нативный код синхронно через
`prompt("AJBRIDGE:<json>")`, который перехватывается в
`webView(_:runJavaScriptTextInputPanelWithPrompt:...)`.

| JS-вызов | iOS-реализация |
|---|---|
| `AndroidBridge.saveBase64(name, mime, b64)` | пишет файл в `Documents/` и открывает share-sheet (сохранить PDF/бэкап в «Файлы») |
| `AndroidBridge.setTheme(theme)` | переключает `overrideUserInterfaceStyle` / статус-бар |
| `AndroidBridge.openUrl(url)` | `UIApplication.shared.open` |
| `UpdateBridge.*` | заглушка: на iOS нет сайдлоадинга APK |

Выбор файлов (`<input type="file">` для фото и импорта бэкапа) работает
нативно в WKWebView без дополнительного кода.

## Обновления

На iOS установка APK в обход App Store невозможна, поэтому OTA-проверка в
веб-слое отключена (`window.IS_IOS` в `Web/app-update.js`). Обновления
распространяются через App Store / TestFlight. Чтобы вместо этого вести на
TestFlight, достаточно в `app-update.js` вернуть баннер и указать ссылку —
мост `openUrl` уже поддерживается.

## Данные

Состояние хранится в `localStorage` (как и в Android-сборке) и остаётся на
устройстве. Если на какой-то версии iOS `localStorage` для `file://` окажется
нестабильным, замените `loadFileURL` на `WKURLSchemeHandler` с собственным
схемным протоколом (`app://`) — тогда у страницы будет стабильный origin и
хранилище будет надёжнее.

## Синхронизация веб-ассетов

`Web/` — копия ассетов из Android-сборки. При изменении логики приложения
обновляйте обе копии (Android APK и `ios/AvtoJournal/Web/`).
