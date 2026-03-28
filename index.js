// ===============================
// BOT MODERAÇÃO COMPLETA VERSÃO INTEGRADA - CORRIGIDO (COM PAINEL DO DONO E SISTEMA DE WARNS ULTRA COMPLETO)
// ===============================
const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  Colors, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder, 
  ChannelType,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
const dotenv = require('dotenv');
const chalk = require('chalk');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const axios = require('axios');
const crypto = require('crypto');

dotenv.config();

// ===============================
// CONFIGURAÇÃO DO CLIENTE DISCORD
// ===============================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User, Partials.Reaction],
});

// ===============================
// CONFIGURAÇÕES GERAIS
// ===============================
const CONFIG = {
  logChannelId: process.env.LOG_CHANNEL_ID,
  adminRoles: process.env.ADMIN_ROLES ? process.env.ADMIN_ROLES.split(',') : [],
  ACCESS_CODE: process.env.ACCESS_CODE,
  STAFF_USER_ID: process.env.STAFF_USER_ID,
  OWNER_ID: process.env.OWNER_ID,
  DAILY_REPORT_TIME: process.env.DAILY_REPORT_TIME || '12:00',
};

// ===============================
// VARIÁVEIS GLOBAIS
// ===============================
const serverMonitoring = new Map(); // Key: guildId, Value: boolean (true = monitoramento ativo)
const pendingActions = new Map(); // Armazena ações pendentes para seleção de servidor
const activeSessions = new Map(); // Sessões de moderação
const activeAppeals = new Map(); // Recursos ativos
const backupSchedules = new Map(); // Agendamentos de backup

// Lista de IDs de staff que NÃO serão moderados
const staffIds = CONFIG.STAFF_USER_ID ? CONFIG.STAFF_USER_ID.split(',').map(id => id.trim().replace(/[<@>]/g, '')) : [];

const stats = {
  messagesDeleted: 0,
  warnsGiven: 0,
  membersJoined: 0,
  membersLeft: 0,
  commandsUsed: {},
  startDate: new Date(),
  
  reset() {
    this.messagesDeleted = 0;
    this.warnsGiven = 0;
    this.membersJoined = 0;
    this.membersLeft = 0;
    this.commandsUsed = {};
  }
};

// ===============================
// IMPORTAÇÃO DO SISTEMA DE WARNS
// ===============================
let warnSystem;
try {
  warnSystem = require('./modules/warnSystem.js');
  console.log(chalk.green(`✅ Sistema de warns v${warnSystem.version || '2.0.0'} carregado com sucesso!`));
  
  // Verificar se os cargos estão configurados
  if (warnSystem.CONFIG && warnSystem.CONFIG.autoRoles) {
    console.log(chalk.cyan(`\n📋 Cargos de warn configurados no warnSystem.js:`));
    for (let i = 1; i <= 7; i++) {
      if (warnSystem.CONFIG.autoRoles[i]) {
        console.log(chalk.white(`   • Nível ${i}: ${warnSystem.CONFIG.autoRoles[i]}`));
      }
    }
  }
  
  // Verificar PUNISHMENT_CONFIG
  if (warnSystem.PUNISHMENT_CONFIG && warnSystem.PUNISHMENT_CONFIG.roles && warnSystem.PUNISHMENT_CONFIG.roles.warnRoles) {
    console.log(chalk.cyan(`\n📋 Cargos de warn configurados no PUNISHMENT_CONFIG:`));
    for (let i = 1; i <= 5; i++) {
      if (warnSystem.PUNISHMENT_CONFIG.roles.warnRoles[i]) {
        console.log(chalk.white(`   • Nível ${i}: ${warnSystem.PUNISHMENT_CONFIG.roles.warnRoles[i]}`));
      }
    }
  }
  
} catch (error) {
  console.log(chalk.red('❌ Erro fatal ao carregar sistema de warns:'), error.message);
  console.log(chalk.yellow('⚠️ Certifique-se de que o arquivo ./modules/warnSystem.js existe e não contém erros.'));
  process.exit(1);
}

// ===============================
// FUNÇÃO PARA MONITORAR CARGOS DE WARN NO CONSOLE
// ===============================
async function monitorWarnRoles() {
  console.log(chalk.yellow('\n╔═══════════════════════════════════════════════════════════════╗'));
  console.log(chalk.yellow('║              📊 MONITORAMENTO DE CARGOS DE WARN                ║'));
  console.log(chalk.yellow('╚═══════════════════════════════════════════════════════════════╝'));
  
  for (const guild of client.guilds.cache.values()) {
    console.log(chalk.cyan(`\n🏛️ Servidor: ${guild.name} (${guild.id})`));
    console.log(chalk.gray('─'.repeat(60)));
    
    try {
      await guild.members.fetch();
      const members = guild.members.cache;
      
      // Buscar cargos de warn do warnSystem
      const warnRoles = {};
      
      // Tentar pegar do CONFIG.autoRoles
      if (warnSystem.CONFIG && warnSystem.CONFIG.autoRoles) {
        for (let i = 1; i <= 7; i++) {
          if (warnSystem.CONFIG.autoRoles[i]) {
            warnRoles[i] = warnSystem.CONFIG.autoRoles[i];
          }
        }
      }
      
      // Tentar pegar do PUNISHMENT_CONFIG.roles.warnRoles
      if (warnSystem.PUNISHMENT_CONFIG && warnSystem.PUNISHMENT_CONFIG.roles && warnSystem.PUNISHMENT_CONFIG.roles.warnRoles) {
        for (let i = 1; i <= 5; i++) {
          if (warnSystem.PUNISHMENT_CONFIG.roles.warnRoles[i]) {
            warnRoles[i] = warnSystem.PUNISHMENT_CONFIG.roles.warnRoles[i];
          }
        }
      }
      
      // Verificar cada nível de warn
      let hasAnyRole = false;
      for (let level = 1; level <= 7; level++) {
        const roleId = warnRoles[level];
        
        if (!roleId) {
          if (level === 1) console.log(chalk.gray(`   Nível ${level}: ⚠️ Cargo não configurado no warnSystem`));
          continue;
        }
        
        const role = guild.roles.cache.get(roleId);
        if (!role) {
          console.log(chalk.yellow(`   Nível ${level}: ❌ Cargo não encontrado (ID: ${roleId})`));
          continue;
        }
        
        const membersWithRole = members.filter(member => member.roles.cache.has(roleId));
        
        if (membersWithRole.size === 0) {
          console.log(chalk.gray(`   Nível ${level} (${role.name}): Nenhum membro`));
        } else {
          hasAnyRole = true;
          console.log(chalk.red(`   🔴 Nível ${level} (${role.name}): ${membersWithRole.size} membros`));
          
          // Listar os membros com este cargo
          membersWithRole.forEach(member => {
            // Verificar quantos warns o usuário tem
            let warnCount = 0;
            try {
              const userWarns = warnSystem.getUserWarns ? warnSystem.getUserWarns(guild.id, member.id) : null;
              warnCount = userWarns?.activeCount || 0;
            } catch (err) {
              // Ignorar erro
            }
            
            const riskLevel = warnSystem.calculateRiskLevel ? warnSystem.calculateRiskLevel(warnCount) : { emoji: '⚠️' };
            console.log(chalk.white(`      • ${member.user.tag} (${member.id}) - Warns: ${warnCount} ${riskLevel.emoji || '⚠️'}`));
          });
        }
      }
      
      if (!hasAnyRole) {
        console.log(chalk.gray(`   Nenhum membro com cargos de warn encontrado.`));
      }
      
      // Mostrar estatísticas de warns do servidor
      if (warnSystem.getServerStats) {
        try {
          const serverStats = warnSystem.getServerStats(guild.id);
          if (serverStats && serverStats.totalWarns > 0) {
            console.log(chalk.green(`\n   📊 Estatísticas do servidor:`));
            console.log(chalk.white(`      • Total de warns: ${serverStats.totalWarns || 0}`));
            console.log(chalk.white(`      • Warns ativos: ${serverStats.activeWarns || 0}`));
            console.log(chalk.white(`      • Usuários warnados: ${serverStats.warnedUsers || 0}`));
          }
        } catch (err) {
          // Ignorar erro
        }
      }
      
    } catch (error) {
      console.log(chalk.red(`   Erro ao carregar membros: ${error.message}`));
    }
  }
  
  console.log(chalk.yellow('\n═══════════════════════════════════════════════════════════════\n'));
}

