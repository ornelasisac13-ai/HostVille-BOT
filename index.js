// ===============================
// BOT MODERAÇÃO COMPLETA VERSÃO INTEGRADA - PARTE 1/3
// ===============================
// TOTAL DE LINHAS APROXIMADO: 1300 LINHAS
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
  
  DEFAULT_WARN_ROLES: {
    1: process.env.WARN_ROLE_1 || '1484383270362677279',
    2: process.env.WARN_ROLE_2 || '1484383343595491348',
    3: process.env.WARN_ROLE_3 || '1484383411186438144',
    4: process.env.WARN_ROLE_4 || '1484383888582246521',
    5: process.env.WARN_ROLE_5 || '1484389386656288818',
    6: process.env.WARN_ROLE_6 || '1484389491052515349',
    7: process.env.WARN_ROLE_7 || '1484389573831426209',
  }
};

// ===============================
// VARIÁVEIS GLOBAIS
// ===============================
const serverMonitoring = new Map();
const pendingActions = new Map();
const activeSessions = new Map();
const activeAppeals = new Map();
const backupSchedules = new Map();

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
// IMPORTAÇÃO DOS MÓDULOS DE WARNS
// ===============================
let warnSystem;
let warnCommands;

try {
  warnSystem = require('./modules/warnSystem.js');
  console.log(chalk.green(`✅ Sistema de warns v${warnSystem.version || '2.0.0'} carregado com sucesso!`));
} catch (error) {
  console.log(chalk.red('❌ Erro fatal ao carregar warnSystem.js:'), error.message);
  console.log(chalk.yellow('⚠️ O sistema de warns pode não funcionar corretamente.'));
  warnSystem = null;
}

try {
  warnCommands = require('./modules/allWarncmd.js');
  console.log(chalk.green(`✅ Módulo allWarncmd.js carregado com sucesso!`));
} catch (error) {
  console.log(chalk.red('❌ Erro fatal ao carregar allWarncmd.js:'), error.message);
  console.log(chalk.yellow('⚠️ Os comandos de warn podem não funcionar corretamente.'));
  warnCommands = null;
}

// ===============================
// CARREGAR CARGOS DE WARN (PRIORIDADE: warnSystem.js > .env > padrão)
// ===============================
let WARN_ROLES = { ...CONFIG.DEFAULT_WARN_ROLES };

if (warnSystem && warnSystem.CONFIG && warnSystem.CONFIG.autoRoles) {
  console.log(chalk.cyan(`\n📋 Carregando cargos do warnSystem.CONFIG.autoRoles:`));
  for (let i = 1; i <= 7; i++) {
    if (warnSystem.CONFIG.autoRoles[i]) {
      WARN_ROLES[i] = warnSystem.CONFIG.autoRoles[i];
      console.log(chalk.white(`   • Nível ${i}: ${WARN_ROLES[i]} (do warnSystem)`));
    }
  }
}

console.log(chalk.cyan(`\n📋 CARGOS DE WARN FINAIS:`));
for (let i = 1; i <= 7; i++) {
  console.log(chalk.white(`   • Nível ${i}: ${WARN_ROLES[i]}`));
}

// ===============================
// SISTEMA DE WARNS LOCAL (FALLBACK)
// ===============================
let warnsData = new Map();

function saveWarnsData() {
  try {
    const dataPath = path.join(__dirname, 'warns_data.json');
    const dataToSave = { warns: Object.fromEntries(warnsData) };
    fs.writeFileSync(dataPath, JSON.stringify(dataToSave, null, 2));
  } catch (error) {
    logError(`Erro ao salvar warns: ${error.message}`);
  }
}

function loadWarnsData() {
  try {
    const dataPath = path.join(__dirname, 'warns_data.json');
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      if (data.warns) {
        warnsData = new Map();
        for (const [gid, users] of Object.entries(data.warns)) {
          const guildMap = new Map();
          for (const [uid, userData] of Object.entries(users)) {
            guildMap.set(uid, userData);
          }
          warnsData.set(gid, guildMap);
        }
      }
      logInfo(`✅ ${warnsData.size} servidores carregados`);
    }
  } catch (error) {
    logError(`Erro ao carregar warns: ${error.message}`);
  }
}

function generateWarnId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `WRN-${timestamp}-${random}`;
}

