// ============================================
// SISTEMA DE WARN COMPLETO - VERSÃO ULTIMATE
// ============================================

const fs = require('fs');
const path = require('path');
const { 
  EmbedBuilder, 
  Colors, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

// ============================================
// CONFIGURAÇÕES DO SISTEMA
// ============================================

const CONFIG = {
  // Caminhos dos arquivos
  dataPath: path.join(__dirname, '..', 'data', 'warns.json'),
  logsPath: path.join(__dirname, '..', 'logs', 'warns.log'),
  
  // Configurações de warns
  maxWarnsBeforeKick: 5,
  maxWarnsBeforeBan: 7,
  warnExpirationDays: 30, // Warns expiram após 30 dias (0 = nunca expiram)
  
  // Cargos automáticos por quantidade de warns
  autoRoles: {
    1: 'ID_DO_CARGO_1_WARN',     // Substitua pelo ID real
    2: 'ID_DO_CARGO_2_WARNS',    // Substitua pelo ID real
    3: 'ID_DO_CARGO_3_WARNS',    // Substitua pelo ID real
    4: 'ID_DO_CARGO_4_WARNS',    // Substitua pelo ID real
  },
  
  // Canais de log (opcional - pode ser configurado por servidor)
  defaultLogChannel: null,
  
  // Cores dos embeds
  colors: {
    warn: Colors.Orange,
    success: Colors.Green,
    error: Colors.Red,
    info: Colors.Blue,
    kick: Colors.Red,
    ban: Colors.DarkRed,
    appeal: Colors.Purple
  },
  
  // Emojis
  emojis: {
    warn: '⚠️',
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    kick: '👢',
    ban: '🔨',
    appeal: '📝',
    clock: '⏰',
    user: '👤',
    mod: '🛡️',
    reason: '📋',
    history: '📜',
    clear: '🧹',
    list: '📋',
    search: '🔍',
    settings: '⚙️',
    stats: '📊',
    warning: '🚨'
  }
};

// ============================================
// ESTRUTURA DE DADOS
// ============================================

let warns = new Map(); // guildId -> userId -> warnData
let guildSettings = new Map(); // guildId -> settings
let appealRequests = new Map(); // guildId -> userId -> appealData

// ============================================
// FUNÇÕES DE LOG
// ============================================

function writeLog(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type}] ${message}\n`;
  
  // Log no console com cores
  const colors = {
    INFO: '\x1b[36m',    // Ciano
    WARN: '\x1b[33m',    // Amarelo
    ERROR: '\x1b[31m',   // Vermelho
    SUCCESS: '\x1b[32m', // Verde
    MOD: '\x1b[35m'      // Magenta
  };
  
  const color = colors[type] || '\x1b[37m'; // Branco padrão
  console.log(`${color}[${timestamp}] [${type}] ${message}\x1b[0m`);
  
  // Salvar em arquivo
  try {
    const logsDir = path.dirname(CONFIG.logsPath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    fs.appendFileSync(CONFIG.logsPath, logMessage);
  } catch (err) {
    console.error('Erro ao escrever log:', err);
  }
}

// ============================================
// FUNÇÕES DE PERSISTÊNCIA
// ============================================

function loadData() {
  try {
    // Garantir que a pasta data existe
    const dataDir = path.dirname(CONFIG.dataPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      writeLog('Pasta data criada', 'INFO');
    }
    
    // Carregar warns
    if (fs.existsSync(CONFIG.dataPath)) {
      const raw = fs.readFileSync(CONFIG.dataPath, 'utf8');
      const parsed = JSON.parse(raw);
      
      // Converter objeto plano para Map
      warns = new Map();
      for (const [guildId, users] of Object.entries(parsed.warns || {})) {
        const userMap = new Map();
        for (const [userId, userData] of Object.entries(users)) {
          userMap.set(userId, userData);
        }
        warns.set(guildId, userMap);
      }
      
      // Carregar configurações dos servidores
      guildSettings = new Map(Object.entries(parsed.settings || {}));
      
      writeLog(`✅ Dados carregados: ${warns.size} servidores, ${Array.from(warns.values()).reduce((acc, map) => acc + map.size, 0)} warns totais`, 'SUCCESS');
    } else {
      writeLog('ℹ️ Nenhum arquivo de dados encontrado, iniciando novo', 'INFO');
    }
  } catch (err) {
    writeLog(`❌ Erro ao carregar dados: ${err.message}`, 'ERROR');
  }
}

function saveData() {
  try {
    const dataDir = path.dirname(CONFIG.dataPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Converter Maps para objetos
    const warnsObj = {};
    for (const [guildId, userMap] of warns) {
      warnsObj[guildId] = Object.fromEntries(userMap);
    }
    
    const settingsObj = Object.fromEntries(guildSettings);
    
    const data = {
      warns: warnsObj,
      settings: settingsObj,
      lastUpdate: new Date().toISOString()
    };
    
    fs.writeFileSync(CONFIG.dataPath, JSON.stringify(data, null, 2), 'utf8');
    writeLog('💾 Dados salvos com sucesso', 'SUCCESS');
  } catch (err) {
    writeLog(`❌ Erro ao salvar dados: ${err.message}`, 'ERROR');
  }
}

// ============================================
// FUNÇÕES DE UTILIDADE
// ============================================

function formatDate(date) {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });
}

function calculateWarnLevel(warnCount) {
  if (warnCount >= CONFIG.maxWarnsBeforeBan) return 'CRÍTICO';
  if (warnCount >= CONFIG.maxWarnsBeforeKick) return 'ALTO';
  if (warnCount >= 3) return 'MÉDIO';
  if (warnCount >= 1) return 'BAIXO';
  return 'NENHUM';
}

function getWarnColor(warnCount) {
  if (warnCount >= CONFIG.maxWarnsBeforeBan) return Colors.DarkRed;
  if (warnCount >= CONFIG.maxWarnsBeforeKick) return Colors.Red;
  if (warnCount >= 3) return Colors.Orange;
  if (warnCount >= 1) return Colors.Yellow;
  return Colors.Green;
}

// ============================================
// FUNÇÕES PRINCIPAIS DE WARNS
// ============================================

function addWarn(guildId, userId, reason, moderatorId, options = {}) {
  try {
    const { 
      silent = false,
      duration = null, // null = permanente, ou número em dias
      evidence = null,
      channelId = null,
      messageId = null
    } = options;
    
    // Inicializar estruturas se necessário
    if (!warns.has(guildId)) {
      warns.set(guildId, new Map());
    }
    
    const guildWarns = warns.get(guildId);
    const userWarns = guildWarns.get(userId) || {
      count: 0,
      activeCount: 0,
      history: [],
      lastWarn: null,
      firstWarn: null,
      totalDuration: 0,
      appeals: []
    };
    
    // Criar novo warn
    const warnId = generateWarnId();
    const now = new Date();
    const expirationDate = duration ? new Date(now.getTime() + duration * 24 * 60 * 60 * 1000) : null;
    
    const newWarn = {
      id: warnId,
      reason,
      moderatorId,
      timestamp: now.toISOString(),
      expiresAt: expirationDate?.toISOString() || null,
      active: true,
      evidence,
      channelId,
      messageId,
      appealed: false,
      appealReason: null,
      appealDate: null,
      appealResult: null,
      notes: []
    };
    
    // Adicionar ao histórico
    userWarns.history.push(newWarn);
    userWarns.count += 1;
    userWarns.activeCount += 1;
    userWarns.lastWarn = now.toISOString();
    if (!userWarns.firstWarn) {
      userWarns.firstWarn = now.toISOString();
    }
    
    guildWarns.set(userId, userWarns);
    
    // Salvar dados
    saveData();
    
    // Log da ação
    writeLog(`➕ Warn #${warnId} adicionado para ${userId} em ${guildId} por ${moderatorId}: ${reason}`, 'MOD');
    
    return {
      success: true,
      warnId,
      warnCount: userWarns.activeCount,
      totalCount: userWarns.count,
      warn: newWarn
    };
    
  } catch (err) {
    writeLog(`❌ Erro ao adicionar warn: ${err.message}`, 'ERROR');
    return { success: false, error: err.message };
  }
}