// ===============================
// FUNÇÃO PARA ATUALIZAR CARGOS DE WARN AUTOMATICAMENTE
// ===============================
async function updateWarnRoles(guild, userId, warnCount) {
  try {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return;
    
    // Verificar se o membro é staff ou admin
    const isStaffMember = staffIds.includes(userId) || member.roles.cache.some(role => 
      CONFIG.adminRoles.includes(role.id) || CONFIG.adminRoles.includes(role.name)
    );
    
    if (isStaffMember) return;
    
    // Buscar cargos de warn do warnSystem
    const warnRoles = {};
    
    if (warnSystem.CONFIG && warnSystem.CONFIG.autoRoles) {
      for (let i = 1; i <= 7; i++) {
        if (warnSystem.CONFIG.autoRoles[i]) {
          warnRoles[i] = warnSystem.CONFIG.autoRoles[i];
        }
      }
    }
    
    if (warnSystem.PUNISHMENT_CONFIG && warnSystem.PUNISHMENT_CONFIG.roles && warnSystem.PUNISHMENT_CONFIG.roles.warnRoles) {
      for (let i = 1; i <= 5; i++) {
        if (warnSystem.PUNISHMENT_CONFIG.roles.warnRoles[i]) {
          warnRoles[i] = warnSystem.PUNISHMENT_CONFIG.roles.warnRoles[i];
        }
      }
    }
    
    // Remover todos os cargos de warn
    for (let level = 1; level <= 7; level++) {
      const roleId = warnRoles[level];
      if (roleId && member.roles.cache.has(roleId)) {
        await member.roles.remove(roleId).catch(() => {});
      }
    }
    
    // Adicionar o cargo correspondente ao nível de warn
    if (warnCount >= 1 && warnCount <= 7) {
      const roleId = warnRoles[warnCount];
      if (roleId) {
        await member.roles.add(roleId).catch(() => {});
        console.log(chalk.green(`✅ Cargo de warn nível ${warnCount} adicionado a ${member.user.tag}`));
      }
    }
    
  } catch (error) {
    console.log(chalk.red(`❌ Erro ao atualizar cargo de warn: ${error.message}`));
  }
}

// ===============================
// FUNÇÕES DE LOG PERSONALIZADAS
// ===============================
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

// ===============================
// FUNÇÃO PARA FORMATAR TEMPO
// ===============================
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  return `${days}d ${hours % 24}h ${minutes % 60}m`;
}