function addWarnLocal(guildId, userId, reason, moderatorId, options = {}) {
  try {
    if (!guildId || !userId || !reason || !moderatorId) {
      return { success: false, error: 'Parâmetros inválidos' };
    }
    
    if (!reason || reason.trim().length < 3) {
      return { success: false, error: 'Motivo deve ter pelo menos 3 caracteres' };
    }
    
    if (!warnsData.has(guildId)) warnsData.set(guildId, new Map());
    const guildWarns = warnsData.get(guildId);
    
    if (!guildWarns.has(userId)) {
      guildWarns.set(userId, { history: [], count: 0, activeCount: 0, firstWarn: null, lastWarn: null });
    }
    
    const userWarns = guildWarns.get(userId);
    const warnId = generateWarnId();
    const timestamp = Date.now();
    const expiresAt = options.duration ? timestamp + (options.duration * 24 * 60 * 60 * 1000) : null;
    
    const warn = { id: warnId, reason, moderatorId, timestamp, expiresAt, active: true };
    
    userWarns.history.push(warn);
    userWarns.count = userWarns.history.length;
    userWarns.activeCount = userWarns.history.filter(w => w.active && (!w.expiresAt || w.expiresAt > Date.now())).length;
    userWarns.lastWarn = timestamp;
    if (!userWarns.firstWarn) userWarns.firstWarn = timestamp;
    
    guildWarns.set(userId, userWarns);
    warnsData.set(guildId, guildWarns);
    saveWarnsData();
    
    return { success: true, warnId, warnCount: userWarns.activeCount, totalCount: userWarns.count };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function removeWarnLocal(guildId, userId, warnId, moderatorId, reason) {
  try {
    if (!warnsData.has(guildId)) return { success: false, error: 'Servidor não encontrado' };
    const guildWarns = warnsData.get(guildId);
    if (!guildWarns.has(userId)) return { success: false, error: 'Usuário não encontrado' };
    
    const userWarns = guildWarns.get(userId);
    const warnIndex = userWarns.history.findIndex(w => w.id === warnId);
    if (warnIndex === -1) return { success: false, error: 'Warn não encontrado' };
    
    const warn = userWarns.history[warnIndex];
    if (!warn.active) return { success: false, error: 'Warn já foi removido' };
    
    warn.active = false;
    warn.removedBy = moderatorId;
    warn.removedReason = reason;
    warn.removedAt = Date.now();
    
    userWarns.activeCount = userWarns.history.filter(w => w.active && (!w.expiresAt || w.expiresAt > Date.now())).length;
    guildWarns.set(userId, userWarns);
    warnsData.set(guildId, guildWarns);
    saveWarnsData();
    
    return { success: true, warn };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function clearUserWarnsLocal(guildId, userId, moderatorId, reason) {
  try {
    if (!warnsData.has(guildId)) return { success: false, error: 'Servidor não encontrado' };
    const guildWarns = warnsData.get(guildId);
    if (!guildWarns.has(userId)) return { success: false, error: 'Usuário não encontrado' };
    
    const userWarns = guildWarns.get(userId);
    const clearedCount = userWarns.history.filter(w => w.active).length;
    
    userWarns.history.forEach(warn => {
      if (warn.active) {
        warn.active = false;
        warn.removedBy = moderatorId;
        warn.removedReason = reason;
        warn.removedAt = Date.now();
      }
    });
    
    userWarns.activeCount = 0;
    guildWarns.set(userId, userWarns);
    warnsData.set(guildId, guildWarns);
    saveWarnsData();
    
    return { success: true, clearedCount };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function getUserWarnsLocal(guildId, userId) {
  if (!warnsData.has(guildId)) return null;
  const guildWarns = warnsData.get(guildId);
  if (!guildWarns.has(userId)) return null;
  
  const userWarns = guildWarns.get(userId);
  const activeWarns = userWarns.history.filter(w => w.active && (!w.expiresAt || w.expiresAt > Date.now()));
  
  return {
    count: userWarns.count,
    activeCount: activeWarns.length,
    history: userWarns.history,
    firstWarn: userWarns.firstWarn,
    lastWarn: userWarns.lastWarn
  };
}

function getUserStatsLocal(guildId, userId) {
  const userWarns = getUserWarnsLocal(guildId, userId);
  if (!userWarns) return { totalWarns: 0, activeWarns: 0, firstWarn: null, lastWarn: null, averageInterval: 0 };
  
  let intervals = [], prevDate = null;
  userWarns.history.forEach(warn => {
    if (prevDate) intervals.push((warn.timestamp - prevDate) / (24 * 60 * 60 * 1000));
    prevDate = warn.timestamp;
  });
  
  return {
    totalWarns: userWarns.count,
    activeWarns: userWarns.activeCount,
    firstWarn: userWarns.firstWarn,
    lastWarn: userWarns.lastWarn,
    averageInterval: intervals.length > 0 ? (intervals.reduce((a, b) => a + b, 0) / intervals.length).toFixed(2) : 0
  };
}

function getServerStatsLocal(guildId) {
  if (!warnsData.has(guildId)) return { totalWarns: 0, activeWarns: 0, warnedUsers: 0, averageWarnsPerUser: 0, topReasons: [], topModerators: [], warnsByHour: Array(24).fill(0), warnsByWeekday: Array(7).fill(0) };
  
  const guildWarns = warnsData.get(guildId);
  let totalWarns = 0, activeWarns = 0, warnedUsers = 0;
  const reasons = {}, moderators = {};
  const warnsByHour = Array(24).fill(0);
  const warnsByWeekday = Array(7).fill(0);
  
  for (const [userId, userWarns] of guildWarns) {
    warnedUsers++;
    totalWarns += userWarns.count;
    activeWarns += userWarns.activeCount;
    userWarns.history.forEach(warn => {
      reasons[warn.reason] = (reasons[warn.reason] || 0) + 1;
      moderators[warn.moderatorId] = (moderators[warn.moderatorId] || 0) + 1;
      const hour = new Date(warn.timestamp).getHours();
      warnsByHour[hour]++;
      const weekday = new Date(warn.timestamp).getDay();
      warnsByWeekday[weekday]++;
    });
  }
  
  return {
    totalWarns, activeWarns, warnedUsers,
    averageWarnsPerUser: warnedUsers > 0 ? (totalWarns / warnedUsers).toFixed(2) : 0,
    topReasons: Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([r, c]) => ({ reason: r, count: c })),
    topModerators: Object.entries(moderators).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([m, c]) => ({ id: m, count: c })),
    warnsByHour, warnsByWeekday
  };
}

function getGlobalStatsLocal() {
  let totalServers = warnsData.size, totalUsers = 0, totalWarns = 0, totalActiveWarns = 0;
  for (const [guildId, guildWarns] of warnsData) {
    totalUsers += guildWarns.size;
    for (const [userId, userWarns] of guildWarns) {
      totalWarns += userWarns.count;
      totalActiveWarns += userWarns.activeCount;
    }
  }
  return { totalServers, totalUsers, totalWarns, totalActiveWarns, averageWarnsPerUser: totalUsers > 0 ? (totalWarns / totalUsers).toFixed(2) : 0 };
}

function calculateRiskLevelLocal(warnCount) {
  if (warnCount >= 7) return { level: 'CRÍTICO', color: Colors.DarkRed, emoji: '💀', action: 'BANIMENTO' };
  if (warnCount >= 5) return { level: 'ALTO', color: Colors.Red, emoji: '🔴', action: 'KICK' };
  if (warnCount >= 3) return { level: 'MÉDIO', color: Colors.Orange, emoji: '🟠', action: 'MUTE' };
  if (warnCount >= 1) return { level: 'BAIXO', color: Colors.Yellow, emoji: '🟡', action: 'MONITORAR' };
  return { level: 'NENHUM', color: Colors.Green, emoji: '🟢', action: 'NENHUMA' };
}

function formatDateLocal(timestamp) {
  if (!timestamp) return 'Nunca';
  return new Date(timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDurationLocal(days) {
  if (days === 0) return 'Permanente';
  if (days === 1) return '1 dia';
  if (days < 30) return `${days} dias`;
  if (days < 365) return `${Math.floor(days / 30)} meses`;
  return `${Math.floor(days / 365)} anos`;
}

// ===============================
// FUNÇÕES DE WRAPPER PARA USAR warnSystem OU LOCAL
// ===============================
function addWarn(guildId, userId, reason, moderatorId, options = {}) {
  if (warnSystem && warnSystem.addWarn) {
    return warnSystem.addWarn(guildId, userId, reason, moderatorId, options);
  }
  return addWarnLocal(guildId, userId, reason, moderatorId, options);
}

function removeWarn(guildId, userId, warnId, moderatorId, reason) {
  if (warnSystem && warnSystem.removeWarn) {
    return warnSystem.removeWarn(guildId, userId, warnId, moderatorId, reason);
  }
  return removeWarnLocal(guildId, userId, warnId, moderatorId, reason);
}

function clearUserWarns(guildId, userId, moderatorId, reason) {
  if (warnSystem && warnSystem.clearUserWarns) {
    return warnSystem.clearUserWarns(guildId, userId, moderatorId, reason);
  }
  return clearUserWarnsLocal(guildId, userId, moderatorId, reason);
}

function getUserWarns(guildId, userId) {
  if (warnSystem && warnSystem.getUserWarns) {
    return warnSystem.getUserWarns(guildId, userId);
  }
  return getUserWarnsLocal(guildId, userId);
}

function getUserStats(guildId, userId) {
  if (warnSystem && warnSystem.getUserStats) {
    return warnSystem.getUserStats(guildId, userId);
  }
  return getUserStatsLocal(guildId, userId);
}

function getServerStats(guildId) {
  if (warnSystem && warnSystem.getServerStats) {
    return warnSystem.getServerStats(guildId);
  }
  return getServerStatsLocal(guildId);
}

function getGlobalStats() {
  if (warnSystem && warnSystem.getGlobalStats) {
    return warnSystem.getGlobalStats();
  }
  return getGlobalStatsLocal();
}

function calculateRiskLevel(warnCount) {
  if (warnSystem && warnSystem.calculateRiskLevel) {
    return warnSystem.calculateRiskLevel(warnCount);
  }
  return calculateRiskLevelLocal(warnCount);
}

function formatDate(timestamp) {
  if (warnSystem && warnSystem.formatDate) {
    return warnSystem.formatDate(timestamp);
  }
  return formatDateLocal(timestamp);
}

function formatDuration(days) {
  if (warnSystem && warnSystem.formatDuration) {
    return warnSystem.formatDuration(days);
  }
  return formatDurationLocal(days);
}

// ===============================
// LISTA DE PALAVRAS OFENSIVAS
// ===============================
const offensiveWords = [
  "idiota", "burro", "estupido", "retardado", "lixo", "merda", "fdp", "otario",
  "vtnc", "imbecil", "inutil", "arrombado", "viado", "bicha", "piranha", "prostituta",
  "corno", "babaca", "palhaco", "nojento", "escroto", "cretino", "canalha", "maldito",
  "vai tomar no cu", "vai tnc", "vai se foder", "fodase", "caralho", "porra", "krl"
];

// ===============================
// FUNÇÕES DE LOG
// ===============================
function getTimestamp() {
  const dataBrasil = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  return chalk.gray(`[${dataBrasil}]`);
}

function logInfo(message) { console.log(`${getTimestamp()} ${chalk.green('➜ INFO')}: ${chalk.cyan(message)}`); }
function logError(message) { console.log(`${getTimestamp()} ${chalk.red('✖ ERRO')}: ${chalk.yellow(message)}`); }
function logWarn(message) { console.log(`${getTimestamp()} ${chalk.yellow('⚠ AVISO')}: ${chalk.white(message)}`); }
function logSuccess(message) { console.log(`${getTimestamp()} ${chalk.green('✔ SUCESSO')}: ${chalk.white(message)}`); }

function logModeration(message, user, content, channel, foundWord) {
  console.log(chalk.red.bgBlack.bold('\n 🛡️ MENSAGEM MODERADA '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Usuário:   ${user.tag}`));
  console.log(chalk.red(`   Conteúdo:  ${content}`));
  console.log(chalk.red(`   Palavra:   "${foundWord}"`));
  console.log(chalk.red(`   Canal:     #${channel.name}`));
  console.log(chalk.red('────────────────────────────────\n'));
}

function formatTime(ms) {
  const sec = Math.floor(ms / 1000), min = Math.floor(sec / 60), hrs = Math.floor(min / 60), days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h ${min % 60}m`;
}

function containsOffensiveWord(text) {
  if (!text) return false;
  const textLower = text.toLowerCase();
  return offensiveWords.some(word => textLower.includes(word));
}

function findOffensiveWord(text) {
  if (!text) return null;
  const textLower = text.toLowerCase();
  return offensiveWords.find(word => textLower.includes(word)) || null;
}

function isAdmin(member) {
  if (!member || !CONFIG.adminRoles.length) return false;
  return member.roles.cache.some(role => CONFIG.adminRoles.includes(role.id) || CONFIG.adminRoles.includes(role.name));
}

function isStaff(userId) { return staffIds.includes(userId); }

function setServerMonitoring(guildId, status, user) {
  serverMonitoring.set(guildId, status);
  console.log(chalk.cyan.bgBlack.bold(`\n 🛡️ MONITORAMENTO ${status ? 'ATIVADO' : 'DESATIVADO'}`));
  console.log(chalk.cyan(`   Servidor: ${client.guilds.cache.get(guildId)?.name || guildId}`));
  console.log(chalk.cyan(`   Staff:    ${user.tag}`));
  console.log(chalk.cyan('────────────────────────────────\n'));
}

function createStatusEmbed(guild, action, user) {
  const isActive = action === 'on';
  return new EmbedBuilder()
    .setTitle(`🛡️ Monitoramento ${isActive ? 'Ativado' : 'Desativado'}`)
    .setColor(isActive ? Colors.Green : Colors.Red)
    .addFields(
      { name: '🛡️ Status', value: isActive ? '🟢 ATIVO' : '🔴 INATIVO', inline: true },
      { name: '🛠 Staff', value: user.toString(), inline: true },
      { name: '🏛️ Servidor', value: guild?.name || 'Todos', inline: true }
    )
    .setTimestamp();
}

// ===============================
// FUNÇÃO PARA ATUALIZAR CARGOS DE WARN
// ===============================
async function updateWarnRoles(guild, userId, warnCount) {
  try {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member || isStaff(userId) || isAdmin(member)) return;
    
    for (let level = 1; level <= 7; level++) {
      const roleId = WARN_ROLES[level];
      if (roleId && member.roles.cache.has(roleId)) await member.roles.remove(roleId).catch(() => {});
    }
    
    if (warnCount >= 1 && warnCount <= 7) {
      const roleId = WARN_ROLES[warnCount];
      if (roleId) await member.roles.add(roleId).catch(() => {});
    }
  } catch (error) {}
}

// ===============================
// FUNÇÃO PARA MONITORAR CARGOS DE WARN
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
      
      for (let level = 1; level <= 7; level++) {
        const roleId = WARN_ROLES[level];
        if (!roleId) continue;
        
        const role = guild.roles.cache.get(roleId);
        if (!role) { console.log(chalk.yellow(`   Nível ${level}: ❌ Cargo não encontrado`)); continue; }
        
        const membersWithRole = members.filter(m => m.roles.cache.has(roleId));
        if (membersWithRole.size === 0) {
          console.log(chalk.gray(`   Nível ${level} (${role.name}): Nenhum membro`));
        } else {
          console.log(chalk.red(`   🔴 Nível ${level} (${role.name}): ${membersWithRole.size} membros`));
          membersWithRole.forEach(m => {
            let warnCount = 0;
            try { const uw = getUserWarns(guild.id, m.id); warnCount = uw?.activeCount || 0; } catch(e) {}
            const emoji = warnCount >= 7 ? '💀' : warnCount >= 5 ? '🔴' : warnCount >= 3 ? '🟠' : warnCount >= 1 ? '🟡' : '⚪';
            console.log(chalk.white(`      • ${m.user.tag} (${m.id}) - Warns: ${warnCount} ${emoji}`));
          });
        }
      }
      
      const serverStats = getServerStats(guild.id);
      if (serverStats.totalWarns > 0) {
        console.log(chalk.green(`\n   📊 Estatísticas: ${serverStats.totalWarns} warns | ${serverStats.activeWarns} ativos | ${serverStats.warnedUsers} usuários`));
      }
    } catch (error) {
      console.log(chalk.red(`   Erro: ${error.message}`));
    }
  }
  console.log(chalk.yellow('\n═══════════════════════════════════════════════════════════════\n'));
}

// ===============================
// FUNÇÃO PARA GERAR RELATÓRIO DIÁRIO
// ===============================
async function generateDailyReport() {
  const reportDate = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const sortedCommands = Object.entries(stats.commandsUsed).sort((a, b) => b[1] - a[1]).slice(0, 5);
  let commandsField = "📊 **Comandos mais usados:**\n";
  if (sortedCommands.length) sortedCommands.forEach(([cmd, c]) => commandsField += `• \`/${cmd}\`: ${c} vezes\n`);
  else commandsField += "• Nenhum comando usado hoje";
  
  const globalStats = getGlobalStats();
  
  return new EmbedBuilder()
    .setTitle('📊 Relatório Diário do Bot')
    .setDescription(`Período: **${reportDate}**`)
    .setColor(Colors.Blue)
    .addFields(
      { name: '🛡️ **Ações de Moderação**', value: `• Mensagens deletadas: **${stats.messagesDeleted}**\n• Avisos dados: **${stats.warnsGiven}**\n• Warns totais: **${globalStats.totalWarns}**`, inline: true },
      { name: '👥 **Movimentação de Membros**', value: `• Entraram: **${stats.membersJoined}**\n• Saíram: **${stats.membersLeft}**`, inline: true },
      { name: '📈 **Crescimento Líquido**', value: `**${stats.membersJoined - stats.membersLeft}** membros`, inline: true },
      { name: '🤖 **Status do Bot**', value: `• Uptime: **${formatTime(client.uptime)}**\n• Ping: **${client.ws.ping}ms**\n• Servidores: **${client.guilds.cache.size}**`, inline: false },
      { name: '📋 **Comandos**', value: commandsField, inline: false }
    )
    .setFooter({ text: `Relatório gerado • ${new Date().toLocaleTimeString('pt-BR')}` });
}

async function sendReportToStaff() {
  try {
    const reportEmbed = await generateDailyReport();
    const staffList = CONFIG.STAFF_USER_ID ? CONFIG.STAFF_USER_ID.split(',') : [];
    for (const staffId of staffList) {
      const cleanId = staffId.trim().replace(/[<@>]/g, '');
      try {
        const staffUser = await client.users.fetch(cleanId);
        await staffUser.send({ content: '📬 **Relatório Diário do Bot**', embeds: [reportEmbed] });
      } catch(e) {}
    }
    if (CONFIG.logChannelId) {
      const logChannel = await client.channels.fetch(CONFIG.logChannelId).catch(() => null);
      if (logChannel) await logChannel.send({ embeds: [reportEmbed] });
    }
    stats.reset();
  } catch (error) { logError(`Erro ao enviar relatório: ${error.message}`); }
}

function scheduleDailyReport() {
  const now = new Date();
  const [hour, minute] = (CONFIG.DAILY_REPORT_TIME || '12:00').split(':').map(Number);
  const nextReport = new Date(now);
  nextReport.setHours(hour, minute, 0, 0);
  if (now > nextReport) nextReport.setDate(nextReport.getDate() + 1);
  
  setTimeout(() => {
    sendReportToStaff();
    setInterval(sendReportToStaff, 24 * 60 * 60 * 1000);
  }, nextReport - now);
}

// ===============================
// INICIALIZAR READLINE
// ===============================
let rl = null, isMenuActive = false;
function initReadline() {
  if (!rl) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.on('close', () => { isMenuActive = false; });
    rl.on('line', (input) => { if (isMenuActive) handleMenuOption(input); });
  }
}

loadWarnsData();

module.exports = {
  client, CONFIG, staffIds, stats, serverMonitoring, pendingActions,
  warnsData, WARN_ROLES, offensiveWords,
  addWarn, removeWarn, clearUserWarns, getUserWarns, getUserStats, getServerStats, getGlobalStats,
  calculateRiskLevel, formatDate, formatDuration, updateWarnRoles, monitorWarnRoles,
  generateDailyReport, sendReportToStaff, scheduleDailyReport,
  containsOffensiveWord, findOffensiveWord, isAdmin, isStaff, setServerMonitoring, createStatusEmbed,
  getTimestamp, logInfo, logError, logWarn, logSuccess, logModeration, formatTime,
  initReadline, showMenu, handleMenuOption
};
// ===============================
// BOT MODERAÇÃO COMPLETA VERSÃO INTEGRADA - PARTE 2/3
// ===============================
// COMANDOS DO BOT
// TOTAL DE LINHAS APROXIMADO: 1200 LINHAS
// ===============================

// ===============================
// COMANDO /adm - PAINEL ADMINISTRATIVO
// ===============================
const admCommand = {
  data: { 
    name: 'adm', 
    description: 'Painel administrativo do bot', 
    options: [{ name: 'code', type: 3, description: 'Senha de acesso administrativo', required: true }]
  },
  async execute(interaction) {
    const code = interaction.options.getString('code');
    
    if (code !== CONFIG.ACCESS_CODE) {
      return interaction.reply({ content: '❌ Código de acesso incorreto!', flags: 64 });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('stats').setLabel('📊 Estatísticas').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('console').setLabel('🖥️ Ver no Console').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('help').setLabel('❓ Ajuda').setStyle(ButtonStyle.Success)
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
  }
};

// ===============================
// COMANDO /ping - VERIFICAR LATÊNCIA
// ===============================
const pingCommand = {
  data: { name: 'ping', description: 'Verifica a latência do bot' },
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
  }
};

// ===============================
// COMANDO /help - LISTA DE AJUDA
// ===============================
const helpCommand = {
  data: { name: 'help', description: 'Mostra a lista de comandos disponíveis' },
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('❓ Comandos Disponíveis')
      .setDescription('Lista de comandos que você pode usar no bot:')
      .setColor(Colors.Blue)
      .addFields(
        { name: '/ping', value: 'Verifica a latência do bot', inline: false },
        { name: '/help', value: 'Mostra esta lista de ajuda', inline: false },
        { name: '/adm', value: 'Acesso ao painel administrativo (Staff)', inline: false },
        { name: '/private', value: 'Enviar mensagem privada (Staff) - Suporta pessoa ou cargo', inline: false },
        { name: '/report', value: 'Gerar relatório manual (Staff)', inline: false },
        { name: '/warn', value: 'Sistema completo de warns (Staff)', inline: false },
        { name: '/warnings', value: '[Atalho] Ver warns de um usuário', inline: false },
        { name: '/clearwarns', value: '[Atalho] Limpar warns de um usuário', inline: false },
        { name: '/warnstats', value: '[Atalho] Estatísticas de warns', inline: false },
        { name: '/mywarns', value: 'Ver seus próprios warns', inline: false }
      )
      .setFooter({ text: 'Comandos de texto na DM: !clear, !clearAll, Hello' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: 64 });
    logInfo(`Comando /help usado por ${interaction.user.tag}`);
    stats.commandsUsed['help'] = (stats.commandsUsed['help'] || 0) + 1;
  }
};

// ===============================
// COMANDO /private - ENVIAR MENSAGEM PARA PESSOA OU CARGO
// ===============================
const privateCommand = {
  data: { 
    name: 'private', 
    description: 'Enviar mensagem da staff para pessoa ou cargo', 
    options: [
      { name: 'code', type: 3, description: 'Código de acesso', required: true },
      { name: 'target_type', type: 3, description: 'Tipo de destino (user ou role)', required: true, choices: [
        { name: '👤 Pessoa', value: 'user' },
        { name: '👥 Cargo', value: 'role' }
      ]},
      { name: 'target', type: 3, description: 'ID do usuário ou cargo', required: true },
      { name: 'message', type: 3, description: 'Mensagem a ser enviada', required: true }
    ]
  },
  async execute(interaction) {
    const code = interaction.options.getString('code');
    const targetType = interaction.options.getString('target_type');
    const target = interaction.options.getString('target');
    const message = interaction.options.getString('message');
    
    if (code !== CONFIG.ACCESS_CODE) {
      return interaction.reply({ content: '❌ Código de acesso incorreto!', flags: 64 });
    }
    
    await interaction.deferReply({ flags: 64 });
    
    try {
      if (targetType === 'user') {
        const user = await client.users.fetch(target).catch(() => null);
        if (!user) {
          return interaction.editReply({ content: '❌ Usuário não encontrado!' });
        }
        
        await user.send({ content: `📬 **Mensagem da Staff**\n\n${message}` });
        await interaction.editReply({ content: `✅ Mensagem enviada para ${user.tag}`, flags: 64 });
        logInfo(`${interaction.user.tag} enviou mensagem para ${user.tag}`);
        
      } else if (targetType === 'role') {
        const role = interaction.guild.roles.cache.get(target);
        if (!role) {
          return interaction.editReply({ content: '❌ Cargo não encontrado!' });
        }
        
        await interaction.editReply({ content: `🔄 Enviando mensagem para o cargo **${role.name}**... Isso pode levar alguns segundos.`, flags: 64 });
        
        const members = role.members;
        let successCount = 0;
        let failCount = 0;
        
        for (const [memberId, member] of members) {
          try {
            await member.send({ content: `📬 **Mensagem da Staff para ${role.name}**\n\n${message}` });
            successCount++;
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (err) {
            failCount++;
            logError(`Erro ao enviar para ${member.user.tag}: ${err.message}`);
          }
        }
        
        await interaction.editReply({ 
          content: `✅ Mensagem enviada para **${successCount}** membros do cargo ${role.name}${failCount > 0 ? ` (${failCount} falhas)` : ''}`, 
          flags: 64 
        });
        logInfo(`${interaction.user.tag} enviou mensagem para o cargo ${role.name} (${successCount} membros)`);
      }
      
      stats.commandsUsed['private'] = (stats.commandsUsed['private'] || 0) + 1;
      
    } catch (error) {
      logError(`Erro ao enviar mensagem: ${error.message}`);
      await interaction.editReply({ content: '❌ Erro ao enviar a mensagem.', flags: 64 });
    }
  }
};

// ===============================
// COMANDO /report - GERAR RELATÓRIO MANUAL
// ===============================
const reportCommand = {
  data: { 
    name: 'report', 
    description: 'Gerar relatório manual (Staff)', 
    options: [{ name: 'code', type: 3, description: 'Código de acesso', required: true }]
  },
  async execute(interaction) {
    const code = interaction.options.getString('code');
    
    if (code !== CONFIG.ACCESS_CODE) {
      return interaction.reply({ content: '❌ Código de acesso incorreto!', flags: 64 });
    }
    
    await interaction.reply({ content: '🔄 Gerando relatório...', flags: 64 });
    
    const reportEmbed = await generateDailyReport();
    
    const staffList = CONFIG.STAFF_USER_ID ? CONFIG.STAFF_USER_ID.split(',') : [];
    let successCount = 0;
    let failCount = 0;
    
    for (const staffId of staffList) {
      const cleanId = staffId.trim().replace(/[<@>]/g, '');
      try {
        const staffUser = await client.users.fetch(cleanId);
        if (staffUser) {
          await staffUser.send({ content: '📊 **Relatório Manual do Bot**', embeds: [reportEmbed] });
          successCount++;
          logInfo(`📊 Relatório manual enviado para ${staffUser.tag}`);
        }
      } catch (err) {
        failCount++;
        logError(`Erro ao enviar relatório para ${cleanId}: ${err.message}`);
      }
    }
    
    if (CONFIG.logChannelId) {
      const logChannel = await client.channels.fetch(CONFIG.logChannelId).catch(() => null);
      if (logChannel) {
        await logChannel.send({ content: '📊 **Relatório Manual do Bot**', embeds: [reportEmbed] });
      }
    }
    
    await interaction.followUp({
      content: `✅ Relatório gerado e enviado para **${successCount} staff(s)**${failCount > 0 ? ` (${failCount} falhas)` : ''}`,
      flags: 64
    });
    
    logInfo(`${interaction.user.tag} gerou relatório manual`);
    stats.commandsUsed['report'] = (stats.commandsUsed['report'] || 0) + 1;
  }
};

// ===============================
// COMANDO /warn - USANDO EXECUTORES DO allWarncmd.js
// ===============================
const warnCommand = {
  data: warnCommands ? warnCommands.warnCommandData : {
    name: 'warn',
    description: 'Sistema completo de warns',
    options: [
      {
        name: 'add',
        description: 'Adicionar warn a um usuário',
        type: 1,
        options: [
          { name: 'code', type: 3, description: 'Código de acesso', required: true },
          { name: 'user', type: 6, description: 'Usuário a ser warnado', required: true },
          { name: 'reason', type: 3, description: 'Motivo do warn', required: true },
          { name: 'duration', type: 4, description: 'Duração em dias (0 = permanente)', required: false }
        ]
      },
      {
        name: 'remove',
        description: 'Remover um warn específico',
        type: 1,
        options: [
          { name: 'code', type: 3, description: 'Código de acesso', required: true },
          { name: 'user', type: 6, description: 'Usuário', required: true },
          { name: 'warnid', type: 3, description: 'ID do warn a remover', required: true },
          { name: 'reason', type: 3, description: 'Motivo da remoção', required: true }
        ]
      },
      {
        name: 'clear',
        description: 'Limpar todos os warns de um usuário',
        type: 1,
        options: [
          { name: 'code', type: 3, description: 'Código de acesso', required: true },
          { name: 'user', type: 6, description: 'Usuário', required: true },
          { name: 'reason', type: 3, description: 'Motivo da limpeza', required: true }
        ]
      },
      {
        name: 'check',
        description: 'Verificar warns de um usuário',
        type: 1,
        options: [
          { name: 'code', type: 3, description: 'Código de acesso', required: true },
          { name: 'user', type: 6, description: 'Usuário', required: true }
        ]
      },
      {
        name: 'stats',
        description: 'Estatísticas de warns',
        type: 1,
        options: [
          { name: 'code', type: 3, description: 'Código de acesso', required: true },
          { name: 'user', type: 6, description: 'Ver estatísticas de um usuário', required: false }
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

    // Usar executores do allWarncmd.js se disponíveis
    if (warnCommands) {
      try {
        if (subcommand === 'add') {
          await warnCommands.executeWarnAdd(interaction, warnSystem, updateWarnRoles, stats);
        } else if (subcommand === 'remove') {
          await warnCommands.executeWarnRemove(interaction, warnSystem, updateWarnRoles);
        } else if (subcommand === 'clear') {
          await warnCommands.executeWarnClear(interaction, warnSystem, updateWarnRoles);
        } else if (subcommand === 'check') {
          await warnCommands.executeWarnCheck(interaction, warnSystem);
        } else if (subcommand === 'stats') {
          await warnCommands.executeWarnStats(interaction, warnSystem);
        }
        stats.commandsUsed['warn'] = (stats.commandsUsed['warn'] || 0) + 1;
        return;
      } catch (error) {
        logError(`Erro no executor do warn: ${error.message}`);
        // Fallback para o código interno
      }
    }

    // ========== FALLBACK: CÓDIGO INTERNO ==========
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

        const result = addWarn(interaction.guild.id, user.id, reason, interaction.user.id, { duration: duration || null });
        
        if (!result.success) {
          return interaction.editReply({ content: `❌ ${result.error || 'Falha ao adicionar warn'}` });
        }

        stats.warnsGiven++;
        await updateWarnRoles(interaction.guild, user.id, result.warnCount);

        const riskLevel = calculateRiskLevel(result.warnCount);
        
        const embed = new EmbedBuilder()
          .setTitle(`${riskLevel.emoji} Warn Adicionado`)
          .setColor(riskLevel.color)
          .setDescription(`Warn registrado para ${user.toString()}`)
          .addFields(
            { name: '👤 Usuário', value: `${user.tag}`, inline: true },
            { name: '🛡️ Moderador', value: interaction.user.tag, inline: true },
            { name: '📋 Motivo', value: reason, inline: false },
            { name: '⚠️ Warns Ativos', value: `**${result.warnCount}**`, inline: true },
            { name: '📊 Nível de Risco', value: `**${riskLevel.level}**`, inline: true },
            { name: '🆔 ID', value: `\`${result.warnId}\``, inline: true }
          )
          .setFooter({ text: `Sistema de Warns` })
          .setTimestamp();

        if (duration > 0) {
          embed.addFields({ name: '⏰ Expira em', value: `${duration} dias`, inline: true });
        }

        await interaction.editReply({ embeds: [embed] });

        try {
          const dmEmbed = new EmbedBuilder()
            .setTitle(`⚠️ Você recebeu um warn em ${interaction.guild.name}`)
            .setColor(riskLevel.color)
            .setDescription(`**Motivo:** ${reason}`)
            .addFields(
              { name: '📊 Warns Ativos', value: `**${result.warnCount}**`, inline: true },
              { name: '📊 Nível de Risco', value: riskLevel.level, inline: true }
            )
            .setFooter({ text: 'Caso ache isso um erro, você pode recorrer' })
            .setTimestamp();

          await user.send({ embeds: [dmEmbed] });
        } catch (dmError) {}
      }

      else if (subcommand === 'remove') {
        const user = interaction.options.getUser('user');
        const warnId = interaction.options.getString('warnid');
        const reason = interaction.options.getString('reason');

        const result = removeWarn(interaction.guild.id, user.id, warnId, interaction.user.id, reason);

        if (!result.success) {
          return interaction.editReply({ content: `❌ ${result.error || 'Erro ao remover warn'}` });
        }

        const userWarns = getUserWarns(interaction.guild.id, user.id);
        await updateWarnRoles(interaction.guild, user.id, userWarns?.activeCount || 0);

        const embed = new EmbedBuilder()
          .setTitle('✅ Warn Removido')
          .setColor(Colors.Green)
          .setDescription(`Warn removido de ${user.toString()}`)
          .addFields(
            { name: '🆔 ID do Warn', value: `\`${warnId}\``, inline: true },
            { name: '📋 Motivo', value: reason, inline: false },
            { name: '🛡️ Moderador', value: interaction.user.tag, inline: true }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }

      else if (subcommand === 'clear') {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        const result = clearUserWarns(interaction.guild.id, user.id, interaction.user.id, reason);

        if (!result.success) {
          return interaction.editReply({ content: `❌ ${result.error || 'Erro ao limpar warns'}` });
        }

        await updateWarnRoles(interaction.guild, user.id, 0);

        const embed = new EmbedBuilder()
          .setTitle('🧹 Warns Limpos')
          .setColor(Colors.Green)
          .setDescription(`Todos os warns de ${user.toString()} foram limpos.`)
          .addFields(
            { name: '🧹 Warns Removidos', value: `**${result.clearedCount || 0}**`, inline: true },
            { name: '📋 Motivo', value: reason, inline: false },
            { name: '🛡️ Moderador', value: interaction.user.tag, inline: true }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }

      else if (subcommand === 'check') {
        const user = interaction.options.getUser('user');
        
        const userWarns = getUserWarns(interaction.guild.id, user.id);
        
        if (!userWarns || userWarns.history.length === 0) {
          const embed = new EmbedBuilder()
            .setTitle('📭 Histórico de Warns')
            .setColor(Colors.Green)
            .setDescription(`${user.toString()} não possui warns.`)
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp();

          return interaction.editReply({ embeds: [embed] });
        }

        const riskLevel = calculateRiskLevel(userWarns.activeCount);
        
        const embed = new EmbedBuilder()
          .setTitle(`${riskLevel.emoji} Histórico de Warns de ${user.username}`)
          .setColor(riskLevel.color)
          .setThumbnail(user.displayAvatarURL())
          .addFields(
            { name: '⚠️ Warns Ativos', value: `**${userWarns.activeCount}**`, inline: true },
            { name: '📊 Total de Warns', value: `**${userWarns.count}**`, inline: true },
            { name: '📊 Nível de Risco', value: `**${riskLevel.level}**`, inline: true },
            { name: '📅 Primeiro Warn', value: formatDate(userWarns.firstWarn), inline: true },
            { name: '📅 Último Warn', value: formatDate(userWarns.lastWarn), inline: true }
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
          const userStats = getUserStats(interaction.guild.id, user.id);
          
          const embed = new EmbedBuilder()
            .setTitle(`📊 Estatísticas de ${user.username}`)
            .setColor(Colors.Blue)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
              { name: '⚠️ Total de Warns', value: userStats.totalWarns.toString(), inline: true },
              { name: '🟢 Warns Ativos', value: userStats.activeWarns.toString(), inline: true },
              { name: '📅 Primeiro Warn', value: formatDate(userStats.firstWarn), inline: true },
              { name: '📅 Último Warn', value: formatDate(userStats.lastWarn), inline: true },
              { name: '⏱️ Intervalo Médio', value: `${userStats.averageInterval} dias`, inline: true }
            )
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });
        } else {
          const serverStats = getServerStats(interaction.guild.id);
          
          const embed = new EmbedBuilder()
            .setTitle(`📊 Estatísticas do Servidor`)
            .setColor(Colors.Gold)
            .setThumbnail(interaction.guild.iconURL())
            .addFields(
              { name: '⚠️ Total de Warns', value: serverStats.totalWarns.toString(), inline: true },
              { name: '🟢 Warns Ativos', value: serverStats.activeWarns.toString(), inline: true },
              { name: '👥 Usuários Warnados', value: serverStats.warnedUsers.toString(), inline: true },
              { name: '📊 Média por Usuário', value: serverStats.averageWarnsPerUser.toString(), inline: true }
            )
            .setTimestamp();

          if (serverStats.topModerators && serverStats.topModerators.length > 0) {
            let modsList = serverStats.topModerators.slice(0, 5)
              .map((m, i) => `${i+1}. <@${m.id}>: **${m.count}** warns`)
              .join('\n');
            embed.addFields({ name: '🛡️ Top Moderadores', value: modsList || 'Nenhum dado', inline: false });
          }

          if (serverStats.topReasons && serverStats.topReasons.length > 0) {
            let reasonsList = serverStats.topReasons.slice(0, 5)
              .map((r, i) => `${i+1}. **${r.reason}**: ${r.count}x`)
              .join('\n');
            embed.addFields({ name: '📋 Motivos Mais Comuns', value: reasonsList || 'Nenhum dado', inline: false });
          }

          await interaction.editReply({ embeds: [embed] });
        }
      }

      stats.commandsUsed['warn'] = (stats.commandsUsed['warn'] || 0) + 1;

    } catch (error) {
      logError(`Erro no comando warn: ${error.message}`);
      console.error(error);
      await interaction.editReply({ content: '❌ Erro ao executar o comando.' });
    }
  }
};

// ===============================
// COMANDO /warnings - ATALHO PARA VER WARNS
// ===============================
const warningsCommand = {
  data: warnCommands ? warnCommands.warningsCommandData : {
    name: 'warnings', 
    description: '[Atalho] Ver warns de um usuário', 
    options: [
      { name: 'code', type: 3, description: 'Código de acesso', required: true },
      { name: 'user', type: 6, description: 'Usuário', required: true }
    ]
  },
  async execute(interaction) {
    if (warnCommands && warnCommands.executeWarnings) {
      return warnCommands.executeWarnings(interaction, warnSystem);
    }
    
    const user = interaction.options.getUser('user');
    const code = interaction.options.getString('code');
    
    const fakeInteraction = {
      ...interaction,
      options: {
        getSubcommand: () => 'check',
        getUser: (name) => name === 'user' ? user : null,
        getString: (name) => name === 'code' ? code : null,
        getBoolean: () => false
      }
    };
    
    return warnCommand.execute(fakeInteraction);
  }
};

// ===============================
// COMANDO /clearwarns - ATALHO PARA LIMPAR WARNS
// ===============================
const clearwarnsCommand = {
  data: warnCommands ? warnCommands.clearwarnsCommandData : {
    name: 'clearwarns', 
    description: '[Atalho] Limpar warns de um usuário', 
    options: [
      { name: 'code', type: 3, description: 'Código de acesso', required: true },
      { name: 'user', type: 6, description: 'Usuário', required: true },
      { name: 'reason', type: 3, description: 'Motivo', required: false }
    ]
  },
  async execute(interaction) {
    if (warnCommands && warnCommands.executeClearWarns) {
      return warnCommands.executeClearWarns(interaction, warnSystem, updateWarnRoles);
    }
    
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

// ===============================
// COMANDO /warnstats - ATALHO PARA ESTATÍSTICAS
// ===============================
const warnstatsCommand = {
  data: warnCommands ? warnCommands.warnstatsCommandData : {
    name: 'warnstats', 
    description: '[Atalho] Estatísticas de warns', 
    options: [
      { name: 'code', type: 3, description: 'Código de acesso', required: true },
      { name: 'user', type: 6, description: 'Usuário', required: false }
    ]
  },
  async execute(interaction) {
    if (warnCommands && warnCommands.executeWarnStatsShortcut) {
      return warnCommands.executeWarnStatsShortcut(interaction, warnSystem);
    }
    
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
// COMANDO /mywarns - VER PRÓPRIOS WARNS
// ===============================
const mywarnsCommand = {
  data: warnCommands ? warnCommands.mywarnsCommandData : {
    name: 'mywarns', 
    description: '👤 Ver seus próprios warns', 
    options: [
      { name: 'code', type: 3, description: 'Código de acesso', required: true }
    ]
  },
  async execute(interaction) {
    if (warnCommands && warnCommands.executeMyWarns) {
      return warnCommands.executeMyWarns(interaction, warnSystem);
    }
    
    const code = interaction.options.getString('code');
    if (code !== CONFIG.ACCESS_CODE) {
      return interaction.reply({ content: '❌ Código de acesso incorreto!', flags: 64 });
    }
    
    await interaction.deferReply({ flags: 64 });
    const user = interaction.user;
    const userWarns = getUserWarns(interaction.guild.id, user.id);
    
    const riskLevel = calculateRiskLevel(userWarns?.activeCount || 0);
    const embed = new EmbedBuilder()
      .setTitle(`${riskLevel.emoji} Seus Warns ${riskLevel.emoji}`)
      .setColor(riskLevel.color)
      .setThumbnail(user.displayAvatarURL())
      .setDescription(`**${user.toString()}**`)
      .addFields(
        { name: '⚠️ Warns Ativos', value: `**${userWarns?.activeCount || 0}**`, inline: true },
        { name: '📊 Total de Warns', value: `**${userWarns?.count || 0}**`, inline: true },
        { name: '📊 Nível de Risco', value: `**${riskLevel.level}**`, inline: true }
      )
      .setTimestamp();
    
    if (!userWarns || userWarns.history.length === 0) {
      embed.setDescription(`✅ ${user.toString()} não possui warns. Continue com bom comportamento!`);
    }
    
    await interaction.editReply({ embeds: [embed], flags: 64 });
    stats.commandsUsed['mywarns'] = (stats.commandsUsed['mywarns'] || 0) + 1;
  }
};

// ===============================
// ARRAY COM TODOS OS COMANDOS PARA REGISTRO
// ===============================
const allCommands = [
  admCommand,
  pingCommand,
  helpCommand,
  privateCommand,
  reportCommand,
  warnCommand,
  warningsCommand,
  clearwarnsCommand,
  warnstatsCommand,
  mywarnsCommand
];

// Exportar comandos para uso na parte 3
module.exports = {
  admCommand, pingCommand, helpCommand, privateCommand, reportCommand,
  warnCommand, warningsCommand, clearwarnsCommand, warnstatsCommand, mywarnsCommand,
  allCommands
};
// ===============================
// BOT MODERAÇÃO COMPLETA VERSÃO INTEGRADA - PARTE 3/3
// ===============================
// EVENTOS, HANDLERS, MENU INTERATIVO E LOGIN
// TOTAL DE LINHAS APROXIMADO: 1300 LINHAS
// ===============================

// ===============================
// HANDLER PARA BOTÕES DO PAINEL ADMIN
// ===============================
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
        .setFooter({ text: 'Estatísticas atualizadas' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
      logInfo(`${interaction.user.tag} abriu estatísticas`);
      
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (e) {}
      }, 15000);
      break;
    }

    case 'console': {
      console.log(chalk.yellow('\n═══ ESTATÍSTICAS DO BOT ═══'));
      console.log(chalk.white(`Ping:    ${client.ws.ping}ms`));
      console.log(chalk.white(`Uptime:  ${Math.floor(client.uptime / 3600000)}h`));
      console.log(chalk.white(`Servers: ${client.guilds.cache.size}`));
      console.log(chalk.white(`Users:   ${client.users.cache.size}`));
      console.log(chalk.yellow('═════════════════════════════\n'));
      await interaction.reply({ content: '✅ Verifique o console!', flags: 64 });
      
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (e) {}
      }, 5000);
      break;
    }

    case 'help': {
      const embed = new EmbedBuilder()
        .setTitle('❓ Ajuda - Painel Administrativo')
        .setDescription('Como usar o painel administrativo:')
        .setColor(Colors.Blue)
        .addFields(
          { name: '📊 Estatísticas', value: 'Clique em "Estatísticas" para ver dados do bot', inline: false },
          { name: '🖥️ Console', value: 'Clique em "Ver no Console" para ver dados no terminal', inline: false },
          { name: '🔐 Segurança', value: 'Use o comando /adm com a senha correta', inline: false }
        )
        .setFooter({ text: 'Painel Administrativo' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
      logInfo(`${interaction.user.tag} pediu ajuda no painel`);
      
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (e) {}
      }, 15000);
      break;
    }

    default:
      await interaction.reply({ content: '❌ Botão desconhecido!', flags: 64 });
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (e) {}
      }, 5000);
  }
}

// ===============================
// HANDLER PARA BOTÕES DE MONITORAMENTO (DM)
// ===============================
async function handleMonitorButtons(interaction) {
  await interaction.deferReply({ flags: 64 });
  
  try {
    const parts = interaction.customId.split('_');
    const action = parts[1];
    const state = parts[2];
    const isOn = state === 'on';
    const actionText = isOn ? 'ATIVAR' : 'DESATIVAR';
    
    if (action === 'all') {
      let count = 0;
      for (const [guildId, guild] of client.guilds.cache) {
        setServerMonitoring(guildId, isOn, interaction.user);
        count++;
      }
      
      const embed = createStatusEmbed(null, state, interaction.user);
      embed.setDescription(`✅ Monitoramento ${isOn ? 'ativado' : 'desativado'} em **${count} servidores**!`);
      
      await interaction.editReply({
        content: `✅ Operação concluída!`,
        embeds: [embed]
      });
      
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (e) {}
      }, 10000);
      
    } else if (action === 'select') {
      const options = [];
      let count = 0;
      
      for (const [guildId, guild] of client.guilds.cache) {
        if (count >= 25) break;
        
        const status = serverMonitoring.get(guildId) ? '🟢 ATIVO' : '🔴 INATIVO';
        options.push(
          new StringSelectMenuOptionBuilder()
            .setLabel(guild.name.substring(0, 100))
            .setDescription(`${guild.memberCount} membros - ${status}`)
            .setValue(guildId)
            .setEmoji('🏛️')
        );
        count++;
      }
      
      if (client.guilds.cache.size > 25) {
        options.push(
          new StringSelectMenuOptionBuilder()
            .setLabel('📌 Mais servidores...')
            .setDescription('Use o comando novamente para ver outros servidores')
            .setValue('more')
            .setEmoji('📌')
        );
      }
      
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`select_server_${state}`)
        .setPlaceholder('Selecione um servidor')
        .addOptions(options);
      
      const row = new ActionRowBuilder().addComponents(selectMenu);
      
      pendingActions.set(interaction.user.id, { 
        action: state,
        messageId: interaction.id 
      });
      
      await interaction.editReply({
        content: `🔍 **Selecione o servidor para ${actionText} o monitoramento:**`,
        components: [row]
      });
    }
  } catch (error) {
    logError(`Erro no handleMonitorButtons: ${error.message}`);
    await interaction.editReply({ 
      content: '❌ Erro ao processar comando. Tente novamente.'
    });
    
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (e) {}
    }, 5000);
  }
}

