// ===============================
// menus/interactiveMenu.js - MENU INTERATIVO
// ===============================
const chalk = require('chalk');
const readline = require('readline');
const { ChannelType } = require('discord.js');

let rl = null;
let isMenuActive = false;
let client = null;
let stats = null;
let serverMonitoring = null;
let logger = null;
let warnSystem = null;

function init(clientRef, statsRef, serverMonitoringRef, loggerRef, warnSystemRef) {
  client = clientRef;
  stats = statsRef;
  serverMonitoring = serverMonitoringRef;
  logger = loggerRef;
  warnSystem = warnSystemRef;
  
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    rl.on('close', () => {
      isMenuActive = false;
      if (logger) logger.logWarn('Console do menu fechado.');
    });
    
    rl.on('line', (input) => {
      if (isMenuActive) {
        handleMenuOption(input);
      }
    });
  }
}

function showMenu() {
  if (isMenuActive) return;
  isMenuActive = true;
  
  console.log(chalk.cyan('\n╔═══════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║                  𝙷𝚘𝚜𝚝𝚅𝚒𝚕𝚕𝚎-𝙱𝙾𝚃 𝚅𝚎𝚛𝚜ã𝚘 5.0.1                     ║'));
  console.log(chalk.cyan('╠═══════════════════════════════════════════════════════╣'));
  console.log(chalk.cyan('║  1.  Ver estatísticas detalhadas                                ║'));
  console.log(chalk.cyan('║  2.  Listar todos os servidores                                 ║'));
  console.log(chalk.cyan('║  3.  Ver membros de um servidor                                 ║'));
  console.log(chalk.cyan('║  4.  Enviar mensagem para canal                                 ║'));
  console.log(chalk.cyan('║  5.  Ver status do monitoramento                                ║'));
  console.log(chalk.cyan('║  6.  Ver logs recentes                                          ║'));
  console.log(chalk.cyan('║  7.  Ver status do bot                                          ║'));
  console.log(chalk.cyan('║  8.  Gerar relatório manual                                     ║'));
  console.log(chalk.cyan('║  9.  Ver estatísticas de warns                                  ║'));
  console.log(chalk.cyan('║  0.  Sair                                                       ║'));
  console.log(chalk.cyan('╚═══════════════════════════════════════════════════════╝'));
  
  rl.question(chalk.yellow('\n👉 Escolha uma opção: '), (answer) => {
    isMenuActive = false;
    handleMenuOption(answer);
  });
}

function handleMenuOption(option) {
  if (!rl || rl.closed) {
    initReadline();
  }
  
  switch (option) {
    case '1':
      showStats();
      break;
    case '2':
      listServers();
      break;
    case '3':
      listMembersInServer();
      break;
    case '4':
      sendMessageToChannel();
      break;
    case '5':
      showMonitoringStatus();
      break;
    case '6':
      showRecentLogs();
      break;
    case '7':
      showBotStatus();
      break;
    case '8':
      generateManualReport();
      break;
    case '9':
      showWarnStats();
      break;
    case '0':
      console.log(chalk.red('❌ Encerrando o bot...'));
      if (rl && !rl.closed) {
        rl.close();
      }
      process.exit(0);
    default:
      console.log(chalk.red('❌ Opção inválida!'));
      showMenu();
  }
}

function showStats() {
  const uptimeSeconds = Math.floor(client.uptime / 1000);
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  console.log(chalk.yellow('\n═══ 📊 ESTATÍSTICAS DO BOT ═══'));
  console.log(chalk.white(`🤖 Tag:        ${client.user.tag}`));
  console.log(chalk.white(`🏓 Ping:       ${client.ws.ping}ms`));
  console.log(chalk.white(`⏱️  Uptime:     ${hours}h ${minutes}m ${seconds}s`));
  console.log(chalk.white(`🏛️  Servidores: ${client.guilds.cache.size}`));
  console.log(chalk.white(`👥 Usuários:   ${client.users.cache.size}`));
  console.log(chalk.white(`📁 Canais:     ${client.channels.cache.size}`));
  console.log(chalk.white(`📊 Stats Hoje:  Del:${stats.messagesDeleted} Ent:${stats.membersJoined} Sai:${stats.membersLeft}`));
  console.log(chalk.yellow('═══════════════════════════════\n'));
  
  showMenu();
}