// ===============================
// FUNÇÃO PARA GERAR RELATÓRIO
// ===============================
async function generateDailyReport() {
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
  let globalWarnStats = { totalWarns: 0, totalActiveWarns: 0 };
  try {
    globalWarnStats = warnSystem.getGlobalStats ? warnSystem.getGlobalStats() : globalWarnStats;
  } catch (err) {
    // Ignorar erro
  }
  
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

// ===============================
// FUNÇÃO PARA ENVIAR RELATÓRIO
// ===============================
async function sendReportToStaff() {
  try {
    const reportEmbed = await generateDailyReport();
    
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

// ===============================
// FUNÇÃO PARA AGENDAR RELATÓRIO
// ===============================
function scheduleDailyReport() {
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
    sendReportToStaff();
    setInterval(sendReportToStaff, 24 * 60 * 60 * 1000);
    logInfo('📊 Relatórios diários agendados (a cada 24h)');
  }, timeUntilReport);
}

// ===============================
// FUNÇÃO PARA CHECAR PALAVRAS OFENSIVAS
// ===============================
const offensiveWords = [
  "idiota", "burro", "estupido", "retardado", "lixo",
  "merda", "fdp", "otario", "hilter", "sybau", "vsfd", "nazista", "nazismo", "desgracado",
  "vtnc", "imbecil", "inutil", "arrombado", "viado", "bicha", 
  "piranha", "prostituta", "corno", "babaca", "palhaco", "nojento", 
  "escroto", "cretino", "canalha", "maldito", "peste", "verme", 
  "trouxa", "otaria", "burra", "cacete", "caralho", "merdinha",
  "vagabundo", "vagabunda", "cuzao", "idiotinha", "fodido", "bosta",
  "porra", "prr", "poha", "krl", "krlh", "caramba",
  "fds", "foda", "fudeu", "fodase", "fodassi",
  "pqp", "puta", "vsf", "tnc", "tmnc", "cuzão", "cú", "cu",
  "buceta", "bct", "xota", "xoxota", "ppk", "perereca",
  "vai tomar no cu", "vai tnc", "vai tmnc", "vai se foder"
];

function containsOffensiveWord(text) {
  if (!text || typeof text !== 'string') return false;
  
  const textLower = text.toLowerCase().trim();
  
  for (const offensivePhrase of offensiveWords) {
    if (offensivePhrase.includes(' ') && textLower.includes(offensivePhrase)) {
      return true;
    }
  }
  
  const textNormalized = textLower
    .replace(/[^\w\sà-úÀ-Ú]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const words = textNormalized.split(' ');
  
  for (const word of words) {
    if (word.length < 3) continue;
    
    if (offensiveWords.includes(word)) {
      return true;
    }
    
    const leetMap = {
      '0': 'o', '1': 'i', '2': 'z', '3': 'e', '4': 'a', 
      '5': 's', '6': 'g', '7': 't', '8': 'b', '9': 'g',
      '@': 'a', '!': 'i', '$': 's', '#': 'h', '&': 'e'
    };
    
    let normalizedWord = '';
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      normalizedWord += leetMap[char] || char;
    }
    
    if (offensiveWords.includes(normalizedWord)) {
      return true;
    }
  }
  
  return false;
}

function findOffensiveWord(text) {
  if (!text || typeof text !== 'string') return null;
  
  const textLower = text.toLowerCase().trim();
  
  for (const offensivePhrase of offensiveWords) {
    if (offensivePhrase.includes(' ') && textLower.includes(offensivePhrase)) {
      return offensivePhrase;
    }
  }
  
  const textNormalized = textLower
    .replace(/[^\w\sà-úÀ-Ú]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const words = textNormalized.split(' ');
  
  for (const word of words) {
    if (word.length < 3) continue;
    
    if (offensiveWords.includes(word)) {
      return word;
    }
    
    const leetMap = {
      '0': 'o', '1': 'i', '2': 'z', '3': 'e', '4': 'a', 
      '5': 's', '6': 'g', '7': 't', '8': 'b', '9': 'g',
      '@': 'a', '!': 'i', '$': 's', '#': 'h', '&': 'e'
    };
    
    let normalizedWord = '';
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      normalizedWord += leetMap[char] || char;
    }
    
    if (offensiveWords.includes(normalizedWord)) {
      return word;
    }
  }
  
  return null;
}

// ===============================
// FUNÇÃO PARA VERIFICAR PERMISSÕES
// ===============================
function isAdmin(member) {
  if (!member) return false;
  if (!CONFIG.adminRoles || CONFIG.adminRoles.length === 0) return false;
  
  return member.roles.cache.some(role => 
    CONFIG.adminRoles.includes(role.id) || CONFIG.adminRoles.includes(role.name)
  );
}

function isStaff(userId) {
  return staffIds.includes(userId);
}

function setServerMonitoring(guildId, status, user) {
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

// ===============================
// INICIALIZAR READLINE
// ===============================
let rl = null;
let isMenuActive = false;

function initReadline() {
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    rl.on('close', () => {
      isMenuActive = false;
      logWarn('Console do menu fechado.');
    });
    
    rl.on('line', (input) => {
      if (isMenuActive) {
        handleMenuOption(input);
      }
    });
  }
}

// ===============================
// COMANDOS DO BOT
// ===============================
const commands = [
  {
    data: {
      name: 'adm',
      description: 'Painel administrativo do bot',
      options: [{ 
        name: 'code', 
        type: 3, 
        description: 'Senha de acesso administrativo', 
        required: true 
      }],
    },
    async execute(interaction) {
      const code = interaction.options.getString('code');
      
      if (code !== CONFIG.ACCESS_CODE) {
        return interaction.reply({ 
          content: '❌ Código de acesso incorreto!', 
          flags: 64
        });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('stats')
          .setLabel('📊 Estatísticas')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('console')
          .setLabel('🖥️ Ver no Console')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('help')
          .setLabel('❓ Ajuda')
          .setStyle(ButtonStyle.Success)
      );

      const embed = new EmbedBuilder()
        .setTitle('🔐 Painel Administrativo')
        .setDescription('Bem-vindo ao painel de controle do bot!')
        .setColor(Colors.Blue)
        .addFields(
          { name: '👤 Usuário', value: interaction.user.tag, inline: true },
          { name: '🆔 ID', value: interaction.user.id, inline: true }
        )
        .setFooter({ text: 'Use os botões abaixo para acessar as funcionalidades' })
        .setTimestamp();

      await interaction.reply({ 
        content: 'Painel Administrativo:', 
        embeds: [embed],
        components: [row], 
        flags: 64
      });
      
      logInfo(`/adm usado por ${interaction.user.tag}`);
    },
  },
];

const pingCommand = {
  data: {
    name: 'ping',
    description: 'Verifica a latência do bot',
  },
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🏓 Ping do Bot')
      .setColor(Colors.Green)
      .addFields(
        { name: '📡 Latência', value: `${client.ws.ping}ms`, inline: true },
        { name: '⏱️ Uptime', value: `${Math.floor(client.uptime / 1000)}s`, inline: true }
      )
      .setFooter({ text: 'Bot está funcionando corretamente!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: 64 });
    logInfo(`Comando /ping usado por ${interaction.user.tag}`);
    
    stats.commandsUsed['ping'] = (stats.commandsUsed['ping'] || 0) + 1;
  },
};

const helpCommand = {
  data: {
    name: 'help',
    description: 'Mostra a lista de comandos disponíveis',
  },
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('❓ Comandos Disponíveis')
      .setDescription('Lista de comandos que você pode usar no bot:')
      .setColor(Colors.Blue)
      .addFields(
        { name: '/ping', value: 'Verifica a latência do bot', inline: false },
        { name: '/help', value: 'Mostra esta lista de ajuda', inline: false },
        { name: '/adm', value: 'Acesso ao painel administrativo (Staff)', inline: false },
        { name: '/private', value: 'Enviar mensagem privada (Staff)', inline: false },
        { name: '/report', value: 'Gerar relatório manual (Staff)', inline: false },
        { name: '/warn', value: 'Sistema completo de warns (Staff)', inline: false },
        { name: '/warnings', value: '[Atalho] Ver warns de um usuário', inline: false },
        { name: '/clearwarns', value: '[Atalho] Limpar warns de um usuário', inline: false },
        { name: '/warnstats', value: '[Atalho] Estatísticas de warns', inline: false }
      )
      .setFooter({ text: 'Comandos de texto na DM: !clear, !clearAll, !MonitorOn, !MonitorOff, Hello' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: 64 });
    logInfo(`Comando /help usado por ${interaction.user.tag}`);
    
    stats.commandsUsed['help'] = (stats.commandsUsed['help'] || 0) + 1;
  },
};

const privateCommand = {
  data: {
    name: 'private',
    description: 'Enviar mensagem da staff',
    options: [
      {
        name: 'user',
        description: 'Usuário que receberá a mensagem',
        type: 6,
        required: true
      },
      {
        name: 'message',
        description: 'Mensagem a ser enviada',
        type: 3,
        required: true
      },
      {
        name: 'code',
        description: 'Código de acesso',
        type: 3,
        required: true
      }
    ]
  },
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const message = interaction.options.getString('message');
    const code = interaction.options.getString('code');

    if (code !== CONFIG.ACCESS_CODE) {
      return interaction.reply({
        content: '❌ Código de acesso incorreto!',
        flags: 64
      });
    }

    try {
      await interaction.channel.send(
        `🛠 **Mensagem da Staff**\n\n${user}\n\n${message}`
      );

      await user.send({
        content: `📬 **Mensagem da Staff**\n\n${message}`
      });

      await interaction.reply({
        content:
          `✅ Mensagem enviada\n\nPara ${user}\n\nMensagem enviada:\n${message}`,
        flags: 64
      });

      logInfo(`${interaction.user.tag} enviou mensagem para ${user.tag}`);
      
      stats.commandsUsed['private'] = (stats.commandsUsed['private'] || 0) + 1;
    } catch (error) {
      await interaction.reply({
        content: '❌ Erro ao enviar a mensagem. Verifique se o usuário tem DMs abertos.',
        flags: 64
      });
      logError(`Erro ao enviar mensagem privada: ${error.message}`);
    }
  }
};

const reportCommand = {
  data: {
    name: 'report',
    description: 'Gerar relatório manual (Staff)',
    options: [
      {
        name: 'code',
        description: 'Código de acesso',
        type: 3,
        required: true
      }
    ]
  },
  async execute(interaction) {
    const code = interaction.options.getString('code');
    
    if (code !== CONFIG.ACCESS_CODE) {
      return interaction.reply({
        content: '❌ Código de acesso incorreto!',
        flags: 64
      });
    }
    
    await interaction.reply({ content: '🔄 Gerando relatório...', flags: 64 });
    
    const reportEmbed = await generateDailyReport();
    
    const staffIds = CONFIG.STAFF_USER_ID ? CONFIG.STAFF_USER_ID.split(',') : [];
    let successCount = 0;
    let failCount = 0;
    
    for (const staffId of staffIds) {
      const staffIdTrimmed = staffId.trim();
      const cleanId = staffIdTrimmed.replace(/[<@>]/g, '');
      
      try {
        const staffUser = await client.users.fetch(cleanId);
        if (staffUser) {
          await staffUser.send({ 
            content: '📊 **Relatório Manual do Bot**',
            embeds: [reportEmbed] 
          });
          successCount++;
          logInfo(`📊 Relatório manual enviado para ${staffUser.tag}`);
        }
      } catch (err) {
        failCount++;
        logError(`Erro ao enviar relatório manual para ${cleanId}: ${err.message}`);
      }
    }
    
    if (CONFIG.logChannelId) {
      const logChannel = await client.channels.fetch(CONFIG.logChannelId).catch(() => null);
      if (logChannel) {
        await logChannel.send({ 
          content: '📊 **Relatório Manual do Bot**',
          embeds: [reportEmbed] 
        });
      }
    }
    
    await interaction.followUp({
      content: `✅ Relatório gerado e enviado para **${successCount} staff(s)**${failCount > 0 ? ` (${failCount} falhas)` : ''}`,
      flags: 64
    });
    
    logInfo(`${interaction.user.tag} gerou relatório manual (enviado para ${successCount} staffs)`);
    
    stats.commandsUsed['report'] = (stats.commandsUsed['report'] || 0) + 1;
  }
};