// ===============================
// HANDLER PARA SELEÇÃO DE SERVIDOR (MONITORAMENTO PADRÃO)
// ===============================
async function handleServerSelection(interaction) {
  await interaction.deferUpdate();
  
  try {
    const selectedValue = interaction.values[0];
    const customId = interaction.customId;
    const state = customId.split('_')[2];
    
    const pending = pendingActions.get(interaction.user.id);
    
    if (!pending) {
      await interaction.editReply({ 
        content: '❌ Esta seleção expirou. Use o comando novamente.',
        components: [] 
      });
      
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (e) {}
      }, 5000);
      
      return;
    }
    
    const isOn = state === 'on';
    const actionText = isOn ? 'ATIVADO' : 'DESATIVADO';
    
    if (selectedValue === 'more') {
      await interaction.editReply({ 
        content: '📌 **Use o comando novamente para ver mais servidores.**\nDigite `!MonitorOn` ou `!MonitorOff` novamente.',
        components: [] 
      });
      
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (e) {}
      }, 5000);
      
      pendingActions.delete(interaction.user.id);
      return;
    }
    
    const guild = client.guilds.cache.get(selectedValue);
    if (!guild) {
      await interaction.editReply({ 
        content: '❌ Servidor não encontrado.',
        components: [] 
      });
      
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (e) {}
      }, 5000);
      
      pendingActions.delete(interaction.user.id);
      return;
    }
    
    setServerMonitoring(selectedValue, isOn, interaction.user);
    
    const embed = createStatusEmbed(guild, state, interaction.user);
    
    await interaction.editReply({ 
      content: `✅ **Monitoramento ${actionText} em ${guild.name}!**`,
      embeds: [embed],
      components: [] 
    });
    
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (e) {}
    }, 10000);
    
    pendingActions.delete(interaction.user.id);
    
  } catch (error) {
    logError(`Erro no handleServerSelection: ${error.message}`);
    await interaction.editReply({ 
      content: '❌ Erro ao processar seleção.',
      components: [] 
    });
    
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (e) {}
    }, 5000);
  }
}

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
  const globalStats = getGlobalStats();

  const embed = new EmbedBuilder()
    .setTitle('👋 Welcome, Owner!')
    .setDescription('**Painel de Controle do Bot**')
    .setColor('#89CFF0')
    .addFields(
      { 
        name: '🤖 **Informações do Bot**', 
        value: `• **Tag:** ${client.user.tag}\n• **ID:** ${client.user.id}\n• **Servidores:** ${client.guilds.cache.size}\n• **Usuários:** ${client.users.cache.size}`,
        inline: false 
      },
      { 
        name: '📊 **Status**', 
        value: `• **Ping:** ${client.ws.ping}ms\n• **Uptime:** ${uptimeString}\n• **Memória:** ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
        inline: true 
      },
      { 
        name: '📅 **Informações**', 
        value: `• **Iniciado em:** ${stats.startDate.toLocaleString('pt-BR')}\n• **Comandos hoje:** ${totalCommandsToday}\n• **Warns totais:** ${globalStats.totalWarns}\n• **Servidores com warns:** ${globalStats.totalServers}`,
        inline: true 
      },
      { 
        name: '📋 **Comandos Disponíveis**', 
        value: '`/ping` - Verificar latência\n`/help` - Lista de comandos\n`/adm` - Painel admin\n`/private` - Mensagem staff (pessoa ou cargo)\n`/report` - Gerar relatório\n`/warn` - Sistema completo de warns\n`/warnings` - Ver warns\n`/clearwarns` - Limpar warns\n`/warnstats` - Estatísticas\n`/mywarns` - Ver seus warns\n\n**Comandos DM:**\n`!clear` - Limpar DM\n`!clearAll` - Limpar todas DMs\n`Hello` - Abrir este painel',
        inline: false 
      }
    )
    .setFooter({ 
      text: `Hostville-bot@5.0.1 • Warn System v${warnSystem?.version || '2.0.0'}`,
      iconURL: client.user.displayAvatarURL()
    })
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('owner_turnoff')
        .setLabel('Turn Off')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔴'),
      new ButtonBuilder()
        .setCustomId('owner_moderation')
        .setLabel('Moderation')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🛡️'),
      new ButtonBuilder()
        .setCustomId('owner_warnstats')
        .setLabel('Warn Stats')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📊'),
      new ButtonBuilder()
        .setCustomId('owner_monitor_roles')
        .setLabel('Monitor Roles')
        .setStyle(ButtonStyle.Success)
        .setEmoji('👥')
    );

  await message.reply({
    content: '✅ **Owner Panel**',
    embeds: [embed],
    components: [row]
  });

  logInfo(`🔐 Painel do dono aberto por ${message.author.tag}`);
}

async function handleOwnerPanelButtons(interaction) {
  const ownerId = CONFIG.OWNER_ID ? CONFIG.OWNER_ID.replace(/[<@>]/g, '') : null;
  
  if (interaction.user.id !== ownerId) {
    await interaction.reply({ 
      content: '❌ Apenas o dono do bot pode usar estes botões!', 
      flags: 64 
    });
    
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (e) {}
    }, 5000);
    return;
  }

  if (interaction.customId === 'owner_turnoff') {
    const confirmRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('confirm_shutdown')
          .setLabel('✅ Confirmar Desligamento')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('cancel_shutdown')
          .setLabel('❌ Cancelar')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.reply({
      content: '⚠️ **Tem certeza que deseja desligar o bot?**',
      components: [confirmRow],
      flags: 64
    });

    const filter = (i) => i.user.id === ownerId;
    const collector = interaction.channel.createMessageComponentCollector({ 
      filter, 
      time: 30000,
      max: 1
    });

    collector.on('collect', async (i) => {
      if (i.customId === 'confirm_shutdown') {
        await i.update({ 
          content: '🔴 **Desligando o bot...**', 
          components: [] 
        });
        
        logInfo(`🔴 Bot desligado por ${interaction.user.tag}`);
        
        setTimeout(() => {
          process.exit(0);
        }, 2000);
        
      } else if (i.customId === 'cancel_shutdown') {
        await i.update({ 
          content: '✅ **Desligamento cancelado.**', 
          components: [] 
        });
        
        setTimeout(async () => {
          try {
            await i.deleteReply();
          } catch (e) {}
        }, 3000);
      }
    });

    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        try {
          await interaction.editReply({ 
            content: '⏰ **Tempo esgotado. Desligamento cancelado.**', 
            components: [] 
          });
          
          setTimeout(async () => {
            try {
              await interaction.deleteReply();
            } catch (e) {}
          }, 3000);
        } catch (e) {}
      }
    });

  } else if (interaction.customId === 'owner_moderation') {
    await interaction.deferReply({ flags: 64 });

    try {
      const options = [];
      let count = 0;
      
      for (const [guildId, guild] of client.guilds.cache) {
        if (count >= 25) break;
        
        const status = serverMonitoring.get(guildId) ? '🟢 ATIVO' : '🔴 INATIVO';
        options.push(
          new StringSelectMenuOptionBuilder()
            .setLabel(guild.name.substring(0, 100))
            .setDescription(`${guild.memberCount} membros - ${status}`)
            .setValue(guildId)
            .setEmoji('🏛️')
        );
        count++;
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('owner_monitor_select')
        .setPlaceholder('Selecione um servidor para alterar')
        .addOptions(options);

      if (client.guilds.cache.size > 25) {
        selectMenu.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('📌 Mais servidores...')
            .setDescription('Use /adm para ver mais opções')
            .setValue('more')
            .setEmoji('📌')
        );
      }

      const row = new ActionRowBuilder().addComponents(selectMenu);

      const actionRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('owner_monitor_all_on')
            .setLabel('Ativar Todos')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅'),
          new ButtonBuilder()
            .setCustomId('owner_monitor_all_off')
            .setLabel('Desativar Todos')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌')
        );

      await interaction.editReply({
        content: '🛡️ **Painel de Moderação**\nSelecione um servidor para alterar o status do monitoramento:',
        components: [row, actionRow]
      });

    } catch (error) {
      logError(`Erro no painel de moderação: ${error.message}`);
      await interaction.editReply({ 
        content: '❌ Erro ao carregar servidores.' 
      });
    }
  } else if (interaction.customId === 'owner_warnstats') {
    await interaction.deferReply({ flags: 64 });

    try {
      const globalStats = getGlobalStats();

      const embed = new EmbedBuilder()
        .setTitle('📊 Estatísticas Globais de Warns')
        .setColor(Colors.Blue)
        .addFields(
          { name: '🌐 Servidores', value: globalStats.totalServers.toString(), inline: true },
          { name: '👥 Usuários Warnados', value: globalStats.totalUsers.toString(), inline: true },
          { name: '⚠️ Total de Warns', value: globalStats.totalWarns.toString(), inline: true },
          { name: '🟢 Warns Ativos', value: globalStats.totalActiveWarns.toString(), inline: true },
          { name: '📊 Média por Usuário', value: globalStats.averageWarnsPerUser.toString(), inline: true }
        )
        .setFooter({ text: `Sistema de Warns v${warnSystem?.version || '2.0.0'}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      logError(`Erro no painel de warns: ${error.message}`);
      await interaction.editReply({ 
        content: '❌ Erro ao carregar estatísticas de warns.' 
      });
    }
  } else if (interaction.customId === 'owner_monitor_roles') {
    await interaction.deferReply({ flags: 64 });
    await monitorWarnRoles();
    await interaction.editReply({ 
      content: '✅ **Monitoramento de cargos concluído!** Verifique o console para ver os resultados.',
      flags: 64
    });
    setTimeout(async () => { try { await interaction.deleteReply(); } catch (e) {} }, 10000);
  }
}

