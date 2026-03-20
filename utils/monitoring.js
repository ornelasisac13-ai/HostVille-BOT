// ===============================
// utils/monitoring.js - FUNÇÕES DE MONITORAMENTO
// ===============================
const { Colors, EmbedBuilder } = require('discord.js');
const chalk = require('chalk');

function setServerMonitoring(serverMonitoring, client, guildId, status, user) {
  serverMonitoring.set(guildId, status);
  
  const action = status ? 'ATIVADO' : 'DESATIVADO';
  console.log(chalk.cyan.bgBlack.bold(`\n 🛡️ MONITORAMENTO ${action}`));
  console.log(chalk.cyan('────────────────────────────────'));
  console.log(chalk.cyan(`   Servidor: ${client.guilds.cache.get(guildId)?.name || guildId}`));
  console.log(chalk.cyan(`   ID:       ${guildId}`));
  console.log(chalk.cyan(`   Staff:    ${user.tag}`));
  console.log(chalk.cyan(`   Data:     ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`));
  console.log(chalk.cyan('────────────────────────────────\n'));
}

function createStatusEmbed(guild, action, user) {
  const isActive = action === 'on';
  const color = isActive ? Colors.Green : Colors.Red;
  const statusText = isActive ? '🟢 **ATIVO**' : '🔴 **INATIVO**';
  
  const embed = new EmbedBuilder()
    .setTitle(`🛡️ Monitoramento ${isActive ? 'Ativado' : 'Desativado'}`)
    .setColor(color)
    .addFields(
      { name: '🛡️ Status', value: statusText, inline: true },
      { name: '🛠 Staff', value: user.toString(), inline: true },
      { name: '🗓 Data', value: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }), inline: false }
    )
    .setTimestamp();
  
  if (guild) {
    embed.addFields({ name: '🏛️ Servidor', value: guild.name, inline: true });
  }
  
  return embed;
}

module.exports = {
  setServerMonitoring,
  createStatusEmbed
};
