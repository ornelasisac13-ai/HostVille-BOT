// ===============================
// events/ready.js - EVENTO QUANDO O BOT ESTÁ PRONTO
// ===============================
const chalk = require('chalk');
const menuHandler = require('../menus/interactiveMenu');

async function handleReady(
  client,
  CONFIG,
  stats,
  serverMonitoring,
  scheduleDailyReport,
  logger,
  warnSystem
) {
  console.log('\n' + chalk.green.underline('═'.repeat(50)));
  console.log(chalk.green('  ✅️ BOT ESTÁ ONLINE!'));
  console.log(chalk.green.underline('═'.repeat(50)));

  console.log(chalk.cyan('\n  📊 ESTATÍSTICAS INICIAIS:'));
  console.log(chalk.white(`   • Tag: ${client.user.tag}`));
  console.log(chalk.white(`   • ID: ${client.user.id}`));
  console.log(chalk.white(`   • Servidores: ${client.guilds.cache.size}`));
    
  for (const guild of client.guilds.cache.values()) {
    serverMonitoring.set(guild.id, true);
  }
  
  if (client.guilds.cache.size > 0) {
    try {
      // Importar comandos
      const commands = [
        require('../commands/adm').data,
        require('../commands/ping').data,
        require('../commands/help').data,
        require('../commands/private').data,
        require('../commands/report').data,
        require('../commands/warn').data,
        require('../commands/warnings').data,
        require('../commands/clearwarns').data,
        require('../commands/warnstats').data
      ];
      
      for (const guild of client.guilds.cache.values()) {
        await guild.commands.set(commands);
        logger.logSuccess(`Comandos registrados em: ${guild.name}`);
      }
      logger.logInfo('Comandos registrados nos servidores com sucesso!');
    } catch (error) {
      logger.logError(`Erro ao registrar comandos: ${error.message}`);
    }
  } else {
    logger.logWarn('Nenhum servidor encontrado. Comandos não registrados.');
  }

  console.log(chalk.green('\n  ✅ Tudo pronto! Bot conectado com sucesso.\n'));
  console.log(chalk.yellow('  📝 COMANDOS NA DM:'));
  console.log(chalk.yellow('  • !clear - Limpa mensagens da DM (mensagens temporárias)'));
  console.log(chalk.yellow('  • !clearAll - Limpa TODAS as DMs (requer senha)'));
  console.log(chalk.yellow('  • !MonitorOn - Ativar monitoramento (requer senha)'));
  console.log(chalk.yellow('  • !MonitorOff - Desativar monitoramento (requer senha)'));
  console.log(chalk.yellow('  • Hello - Painel do Dono (apenas para o dono)\n'));
  
  scheduleDailyReport(client, CONFIG, stats, warnSystem);
  
  menuHandler.initReadline();
  menuHandler.showMenu();
}

module.exports = { handleReady };