function removeWarn(guildId, userId, warnId, moderatorId, reason = 'Removido por moderador') {
  try {
    if (!warns.has(guildId)) return { success: false, error: 'Servidor não encontrado' };
    
    const guildWarns = warns.get(guildId);
    if (!guildWarns.has(userId)) return { success: false, error: 'Usuário não encontrado' };
    
    const userWarns = guildWarns.get(userId);
    const warnIndex = userWarns.history.findIndex(w => w.id === warnId);
    
    if (warnIndex === -1) return { success: false, error: 'Warn não encontrado' };
    
    const warn = userWarns.history[warnIndex];
    
    if (!warn.active) {
      return { success: false, error: 'Este warn já está inativo' };
    }
    
    // Marcar como inativo
    warn.active = false;
    warn.removedBy = moderatorId;
    warn.removedAt = new Date().toISOString();
    warn.removalReason = reason;
    
    // Adicionar nota
    if (!warn.notes) warn.notes = [];
    warn.notes.push({
      type: 'removal',
      moderatorId,
      reason,
      timestamp: new Date().toISOString()
    });
    
    // Atualizar contagem ativa
    userWarns.activeCount = Math.max(0, userWarns.activeCount - 1);
    
    guildWarns.set(userId, userWarns);
    saveData();
    
    writeLog(`➖ Warn #${warnId} removido de ${userId} por ${moderatorId}: ${reason}`, 'MOD');
    
    return {
      success: true,
      warnCount: userWarns.activeCount,
      warn
    };
    
  } catch (err) {
    writeLog(`❌ Erro ao remover warn: ${err.message}`, 'ERROR');
    return { success: false, error: err.message };
  }
}