// ===============================
// COMANDO /warn
// ===============================
const warnCommand = {
  data: {
    name: 'warn',
    description: 'Sistema completo de warns',
    options: [
      {
        name: 'add',
        description: 'Adicionar warn a um usuário',
        type: 1,
        options: [
          { name: 'user', description: 'Usuário a ser warnado', type: 6, required: true },
          { name: 'reason', description: 'Motivo do warn', type: 3, required: true },
          { name: 'duration', description: 'Duração em dias (0 = permanente)', type: 4, required: false },
          { name: 'code', description: 'Código de acesso', type: 3, required: true }
        ]
      },
      {
        name: 'remove',
        description: 'Remover um warn específico',
        type: 1,
        options: [
          { name: 'user', description: 'Usuário', type: 6, required: true },
          { name: 'warnid', description: 'ID do warn a remover', type: 3, required: true },
          { name: 'reason', description: 'Motivo da remoção', type: 3, required: true },
          { name: 'code', description: 'Código de acesso', type: 3, required: true }
        ]
      },
      {
        name: 'clear',
        description: 'Limpar todos os warns de um usuário',
        type: 1,
        options: [
          { name: 'user', description: 'Usuário', type: 6, required: true },
          { name: 'reason', description: 'Motivo da limpeza', type: 3, required: true },
          { name: 'code', description: 'Código de acesso', type: 3, required: true }
        ]
      },
      {
        name: 'check',
        description: 'Verificar warns de um usuário',
        type: 1,
        options: [
          { name: 'user', description: 'Usuário', type: 6, required: true },
          { name: 'code', description: 'Código de acesso', type: 3, required: true }
        ]
      },
      {
        name: 'stats',
        description: 'Estatísticas de warns',
        type: 1,
        options: [
          { name: 'user', description: 'Ver estatísticas de um usuário', type: 6, required: false },
          { name: 'code', description: 'Código de acesso', type: 3, required: true }
        ]
      }
    ]
  },
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const code = interaction.options.getString('code');
    
    if (code !== CONFIG.ACCESS_CODE) {
      return interaction.reply({ content: '❌ Código de acesso incorreto!', flags: 64 });
    }

    await interaction.deferReply({ flags: 64 });

    try {
      if (subcommand === 'add') {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const duration = interaction.options.getInteger('duration') || 0;
        
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
          return interaction.editReply({ content: '❌ Usuário não está no servidor.' });
        }

        if (isStaff(user.id) || isAdmin(member)) {
          return interaction.editReply({ content: '❌ Não é possível warnar membros da staff ou administradores!' });
        }

        let result;
        if (warnSystem.addWarn) {
          result = warnSystem.addWarn(
            interaction.guild.id,
            user.id,
            reason,
            interaction.user.id,
            { duration: duration > 0 ? duration : null }
          );
        } else {
          return interaction.editReply({ content: '❌ Sistema de warns não disponível.' });
        }

        if (!result || !result.success) {
          return interaction.editReply({ content: `❌ Erro: ${result?.error || 'Falha ao adicionar warn'}` });
        }

        stats.warnsGiven++;

        const riskLevel = warnSystem.calculateRiskLevel ? 
          warnSystem.calculateRiskLevel(result.warnCount) : 
          { level: 'DESCONHECIDO', color: Colors.Orange, emoji: '⚠️' };

        const embed = new EmbedBuilder()
          .setTitle(`${riskLevel.emoji || '⚠️'} Warn Adicionado`)
          .setColor(riskLevel.color || Colors.Orange)
          .setDescription(`Warn registrado para ${user.toString()}`)
          .addFields(
            { name: '👤 Usuário', value: `${user.tag}`, inline: true },
            { name: '🛡️ Moderador', value: interaction.user.tag, inline: true },
            { name: '📋 Motivo', value: reason, inline: false },
            { name: '⚠️ Warns Ativos', value: `**${result.warnCount}**`, inline: true },
            { name: '🆔 ID', value: `\`${result.warnId}\``, inline: true }
          )
          .setTimestamp();

        if (duration > 0) {
          embed.addFields({ name: '⏰ Expira em', value: `${duration} dias`, inline: true });
        }

        await interaction.editReply({ embeds: [embed] });

        // Atualizar cargo de warn
        await updateWarnRoles(interaction.guild, user.id, result.warnCount);

        try {
          const dmEmbed = new EmbedBuilder()
            .setTitle(`⚠️ Você recebeu um warn em ${interaction.guild.name}`)
            .setColor(riskLevel.color || Colors.Orange)
            .setDescription(`**Motivo:** ${reason}`)
            .addFields({ name: '📊 Warns Ativos', value: `**${result.warnCount}**`, inline: true })
            .setTimestamp();

          await user.send({ embeds: [dmEmbed] });
        } catch (dmError) {}
      }

      else if (subcommand === 'remove') {
        const user = interaction.options.getUser('user');
        const warnId = interaction.options.getString('warnid');
        const reason = interaction.options.getString('reason');

        if (!warnSystem.removeWarn) {
          return interaction.editReply({ content: '❌ Função removeWarn não disponível.' });
        }

        const result = warnSystem.removeWarn(
          interaction.guild.id,
          user.id,
          warnId,
          interaction.user.id,
          reason
        );

        if (!result || !result.success) {
          return interaction.editReply({ content: `❌ ${result?.error || 'Erro ao remover warn'}` });
        }

        // Atualizar cargo após remoção
        const currentWarns = warnSystem.getUserWarns ? warnSystem.getUserWarns(interaction.guild.id, user.id) : null;
        await updateWarnRoles(interaction.guild, user.id, currentWarns?.activeCount || 0);

        const embed = new EmbedBuilder()
          .setTitle('✅ Warn Removido')
          .setColor(Colors.Green)
          .setDescription(`Warn removido de ${user.toString()}`)
          .addFields(
            { name: '🆔 ID do Warn', value: `\`${warnId}\``, inline: true },
            { name: '📋 Motivo', value: reason, inline: false }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }

      else if (subcommand === 'clear') {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        if (!warnSystem.clearUserWarns) {
          return interaction.editReply({ content: '❌ Função clearUserWarns não disponível.' });
        }

        const result = warnSystem.clearUserWarns(
          interaction.guild.id,
          user.id,
          interaction.user.id,
          reason
        );

        if (!result || !result.success) {
          return interaction.editReply({ content: `❌ ${result?.error || 'Erro ao limpar warns'}` });
        }

        // Remover cargos de warn
        await updateWarnRoles(interaction.guild, user.id, 0);

        const embed = new EmbedBuilder()
          .setTitle('🧹 Warns Limpos')
          .setColor(Colors.Green)
          .setDescription(`Todos os warns de ${user.toString()} foram limpos.`)
          .addFields(
            { name: '🧹 Warns Removidos', value: `**${result.clearedCount || 0}**`, inline: true },
            { name: '📋 Motivo', value: reason, inline: false }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }

      else if (subcommand === 'check') {
        const user = interaction.options.getUser('user');
        
        const userWarns = warnSystem.getUserWarns ? warnSystem.getUserWarns(interaction.guild.id, user.id) : null;
        
        if (!userWarns || !userWarns.history || userWarns.history.length === 0) {
          const embed = new EmbedBuilder()
            .setTitle('📭 Histórico de Warns')
            .setColor(Colors.Green)
            .setDescription(`${user.toString()} não possui warns.`)
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp();

          return interaction.editReply({ embeds: [embed] });
        }

        const riskLevel = warnSystem.calculateRiskLevel ? 
          warnSystem.calculateRiskLevel(userWarns.activeCount) : 
          { level: 'DESCONHECIDO', emoji: '⚠️' };
        
        const embed = new EmbedBuilder()
          .setTitle(`${riskLevel.emoji || '📊'} Histórico de Warns de ${user.username}`)
          .setColor(riskLevel.color || Colors.Orange)
          .setThumbnail(user.displayAvatarURL())
          .addFields(
            { name: '⚠️ Warns Ativos', value: `**${userWarns.activeCount || 0}**`, inline: true },
            { name: '📊 Total de Warns', value: `**${userWarns.count || 0}**`, inline: true },
            { name: '📊 Nível de Risco', value: `**${riskLevel.level || 'N/A'}**`, inline: true }
          )
          .setTimestamp();

        if (userWarns.history.length > 0) {
          const recentWarns = userWarns.history.slice(-5).reverse();
          let warnsList = '';
          
          recentWarns.forEach((warn, index) => {
            const status = warn.active ? '🟢' : '🔴';
            warnsList += `${status} **#${index + 1}** \`${warn.id}\` - ${warn.reason.substring(0, 50)}${warn.reason.length > 50 ? '...' : ''}\n`;
          });
          
          embed.addFields({ name: '📋 Últimos Warns', value: warnsList || 'Nenhum warn recente', inline: false });
        }

        await interaction.editReply({ embeds: [embed] });
      }

      else if (subcommand === 'stats') {
        const user = interaction.options.getUser('user');

        if (user) {
          const userStats = warnSystem.getUserStats ? warnSystem.getUserStats(interaction.guild.id, user.id) : null;
          
          const embed = new EmbedBuilder()
            .setTitle(`📊 Estatísticas de ${user.username}`)
            .setColor(Colors.Blue)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
              { name: '⚠️ Total de Warns', value: userStats?.totalWarns?.toString() || '0', inline: true },
              { name: '🟢 Warns Ativos', value: userStats?.activeWarns?.toString() || '0', inline: true },
              { name: '📅 Primeiro Warn', value: userStats?.firstWarn ? new Date(userStats.firstWarn).toLocaleString('pt-BR') : 'Nunca', inline: true }
            )
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });
        } else {
          const serverStats = warnSystem.getServerStats ? warnSystem.getServerStats(interaction.guild.id) : null;
          
          const embed = new EmbedBuilder()
            .setTitle(`📊 Estatísticas do Servidor`)
            .setColor(Colors.Gold)
            .setThumbnail(interaction.guild.iconURL())
            .addFields(
              { name: '⚠️ Total de Warns', value: serverStats?.totalWarns?.toString() || '0', inline: true },
              { name: '🟢 Warns Ativos', value: serverStats?.activeWarns?.toString() || '0', inline: true },
              { name: '👥 Usuários Warnados', value: serverStats?.warnedUsers?.toString() || '0', inline: true }
            )
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });
        }
      }

      stats.commandsUsed['warn'] = (stats.commandsUsed['warn'] || 0) + 1;

    } catch (error) {
      logError(`Erro no comando warn: ${error.message}`);
      await interaction.editReply({ content: '❌ Erro ao executar o comando.' });
    }
  }
};