async function handleOwnerServerSelection(interaction) {
  const ownerId = CONFIG.OWNER_ID ? CONFIG.OWNER_ID.replace(/[<@>]/g, '') : null;
  
  if (interaction.user.id !== ownerId) {
    await interaction.reply({ 
      content: '❌ Acesso negado!', 
      flags: 64 
    });
    return;
  }

  await interaction.deferUpdate();

  try {
    const selectedValue = interaction.values[0];
    
    if (selectedValue === 'more') {
      await interaction.editReply({ 
        content: '📌 **Use o comando `Hello` novamente para ver mais servidores.**',
        components: [] 
      });
      
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (e) {}
      }, 5000);
      return;
    }

    const guild = client.guilds.cache.get(selectedValue);
    if (!guild) {
      await interaction.editReply({ 
        content: '❌ Servidor não encontrado.',
        components: [] 
      });
      return;
    }

    const currentStatus = serverMonitoring.get(guild.id) !== false;
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`monitor_guild_${guild.id}_on`)
          .setLabel('🟢 Ativar')
          .setStyle(ButtonStyle.Success)
          .setDisabled(currentStatus),
        new ButtonBuilder()
          .setCustomId(`monitor_guild_${guild.id}_off`)
          .setLabel('🔴 Desativar')
          .setStyle(ButtonStyle.Danger)
          .setDisabled(!currentStatus)
      );

    const embed = new EmbedBuilder()
      .setTitle(`🛡️ Servidor: ${guild.name}`)
      .setColor(currentStatus ? Colors.Green : Colors.Red)
      .addFields(
        { name: '📊 Status Atual', value: currentStatus ? '🟢 **ATIVO**' : '🔴 **INATIVO**', inline: true },
        { name: '👥 Membros', value: `${guild.memberCount}`, inline: true },
        { name: '📅 Criado em', value: guild.createdAt.toLocaleDateString('pt-BR'), inline: true }
      )
      .setTimestamp();

    await interaction.editReply({
      content: `**${guild.name}** - Escolha a ação:`,
      embeds: [embed],
      components: [row]
    });

  } catch (error) {
    logError(`Erro no handleOwnerServerSelection: ${error.message}`);
  }
}