function clearUserWarns(guildId, userId, moderatorId, reason = 'Todos os warns limpos') {
  try {
    if (!warns.has(guildId)) return { success: false, error: 'Servidor não encontrado' };
    
    const guildWarns = warns.get(guildId);
    if (!guildWarns.has(userId)) return { success: false, error: 'Usuário não encontrado' };
    
    const userWarns = guildWarns.get(userId);
    const clearedCount = userWarns.activeCount;
    
    // Marcar todos os warns ativos como inativos
    userWarns.history.forEach(warn => {
      if (warn.active) {
        warn.active = false;
        warn.removedBy = moderatorId;
        warn.removedAt = new Date().toISOString();
        warn.removalReason = reason;
        
        if (!warn.notes) warn.notes = [];
        warn.notes.push({
          type: 'bulk_removal',
          moderatorId,
          reason,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    userWarns.activeCount = 0;
    
    guildWarns.set(userId, userWarns);
    saveData();
    
    writeLog(`🧹 Todos os warns (${clearedCount}) de ${userId} foram limpos por ${moderatorId}`, 'MOD');
    
    return {
      success: true,
      clearedCount
    };
    
  } catch (err) {
    writeLog(`❌ Erro ao limpar warns: ${err.message}`, 'ERROR');
    return { success: false, error: err.message };
  }
}

function getUserWarns(guildId, userId) {
  return warns.get(guildId)?.get(userId) || null;
}

function getUserActiveWarns(guildId, userId) {
  const userWarns = getUserWarns(guildId, userId);
  if (!userWarns) return [];
  
  return userWarns.history.filter(w => w.active);
}

function getServerWarns(guildId, options = {}) {
  const {
    activeOnly = false,
    userId = null,
    limit = 100,
    sortBy = 'timestamp',
    order = 'desc'
  } = options;
  
  if (!warns.has(guildId)) return [];
  
  const guildWarns = warns.get(guildId);
  const results = [];
  
  for (const [uid, userData] of guildWarns) {
    if (userId && uid !== userId) continue;
    
    const warnsToAdd = activeOnly ? userData.history.filter(w => w.active) : userData.history;
    
    warnsToAdd.forEach(warn => {
      results.push({
        userId: uid,
        username: null, // Será preenchido depois com dados do Discord
        ...warn,
        currentCount: userData.activeCount,
        totalCount: userData.count
      });
    });
  }
  
  // Ordenar
  results.sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    
    if (order === 'desc') {
      return aVal > bVal ? -1 : 1;
    } else {
      return aVal < bVal ? -1 : 1;
    }
  });
  
  return results.slice(0, limit);
}

function getServerStats(guildId) {
  if (!warns.has(guildId)) {
    return {
      totalWarns: 0,
      activeWarns: 0,
      warnedUsers: 0,
      averageWarnsPerUser: 0,
      topModerators: {},
      warnsByReason: {},
      warnsByDay: {}
    };
  }
  
  const guildWarns = warns.get(guildId);
  let totalWarns = 0;
  let activeWarns = 0;
  let warnedUsers = 0;
  const moderators = {};
  const reasons = {};
  const days = {};
  
  for (const [userId, userData] of guildWarns) {
    if (userData.history.length > 0) {
      warnedUsers++;
      totalWarns += userData.history.length;
      activeWarns += userData.activeCount;
      
      userData.history.forEach(warn => {
        // Contar por moderador
        moderators[warn.moderatorId] = (moderators[warn.moderatorId] || 0) + 1;
        
        // Contar por motivo
        reasons[warn.reason] = (reasons[warn.reason] || 0) + 1;
        
        // Contar por dia
        const day = new Date(warn.timestamp).toISOString().split('T')[0];
        days[day] = (days[day] || 0) + 1;
      });
    }
  }
  
  return {
    totalWarns,
    activeWarns,
    warnedUsers,
    averageWarnsPerUser: warnedUsers > 0 ? (totalWarns / warnedUsers).toFixed(2) : 0,
    topModerators: Object.entries(moderators)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ id, count })),
    warnsByReason: Object.entries(reasons)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([reason, count]) => ({ reason, count })),
    warnsByDay: Object.entries(days)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, count]) => ({ day, count }))
  };
}