// ===============================
// COMANDOS DE ATALHO
// ===============================
const warningsCommand = {
  data: {
    name: 'warnings',
    description: '[Atalho] Ver warns de um usuário',
    options: [
      { name: 'user', description: 'Usuário', type: 6, required: true },
      { name: 'code', description: 'Código de acesso', type: 3, required: true }
    ]
  },
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const code = interaction.options.getString('code');
    
    const fakeInteraction = {
      ...interaction,
      options: {
        getSubcommand: () => 'check',
        getUser: (name) => name === 'user' ? user : null,
        getString: (name) => name === 'code' ? code : null
      }
    };
    
    return warnCommand.execute(fakeInteraction);
  }
};

const clearwarnsCommand = {
  data: {
    name: 'clearwarns',
    description: '[Atalho] Limpar warns de um usuário',
    options: [
      { name: 'user', description: 'Usuário', type: 6, required: true },
      { name: 'reason', description: 'Motivo', type: 3, required: false },
      { name: 'code', description: 'Código de acesso', type: 3, required: true }
    ]
  },
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Limpeza via comando de atalho';
    const code = interaction.options.getString('code');
    
    const fakeInteraction = {
      ...interaction,
      options: {
        getSubcommand: () => 'clear',
        getUser: (name) => name === 'user' ? user : null,
        getString: (name) => {
          if (name === 'reason') return reason;
          if (name === 'code') return code;
          return null;
        }
      }
    };
    
    return warnCommand.execute(fakeInteraction);
  }
};

const warnstatsCommand = {
  data: {
    name: 'warnstats',
    description: '[Atalho] Estatísticas de warns',
    options: [
      { name: 'user', description: 'Usuário (opcional)', type: 6, required: false },
      { name: 'code', description: 'Código de acesso', type: 3, required: true }
    ]
  },
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const code = interaction.options.getString('code');
    
    const fakeInteraction = {
      ...interaction,
      options: {
        getSubcommand: () => 'stats',
        getUser: (name) => name === 'user' ? user : null,
        getString: (name) => name === 'code' ? code : null
      }
    };
    
    return warnCommand.execute(fakeInteraction);
  }
};

