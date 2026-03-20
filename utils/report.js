// ===============================
// utils/report.js - FUNÇÕES PARA GERAR RELATÓRIOS
// ===============================
const { EmbedBuilder, Colors } = require('discord.js');
const { formatTime } = require('./timeFormatter');
const { logInfo, logError } = require('./logger');

async function generateDailyReport(client, stats, warnSystem) {
  const now = new Date();
  const reportDate = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  
  const sortedCommands = Object.entries(stats.commandsUsed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  let commandsField = "📊 **Comandos mais usados:**\n";
  if (sortedCommands.length > 0) {
    sortedCommands.forEach(([cmd, count]) => {
      commandsField += `• \`/${cmd}\`: ${count} vezes\n`;
    });
  } else {
    commandsField += "• Nenhum comando usado hoje";
  }
  
  // Adicionar estatísticas de warns
  const globalWarnStats = warnSystem.getGlobalStats ? warnSystem.getGlobalStats() : { totalWarns: 0, totalActiveWarns: 0 };
  
  const reportEmbed = new EmbedBuilder()
    .setTitle('📊 Relatório Diário do Bot')
    .setDescription(`Período: **${reportDate}**`)
    .setColor(Colors.Blue)
    .addFields(
      { 
        name: '🛡️ **Ações de Moderação**', 
        value: `• Mensagens deletadas: **${stats.messagesDeleted}**\n• Avisos dados: **${stats.warnsGiven}**\n• Warns totais: **${globalWarnStats.totalWarns || 0}**`,
        inline: true 
      },
      { 
        name: '👥 **Movimentação de Membros**', 
        value: `• Entraram: **${stats.membersJoined}**\n• Saíram: **${stats.membersLeft}**`,
        inline: true 
      },
      { 
        name: '📈 **Crescimento Líquido**', 
        value: `**${stats.membersJoined - stats.membersLeft}** membros`,
        inline: true 
      },
      { 
        name: '🤖 **Status do Bot**', 
        value: `• Uptime: **${formatTime(client.uptime)}**\n• Ping: **${client.ws.ping}ms**\n• Servidores: **${client.guilds.cache.size}**`,
        inline: false 
      },
      { 
        name: '📋 **Comandos**', 
        value: commandsField,
        inline: false 
      }
    )
    .setFooter({ 
      text: `Relatório gerado automaticamente • ${new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
      iconURL: client.user.displayAvatarURL()
    });

  return reportEmbed;
}

async function sendReportToStaff(client, CONFIG, stats, warnSystem) {
  try {
    const reportEmbed = await generateDailyReport(client, stats, warnSystem);
    
    const staffIds = CONFIG.STAFF_USER_ID ? CONFIG.STAFF_USER_ID.split(',') : [];
    
    for (const staffId of staffIds) {
      const staffIdTrimmed = staffId.trim();
      const cleanId = staffIdTrimmed.replace(/[<@>]/g, '');
      
      try {
        const staffUser = await client.users.fetch(cleanId);
        if (staffUser) {
          await staffUser.send({ 
            content: '📬 **Relatório Diário do Bot**',
            embeds: [reportEmbed] 
          });
          logInfo(`📊 Relatório diário enviado para ${staffUser.tag}`);
        }
      } catch (err) {
        logError(`Erro ao enviar relatório para ${cleanId}: ${err.message}`);
      }
    }
    
    if (CONFIG.logChannelId) {
      const logChannel = await client.channels.fetch(CONFIG.logChannelId).catch(() => null);
      if (logChannel) {
        await logChannel.send({ 
          content: '📊 **Relatório Diário do Bot**',
          embeds: [reportEmbed] 
        });
      }
    }
    
    stats.reset();
    
  } catch (error) {
    logError(`Erro ao gerar/enviar relatório: ${error.message}`);
  }
}

function scheduleDailyReport(client, CONFIG, stats, warnSystem) {
  const now = new Date();
  const [reportHour, reportMinute] = CONFIG.DAILY_REPORT_TIME ? CONFIG.DAILY_REPORT_TIME.split(':').map(Number) : [12, 0];
  
  const nextReport = new Date(now);
  nextReport.setHours(reportHour, reportMinute, 0, 0);
  
  if (now > nextReport) {
    nextReport.setDate(nextReport.getDate() + 1);
  }
  
  const timeUntilReport = nextReport - now;
  
  logInfo(`📊 Próximo relatório diário agendado para: ${nextReport.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  
  setTimeout(() => {
    sendReportToStaff(client, CONFIG, stats, warnSystem);
    setInterval(() => sendReportToStaff(client, CONFIG, stats, warnSystem), 24 * 60 * 60 * 1000);
    logInfo('📊 Relatórios diários agendados (a cada 24h)');
  }, timeUntilReport);
}

module.exports = {
  generateDailyReport,
  sendReportToStaff,
  scheduleDailyReport
};
