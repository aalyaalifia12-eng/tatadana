/**
 * Telegram Long-Polling Dev Runner for TataDana
 * Allows local real-time testing of Telegram Bot without setting up an external HTTPS tunnel
 */

import 'dotenv/config';
import { processTelegramUpdate } from '../src/lib/telegram/bot-service.js';

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token || token === 'your_telegram_bot_token_here' || token === 'demo_test_token') {
  console.log('⚠️ TELEGRAM_BOT_TOKEN belum diset di .env.local.');
  console.log('Masukkan token bot dari @BotFather di .env.local untuk menjalankan live polling.');
  process.exit(0);
}

console.log('🤖 TataDana Telegram Bot Polling Runner aktif...');
console.log('Mendengarkan pesan baru dari Telegram secara real-time...');

let offset = 0;

async function poll() {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=30`);
    const data = await res.json();

    if (data.ok && Array.isArray(data.result)) {
      for (const update of data.result) {
        offset = update.update_id + 1;
        console.log(`📩 Menerima update [${update.update_id}] dari Telegram:`, update.message?.text || '[media]');

        const processResult = await processTelegramUpdate(update, token);
        if (processResult && processResult.replyText) {
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: processResult.chatId,
              text: processResult.replyText,
            }),
          });
          console.log(`📤 Membalas ke chat ${processResult.chatId}:\n${processResult.replyText}\n---`);
        }
      }
    }
  } catch (err) {
    console.error('Polling error:', err.message);
  }

  setTimeout(poll, 1000);
}

poll();
