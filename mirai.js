// مكتبات رئيسية
const chalk = require("chalk");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const moment = require("moment-timezone");
const login = require("fca-unofficial");

// عرض وقت التشغيل
const startTime = moment().tz("Asia/Karachi").format("LLLL");
console.log(chalk.bold.blue(`[🚀 BOT STARTED AT] ${startTime}`));

// تحميل الإعدادات
let config;
try {
  config = require(path.join(process.cwd(), "config.json"));
  console.log(chalk.green("✅ config.json تم تحميله بنجاح."));
} catch {
  console.log(chalk.red("❌ لم يتم العثور على config.json."));
  process.exit(1);
}

// التحقق من الحظر العالمي
(async () => {
  try {
    const { data: banned } = await axios.get("https://raw.githubusercontent.com/Mrchandu7/trick/main/listban.json");
    const isBanned = banned?.includes(config.UID);

    if (isBanned) {
      console.log(chalk.red("[🚫 GLOBAL BAN] المستخدم محظور!"));
      process.exit(1);
    }
  } catch {
    console.log(chalk.yellow("⚠️ تعذر التحقق من قائمة الحظر."));
  }
})();

// تسجيل الدخول عبر appstate.json
let appState;
try {
  appState = require("./appstate.json");
} catch {
  console.log(chalk.red("❌ لم يتم العثور على appstate.json."));
  process.exit(1);
}

login({ appState }, async (err, api) => {
  if (err) {
    console.log(chalk.red(`❌ فشل تسجيل الدخول: ${err.error}`));
    return;
  }

  console.log(chalk.green("✅ تم تسجيل الدخول بنجاح."));

  // إعداد اللغة
  let language = "en";
  try {
    const langData = require(`./languages/${config.language || "en"}.lang`);
    language = langData;
    console.log(chalk.green(`🌐 اللغة: ${config.language || "en"}`));
  } catch {
    console.log(chalk.yellow("⚠️ لم يتم تحميل اللغة، سيتم استخدام اللغة الإنجليزية."));
  }

  // تحميل الأوامر
  const commandsDir = path.join(__dirname, "commands");
  const commands = new Map();

  fs.readdirSync(commandsDir).forEach(file => {
    if (file.endsWith(".js")) {
      const command = require(path.join(commandsDir, file));
      if (command.config && command.config.name) {
        commands.set(command.config.name, command);
        console.log(chalk.blue(`📥 أمر محمّل: ${command.config.name}`));
      }
    }
  });

  // تحميل الأحداث
  const eventsDir = path.join(__dirname, "events");
  const events = [];

  fs.readdirSync(eventsDir).forEach(file => {
    if (file.endsWith(".js")) {
      const event = require(path.join(eventsDir, file));
      events.push(event);
      console.log(chalk.cyan(`📡 حدث محمّل: ${event.config.name}`));
    }
  });

  // استقبال الرسائل
  api.setOptions({
    listenEvents: true,
    logLevel: "silent",
    selfListen: false
  });

  api.listenMqtt((err, message) => {
    if (err) return console.error("❌ خطأ في استقبال الرسائل:", err);

    for (const event of events) {
      try {
        event.run({ api, message, config, commands, language });
      } catch (e) {
        console.error(`⚠️ خطأ في حدث ${event.config.name}:`, e);
      }
    }
  });
});