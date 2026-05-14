require('dotenv').config();
const { validateToken, refreshToken } = require('./tokenManager');
const { getAllContent } = require('./contentReader');
const { publishPost, publishReel, publishCarousel } = require('./uploader');

const TRIAL_MODE = process.env.TRIAL_MODE === 'true';

// ─── Тестовые URL для trial режима ─────────────────────────────
// Instagram требует публичный URL — локальные файлы не принимает
// В продакшене сюда подставляем ссылки из облака (S3, Cloudinary и тд)
const TEST_URLS = {
  image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080',
  video: 'https://www.w3schools.com/html/mov_bbb.mp4',
  carousel: [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1080',
  ],
};

async function run() {
  console.log('🚀 Instagram Auto Uploader запущен');
  console.log(`📋 Режим: ${TRIAL_MODE ? '🧪 TRIAL (без реальной публикации)' : '🟢 PRODUCTION'}\n`);

  // 1. Проверяем токен
  const isValid = await validateToken();
  if (!isValid) {
    console.log('🔄 Пробуем обновить токен...');
    await refreshToken();
  }

  // 2. Читаем контент из папок
  const content = getAllContent();
  console.log(`📁 Найдено контента:`);
  console.log(`   Reels: ${content.reels.length}`);
  console.log(`   Карусели: ${content.carousel.length}`);
  console.log(`   Посты: ${content.posts.length}\n`);

  // 3. Тестовая публикация (trial)
  if (TRIAL_MODE) {
    console.log('─'.repeat(50));
    console.log('🧪 ЗАПУСК TRIAL ПУБЛИКАЦИЙ\n');

    try {
      await publishPost({
        imageUrl: TEST_URLS.image,
        caption: 'Тестовый пост 🚀 #trial',
      });
    } catch (e) {
      console.error('❌ Ошибка trial поста:', e.response?.data || e.message);
    }

    try {
      await publishCarousel({
        imageUrls: TEST_URLS.carousel,
        caption: 'Тестовая карусель 🎠 #trial',
      });
    } catch (e) {
      console.error('❌ Ошибка trial карусели:', e.response?.data || e.message);
    }

    try {
      await publishReel({
        videoUrl: TEST_URLS.video,
        caption: 'Тестовый Reel 🎬 #trial',
      });
    } catch (e) {
      console.error('❌ Ошибка trial Reel:', e.response?.data || e.message);
    }

    console.log('\n' + '─'.repeat(50));
    console.log('✅ Trial завершён. Установи TRIAL_MODE=false для реальной публикации.');
    return;
  }

  // 4. Реальная публикация из папок
  for (const item of content.posts) {
    console.log(`📸 Обрабатываем: ${item.fileName}`);
    // В продакшене: загружаем файл в облако, получаем URL, публикуем
    console.log('  ⚠️  Для публикации из локальных файлов нужен облачный хостинг');
  }
}

run().catch(console.error);

// ─── Автообновление токена каждые 30 дней ──────────────────────
const cron = require('node-cron');

cron.schedule('0 9 1 * *', async () => {
  console.log('🔄 Плановое обновление токена...');
  try {
    const newToken = await refreshToken();
    // Записываем новый токен в .env
    const fs = require('fs');
    const envPath = require('path').join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(
      /LONG_LIVED_TOKEN=.*/,
      `LONG_LIVED_TOKEN=${newToken}`
    );
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Токен обновлён и сохранён в .env');
  } catch (e) {
    console.error('❌ Ошибка планового обновления:', e.message);
  }
});