async function handleGuildMonitorButton(interaction) {
  const ownerId = CONFIG.OWNER_ID ? CONFIG.OWNER_ID.replace(/[<@>]/g, '') : null;
  
  if (interaction.user.id !== ownerId) {
    await interaction.reply({ 
      content: '❌ Acesso negado!', 
      flags: 64 
    });
    return;
  }

  await interaction.deferUpdate();

  try {
    const parts = interaction.customId.split('_');
    const guildId = parts[2];
    const action = parts[3];
    
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      await interaction.editReply({ 
        content: '❌ Servidor não encontrado.',
        components: [] 
      });
      return;
    }

    const isOn = action === 'on';
    setServerMonitoring(guildId, isOn, interaction.user);

    const embed = new EmbedBuilder()
      .setTitle(`✅ Monitoramento ${isOn ? 'Ativado' : 'Desativado'}`)
      .setColor(isOn ? Colors.Green : Colors.Red)
      .addFields(
        { name: '🏛️ Servidor', value: guild.name, inline: true },
        { name: '🛡️ Status', value: isOn ? '🟢 **ATIVO**' : '🔴 **INATIVO**', inline: true },
        { name: '👤 Staff', value: interaction.user.tag, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({
      content: `✅ **Monitoramento ${isOn ? 'ativado' : 'desativado'} em ${guild.name}!**`,
      embeds: [embed],
      components: []
    });

    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (e) {}
    }, 10000);

  } catch (error) {
    logError(`Erro no handleGuildMonitorButton: ${error.message}`);
  }
}