// ===============================
// FUNÇÕES DO PAINEL DO DONO
// ===============================
async function handleOwnerPanel(message) {
  const ownerId = CONFIG.OWNER_ID ? CONFIG.OWNER_ID.replace(/[<@>]/g, '') : null;
  
  if (message.author.id !== ownerId) {
    const deniedMsg = await message.reply('❌ **Acesso negado!** Apenas o dono do bot pode usar este comando.');
    setTimeout(async () => {
      try {
        await message.delete();
        await deniedMsg.delete();
      } catch (e) {}
    }, 5000);
    return;
  }

  const uptimeMs = client.uptime;
  const uptimeSeconds = Math.floor(uptimeMs / 1000);
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  let uptimeString = '';
  if (hours > 0) uptimeString += `${hours}h `;
  if (minutes > 0) uptimeString += `${minutes}m `;
  uptimeString += `${seconds}s`;

  const totalCommandsToday = Object.values(stats.commandsUsed).reduce((a, b) => a + b, 0);

  let globalWarnStats = { totalWarns: 0, totalUsers: 0, totalServers: 0 };
  try {
    globalWarnStats = warnSystem.getGlobalStats ? warnSystem.getGlobalStats() : globalWarnStats;
  } catch (err) {}

  const embed = new EmbedBuilder()
    .setTitle('👋 Welcome, Owner!')
    .setDescription('**Painel de Controle do Bot**')
    .setColor('#89CFF0')
    .addFields(
      { name: '🤖 **Informações do Bot**', value: `• **Tag:** ${client.user.tag}\n• **ID:** ${client.user.id}\n• **Servidores:** ${client.guilds.cache.size}\n• **Usuários:** ${client.users.cache.size}`, inline: false },
      { name: '📊 **Status**', value: `• **Ping:** ${client.ws.ping}ms\n• **Uptime:** ${uptimeString}\n• **Memória:** ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
      { name: '📅 **Informações**', value: `• **Iniciado em:** ${stats.startDate.toLocaleString('pt-BR')}\n• **Comandos hoje:** ${totalCommandsToday}\n• **Warns totais:** ${globalWarnStats.totalWarns || 0}`, inline: true },
      { name: '📋 **Comandos Disponíveis**', value: '`/ping` `/help` `/adm` `/private` `/report` `/warn` `/warnings` `/clearwarns` `/warnstats`\n\n**Comandos DM:** `!clear` `!clearAll` `Hello`', inline: false }
    )
    .setFooter({ text: `Hostville-bot@5.0.1 • Warn System v${warnSystem.version || '2.0.0'}` })
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder().setCustomId('owner_turnoff').setLabel('Turn Off').setStyle(ButtonStyle.Secondary).setEmoji('🔴'),
      new ButtonBuilder().setCustomId('owner_moderation').setLabel('Moderation').setStyle(ButtonStyle.Danger).setEmoji('🛡️'),
      new ButtonBuilder().setCustomId('owner_warnstats').setLabel('Warn Stats').setStyle(ButtonStyle.Primary).setEmoji('📊'),
      new ButtonBuilder().setCustomId('owner_monitor_roles').setLabel('Monitor Roles').setStyle(ButtonStyle.Success).setEmoji('👥')
    );

  const panelMsg = await message.reply({
    content: '✅ **Owner Panel**',
    embeds: [embed],
    components: [row]
  });

  logInfo(`🔐 Painel do dono aberto por ${message.author.tag}`);
  return panelMsg;
}

async function handleOwnerPanelButtons(interaction) {
  const ownerId = CONFIG.OWNER_ID ? CONFIG.OWNER_ID.replace(/[<@>]/g, '') : null;
  
  if (interaction.user.id !== ownerId) {
    await interaction.reply({ content: '❌ Apenas o dono do bot pode usar estes botões!', flags: 64 });
    setTimeout(async () => { try { await interaction.deleteReply(); } catch (e) {} }, 5000);
    return;
  }

  if (interaction.customId === 'owner_turnoff') {
    const confirmRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('confirm_shutdown').setLabel('✅ Confirmar Desligamento').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('cancel_shutdown').setLabel('❌ Cancelar').setStyle(ButtonStyle.Secondary)
      );

    await interaction.reply({ content: '⚠️ **Tem certeza que deseja desligar o bot?**', components: [confirmRow], flags: 64 });

    const filter = (i) => i.user.id === ownerId;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async (i) => {
      if (i.customId === 'confirm_shutdown') {
        await i.update({ content: '🔴 **Desligando o bot...**', components: [] });
        logInfo(`🔴 Bot desligado por ${interaction.user.tag}`);
        setTimeout(() => process.exit(0), 2000);
      } else if (i.customId === 'cancel_shutdown') {
        await i.update({ content: '✅ **Desligamento cancelado.**', components: [] });
        setTimeout(async () => { try { await i.deleteReply(); } catch (e) {} }, 3000);
      }
    });
  } 
  else if (interaction.customId === 'owner_moderation') {
    await interaction.deferReply({ flags: 64 });
    try {
      const options = [];
      let count = 0;
      
      for (const [guildId, guild] of client.guilds.cache) {
        if (count >= 25) break;
        const status = serverMonitoring.get(guildId) ? '🟢 ATIVO' : '🔴 INATIVO';
        options.push(new StringSelectMenuOptionBuilder().setLabel(guild.name.substring(0, 100)).setDescription(`${guild.memberCount} membros - ${status}`).setValue(guildId).setEmoji('🏛️'));
        count++;
      }

      const selectMenu = new StringSelectMenuBuilder().setCustomId('owner_monitor_select').setPlaceholder('Selecione um servidor para alterar').addOptions(options);
      const row = new ActionRowBuilder().addComponents(selectMenu);
      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('owner_monitor_all_on').setLabel('Ativar Todos').setStyle(ButtonStyle.Success).setEmoji('✅'),
        new ButtonBuilder().setCustomId('owner_monitor_all_off').setLabel('Desativar Todos').setStyle(ButtonStyle.Danger).setEmoji('❌')
      );

      await interaction.editReply({ content: '🛡️ **Painel de Moderação**\nSelecione um servidor para alterar o status do monitoramento:', components: [row, actionRow] });
    } catch (error) {
      logError(`Erro no painel de moderação: ${error.message}`);
      await interaction.editReply({ content: '❌ Erro ao carregar servidores.' });
    }
  } 
  else if (interaction.customId === 'owner_warnstats') {
    await interaction.deferReply({ flags: 64 });
    try {
      const globalStats = warnSystem.getGlobalStats ? warnSystem.getGlobalStats() : { totalServers: 0, totalUsers: 0, totalWarns: 0, totalActiveWarns: 0 };
      const embed = new EmbedBuilder()
        .setTitle('📊 Estatísticas Globais de Warns')
        .setColor(Colors.Blue)
        .addFields(
          { name: '🌐 Servidores', value: globalStats.totalServers?.toString() || '0', inline: true },
          { name: '👥 Usuários Warnados', value: globalStats.totalUsers?.toString() || '0', inline: true },
          { name: '⚠️ Total de Warns', value: globalStats.totalWarns?.toString() || '0', inline: true },
          { name: '🟢 Warns Ativos', value: globalStats.totalActiveWarns?.toString() || '0', inline: true }
        )
        .setFooter({ text: `Sistema de Warns v${warnSystem.version || '2.0.0'}` })
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logError(`Erro no painel de warns: ${error.message}`);
      await interaction.editReply({ content: '❌ Erro ao carregar estatísticas de warns.' });
    }
  }
  else if (interaction.customId === 'owner_monitor_roles') {
    await interaction.deferReply({ flags: 64 });
    await monitorWarnRoles();
    await interaction.editReply({ content: '✅ **Monitoramento de cargos concluído!** Verifique o console para ver os resultados.' });
    setTimeout(async () => { try { await interaction.deleteReply(); } catch (e) {} }, 10000);
  }
}

// ===============================
// EVENTO PRINCIPAL DE MENSAGENS
// ===============================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.channel.type === ChannelType.DM) {
    if (message.content.toLowerCase() === 'hello') {
      await handleOwnerPanel(message);
      return;
    }
    
    if (message.content.startsWith('!clearAll')) {
      const args = message.content.split(' ');
      const password = args[1];
      
      if (!password || password !== CONFIG.ACCESS_CODE) {
        const errorMsg = await message.reply('❌ Use: `!clearAll ACCESS_CODE`');
        setTimeout(async () => { try { await message.delete(); await errorMsg.delete(); } catch (e) {} }, 5000);
        return;
      }
      
      try {
        await message.delete();
        const processingMsg = await message.channel.send('🔄 Limpando mensagens de TODAS as DMs...');
        let totalDeleted = 0;
        let totalChannels = 0;
        
        const dmChannels = new Map();
        client.channels.cache.forEach(channel => { if (channel.type === ChannelType.DM) dmChannels.set(channel.id, channel); });
        client.users.cache.forEach(user => { if (user.dmChannel && !dmChannels.has(user.dmChannel.id)) dmChannels.set(user.dmChannel.id, user.dmChannel); });
        
        totalChannels = dmChannels.size;
        
        for (const [channelId, channel] of dmChannels) {
          let channelCount = 0;
          try {
            let fetchedMessages;
            let hasMore = true;
            
            while (hasMore) {
              fetchedMessages = await channel.messages.fetch({ limit: 100 });
              if (fetchedMessages.size === 0) break;
              
              const deletableMessages = fetchedMessages.filter(msg => msg.author.id === client.user.id);
              if (deletableMessages.size === 0) break;
              
              for (const [id, msg] of deletableMessages) {
                try { await msg.delete(); channelCount++; totalDeleted++; await new Promise(resolve => setTimeout(resolve, 200)); } catch (err) {}
              }
              
              if (fetchedMessages.size < 100) hasMore = false;
            }
            await new Promise(resolve => setTimeout(resolve, 800));
          } catch (err) {}
        }
        
        await processingMsg.edit(`✅ **${totalDeleted} mensagens** do bot foram limpas de **${totalChannels} DMs**!`);
        setTimeout(async () => { try { await processingMsg.delete(); } catch (e) {} }, 10000);
        logInfo(`${message.author.tag} limpou ${totalDeleted} mensagens de todas as DMs`);
      } catch (error) {
        logError(`Erro ao limpar DMs: ${error.message}`);
      }
      return;
    }
    
    if (message.content.startsWith('!clear')) {
      try {
        await message.delete();
        let deletedCount = 0;
        let fetchedMessages;
        
        do {
          fetchedMessages = await message.channel.messages.fetch({ limit: 100 });
          if (fetchedMessages.size === 0) break;
          
          const deletableMessages = fetchedMessages.filter(msg => msg.author.id === client.user.id);
          if (deletableMessages.size === 0) break;
          
          for (const [id, msg] of deletableMessages) {
            try { await msg.delete(); deletedCount++; await new Promise(resolve => setTimeout(resolve, 200)); } catch (err) {}
          }
        } while (fetchedMessages.size >= 100);
        
        const confirmMsg = await message.channel.send(`✅ **${deletedCount} mensagens** limpas!`);
        setTimeout(async () => { try { await confirmMsg.delete(); } catch (e) {} }, 3000);
        logInfo(`${message.author.tag} limpou ${deletedCount} mensagens na DM`);
      } catch (error) {
        logError(`Erro ao limpar DM: ${error.message}`);
      }
      return;
    }
    
    try {
      const reply = await message.reply({ content: `❌ **Não é possível enviar esta mensagem.**\nCaso tenha algo para falar, entre em contato com <@${CONFIG.OWNER_ID}>` });
      setTimeout(async () => { try { await reply.delete(); } catch (e) {} }, 10000);
    } catch (error) {}
    return;
  }

  const isMonitoringActive = serverMonitoring.get(message.guild.id) !== false;
  if (!isMonitoringActive) return;
  if (isStaff(message.author.id)) return;
  if (isAdmin(message.member)) return;

  if (containsOffensiveWord(message.content)) {
    const foundWord = findOffensiveWord(message.content);
    
    try {
      const permissions = message.channel.permissionsFor(client.user);
      if (!permissions.has(PermissionFlagsBits.ManageMessages)) return;
      if (!message.deletable) return;

      await message.delete();
      stats.messagesDeleted++;

      const warningMsg = await message.channel.send({
        embeds: [new EmbedBuilder()
          .setTitle('🚫 Mensagem Removida')
          .setDescription(`Sua mensagem foi removida por conter palavras ofensivas.`)
          .setColor(Colors.Red)
          .addFields(
            { name: '👤 Usuário', value: message.author.toString(), inline: false },
            { name: '🚫 Palavra', value: `**${foundWord || "desconhecida"}**`, inline: false }
          )
          .setTimestamp()
        ]
      });

      setTimeout(async () => { try { await warningMsg.delete(); } catch (e) {} }, 10000);
      logModeration("Palavras ofensivas detectadas", message.author, message.content, message.channel, foundWord || "desconhecida");
    } catch (err) {
      logError(`Erro ao moderar mensagem: ${err.message}`);
    }
  }
});

// ===============================
// EVENTO: BOT PRONTO
// ===============================
client.once('clientReady', async () => {
  console.log('\n' + chalk.green.underline('═'.repeat(50)));
  console.log(chalk.green('  ✅️ BOT ESTÁ ONLINE!'));
  console.log(chalk.green.underline('═'.repeat(50)));

  console.log(chalk.cyan('\n  📊 ESTATÍSTICAS INICIAIS:'));
  console.log(chalk.white(`   • Tag: ${client.user.tag}`));
  console.log(chalk.white(`   • ID: ${client.user.id}`));
  console.log(chalk.white(`   • Servidores: ${client.guilds.cache.size}`));
  console.log(chalk.white(`   • Warn System: v${warnSystem.version || '2.0.0'}`));
    
  for (const guild of client.guilds.cache.values()) {
    serverMonitoring.set(guild.id, true);
  }
  
  if (client.guilds.cache.size > 0) {
    try {
      const allCommands = [
        ...commands.map(c => c.data),
        pingCommand.data,
        helpCommand.data,
        privateCommand.data,
        reportCommand.data,
        warnCommand.data,
        warningsCommand.data,
        clearwarnsCommand.data,
        warnstatsCommand.data
      ];
      
      console.log(chalk.yellow(`\n📝 Registrando ${allCommands.length} comandos em ${client.guilds.cache.size} servidores...`));
      
      for (const guild of client.guilds.cache.values()) {
        await guild.commands.set(allCommands);
        console.log(chalk.green(`✅ Comandos registrados em: ${guild.name}`));
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      logInfo('Comandos registrados nos servidores com sucesso!');
    } catch (error) {
      logError(`Erro ao registrar comandos: ${error.message}`);
    }
  } else {
    logWarn('Nenhum servidor encontrado. Comandos não registrados.');
  }

  console.log(chalk.green('\n  ✅ Tudo pronto! Bot conectado com sucesso.\n'));
  console.log(chalk.yellow('  📝 COMANDOS NA DM:'));
  console.log(chalk.yellow('  • !clear - Limpa mensagens da DM'));
  console.log(chalk.yellow('  • !clearAll - Limpa TODAS as DMs (requer senha)'));
  console.log(chalk.yellow('  • Hello - Painel do Dono (apenas para o dono)\n'));
  
  console.log(chalk.magenta('  📋 COMANDOS DE WARNS:'));
  console.log(chalk.magenta('  • /warn add @user motivo [dias] - Adicionar warn'));
  console.log(chalk.magenta('  • /warn remove @user warnid motivo - Remover warn'));
  console.log(chalk.magenta('  • /warn clear @user motivo - Limpar warns'));
  console.log(chalk.magenta('  • /warn check @user - Ver warns'));
  console.log(chalk.magenta('  • /warn stats [@user] - Estatísticas\n'));
  
  // Executar monitoramento inicial de cargos
  setTimeout(() => {
    monitorWarnRoles();
  }, 5000);
  
  scheduleDailyReport();
  initReadline();
  showMenu();
});

// ===============================
// HANDLER PARA INTERAÇÕES
// ===============================
client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const cmdName = interaction.commandName;
      stats.commandsUsed[cmdName] = (stats.commandsUsed[cmdName] || 0) + 1;
      
      if (interaction.commandName === 'ping') await pingCommand.execute(interaction);
      else if (interaction.commandName === 'help') await helpCommand.execute(interaction);
      else if (interaction.commandName === 'private') await privateCommand.execute(interaction);
      else if (interaction.commandName === 'report') await reportCommand.execute(interaction);
      else if (interaction.commandName === 'warn') await warnCommand.execute(interaction);
      else if (interaction.commandName === 'warnings') await warningsCommand.execute(interaction);
      else if (interaction.commandName === 'clearwarns') await clearwarnsCommand.execute(interaction);
      else if (interaction.commandName === 'warnstats') await warnstatsCommand.execute(interaction);
      else {
        const command = commands.find(c => c.data.name === interaction.commandName);
        if (command) await command.execute(interaction);
      }
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId === 'owner_turnoff' || interaction.customId === 'owner_moderation' || 
          interaction.customId === 'owner_warnstats' || interaction.customId === 'owner_monitor_roles') {
        await handleOwnerPanelButtons(interaction);
        return;
      }
      
      if (interaction.customId === 'stats' || interaction.customId === 'console' || interaction.customId === 'help') {
        await handleButtonInteraction(interaction);
        return;
      }
    }
  } catch (error) {
    logError(`Erro no interactionCreate: ${error.message}`);
  }
});

async function handleButtonInteraction(interaction) {
  switch (interaction.customId) {
    case 'stats': {
      const uptimeSeconds = Math.floor(client.uptime / 1000);
      const hours = Math.floor(uptimeSeconds / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = uptimeSeconds % 60;

      const embed = new EmbedBuilder()
        .setTitle('📊 Estatísticas do Bot')
        .setColor(Colors.Green)
        .addFields(
          { name: '🏓 Ping', value: `${client.ws.ping}ms`, inline: true },
          { name: '⏱️ Uptime', value: `${hours}h ${minutes}m ${seconds}s`, inline: true },
          { name: '🏛️ Servidores', value: `${client.guilds.cache.size}`, inline: true },
          { name: '👥 Usuários', value: `${client.users.cache.size}`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
      setTimeout(async () => { try { await interaction.deleteReply(); } catch (e) {} }, 15000);
      break;
    }
    case 'console': {
      console.log(chalk.yellow('\n═══ ESTATÍSTICAS DO BOT ═══'));
      console.log(chalk.white(`Ping:    ${client.ws.ping}ms`));
      console.log(chalk.white(`Uptime:  ${Math.floor(client.uptime / 3600000)}h`));
      console.log(chalk.white(`Servers: ${client.guilds.cache.size}`));
      console.log(chalk.yellow('═════════════════════════════\n'));
      await interaction.reply({ content: '✅ Verifique o console!', flags: 64 });
      setTimeout(async () => { try { await interaction.deleteReply(); } catch (e) {} }, 5000);
      break;
    }
    case 'help': {
      const embed = new EmbedBuilder()
        .setTitle('❓ Ajuda - Painel Administrativo')
        .setDescription('Como usar o painel administrativo:')
        .setColor(Colors.Blue)
        .addFields(
          { name: '📊 Estatísticas', value: 'Clique em "Estatísticas" para ver dados do bot', inline: false },
          { name: '🖥️ Console', value: 'Clique em "Ver no Console" para ver dados no terminal', inline: false }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
      setTimeout(async () => { try { await interaction.deleteReply(); } catch (e) {} }, 15000);
      break;
    }
  }
}

// ===============================
// MENU INTERATIVO
// ===============================
function showMenu() {
  if (isMenuActive) return;
  isMenuActive = true;
  
  console.log(chalk.cyan('\n╔═══════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║                  𝙷𝚘𝚜𝚝𝚅𝚒𝚕𝚕𝚎-𝙱𝙾𝚃 𝚅𝚎𝚛𝚜ã𝚘 5.0.1                     ║'));
  console.log(chalk.cyan('╠═══════════════════════════════════════════════════════╣'));
  console.log(chalk.cyan('║  1.  Ver estatísticas detalhadas                                ║'));
  console.log(chalk.cyan('║  2.  Listar todos os servidores                                 ║'));
  console.log(chalk.cyan('║  3.  Ver status do monitoramento                                ║'));
  console.log(chalk.cyan('║  4.  Gerar relatório manual                                     ║'));
  console.log(chalk.cyan('║  5.  Ver estatísticas de warns                                  ║'));
  console.log(chalk.cyan('║  6.  Monitorar cargos de warn (console)                         ║'));
  console.log(chalk.cyan('║  0.  Sair                                                       ║'));
  console.log(chalk.cyan('╚═══════════════════════════════════════════════════════╝'));
  
  rl.question(chalk.yellow('\n👉 Escolha uma opção: '), (answer) => {
    isMenuActive = false;
    handleMenuOption(answer);
  });
}

function handleMenuOption(option) {
  if (!rl || rl.closed) initReadline();
  
  switch (option) {
    case '1':
      showStats();
      break;
    case '2':
      listServers();
      break;
    case '3':
      showMonitoringStatus();
      break;
    case '4':
      generateManualReport();
      break;
    case '5':
      showWarnStats();
      break;
    case '6':
      monitorWarnRoles().then(() => showMenu());
      break;
    case '0':
      console.log(chalk.red('❌ Encerrando o bot...'));
      if (rl && !rl.closed) rl.close();
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
  console.log(chalk.white(`📊 Stats Hoje:  Del:${stats.messagesDeleted} Ent:${stats.membersJoined} Sai:${stats.membersLeft}`));
  console.log(chalk.white(`⚠️ Warns dados: ${stats.warnsGiven}`));
  console.log(chalk.yellow('═══════════════════════════════\n'));
  showMenu();
}

function listServers() {
  console.log(chalk.yellow('\n═══ 🏛️ SERVIDORES DO BOT ═══'));
  client.guilds.cache.forEach((guild, index) => {
    const monitorStatus = serverMonitoring.get(guild.id) ? '🟢 ATIVO' : '🔴 INATIVO';
    console.log(chalk.white(`${index + 1}. ${guild.name} (${guild.memberCount} membros) - ${monitorStatus}`));
  });
  console.log(chalk.yellow('══════════════════════════════\n'));
  showMenu();
}

function showMonitoringStatus() {
  console.log(chalk.yellow('\n═══ 🛡️ STATUS DO MONITORAMENTO ═══'));
  client.guilds.cache.forEach((guild) => {
    const status = serverMonitoring.get(guild.id) !== false ? '🟢 ATIVO' : '🔴 INATIVO';
    console.log(chalk.white(`• ${guild.name}: ${status}`));
  });
  console.log(chalk.yellow('═══════════════════════════════════\n'));
  showMenu();
}

async function generateManualReport() {
  console.log(chalk.yellow('\n═══ 📊 GERANDO RELATÓRIO ═══'));
  try {
    const reportEmbed = await generateDailyReport();
    console.log(chalk.white('✅ Relatório gerado com sucesso!'));
    console.log(chalk.white(`📊 Mensagens deletadas: ${stats.messagesDeleted}`));
    console.log(chalk.white(`👥 Membros novos: ${stats.membersJoined}`));
    console.log(chalk.white(`👋 Membros que saíram: ${stats.membersLeft}`));
    console.log(chalk.white(`⚠️ Warns dados: ${stats.warnsGiven}`));
  } catch (error) {
    console.log(chalk.red(`❌ Erro: ${error.message}`));
  }
  console.log(chalk.yellow('═══════════════════════════════\n'));
  showMenu();
}

function showWarnStats() {
  console.log(chalk.yellow('\n═══ 📊 ESTATÍSTICAS DE WARNS ═══'));
  try {
    const globalStats = warnSystem.getGlobalStats ? warnSystem.getGlobalStats() : { totalServers: 0, totalUsers: 0, totalWarns: 0, totalActiveWarns: 0 };
    console.log(chalk.white(`🌐 Servidores com warns: ${globalStats.totalServers}`));
    console.log(chalk.white(`👥 Usuários warnados: ${globalStats.totalUsers}`));
    console.log(chalk.white(`⚠️ Total de warns: ${globalStats.totalWarns}`));
    console.log(chalk.white(`🟢 Warns ativos: ${globalStats.totalActiveWarns}`));
    console.log(chalk.white(`📊 Versão do sistema: v${warnSystem.version || '2.0.0'}`));
  } catch (error) {
    console.log(chalk.red(`❌ Erro ao carregar estatísticas: ${error.message}`));
  }
  console.log(chalk.yellow('═══════════════════════════════\n'));
  showMenu();
}

// ===============================
// EVENTOS DE LOG
// ===============================
client.on('guildMemberAdd', async (member) => {
  stats.membersJoined++;
  
  if (warnSystem.checkBlacklist) {
    const blacklisted = warnSystem.checkBlacklist(member.guild.id, member.id);
    if (blacklisted && blacklisted.active) {
      try {
        await member.kick('Usuário na blacklist');
        logInfo(`⛔ Usuário ${member.user.tag} kickado automaticamente (blacklist)`);
      } catch (err) {}
    }
  }
  
  console.log(chalk.green.bgBlack.bold('\n 👤 NOVO MEMBRO '));
  console.log(chalk.green(`   Usuário: ${member.user.tag}`));
  console.log(chalk.green(`   Servidor: ${member.guild.name}`));
  console.log(chalk.green('────────────────────────────────\n'));
});

client.on('guildMemberRemove', async (member) => {
  stats.membersLeft++;
  console.log(chalk.red.bgBlack.bold('\n ❌ MEMBRO SAIU '));
  console.log(chalk.red(`   Usuário: ${member.user.tag}`));
  console.log(chalk.red(`   Servidor: ${member.guild.name}`));
  console.log(chalk.red('────────────────────────────────\n'));
});

// ===============================
// ERROS NÃO TRATADOS
// ===============================
process.on('unhandledRejection', (error) => {
  logError(`Erro não tratado: ${error.message}`);
});

process.on('uncaughtException', (error) => {
  logError(`Exceção não tratada: ${error.message}`);
  process.exit(1);
});

// ===============================
// LOGIN DO BOT
// ===============================
client.login(process.env.TOKEN);