function checkExpiredWarns() {
  if (CONFIG.warnExpirationDays <= 0) return;
  
  const now = new Date();
  const expirationMs = CONFIG.warnExpirationDays * 24 * 60 * 60 * 1000;
  let expiredCount = 0;
  
  for (const [guildId, guildWarns] of warns) {
    for (const [userId, userData] of guildWarns) {
      let changed = false;
      
      userData.history.forEach(warn => {
        if (warn.active && warn.expiresAt) {
          const expiryDate = new Date(warn.expiresAt);
          if (expiryDate <= now) {
            warn.active = false;
            warn.expired = true;
            userData.activeCount = Math.max(0, userData.activeCount - 1);
            changed = true;
            expiredCount++;
            
            writeLog(`⏰ Warn #${warn.id} expirou automaticamente para ${userId}`, 'INFO');
          }
        }
      });
      
      if (changed) {
        guildWarns.set(userId, userData);
      }
    }
  }
  
  if (expiredCount > 0) {
    saveData();
    writeLog(`⏰ ${expiredCount} warns expirados automaticamente`, 'INFO');
  }
}

// ============================================
// FUNÇÕES DE PUNIÇÃO AUTOMÁTICA
// ============================================

async function applyAutomaticPunishments(guild, member, warnCount, client) {
  try {
    const punishments = [];
    const actions = [];
    
    // Verificar se atingiu limite para ban
    if (warnCount >= CONFIG.maxWarnsBeforeBan) {
      if (member.bannable) {
        await member.ban({ 
          reason: `Banimento automático: ${warnCount} warns (limite: ${CONFIG.maxWarnsBeforeBan})` 
        });
        actions.push({
          type: 'ban',
          success: true,
          reason: `Limite de ${CONFIG.maxWarnsBeforeBan} warns atingido`
        });
        punishments.push('ban');
      } else {
        actions.push({
          type: 'ban',
          success: false,
          reason: 'Bot não tem permissão para banir'
        });
      }
    }
    // Verificar se atingiu limite para kick
    else if (warnCount >= CONFIG.maxWarnsBeforeKick) {
      if (member.kickable) {
        await member.kick(`Kick automático: ${warnCount} warns (limite: ${CONFIG.maxWarnsBeforeKick})`);
        actions.push({
          type: 'kick',
          success: true,
          reason: `Limite de ${CONFIG.maxWarnsBeforeKick} warns atingido`
        });
        punishments.push('kick');
      } else {
        actions.push({
          type: 'kick',
          success: false,
          reason: 'Bot não tem permissão para kickar'
        });
      }
    }
    
    // Aplicar cargos automáticos
    for (const [threshold, roleId] of Object.entries(CONFIG.autoRoles)) {
      if (warnCount >= parseInt(threshold)) {
        if (member.manageable) {
          await member.roles.add(roleId).catch(() => {});
          actions.push({
            type: 'role_add',
            roleId,
            success: true,
            reason: `Cargo automático por ${warnCount} warns`
          });
        } else {
          actions.push({
            type: 'role_add',
            roleId,
            success: false,
            reason: 'Bot não pode gerenciar cargos'
          });
        }
        break; // Apenas o maior cargo
      }
    }
    
    return {
      applied: punishments.length > 0,
      punishments,
      actions
    };
    
  } catch (err) {
    writeLog(`❌ Erro ao aplicar punições automáticas: ${err.message}`, 'ERROR');
    return {
      applied: false,
      error: err.message
    };
  }
}