async function handleOwnerBulkAction(interaction) {
  const ownerId = CONFIG.OWNER_ID ? CONFIG.OWNER_ID.replace(/[<@>]/g, '') : null;
  
  if (interaction.user.id !== ownerId) {
    await interaction.reply({ 
      content: '❌ Acesso negado!', 
      flags: 64 
    });
    return;
  }

  await interaction.deferUpdate();

  try {
    const isOn = interaction.customId.includes('on');
    let count = 0;
    
    for (const [guildId, guild] of client.guilds.cache) {
      setServerMonitoring(guildId, isOn, interaction.user);
      count++;
    }

    const embed = new EmbedBuilder()
      .setTitle(`✅ Ação em Massa Concluída`)
      .setColor(isOn ? Colors.Green : Colors.Red)
      .addFields(
        { name: '🛡️ Ação', value: isOn ? 'Ativar Todos' : 'Desativar Todos', inline: true },
        { name: '📊 Servidores', value: `${count} servidores`, inline: true },
        { name: '👤 Staff', value: interaction.user.tag, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({
      content: `✅ **Monitoramento ${isOn ? 'ativado' : 'desativado'} em ${count} servidores!**`,
      embeds: [embed],
      components: []
    });

    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (e) {}
    }, 10000);

  } catch (error) {
    logError(`Erro no handleOwnerBulkAction: ${error.message}`);
  }
}