function listServers() {
  console.log(chalk.yellow('\n═══ 🏛️ SERVIDORES DO BOT ═══'));
  
  if (client.guilds.cache.size === 0) {
    console.log(chalk.gray('Nenhum servidor encontrado.'));
  } else {
    client.guilds.cache.forEach((guild, index) => {
      const monitorStatus = serverMonitoring.get(guild.id) ? '🟢 ATIVO' : '🔴 INATIVO';
      console.log(chalk.white(`${index + 1}. ${guild.name} (${guild.memberCount} membros) - ${monitorStatus}`));
    });
  }
  
  console.log(chalk.yellow('══════════════════════════════\n'));
  showMenu();
}

function showMonitoringStatus() {
  console.log(chalk.yellow('\n═══ 🛡️ STATUS DO MONITORAMENTO ═══'));
  
  if (client.guilds.cache.size === 0) {
    console.log(chalk.gray('Nenhum servidor encontrado.'));
  } else {
    client.guilds.cache.forEach((guild) => {
      const status = serverMonitoring.get(guild.id) !== false ? '🟢 ATIVO' : '🔴 INATIVO';
      console.log(chalk.white(`• ${guild.name}: ${status}`));
    });
  }
  
  console.log(chalk.yellow('═══════════════════════════════════\n'));
  showMenu();
}

async function generateManualReport() {
  console.log(chalk.yellow('\n═══ 📊 GERANDO RELATÓRIO ═══'));
  try {
    const { generateDailyReport } = require('../utils/report');
    const reportEmbed = await generateDailyReport(client, stats, warnSystem);
    console.log(chalk.white('✅ Relatório gerado com sucesso!'));
    console.log(chalk.white(`📊 Mensagens deletadas: ${stats.messagesDeleted}`));
    console.log(chalk.white(`👥 Membros novos: ${stats.membersJoined}`));
    console.log(chalk.white(`👋 Membros que saíram: ${stats.membersLeft}`));
    
    console.log(chalk.cyan('\n📋 Comandos mais usados:'));
    const sortedCommands = Object.entries(stats.commandsUsed).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (sortedCommands.length > 0) {
      sortedCommands.forEach(([cmd, count]) => {
        console.log(chalk.white(`   • /${cmd}: ${count} vezes`));
      });
    } else {
      console.log(chalk.white('   • Nenhum comando usado hoje'));
    }
    
  } catch (error) {
    console.log(chalk.red(`❌ Erro: ${error.message}`));
  }
  console.log(chalk.yellow('═══════════════════════════════\n'));
  showMenu();
}

function showWarnStats() {
  console.log(chalk.yellow('\n═══ 📊 ESTATÍSTICAS DE WARNS ═══'));
  
  try {
    const globalStats = warnSystem.getGlobalStats ? warnSystem.getGlobalStats() : {
      totalServers: 0,
      totalUsers: 0,
      totalWarns: 0,
      totalActiveWarns: 0
    };
    
    console.log(chalk.white(`🌐 Servidores com warns: ${globalStats.totalServers}`));
    console.log(chalk.white(`👥 Usuários warnados: ${globalStats.totalUsers}`));
    console.log(chalk.white(`⚠️ Total de warns: ${globalStats.totalWarns}`));
    console.log(chalk.white(`🟢 Warns ativos: ${globalStats.totalActiveWarns}`));
    
  } catch (error) {
    console.log(chalk.red(`❌ Erro ao carregar estatísticas: ${error.message}`));
  }
  
  console.log(chalk.yellow('═══════════════════════════════\n'));
  showMenu();
}

