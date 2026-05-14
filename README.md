Открой `README.md` в VS Code и вставь:

```markdown
# Instagram Auto Uploader

Автоматизация публикации контента в Instagram через Graph API v25.0.
Поддерживает Reels, карусели и обычные посты. Токен не истекает — автообновление каждые 30 дней.

---

## Возможности

- Публикация 3 типов контента: Posts, Reels, Carousel
- Trial режим — проверка без реальной публикации
- Long-Lived Token (~60 дней) с автообновлением через cron
- Подписи к постам через metadata.json
- Контент из локальных папок

---

## Стек

- Node.js
- Instagram Graph API v25.0
- axios, dotenv, node-cron

---

## Быстрый старт

### 1. Клонируй репозиторий

```bash
git clone https://github.com/AzamatDzheldenov/instagram-auto-uploader.git
cd instagram-auto-uploader
npm install
```

### 2. Настрой переменные окружения

```bash
cp .env.example .env
```

Открой `.env` и заполни своими данными (см. раздел "Получение токена" ниже).

### 3. Запусти в trial режиме

```bash
node src/index.js
```

---

## Структура проекта

```
instagram-auto-uploader/
├── src/
│   ├── index.js           # Точка входа, cron для обновления токена
│   ├── uploader.js        # Публикация всех типов контента
│   ├── tokenManager.js    # Валидация и обновление токена
│   └── contentReader.js   # Чтение файлов и metadata из папок
├── content/
│   ├── posts/             # Фото для обычных постов (.jpg, .png)
│   ├── reels/             # Видео для Reels (.mp4, .mov)
│   └── carousel/          # Фото/видео для карусели
├── .env.example           # Шаблон переменных окружения
└── package.json
```

---

## Формат контента

Каждый файл может иметь рядом `metadata.json` с подписью:

**Для одного файла** — `photo.metadata.json`:
```json
{
  "caption": "Текст подписи к посту 🚀 #хештег",
  "scheduled": false
}
```

**Для всей папки** — `metadata.json` (применяется ко всем файлам в папке):
```json
{
  "caption": "Общая подпись для всех постов в папке",
  "scheduled": false
}
```

---

## Получение токена

### Что нужно

- Facebook аккаунт
- Facebook App (создаётся на developers.facebook.com)
- Facebook Page
- Instagram Business аккаунт, привязанный к Facebook Page

### Шаг 1 — Создай Facebook App

1. Открой [developers.facebook.com](https://developers.facebook.com)
2. Мои приложения → Создать приложение
3. Тип: Business
4. Запиши `App ID` и `App Secret` (Настройки → Основные)

### Шаг 2 — Получи User Access Token

1. Открой [Graph API Explorer](https://developers.facebook.com/tools/explorer)
2. Выбери своё приложение
3. Добавь разрешения:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - `pages_show_list`
4. Нажми **Generate Access Token**

### Шаг 3 — Получи Page Access Token

В Graph API Explorer выполни запрос:
```
GET /{page_id}?fields=access_token
```

Сохрани полученный токен.

### Шаг 4 — Обменяй на Long-Lived Token

Открой в браузере (подставь свои значения):
```
https://graph.facebook.com/v25.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={APP_ID}
  &client_secret={APP_SECRET}
  &fb_exchange_token={PAGE_ACCESS_TOKEN}
```

Получишь токен с `expires_in` ~5 000 000 секунд (60 дней).

### Шаг 5 — Найди Instagram Account ID

В Graph API Explorer:
```
GET /{page_id}?fields=instagram_business_account
```

Запиши `id` из поля `instagram_business_account`.

---

## Переменные окружения

| Переменная | Описание |
|---|---|
| `APP_ID` | ID твоего Facebook приложения |
| `APP_SECRET` | Секрет приложения (Settings → Basic) |
| `PAGE_ID` | ID Facebook Page |
| `INSTAGRAM_ACCOUNT_ID` | ID Instagram Business аккаунта |
| `LONG_LIVED_TOKEN` | Long-Lived Page Access Token |
| `TRIAL_MODE` | `true` — без публикации, `false` — реальная публикация |
| `API_VERSION` | Версия API (рекомендуется `v25.0`) |

---

## Trial режим

При `TRIAL_MODE=true` приложение:
- Создаёт медиа-контейнер на серверах Meta
- Обрабатывает видео (для Reels)
- **Не публикует** в ленту

Это безопасный способ проверить что токен и настройки работают корректно.

Для реальной публикации установи в `.env`:
```
TRIAL_MODE=false
```

---

## Важно для публикации локальных файлов

Instagram Graph API принимает только **публичные HTTPS ссылки** на файлы.
Для публикации из локальных папок нужно предварительно загрузить файл в облако.

Рекомендуемые варианты:
- [Cloudinary](https://cloudinary.com) — бесплатный план до 25GB
- AWS S3
- Google Cloud Storage

---

## Автообновление токена

Токен обновляется автоматически **1-го числа каждого месяца в 09:00**.
Новый токен сохраняется в `.env` автоматически.

Для ручного обновления:
```bash
node -e "require('dotenv').config(); require('./src/tokenManager').refreshToken()"
```

---

## Лицензия

MIT
```

