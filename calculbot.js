const { MessengerBot } = require('messenger-bot');

const bot = new MessengerBot();

bot.command('/add', (message) => {
  const numbers = message.text.split(' ').slice(1);
  const result = numbers.reduce((acc, curr) => acc + parseInt(curr), 0);
  message.reply(`المجموع: ${result}`);
});

bot.command('/subtract', (message) => {
  const numbers = message.text.split(' ').slice(1);
  const result = numbers.reduce((acc, curr) => acc - parseInt(curr), 0);
  message.reply(`الفرق: ${result}`);
});

bot.command('/multiply', (message) => {
  const numbers = message.text.split(' ').slice(1);
  const result = numbers.reduce((acc, curr) => acc * parseInt(curr), 1);
  message.reply(`الضرب: ${result}`);
});

bot.command('/divide', (message) => {
  const numbers = message.text.split(' ').slice(1);
  const result = numbers.reduce((acc, curr) => acc / parseInt(curr));
  message.reply(`القسمة: ${result}`);
});

bot.start();