// ===============================
// EVENTO PRINCIPAL DE MENSAGENS
// ===============================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // ===== MENSAGENS NA DM =====
  if (message.channel.type === ChannelType.DM) {
    
    // === COMANDO Hello - Painel do Dono ===
    if (message.content.toLowerCase() === 'hello') {
      await handleOwnerPanel(message);
      return;
    }
    
    // === COMANDO !MonitorOn ===
    if (message.content.startsWith('!MonitorOn')) {
      const args = message.content.split(' ');
      const password = args[1];
      
      if (!password) {
        await message.reply('❌ Use: `!MonitorOn ACCESS_CODE`');
        setTimeout(async () => {
          try {
            const msgs = await message.channel.messages.fetch({ limit: 2 });
            for (const msg of msgs.values()) {
              if (msg.author.id === client.user.id) {
                await msg.delete();
              }
            }
          } catch (e) {}
        }, 5000);
        return;
      }
      
      if (password !== CONFIG.ACCESS_CODE) {
        await message.reply('❌ Código de acesso incorreto!');
        setTimeout(async () => {
          try {
            const msgs = await message.channel.messages.fetch({ limit: 2 });
            for (const msg of msgs.values()) {
              if (msg.author.id === client.user.id) {
                await msg.delete();
              }
            }
          } catch (e) {}
        }, 5000);
        return;
      }
      
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('monitor_all_on')
            .setLabel('Todos os Servidores ⚠️')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🌐'),
          new ButtonBuilder()
            .setCustomId('monitor_select_on')
            .setLabel('Selecionar um Servidor')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔍')
        );
      
      const reply = await message.reply({
        content: '🛡️ **Escolha uma opção para ATIVAR o monitoramento:**',
        components: [row]
      });
      
      setTimeout(async () => {
        try {
          await message.delete();
          await reply.delete();
        } catch (e) {}
      }, 120000);
      
      return;
    }
    
    // === COMANDO !MonitorOff ===
    if (message.content.startsWith('!MonitorOff')) {
      const args = message.content.split(' ');
      const password = args[1];
      
      if (!password) {
        await message.reply('❌ Use: `!MonitorOff ACCESS_CODE`');
        setTimeout(async () => {
          try {
            const msgs = await message.channel.messages.fetch({ limit: 2 });
            for (const msg of msgs.values()) {
              if (msg.author.id === client.user.id) {
                await msg.delete();
              }
            }
          } catch (e) {}
        }, 5000);
        return;
      }
      
      if (password !== CONFIG.ACCESS_CODE) {
        await message.reply('❌ Código de acesso incorreto!');
        setTimeout(async () => {
          try {
            const msgs = await message.channel.messages.fetch({ limit: 2 });
            for (const msg of msgs.values()) {
              if (msg.author.id === client.user.id) {
                await msg.delete();
              }
            }
          } catch (e) {}
        }, 5000);
        return;
      }
      
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('monitor_all_off')
            .setLabel('Todos os Servidores ⚠️')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🌐'),
          new ButtonBuilder()
            .setCustomId('monitor_select_off')
            .setLabel('Selecionar um Servidor')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔍')
        );
      
      const reply = await message.reply({
        content: '🛡️ **Escolha uma opção para DESATIVAR o monitoramento:**',
        components: [row]
      });
      
      setTimeout(async () => {
        try {
          await message.delete();
          await reply.delete();
        } catch (e) {}
      }, 120000);
      
      return;
    }
    
    // === COMANDO !clearAll ===
    if (message.content.startsWith('!clearAll')) {
      const args = message.content.split(' ');
      const password = args[1];
      
      if (!password) {
        const errorMsg = await message.reply('❌ Use: `!clearAll SUA_SENHA`');
        setTimeout(async () => {
          try {
            await message.delete();
            await errorMsg.delete();
          } catch (e) {}
        }, 5000);
        return;
      }
      
      if (password !== CONFIG.ACCESS_CODE) {
        const errorMsg = await message.reply('❌ Código de acesso incorreto!');
        setTimeout(async () => {
          try {
            await message.delete();
            await errorMsg.delete();
          } catch (e) {}
        }, 5000);
        return;
      }
      
      try {
        await message.delete();
      } catch (e) {}
      
      try {
        const processingMsg = await message.channel.send('🔄 Limpando mensagens de TODAS as DMs... Isso pode levar alguns minutos...');
        
        let totalDeleted = 0;
        let totalChannels = 0;
        
        const dmChannels = new Map();
        
        client.channels.cache.forEach(channel => {
          if (channel.type === ChannelType.DM) {
            dmChannels.set(channel.id, channel);
          }
        });
        
        client.users.cache.forEach(user => {
          if (user.dmChannel && !dmChannels.has(user.dmChannel.id)) {
            dmChannels.set(user.dmChannel.id, user.dmChannel);
          }
        });
        
        totalChannels = dmChannels.size;
        
        if (totalChannels === 0) {
          await processingMsg.edit('❌ Nenhum canal de DM encontrado para limpar.');
          setTimeout(async () => {
            try {
              await processingMsg.delete();
            } catch (e) {}
          }, 5000);
          return;
        }
        
        for (const [channelId, channel] of dmChannels) {
          let channelCount = 0;
          
          try {
            let fetchedMessages;
            let hasMore = true;
            let retryCount = 0;
            
            while (hasMore && retryCount < 3) {
              try {
                fetchedMessages = await channel.messages.fetch({ limit: 100 });
                
                if (fetchedMessages.size === 0) {
                  hasMore = false;
                  break;
                }
                
                const deletableMessages = fetchedMessages.filter(msg => 
                  msg.author.id === client.user.id
                );
                
                if (deletableMessages.size === 0) {
                  hasMore = false;
                  break;
                }
                
                for (const [id, msg] of deletableMessages) {
                  try {
                    await msg.delete();
                    channelCount++;
                    totalDeleted++;
                    await new Promise(resolve => setTimeout(resolve, 200));
                  } catch (err) {
                    if (err.code === 10008) continue;
                    logError(`Erro ao deletar mensagem ${id}: ${err.message}`);
                  }
                }
                
                if (fetchedMessages.size < 100) {
                  hasMore = false;
                }
                
              } catch (err) {
                retryCount++;
                logError(`Erro no lote do canal ${channelId}, tentativa ${retryCount}: ${err.message}`);
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
            
            if (channelCount > 0) {
              const recipient = channel.recipient ? channel.recipient.tag : 'desconhecido';
              logInfo(`Limpou ${channelCount} mensagens do bot na DM com ${recipient}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 800));
            
          } catch (err) {
            logError(`Erro ao processar DM ${channelId}: ${err.message}`);
          }
        }
        
        await processingMsg.edit(`✅ **${totalDeleted} mensagens** do bot foram limpas de **${totalChannels} DMs**!`);
        
        setTimeout(async () => {
          try {
            await processingMsg.delete();
          } catch (e) {}
        }, 10000);
        
        logInfo(`${message.author.tag} limpou ${totalDeleted} mensagens de todas as DMs usando !clearAll`);
        
      } catch (error) {
        logError(`Erro ao limpar todas as DMs: ${error.message}`);
        const errorMsg = await message.channel.send('❌ Erro ao limpar mensagens. Tente novamente.');
        setTimeout(async () => {
          try {
            await errorMsg.delete();
          } catch (e) {}
        }, 5000);
      }
      
      return;
    }
    
    // === COMANDO !clear ===
    if (message.content.startsWith('!clear')) {
      try {
        await message.delete();
      } catch (e) {}
      
      try {
        let deletedCount = 0;
        let fetchedMessages;
        
        do {
          fetchedMessages = await message.channel.messages.fetch({ limit: 100 });
          if (fetchedMessages.size === 0) break;
          
          const deletableMessages = fetchedMessages.filter(msg => msg.author.id === client.user.id);
          if (deletableMessages.size === 0) break;
          
          for (const [id, msg] of deletableMessages) {
            try {
              await msg.delete();
              deletedCount++;
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (err) {}
          }
        } while (fetchedMessages.size >= 100);
        
        const confirmMsg = await message.channel.send(`✅ **${deletedCount} mensagens** limpas!`);
        setTimeout(async () => {
          try {
            await confirmMsg.delete();
          } catch (e) {}
        }, 3000);
        
        logInfo(`${message.author.tag} limpou ${deletedCount} mensagens na DM`);
        
      } catch (error) {
        logError(`Erro ao limpar DM: ${error.message}`);
      }
      return;
    }
    
    // RESPOSTA AUTOMÁTICA
    try {
      const reply = await message.reply({
        content: `❌ **Não é possível enviar esta mensagem.**\nCaso tenha algo para falar, entre em contato com <@${CONFIG.OWNER_ID}> `
      });
      
      setTimeout(async () => {
        try {
          await reply.delete();
        } catch (e) {}
      }, 10000);
      
      logInfo(`Mensagem automática enviada para ${message.author.tag} na DM`);
    } catch (error) {
      logError(`Erro ao responder DM: ${error.message}`);
    }
    return;
  }

  // ===== MODERAÇÃO EM CANAIS DE SERVIDOR =====
  const isMonitoringActive = serverMonitoring.get(message.guild.id) !== false;
  
  if (!isMonitoringActive) return;
  if (isStaff(message.author.id)) return;
  if (isAdmin(message.member)) return;

  if (containsOffensiveWord(message.content)) {
    const foundWord = findOffensiveWord(message.content);
    
    try {
      const permissions = message.channel.permissionsFor(client.user);
      if (!permissions.has(PermissionFlagsBits.ManageMessages)) {
        logWarn(`Bot não tem permissão para deletar mensagens em #${message.channel.name}`);
        return;
      }

      if (!message.deletable) {
        logWarn(`Mensagem muito antiga para ser deletada em #${message.channel.name}`);
        return;
      }

      await message.delete();
      stats.messagesDeleted++;

      const warningMsg = await message.channel.send({
        embeds: [new EmbedBuilder()
          .setTitle('🚫 Mensagem Removida')
          .setDescription(`Sua mensagem foi removida por conter palavras ofensivas.`)
          .setColor(Colors.Red)
          .addFields(
            { name: '👤 Usuário', value: message.author.toString(), inline: false },
            { name: '🗓 Data', value: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }), inline: false },
            { name: '🚫 Palavra', value: `**${foundWord || "desconhecida"}**`, inline: false }
          )
          .setFooter({ text: 'Caso isso tenha sido um erro, contate a staff.' })
          .setTimestamp()
        ]
      });

      setTimeout(async () => {
        try {
          await warningMsg.delete();
        } catch (e) {}
      }, 10000);

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
  console.log(chalk.white(`   • Warn System: v${warnSystem?.version || '2.0.0'}`));
    
  for (const guild of client.guilds.cache.values()) {
    serverMonitoring.set(guild.id, true);
  }
  
  // Registrar comandos
  if (client.guilds.cache.size > 0) {
    try {
      const commandsToRegister = allCommands.map(cmd => cmd.data);
      console.log(chalk.yellow(`\n📝 Registrando ${commandsToRegister.length} comandos em ${client.guilds.cache.size} servidores...`));
      
      for (const guild of client.guilds.cache.values()) {
        await guild.commands.set(commandsToRegister);
        console.log(chalk.green(`✅ Comandos registrados em: ${guild.name}`));
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      logInfo('Comandos registrados nos servidores com sucesso!');
    } catch (error) {
      logError(`Erro ao registrar comandos: ${error.message}`);
    }
  }

  console.log(chalk.green('\n  ✅ Tudo pronto! Bot conectado com sucesso.\n'));
  console.log(chalk.yellow('  📝 COMANDOS NA DM:'));
  console.log(chalk.yellow('  • !clear - Limpa mensagens da DM'));
  console.log(chalk.yellow('  • !clearAll - Limpa TODAS as DMs (requer senha)'));
  console.log(chalk.yellow('  • !MonitorOn - Ativar monitoramento (requer senha)'));
  console.log(chalk.yellow('  • !MonitorOff - Desativar monitoramento (requer senha)'));
  console.log(chalk.yellow('  • Hello - Painel do Dono (apenas para o dono)\n'));
  
  console.log(chalk.magenta('  📋 COMANDOS DE WARNS:'));
  console.log(chalk.magenta('  • /warn add @user motivo [dias] - Adicionar warn'));
  console.log(chalk.magenta('  • /warn remove @user warnid motivo - Remover warn específico'));
  console.log(chalk.magenta('  • /warn clear @user motivo - Limpar todos os warns'));
  console.log(chalk.magenta('  • /warn check @user - Ver warns de um usuário'));
  console.log(chalk.magenta('  • /warn stats [@user] - Estatísticas de warns'));
  console.log(chalk.magenta('  • /warnings - Ver warns (atalho)'));
  console.log(chalk.magenta('  • /clearwarns - Limpar warns (atalho)'));
  console.log(chalk.magenta('  • /warnstats - Estatísticas (atalho)'));
  console.log(chalk.magenta('  • /mywarns - Ver seus próprios warns'));
  console.log(chalk.magenta('  • /private (pessoa ou cargo) - Enviar mensagem\n'));
  
  console.log(chalk.cyan('\n📋 CARGOS DE WARN CARREGADOS:'));
  for (let i = 1; i <= 7; i++) {
    console.log(chalk.white(`   • Nível ${i}: ${WARN_ROLES[i]}`));
  }
  
  // Executar monitoramento inicial de cargos
  setTimeout(() => {
    monitorWarnRoles();
  }, 5000);
  
  scheduleDailyReport();
  initReadline();
  showMenu();
});

// ===============================
// EVENTO: INTERAÇÃO
// ===============================
client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const cmdName = interaction.commandName;
      stats.commandsUsed[cmdName] = (stats.commandsUsed[cmdName] || 0) + 1;
      
      // Executar comando correspondente
      if (interaction.commandName === 'ping') await pingCommand.execute(interaction);
      else if (interaction.commandName === 'help') await helpCommand.execute(interaction);
      else if (interaction.commandName === 'private') await privateCommand.execute(interaction);
      else if (interaction.commandName === 'report') await reportCommand.execute(interaction);
      else if (interaction.commandName === 'warn') await warnCommand.execute(interaction);
      else if (interaction.commandName === 'warnings') await warningsCommand.execute(interaction);
      else if (interaction.commandName === 'clearwarns') await clearwarnsCommand.execute(interaction);
      else if (interaction.commandName === 'warnstats') await warnstatsCommand.execute(interaction);
      else if (interaction.commandName === 'mywarns') await mywarnsCommand.execute(interaction);
      else if (interaction.commandName === 'adm') await admCommand.execute(interaction);
      return;
    }

    if (interaction.isButton()) {
      // Botões do painel do dono
      if (interaction.customId === 'owner_turnoff' || interaction.customId === 'owner_moderation' || 
          interaction.customId === 'owner_warnstats' || interaction.customId === 'owner_monitor_roles') {
        await handleOwnerPanelButtons(interaction);
        return;
      }
      
      // Botões de monitoramento de servidor
      if (interaction.customId.startsWith('monitor_guild_')) {
        await handleGuildMonitorButton(interaction);
        return;
      }
      
      // Botões de ação em massa
      if (interaction.customId === 'owner_monitor_all_on' || interaction.customId === 'owner_monitor_all_off') {
        await handleOwnerBulkAction(interaction);
        return;
      }
      
      // Botões do painel administrativo
      if (interaction.customId === 'stats' || interaction.customId === 'console' || interaction.customId === 'help') {
        await handleButtonInteraction(interaction);
        return;
      }
      
      // Botões de monitoramento padrão
      if (interaction.customId.startsWith('monitor_')) {
        await handleMonitorButtons(interaction);
        return;
      }
      
      await interaction.reply({ content: '❌ Botão desconhecido!', flags: 64 });
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (e) {}
      }, 5000);
    }
    
    if (interaction.isStringSelectMenu()) {
      // Menu do painel do dono
      if (interaction.customId === 'owner_monitor_select') {
        await handleOwnerServerSelection(interaction);
        return;
      }
      
      // Menu de seleção padrão
      if (interaction.customId.startsWith('select_server_')) {
        await handleServerSelection(interaction);
        return;
      }
    }
  } catch (error) {
    logError(`Erro no interactionCreate: ${error.message}`);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Erro ao processar interação.', flags: 64 }).catch(() => {});
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (e) {}
      }, 5000);
    }
  }
});

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
  console.log(chalk.cyan('║  3.  Ver membros de um servidor                                 ║'));
  console.log(chalk.cyan('║  4.  Enviar mensagem para canal                                 ║'));
  console.log(chalk.cyan('║  5.  Ver status do monitoramento                                ║'));
  console.log(chalk.cyan('║  6.  Ver logs recentes                                          ║'));
  console.log(chalk.cyan('║  7.  Ver status do bot                                          ║'));
  console.log(chalk.cyan('║  8.  Gerar relatório manual                                     ║'));
  console.log(chalk.cyan('║  9.  Ver estatísticas de warns                                  ║'));
  console.log(chalk.cyan('║  10. Monitorar cargos de warn (console)                         ║'));
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
    case '10':
      monitorWarnRoles().then(() => showMenu());
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
  console.log(chalk.white(`⚠️ Warns dados: ${stats.warnsGiven}`));
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
        logError(`Erro ao buscar membros: ${error.message}`);
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
              logError(`Erro ao enviar mensagem: ${error.message}`);
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
  console.log(chalk.white(`⚠️ Warn System: v${warnSystem?.version || '2.0.0'}`));
  console.log(chalk.yellow('══════════════════════════════\n'));
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
    const globalStats = getGlobalStats();
    
    console.log(chalk.white(`🌐 Servidores com warns: ${globalStats.totalServers}`));
    console.log(chalk.white(`👥 Usuários warnados: ${globalStats.totalUsers}`));
    console.log(chalk.white(`⚠️ Total de warns: ${globalStats.totalWarns}`));
    console.log(chalk.white(`🟢 Warns ativos: ${globalStats.totalActiveWarns}`));
    console.log(chalk.white(`📊 Média por usuário: ${globalStats.averageWarnsPerUser}`));
    console.log(chalk.white(`📊 Versão do sistema: v${warnSystem?.version || '2.0.0'}`));
    
  } catch (error) {
    console.log(chalk.red(`❌ Erro ao carregar estatísticas: ${error.message}`));
  }
  
  console.log(chalk.yellow('═══════════════════════════════\n'));
  showMenu();
}