// ============================================
// FUNÇÕES DE APPEAL (RECURSO)
// ============================================

function createAppeal(guildId, userId, warnId, appealReason) {
  try {
    if (!warns.has(guildId)) return { success: false, error: 'Servidor não encontrado' };
    
    const guildWarns = warns.get(guildId);
    if (!guildWarns.has(userId)) return { success: false, error: 'Usuário não encontrado' };
    
    const userWarns = guildWarns.get(userId);
    const warn = userWarns.history.find(w => w.id === warnId);
    
    if (!warn) return { success: false, error: 'Warn não encontrado' };
    
    if (warn.appealed) {
      return { success: false, error: 'Este warn já possui um recurso' };
    }
    
    const appealId = generateAppealId();
    const now = new Date();
    
    warn.appealed = true;
    warn.appealReason = appealReason;
    warn.appealDate = now.toISOString();
    warn.appealId = appealId;
    warn.appealStatus = 'pending';
    
    // Adicionar nota
    if (!warn.notes) warn.notes = [];
    warn.notes.push({
      type: 'appeal',
      appealId,
      reason: appealReason,
      timestamp: now.toISOString()
    });
    
    guildWarns.set(userId, userWarns);
    saveData();
    
    writeLog(`📝 Recurso #${appealId} criado para warn #${warnId} por ${userId}`, 'INFO');
    
    return {
      success: true,
      appealId,
      warn
    };
    
  } catch (err) {
    writeLog(`❌ Erro ao criar recurso: ${err.message}`, 'ERROR');
    return { success: false, error: err.message };
  }
}

function reviewAppeal(guildId, appealId, moderatorId, approved, reviewReason) {
  try {
    if (!warns.has(guildId)) return { success: false, error: 'Servidor não encontrado' };
    
    const guildWarns = warns.get(guildId);
    
    for (const [userId, userWarns] of guildWarns) {
      for (const warn of userWarns.history) {
        if (warn.appealId === appealId) {
          warn.appealStatus = approved ? 'approved' : 'rejected';
          warn.appealReviewedBy = moderatorId;
          warn.appealReviewedAt = new Date().toISOString();
          warn.appealReviewReason = reviewReason;
          
          if (approved) {
            // Se aprovado, remover o warn
            warn.active = false;
            userWarns.activeCount = Math.max(0, userWarns.activeCount - 1);
          }
          
          // Adicionar nota
          if (!warn.notes) warn.notes = [];
          warn.notes.push({
            type: 'appeal_review',
            moderatorId,
            approved,
            reason: reviewReason,
            timestamp: new Date().toISOString()
          });
          
          guildWarns.set(userId, userWarns);
          saveData();
          
          writeLog(`📝 Recurso #${appealId} ${approved ? 'APROVADO' : 'REJEITADO'} por ${moderatorId}`, 'MOD');
          
          return {
            success: true,
            approved,
            userId,
            warnId: warn.id
          };
        }
      }
    }
    
    return { success: false, error: 'Recurso não encontrado' };
    
  } catch (err) {
    writeLog(`❌ Erro ao revisar recurso: ${err.message}`, 'ERROR');
    return { success: false, error: err.message };
  }
}

// ============================================
// FUNÇÕES DE CONFIGURAÇÃO DO SERVIDOR
// ============================================

function getGuildSettings(guildId) {
  if (!guildSettings.has(guildId)) {
    // Configurações padrão
    const defaultSettings = {
      logChannel: null,
      warnChannel: null,
      appealChannel: null,
      autoPunish: true,
      autoRoles: {},
      warnExpirationDays: CONFIG.warnExpirationDays,
      maxWarnsBeforeKick: CONFIG.maxWarnsBeforeKick,
      maxWarnsBeforeBan: CONFIG.maxWarnsBeforeBan,
      dmUserOnWarn: true,
      dmUserOnPunishment: true,
      notifyStaff: true,
      staffRoles: [],
      ignoredRoles: [],
      ignoredChannels: [],
      appealEnabled: true,
      appealCooldown: 7, // dias
      createdAt: new Date().toISOString()
    };
    
    guildSettings.set(guildId, defaultSettings);
    saveData();
    return defaultSettings;
  }
  
  return guildSettings.get(guildId);
}

