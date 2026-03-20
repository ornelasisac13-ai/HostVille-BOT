// ===============================
// utils/logger.js - FUNÇÕES DE LOG PERSONALIZADAS
// ===============================
const chalk = require('chalk');

function getTimestamp() {
  const dataBrasil = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  return chalk.gray(`[${dataBrasil}]`);
}

function logInfo(message) {
  console.log(`${getTimestamp()} ${chalk.green('➜ INFO')}: ${chalk.cyan(message)}`);
}

function logError(message) {
  console.log(`${getTimestamp()} ${chalk.red('✖ ERRO')}: ${chalk.yellow(message)}`);
}

function logWarn(message) {
  console.log(`${getTimestamp()} ${chalk.yellow('⚠ AVISO')}: ${chalk.white(message)}`);
}

function logSuccess(message) {
  console.log(`${getTimestamp()} ${chalk.green('✔ SUCESSO')}: ${chalk.white(message)}`);
}

function logModeration(message, user, content, channel, foundWord) {
  console.log(chalk.red.bgBlack.bold('\n 🛡️ MENSAGEM MODERADA '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Usuário:   ${user.tag}`));
  console.log(chalk.red(`   ID:        ${user.id}`));
  console.log(chalk.red(`   Conteúdo:  ${content}`));
  console.log(chalk.red(`   Palavra:   "${foundWord}"`));
  console.log(chalk.red(`   Canal:     #${channel.name}`));
  console.log(chalk.red(`   Motivo:    ${message}`));
  console.log(chalk.red('────────────────────────────────\n'));
}

module.exports = {
  getTimestamp,
  logInfo,
  logError,
  logWarn,
  logSuccess,
  logModeration
};
