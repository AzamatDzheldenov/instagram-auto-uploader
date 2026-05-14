const axios = require('axios');
require('dotenv').config();

const BASE_URL = `https://graph.facebook.com/${process.env.API_VERSION}`;

async function refreshToken() {
  try {
    const response = await axios.get(`${BASE_URL}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.APP_ID,
        client_secret: process.env.APP_SECRET,
        fb_exchange_token: process.env.LONG_LIVED_TOKEN,
      },
    });

    const newToken = response.data.access_token;
    const expiresIn = response.data.expires_in;

    console.log(`✅ Токен обновлён. Истекает через: ${Math.round(expiresIn / 86400)} дней`);
    return newToken;
  } catch (error) {
    console.error('❌ Ошибка обновления токена:', error.response?.data || error.message);
    throw error;
  }
}

async function validateToken() {
  try {
    const response = await axios.get(`${BASE_URL}/me`, {
      params: {
        fields: 'id,name',
        access_token: process.env.LONG_LIVED_TOKEN,
      },
    });
    console.log(`✅ Токен валиден. Аккаунт: ${response.data.name}`);
    return true;
  } catch (error) {
    console.error('❌ Токен невалиден:', error.response?.data || error.message);
    return false;
  }
}

module.exports = { refreshToken, validateToken };