function updateGuildSettings(guildId, newSettings) {
  const current = getGuildSettings(guildId);
  const updated = { ...current, ...newSettings, updatedAt: new Date().toISOString() };
  
  guildSettings.set(guildId, updated);
  saveData();
  
  writeLog(`⚙️ Configurações do servidor ${guildId} atualizadas`, 'INFO');
  
  return updated;
}

// ============================================
// FUNÇÕES DE ESTATÍSTICAS AVANÇADAS
// ============================================

function getGlobalStats() {
  let totalServers = 0;
  let totalUsers = 0;
  let totalWarns = 0;
  let totalActiveWarns = 0;
  let totalExpiredWarns = 0;
  let totalAppeals = 0;
  let totalAppealsApproved = 0;
  
  for (const [guildId, guildWarns] of warns) {
    totalServers++;
    
    for (const [userId, userData] of guildWarns) {
      totalUsers++;
      totalWarns += userData.history.length;
      totalActiveWarns += userData.activeCount;
      
      userData.history.forEach(warn => {
        if (warn.expired) totalExpiredWarns++;
        if (warn.appealed) {
          totalAppeals++;
          if (warn.appealStatus === 'approved') totalAppealsApproved++;
        }
      });
    }
  }
  
  return {
    totalServers,
    totalUsers,
    totalWarns,
    totalActiveWarns,
    totalExpiredWarns,
    totalAppeals,
    totalAppealsApproved,
    appealApprovalRate: totalAppeals > 0 ? (totalAppealsApproved / totalAppeals * 100).toFixed(2) : 0,
    averageWarnsPerUser: totalUsers > 0 ? (totalWarns / totalUsers).toFixed(2) : 0,
    lastUpdate: new Date().toISOString()
  };
}

// ============================================
// FUNÇÕES DE CRIAÇÃO DE EMBEDS
// ============================================

function createWarnEmbed(user, moderator, warnData, guild) {
  const embed = new EmbedBuilder()
    .setTitle(`${CONFIG.emojis.warn} Warn Adicionado`)
    .setColor(CONFIG.colors.warn)
    .setDescription(`Um novo warn foi registrado para ${user.toString()}`)
    .addFields(
      {
        name: `${CONFIG.emojis.user} Usuário`,
        value: `${user.tag} (${user.id})`,
        inline: true
      },
      {
        name: `${CONFIG.emojis.mod} Moderador`,
        value: `${moderator.tag} (${moderator.id})`,
        inline: true
      },
      {
        name: `${CONFIG.emojis.reason} Motivo`,
        value: warnData.reason,
        inline: false
      },
      {
        name: `${CONFIG.emojis.clock} Data`,
        value: formatDate(warnData.timestamp),
        inline: true
      },
      {
        name: `${CONFIG.emojis.warning} Total de Warns`,
        value: `**${warnData.currentCount}** (${warnData.totalCount} total)`,
        inline: true
      },
      {
        name: `${CONFIG.emojis.info} ID do Warn`,
        value: `\`${warnData.id}\``,
        inline: true
      }
    )
    .setFooter({ 
      text: `Sistema de Warns • ${guild.name}`,
      iconURL: guild.iconURL() 
    })
    .setTimestamp();

  if (warnData.expiresAt) {
    embed.addFields({
      name: `${CONFIG.emojis.clock} Expira em`,
      value: formatDate(warnData.expiresAt),
      inline: true
    });
  }

  return embed;
}

