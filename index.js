const { spawn } = require('child_process');
const { appendFileSync, readJsonSync } = require('fs-extra');
const http = require('http');
const axios = require('axios');
const semver = require('semver');
const logger = require('./utils/log');

// 📦 تحميل إعدادات التليجرام
let telegram = { token: null, chat_id: null };
try {
  telegram = readJsonSync('./telegram.json');
} catch (err) {
  logger('⚠️ لم يتم العثور على ملف telegram.json أو به خطأ.', '[ TELEGRAM ]');
}

// 📡 خادم بسيط
const dashboard = http.createServer(function (req, res) {
  res.writeHead(200, 'OK', { 'Content-Type': 'text/plain' });
  res.write('HI! EVERYONE , THIS BOT WAS MADE BY MR benzo AND FEEL THIS NAME benzo egypt 😜');
  res.end();
});
dashboard.listen(process.env.port || 0);
logger('Opened server site...', '[ Starting ]');

// 📝 حفظ السجل في ملف
function logToFile(message) {
  const now = new Date().toLocaleString();
  appendFileSync('restart.log', `[${now}] ${message}\n`);
}

// ✉️ إرسال رسالة لتليجرام
function sendTelegram(message) {
  if (!telegram.token || !telegram.chat_id) return;
  const url = `https://api.telegram.org/bot${telegram.token}/sendMessage`;
  axios.post(url, {
    chat_id: telegram.chat_id,
    text: message
  }).catch(err => {
    logger('فشل إرسال رسالة لتليجرام.', '[ TELEGRAM ]');
  });
}

// 🔁 تشغيل البوت مع عداد إعادة التشغيل
function startBot(message) {
  if (message) {
    logger(message, '[ Starting ]');
    logToFile(message);
    sendTelegram(message);
  }

  const bot = spawn('node', ['--trace-warnings', '--async-stack-traces', 'mirai.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  bot.on('close', code => {
    global.countRestart = (global.countRestart || 0);

    if (code !== 0 || global.countRestart < 5) {
      global.countRestart++;
      const restartMsg = `🔄 تم إعادة تشغيل البوت (${global.countRestart}/5)`;
      logger(restartMsg, '[ Restart ]');
      logToFile(restartMsg);
      sendTelegram(restartMsg);

      return startBot('🔁 Restarting...');
    } else {
      const failedMsg = '❌ فشل تشغيل البوت بعد 5 محاولات. الرجاء التحقق من mirai.js.';
      logger(failedMsg, '[ ERROR ]');
      logToFile(failedMsg);
      sendTelegram(failedMsg);
      return;
    }
  });

  bot.on('error', function (err) {
    const errorMsg = 'حدث خطأ: ' + JSON.stringify(err);
    logger(errorMsg, '[ ERROR ]');
    logToFile(errorMsg);
    sendTelegram(errorMsg);
  });
}

// 🚀 تشغيل أول مرة
startBot('✅ تم تشغيل البوت لأول مرة.');