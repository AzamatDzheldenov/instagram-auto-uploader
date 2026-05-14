const axios = require('axios');
require('dotenv').config();

const BASE_URL = `https://graph.facebook.com/${process.env.API_VERSION}`;
const IG_ID = process.env.INSTAGRAM_ACCOUNT_ID;
const TOKEN = process.env.LONG_LIVED_TOKEN;
const TRIAL_MODE = process.env.TRIAL_MODE === 'true';

// ─── Утилита запроса ───────────────────────────────────────────
async function apiPost(endpoint, params) {
  const response = await axios.post(`${BASE_URL}/${endpoint}`, null, {
    params: { ...params, access_token: TOKEN },
  });
  return response.data;
}

async function apiGet(endpoint, params) {
  const response = await axios.get(`${BASE_URL}/${endpoint}`, {
    params: { ...params, access_token: TOKEN },
  });
  return response.data;
}

// ─── Ожидание готовности контейнера ────────────────────────────
async function waitForContainer(containerId, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const data = await apiGet(`${containerId}`, { fields: 'status_code' });
    console.log(`  ⏳ Статус контейнера: ${data.status_code}`);
    if (data.status_code === 'FINISHED') return true;
    if (data.status_code === 'ERROR') throw new Error('Контейнер завершился с ошибкой');
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error('Таймаут ожидания контейнера');
}

// ─── Публикация обычного поста ──────────────────────────────────
async function publishPost({ imageUrl, caption }) {
  console.log('\n📸 Публикация поста...');

  const container = await apiPost(`${IG_ID}/media`, {
    image_url: imageUrl,
    caption,
  });

  console.log(`  ✅ Контейнер создан: ${container.id}`);

  if (TRIAL_MODE) {
    console.log('  🧪 TRIAL MODE: публикация остановлена на этапе контейнера');
    return { trialContainerId: container.id };
  }

  const result = await apiPost(`${IG_ID}/media_publish`, {
    creation_id: container.id,
  });

  console.log(`  ✅ Пост опубликован! ID: ${result.id}`);
  return result;
}

// ─── Публикация Reel ────────────────────────────────────────────
async function publishReel({ videoUrl, caption }) {
  console.log('\n🎬 Публикация Reel...');

  const container = await apiPost(`${IG_ID}/media`, {
    media_type: 'REELS',
    video_url: videoUrl,
    caption,
  });

  console.log(`  ✅ Контейнер создан: ${container.id}`);
  await waitForContainer(container.id);

  if (TRIAL_MODE) {
    console.log('  🧪 TRIAL MODE: публикация остановлена после обработки видео');
    return { trialContainerId: container.id };
  }

  const result = await apiPost(`${IG_ID}/media_publish`, {
    creation_id: container.id,
  });

  console.log(`  ✅ Reel опубликован! ID: ${result.id}`);
  return result;
}

// ─── Публикация карусели ────────────────────────────────────────
async function publishCarousel({ imageUrls, caption }) {
  console.log('\n🎠 Публикация карусели...');

  const childIds = [];
  for (const url of imageUrls) {
    const child = await apiPost(`${IG_ID}/media`, { image_url: url, is_carousel_item: true });
    console.log(`  ✅ Дочерний элемент: ${child.id}`);
    childIds.push(child.id);
  }

  const container = await apiPost(`${IG_ID}/media`, {
    media_type: 'CAROUSEL',
    children: childIds.join(','),
    caption,
  });

  console.log(`  ✅ Контейнер карусели: ${container.id}`);

  if (TRIAL_MODE) {
    console.log('  🧪 TRIAL MODE: публикация остановлена на этапе контейнера');
    return { trialContainerId: container.id };
  }

  const result = await apiPost(`${IG_ID}/media_publish`, {
    creation_id: container.id,
  });

  console.log(`  ✅ Карусель опубликована! ID: ${result.id}`);
  return result;
}

module.exports = { publishPost, publishReel, publishCarousel };