function createUserWarnsEmbed(user, userWarns, guild, page = 1) {
  const itemsPerPage = 5;
  const totalPages = Math.ceil(userWarns.history.length / itemsPerPage);
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageWarns = userWarns.history.slice(start, end);
  
  const level = calculateWarnLevel(userWarns.activeCount);
  const color = getWarnColor(userWarns.activeCount);
  
  const embed = new EmbedBuilder()
    .setTitle(`${CONFIG.emojis.history} Histórico de Warns de ${user.username}`)
    .setColor(color)
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      {
        name: `${CONFIG.emojis.warning} Warns Ativos`,
        value: `**${userWarns.activeCount}**`,
        inline: true
      },
      {
        name: `${CONFIG.emojis.list} Total de Warns`,
        value: `**${userWarns.count}**`,
        inline: true
      },
      {
        name: `${CONFIG.emojis.clock} Primeiro Warn`,
        value: userWarns.firstWarn ? formatDate(userWarns.firstWarn) : 'Nunca',
        inline: true
      },
      {
        name: `${CONFIG.emojis.clock} Último Warn`,
        value: userWarns.lastWarn ? formatDate(userWarns.lastWarn) : 'Nunca',
        inline: true
      },
      {
        name: `${CONFIG.emojis.stats} Nível de Risco`,
        value: `**${level}**`,
        inline: true
      }
    );

  if (pageWarns.length > 0) {
    pageWarns.forEach((warn, index) => {
      const status = warn.active ? '🟢 Ativo' : '🔴 Inativo';
      const appealed = warn.appealed ? `(Recurso: ${warn.appealStatus})` : '';
      
      embed.addFields({
        name: `Warn #${start + index + 1} - ${warn.id} ${appealed}`,
        value: `**Motivo:** ${warn.reason}\n**Moderador:** <@${warn.moderatorId}>\n**Data:** ${formatDate(warn.timestamp)}\n**Status:** ${status}`,
        inline: false
      });
    });
  } else {
    embed.addFields({
      name: '📭 Nenhum warn encontrado',
      value: 'Este usuário não possui warns no histórico.',
      inline: false
    });
  }

  embed.setFooter({ 
    text: `Página ${page}/${totalPages} • ${guild.name}`,
    iconURL: guild.iconURL() 
  });

  return embed;
}

function createServerStatsEmbed(guild, stats) {
  const embed = new EmbedBuilder()
    .setTitle(`${CONFIG.emojis.stats} Estatísticas de Warns - ${guild.name}`)
    .setColor(CONFIG.colors.info)
    .setThumbnail(guild.iconURL())
    .addFields(
      {
        name: '📊 **Visão Geral**',
        value: [
          `**Total de Warns:** ${stats.totalWarns}`,
          `**Warns Ativos:** ${stats.activeWarns}`,
          `**Usuários Warnados:** ${stats.warnedUsers}`,
          `**Média por Usuário:** ${stats.averageWarnsPerUser}`
        ].join('\n'),
        inline: false
      }
    );

  if (stats.topModerators.length > 0) {
    embed.addFields({
      name: '👑 **Top Moderadores**',
      value: stats.topModerators.map((m, i) => `${i + 1}. <@${m.id}>: **${m.count}** warns`).join('\n'),
      inline: true
    });
  }

  if (stats.warnsByReason.length > 0) {
    embed.addFields({
      name: '📋 **Motivos Mais Comuns**',
      value: stats.warnsByReason.map((r, i) => `${i + 1}. **${r.reason}**: ${r.count}x`).join('\n'),
      inline: true
    });
  }

  embed.addFields({
    name: '📅 **Warns por Dia (últimos 7)**',
    value: stats.warnsByDay.slice(-7).map(d => `**${d.day}**: ${d.count}`).join('\n') || 'Nenhum dado',
    inline: false
  });

  return embed;
}

function createAppealEmbed(user, warnData, guild) {
  const embed = new EmbedBuilder()
    .setTitle(`${CONFIG.emojis.appeal} Recurso Enviado`)
    .setColor(CONFIG.colors.appeal)
    .setDescription(`Um recurso foi enviado por ${user.toString()}`)
    .addFields(
      {
        name: '👤 Usuário',
        value: `${user.tag} (${user.id})`,
        inline: true
      },
      {
        name: '🆔 ID do Warn',
        value: `\`${warnData.id}\``,
        inline: true
      },
      {
        name: '📝 Motivo do Warn Original',
        value: warnData.reason,
        inline: false
      },
      {
        name: '📄 Motivo do Recurso',
        value: warnData.appealReason,
        inline: false
      },
      {
        name: '📅 Data do Recurso',
        value: formatDate(warnData.appealDate),
        inline: true
      },
      {
        name: '🆔 ID do Recurso',
        value: `\`${warnData.appealId}\``,
        inline: true
      }
    )
    .setFooter({ 
      text: `Aguardando revisão • ${guild.name}`,
      iconURL: guild.iconURL() 
    })
    .setTimestamp();

  return embed;
}

// ============================================
// FUNÇÕES DE INTERAÇÃO (MODALS, BOTÕES, MENUS)
// ============================================