// ===============================
// EVENTOS DE LOG
// ===============================
client.on('messageDelete', async (message) => {
  if (!message.guild || !message.author) return;

  let deleter = 'Desconhecido';
  try {
    const auditLogs = await message.guild.fetchAuditLogs({ type: 72, limit: 1 });
    const entry = auditLogs.entries.first();
    if (entry && entry.target.id === message.author.id && entry.createdTimestamp > Date.now() - 5000) {
      deleter = entry.executor.tag;
    }
  } catch (e) {}

  console.log(chalk.red.bgBlack.bold('\n 🗑️ MENSAGEM DELETADA '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Autor:     ${message.author.tag}`));
  console.log(chalk.red(`   Conteúdo: ${message.content || '[sem texto]'}`));
  console.log(chalk.red(`   Deletado:  ${deleter}`));
  console.log(chalk.red(`   Canal:     #${message.channel.name}`));
  console.log(chalk.red(`   Servidor:  ${message.guild.name}`));
  console.log(chalk.red('────────────────────────────────\n'));
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (!oldMessage.guild || !oldMessage.author) return;
  if (oldMessage.content === newMessage.content) return;

  console.log(chalk.yellow.bgBlack.bold('\n 📝 MENSAGEM ATUALIZADA '));
  console.log(chalk.yellow('────────────────────────────────'));
  console.log(chalk.yellow(`   Autor:     ${oldMessage.author.tag}`));
  console.log(chalk.yellow(`   Antigo:    ${oldMessage.content}`));
  console.log(chalk.yellow(`   Novo:      ${newMessage.content}`));
  console.log(chalk.yellow(`   Canal:     #${oldMessage.channel.name}`));
  console.log(chalk.yellow('────────────────────────────────\n'));
});

client.on('guildMemberAdd', async (member) => {
  stats.membersJoined++;
  
  console.log(chalk.green.bgBlack.bold('\n 👤 NOVO MEMBRO '));
  console.log(chalk.green('────────────────────────────────'));
  console.log(chalk.green(`   Usuário: ${member.user.tag}`));
  console.log(chalk.green(`   ID:      ${member.user.id}`));
  console.log(chalk.green(`   Servidor: ${member.guild.name}`));
  console.log(chalk.green(`   Data:    ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`));
  console.log(chalk.green('────────────────────────────────\n'));
  logInfo(`Novo membro: ${member.user.tag} (${member.guild.name})`);
});

client.on('guildMemberRemove', async (member) => {
  stats.membersLeft++;
  
  console.log(chalk.red.bgBlack.bold('\n ❌ MEMBRO SAIU '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Usuário: ${member.user.tag}`));
  console.log(chalk.red(`   Servidor: ${member.guild.name}`));
  console.log(chalk.red(`   Data:    ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`));
  console.log(chalk.red('────────────────────────────────\n'));
  logInfo(`Membro saiu: ${member.user.tag} (${member.guild.name})`);
});

// ===============================
// ERROS NÃO TRATADOS
// ===============================
process.on('unhandledRejection', (error) => {
  logError(`Erro não tratado: ${error.message}`);
  console.error(error);
});

process.on('uncaughtException', (error) => {
  logError(`Exceção não tratada: ${error.message}`);
  console.error(error);
  process.exit(1);
});

// ===============================
// LOGIN DO BOT
// ===============================
client.login(process.env.TOKEN);
