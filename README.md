# Good Music 🎧

Premium desktop music player with 3D audio-reactive visualizer, playlists, and local audio import. ✨

## 🇷🇺 Русский

### Что это
- Desktop-приложение на Electron + React + TypeScript.
- Красивый premium UI: glassmorphism, neon, анимации Framer Motion, 3D-сцена на React Three Fiber.
- Полноценный плеер: `play/pause`, `next/prev`, `seek`, `volume`, `shuffle`, `repeat`.
- Плейлисты: создание, удаление, добавление/удаление треков.
- Импорт локальных файлов: `mp3`, `wav`, `ogg`.

### Запуск 🚀
```bash
npm install
npm run dev
```

### Сборка 🛠️
```bash
npm run lint
npm run build
npm start
```

### Важно
- Метаданные библиотеки и плейлистов сохраняются в `localStorage`.
- Локальные файлы после перезапуска могут требовать повторного импорта (ограничение `blob:` URL в браузерном окружении).

## 🇬🇧 English

### What is this
- Desktop app built with Electron + React + TypeScript.
- Premium UI: glassmorphism, neon styling, Framer Motion animations, and React Three Fiber 3D scene.
- Full player controls: `play/pause`, `next/prev`, `seek`, `volume`, `shuffle`, `repeat`.
- Playlists: create, delete, add/remove tracks.
- Local file import: `mp3`, `wav`, `ogg`.

### Run 🚀
```bash
npm install
npm run dev
```

### Build 🛠️
```bash
npm run lint
npm run build
npm start
```

### Notes
- Library and playlist metadata are saved in `localStorage`.
- Local tracks may require re-import after app restart (`blob:` URL limitation).

## Stack 💿
- Electron
- React 19 + TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Three.js / React Three Fiber
- Zustand
- Web Audio API