function createWarnModal(user) {
  const modal = new ModalBuilder()
    .setCustomId(`warn_modal_${user.id}`)
    .setTitle('Adicionar Warn');

  const reasonInput = new TextInputBuilder()
    .setCustomId('reason')
    .setLabel('Motivo do Warn')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Digite o motivo detalhado do warn...')
    .setRequired(true)
    .setMinLength(5)
    .setMaxLength(1000);

  const durationInput = new TextInputBuilder()
    .setCustomId('duration')
    .setLabel('Duração (dias) - 0 para permanente')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ex: 7, 30, 0')
    .setRequired(false)
    .setMaxLength(3);

  const evidenceInput = new TextInputBuilder()
    .setCustomId('evidence')
    .setLabel('Evidências (link ou texto)')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Cole links de evidências aqui...')
    .setRequired(false)
    .setMaxLength(1000);

  const row1 = new ActionRowBuilder().addComponents(reasonInput);
  const row2 = new ActionRowBuilder().addComponents(durationInput);
  const row3 = new ActionRowBuilder().addComponents(evidenceInput);

  modal.addComponents(row1, row2, row3);

  return modal;
}

function createAppealModal(warnId) {
  const modal = new ModalBuilder()
    .setCustomId(`appeal_modal_${warnId}`)
    .setTitle('Enviar Recurso');

  const reasonInput = new TextInputBuilder()
    .setCustomId('appeal_reason')
    .setLabel('Justificativa do Recurso')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Explique por que este warn deve ser removido...')
    .setRequired(true)
    .setMinLength(10)
    .setMaxLength(2000);

  const row = new ActionRowBuilder().addComponents(reasonInput);
  modal.addComponents(row);

  return modal;
}

function createWarnButtons(warnId, userId) {
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`warn_details_${warnId}`)
        .setLabel('Ver Detalhes')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🔍'),
      new ButtonBuilder()
        .setCustomId(`warn_remove_${warnId}_${userId}`)
        .setLabel('Remover Warn')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌'),
      new ButtonBuilder()
        .setCustomId(`warn_appeal_${warnId}_${userId}`)
        .setLabel('Recorrer')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📝')
    );

  return row;
}

function createUserWarnMenu(guildId, userId, userWarns) {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`select_warn_${userId}`)
    .setPlaceholder('Selecione um warn para mais opções')
    .setMinValues(1)
    .setMaxValues(1);

  userWarns.history.forEach((warn, index) => {
    const status = warn.active ? '🟢' : '🔴';
    const date = new Date(warn.timestamp).toLocaleDateString('pt-BR');
    
    selectMenu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(`Warn #${index + 1} - ${warn.reason.substring(0, 50)}`)
        .setDescription(`${status} ${date} • ID: ${warn.id}`)
        .setValue(warn.id)
        .setEmoji(warn.active ? '🟢' : '🔴')
    );
  });

  const row = new ActionRowBuilder().addComponents(selectMenu);
  return row;
}

// ============================================
// FUNÇÕES DE LOGS DETALHADOS
// ============================================

function logWarnAction(action, data) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    ...data
  };
  
  writeLog(JSON.stringify(logEntry), 'WARN_LOG');
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function generateWarnId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function generateAppealId() {
  return 'APL-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

// ============================================
// INICIALIZAÇÃO
// ============================================

// Carregar dados ao iniciar
loadData();

// Verificar warns expirados a cada hora
setInterval(checkExpiredWarns, 60 * 60 * 1000);

// Salvar dados a cada 5 minutos (backup automático)
setInterval(saveData, 5 * 60 * 1000);

// ============================================
// EXPORTAÇÃO DAS FUNÇÕES
// ============================================

module.exports = {
  // Funções principais
  addWarn,
  removeWarn,
  clearUserWarns,
  getUserWarns,
  getUserActiveWarns,
  getServerWarns,
  getServerStats,
  getGlobalStats,
  
  // Funções de recurso
  createAppeal,
  reviewAppeal,
  
  // Funções de configuração
  getGuildSettings,
  updateGuildSettings,
  
  // Funções de punição
  applyAutomaticPunishments,
  
  // Funções de criação de embeds
  createWarnEmbed,
  createUserWarnsEmbed,
  createServerStatsEmbed,
  createAppealEmbed,
  
  // Funções de interação
  createWarnModal,
  createAppealModal,
  createWarnButtons,
  createUserWarnMenu,
  
  // Funções de utilidade
  formatDate,
  calculateWarnLevel,
  getWarnColor,
  
  // Constantes e configurações
  CONFIG,
  
  // Dados (para debug)
  warns,
  guildSettings
};