function listMembersInServer() {
  const guilds = Array.from(client.guilds.cache.values());
  
  if (guilds.length === 0) {
    console.log(chalk.red('Nenhum servidor encontrado.'));
    showMenu();
    return;
  }

  console.log(chalk.yellow('\n═══ 👥 ESCOLHA UM SERVIDOR ═══'));
  guilds.forEach((guild, index) => {
    console.log(chalk.white(`${index + 1}. ${guild.name}`));
  });
  
  rl.question(chalk.yellow('\n👉 Digite o número do servidor: '), async (answer) => {
    const index = parseInt(answer) - 1;
    
    if (index >= 0 && index < guilds.length) {
      const guild = guilds[index];
      console.log(chalk.cyan(`\nCarregando membros de ${guild.name}...`));
      
      try {
        await guild.members.fetch();
        const members = guild.members.cache;
        
        console.log(chalk.yellow(`\n═══ MEMBROS DE ${guild.name.toUpperCase()} ═══`));
        console.log(chalk.white(`Total: ${members.size} membros\n`));
        
        let count = 0;
        members.forEach((member) => {
          if (count < 10) {
            const status = member.user.bot ? chalk.blue('[BOT]') : chalk.green('[USER]');
            console.log(`  ${status} ${member.user.tag} - ${member.user.id}`);
            count++;
          }
        });
        
        if (members.size > 10) {
          console.log(chalk.gray(`  ... e mais ${members.size - 10} membros`));
        }
        
        console.log(chalk.yellow('══════════════════════════════════════\n'));
      } catch (error) {
        if (logger) logger.logError(`Erro ao buscar membros: ${error.message}`);
      }
    } else {
      console.log(chalk.red('Servidor inválido!'));
    }
    
    showMenu();
  });
}

function sendMessageToChannel() {
  const guilds = Array.from(client.guilds.cache.values());
  
  if (guilds.length === 0) {
    console.log(chalk.red('Nenhum servidor encontrado.'));
    showMenu();
    return;
  }

  console.log(chalk.yellow('\n═══ 📢 ENVIAR MENSAGEM ═══'));
  guilds.forEach((guild, index) => {
    console.log(chalk.white(`${index + 1}. ${guild.name}`));
  });
  
  rl.question(chalk.yellow('\n👉 Escolha o servidor: '), (guildAnswer) => {
    const guildIndex = parseInt(guildAnswer) - 1;
    
    if (guildIndex >= 0 && guildIndex < guilds.length) {
      const guild = guilds[guildIndex];
      const channels = guild.channels.cache.filter(
        c => c.type === ChannelType.GuildText
      );
      
      if (channels.size === 0) {
        console.log(chalk.red('Nenhum canal de texto encontrado.'));
        showMenu();
        return;
      }
      
      console.log(chalk.cyan('\n📁 Canais de texto:'));
      channels.forEach((channel, index) => {
        console.log(chalk.white(`${index + 1}. #${channel.name}`));
      });
      
      rl.question(chalk.yellow('\n👉 Escolha o canal: '), async (channelAnswer) => {
        const channelIndex = parseInt(channelAnswer) - 1;
        
        if (channelIndex >= 0 && channelIndex < channels.size) {
          const channel = Array.from(channels.values())[channelIndex];
          
          rl.question(chalk.yellow('\n📝 Digite a mensagem: '), async (message) => {
            try {
              await channel.send(message);
              console.log(chalk.green(`\n✅ Mensagem enviada para #${channel.name}!`));
            } catch (error) {
              if (logger) logger.logError(`Erro ao enviar mensagem: ${error.message}`);
            }
            showMenu();
          });
        } else {
          console.log(chalk.red('Canal inválido!'));
          showMenu();
        }
      });
    } else {
      console.log(chalk.red('Servidor inválido!'));
      showMenu();
    }
  });
}

function showRecentLogs() {
  console.log(chalk.yellow('\n═══ 📋 LOGS RECENTES ═══'));
  console.log(chalk.white('Os logs recentes foram exibidos no console.'));
  console.log(chalk.yellow('══════════════════════════════\n'));
  showMenu();
}

function showBotStatus() {
  const uptimeSeconds = Math.floor(client.uptime / 1000);
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  console.log(chalk.yellow('\n═══ 🛡️ STATUS DO BOT ═══'));
  console.log(chalk.white(`🟢 Status: Online`));
  console.log(chalk.white(`🏓 Ping: ${client.ws.ping}ms`));
  console.log(chalk.white(`⏱️  Uptime: ${hours}h ${minutes}m ${seconds}s`));
  console.log(chalk.white(`🏛️  Servidores: ${client.guilds.cache.size}`));
  console.log(chalk.white(`👥 Usuários: ${client.users.cache.size}`));
  console.log(chalk.yellow('══════════════════════════════\n'));
  showMenu();
}

function initReadline() {
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    rl.on('close', () => {
      isMenuActive = false;
      if (logger) logger.logWarn('Console do menu fechado.');
    });
    
    rl.on('line', (input) => {
      if (isMenuActive) {
        handleMenuOption(input);
      }
    });
  }
}

module.exports = {
  init,
  showMenu,
  initReadline
};
