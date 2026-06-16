# CollabStudy

🌐 Live demo:  
[![Open Site](https://img.shields.io/badge/Open%20Site-CollabStudy-blue?style=for-the-badge)](https://ssllate.github.io/CollabStudy/)

---

## 📌 О проекте
CollabStudy — десктопное Electron-приложение для совместного обучения, управления проектами и общения студентов с офлайн-работой и локальным хранением данных.

---

## Быстрый запуск (для разработки)

### Требования
- [Node.js](https://nodejs.org/) версии 16 или выше
- npm (идёт вместе с Node.js)

### Установка и запуск

```bash
# 1. Установить зависимости
npm install

# 2. Запустить приложение
npm start
```

Приложение откроется как обычная десктопная программа.

---

## Сборка установщика

### Windows (.exe установщик)
```bash
npm run build:win
```
Готовый установщик появится в папке `dist/`.

### macOS (.dmg)
```bash
npm run build:mac
```

### Linux (.AppImage)
```bash
npm run build:linux
```

> ⚠️ Сборка под каждую платформу должна выполняться на соответствующей ОС (Windows → .exe, macOS → .dmg, Linux → .AppImage).

---

## Структура проекта

```
collabstudy-electron/
├── main.js              ← Главный процесс Electron (окно, меню)
├── preload.js           ← Безопасный мост между Electron и страницей
├── index.html           ← Веб-приложение (главная страница)
├── src/
│   ├── js/              ← Логика приложения (по модулям)
│   │   ├── db.js            — работа с данными
│   │   ├── auth.js           — авторизация
│   │   ├── navigation.js     — переключение экранов
│   │   ├── render.js         — отрисовка интерфейса
│   │   ├── home.js           — главная страница
│   │   ├── explore.js        — поиск/обзор
│   │   ├── projects.js       — проекты
│   │   ├── feed.js           — лента
│   │   ├── messages.js       — сообщения
│   │   ├── profile.js        — профиль
│   │   ├── notifications.js  — уведомления
│   │   ├── collab.js         — коллаборация
│   │   ├── utils.js          — вспомогательные функции
│   │   └── init.js           — инициализация приложения
│   └── css/             ← Стили (по модулям)
│       ├── base.css
│       ├── layout.css
│       ├── animations.css
│       ├── views.css
│       ├── components.css
│       ├── modules.css
│       └── responsive.css
├── assets/
│   ├── icon.png         ← Иконка приложения (macOS/Linux)
│   └── icon.ico         ← Иконка приложения (Windows)
└── package.json         ← Настройки Electron
```

---

## Возможности десктопной версии

- Работает **полностью офлайн** — интернет не нужен
- Данные хранятся в **localStorage** браузерного движка Chromium
- Меню приложения: Файл, Правка, Вид, Окно
- Пункт меню **"Сбросить данные"** — полная очистка
- Горячие клавиши:
  - `Ctrl/Cmd + R` — обновить
  - `Ctrl/Cmd + +/-` — масштаб
  - `F11` / `Ctrl+Cmd+F` — полный экран
- Внешние ссылки открываются в браузере системы

---

## Демо-аккаунты

| Email | Пароль |
|-------|--------|
| anna@example.com | demo |
| mike@example.com | demo |
| elena@example.com | demo |
| alex@example.com | demo |
| maria@example.com | demo |
| dima@example.com | demo |

---

## Примечания

- Иконки Font Awesome загружаются из CDN при первом запуске с интернетом; после кешируются
- Шрифты (Manrope, DM Sans) также загружаются из Google Fonts при первом запуске
- Все данные сохраняются локально и не отправляются никуда
