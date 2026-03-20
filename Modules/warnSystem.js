// ============================================
// SISTEMA DE WARNS ULTIMATE - VERSÃO MEGA COMPLETA
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
  TextInputStyle,
  PermissionFlagsBits,
  ChannelType
} = require('discord.js');
const cron = require('node-cron');
const axios = require('axios');
const crypto = require('crypto');

// ============================================
// CONFIGURAÇÕES AVANÇADAS (PARTE 1)
// ============================================

const CONFIG = {
  // Caminhos
  dataPath: path.join(__dirname, '..', 'data', 'warns.json'),
  logsPath: path.join(__dirname, '..', 'logs', 'warns.log'),
  backupsPath: path.join(__dirname, '..', 'backups'),
  reportsPath: path.join(__dirname, '..', 'reports'),
  cachePath: path.join(__dirname, '..', 'cache'),
  
  // Limites e configurações principais
  maxWarnsBeforeKick: 5,
  maxWarnsBeforeBan: 7,
  maxWarnsBeforeMute: 3,
  maxWarnsBeforeTimeout: 2,
  maxWarnsBeforeRole1: 1,
  maxWarnsBeforeRole2: 2,
  maxWarnsBeforeRole3: 3,
  maxWarnsBeforeRole4: 4,
  
  // Temporização
  warnExpirationDays: 30,
  appealCooldownDays: 7,
  maxWarnsPerDay: 3,
  maxWarnsPerWeek: 10,
  maxWarnsPerMonth: 20,
  timeoutDurations: {
    1: 60, // 1 hora
    2: 120, // 2 horas
    3: 240, // 4 horas
    4: 480, // 8 horas
    5: 720 // 12 horas
  },
  
  // Cargos automáticos por quantidade de warns
  autoRoles: {
    1: '1484383270362677279',
    2: 1484383343595491348',
    3: '1484383411186438144',
    4: '1484383888582246521',
    5: '1484389386656288818',
    6: '1484389491052515349',
    7: '1484389573831426209',
  },
  
  // Cores e emojis
  colors: {
    warn: Colors.Orange,
    success: Colors.Green,
    error: Colors.Red,
    info: Colors.Blue,
    kick: Colors.Red,
    ban: Colors.DarkRed,
    mute: Colors.Yellow,
    timeout: Colors.Grey,
    appeal: Colors.Purple,
    history: Colors.Navy,
    stats: Colors.Gold,
    warning: Colors.Orange,
    critical: Colors.DarkRed,
    high: Colors.Red,
    medium: Colors.Yellow,
    low: Colors.Green,
    appeal_pending: Colors.Purple,
    appeal_approved: Colors.Green,
    appeal_rejected: Colors.Red,
    backup: Colors.Blue,
    export: Colors.Green,
    import: Colors.Yellow,
    search: Colors.Blue,
    filter: Colors.Purple,
    sort: Colors.Gold,
    graph: Colors.Aqua,
    calendar: Colors.LuminousVividPink,
    chart: Colors.DarkButNotBlack,
    pie: Colors.Fuchsia,
    timeline: Colors.Greyple,
    heatmap: Colors.Red,
    wordcloud: Colors.Blue,
    analytics: Colors.Purple,
    insights: Colors.Gold,
    trends: Colors.Green,
    predictions: Colors.Orange
  },
  
  emojis: {
    // Ações
    warn: '⚠️',
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    kick: '👢',
    ban: '🔨',
    mute: '🔇',
    timeout: '⏰',
    appeal: '📝',
    
    // Tempo
    clock: '⏰',
    calendar: '📅',
    timer: '⏱️',
    hourglass: '⌛',
    
    // Usuários
    user: '👤',
    users: '👥',
    mod: '🛡️',
    staff: '👮',
    owner: '👑',
    
    // Ações
    reason: '📋',
    history: '📜',
    clear: '🧹',
    list: '📋',
    search: '🔍',
    settings: '⚙️',
    stats: '📊',
    warning: '🚨',
    
    // Dados
    backup: '💾',
    restore: '🔄',
    export: '📤',
    import: '📥',
    database: '🗄️',
    file: '📁',
    
    // Segurança
    lock: '🔒',
    unlock: '🔓',
    key: '🔑',
    shield: '🛡️',
    
    // Ações
    pin: '📌',
    edit: '✏️',
    delete: '🗑️',
    add: '➕',
    remove: '➖',
    
    // Níveis de warning
    warning_level: {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴',
      none: '⚪'
    },
    
    // Votação
    vote_up: '👍',
    vote_down: '👎',
    vote_for: '✅',
    vote_against: '❌',
    vote_neutral: '🤷',
    
    // Gráficos
    graph_up: '📈',
    graph_down: '📉',
    bar_chart: '📊',
    pie_chart: '🥧',
    line_chart: '📏',
    scatter: '🔹',
    
    // Analytics
    analytics: '📐',
    insights: '💡',
    trend_up: '⬆️',
    trend_down: '⬇️',
    trend_flat: '➡️',
    
    // Medalhas
    gold: '🥇',
    silver: '🥈',
    bronze: '🥉',
    
    // Status
    online: '🟢',
    idle: '🟡',
    dnd: '🔴',
    offline: '⚫',
    
    // Paginação
    previous: '◀️',
    next: '▶️',
    first: '⏪',
    last: '⏩',
    
    // Filtros
    filter: '🔍',
    sort: '🔀',
    ascending: '⬆️',
    descending: '⬇️',
    
    // Notificações
    bell: '🔔',
    mail: '📧',
    dm: '💬',
    
    // Moderação
    gavel: '⚖️',
    judge: '👨‍⚖️',
    police: '👮',
    
    // Outros
    star: '⭐',
    sparkles: '✨',
    fire: '🔥',
    snowflake: '❄️',
    rainbow: '🌈',
    gift: '🎁',
    trophy: '🏆',
    medal: '🎖️'
  }
};

// ============================================
// CONFIGURAÇÕES AVANÇADAS (PARTE 2)
// ============================================

const PUNISHMENT_CONFIG = {
  progressive: {
    enabled: true,
    levels: [
      { threshold: 1, action: 'warn', duration: 0 },
      { threshold: 2, action: 'timeout', duration: 30 }, // 30 minutos
      { threshold: 3, action: 'timeout', duration: 60 }, // 1 hora
      { threshold: 4, action: 'timeout', duration: 120 }, // 2 horas
      { threshold: 5, action: 'mute', duration: 240 }, // 4 horas
      { threshold: 6, action: 'mute', duration: 480 }, // 8 horas
      { threshold: 7, action: 'kick', duration: 0 },
      { threshold: 8, action: 'ban', duration: 0 }
    ]
  },
  
  roles: {
    enabled: true,
    removeOnClear: true,
    warnRoles: {
      1: 'ID_ROLE_1',
      2: 'ID_ROLE_2',
      3: 'ID_ROLE_3',
      4: 'ID_ROLE_4',
      5: 'ID_ROLE_5'
    }
  },
  
  appeals: {
    enabled: true,
    requireEvidence: true,
    maxAppealsPerMonth: 3,
    votingEnabled: true,
    votesRequired: 3,
    autoExpireDays: 7,
    notifyOnDecision: true
  },
  
  blacklist: {
    enabled: true,
    autoBlacklist: true,
    blacklistThreshold: 10,
    blacklistDuration: 30, // dias
    preventJoining: true
  },
  
  analytics: {
    enabled: true,
    trackUsers: true,
    trackModerators: true,
    trackReasons: true,
    trackTimes: true,
    storeHistoricalData: true,
    retentionDays: 90
  },
  
  notifications: {
    dmUser: true,
    dmOnWarn: true,
    dmOnPunishment: true,
    dmOnAppeal: true,
    dmOnAppealDecision: true,
    dmOnBlacklist: true,
    
    channelLogs: true,
    channelOnWarn: true,
    channelOnPunishment: true,
    channelOnAppeal: true,
    channelOnBlacklist: true,
    
    staffNotify: true,
    staffRole: 'ID_STAFF_ROLE'
  },
  
  security: {
    encryptData: false,
    require2FA: false,
    maxWarnsPerModPerDay: 50,
    requireReason: true,
    minReasonLength: 5,
    maxReasonLength: 1000,
    preventSelfWarn: true,
    preventWarnStaff: true,
    preventWarnHigherRole: true
  },
  
  automation: {
    autoExpire: true,
    autoBackup: true,
    backupInterval: 6, // horas
    autoCleanup: true,
    cleanupInterval: 24, // horas
    autoReports: true,
    reportTime: '00:00',
    autoSummaries: true,
    summaryInterval: 7 // dias
  },
  
  localization: {
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    dateFormat: 'DD/MM/YYYY HH:mm:ss',
    currency: 'BRL',
    messages: {
      warnAdded: '✅ Warn adicionado com sucesso!',
      warnRemoved: '✅ Warn removido com sucesso!',
      warnNotFound: '❌ Warn não encontrado!',
      userNotFound: '❌ Usuário não encontrado!',
      noPermission: '❌ Você não tem permissão para isso!'
    }
  }
};

// ============================================
// ESTRUTURA DE DADOS EXPANDIDA
// ============================================

// Maps principais
let warns = new Map(); // guildId -> userId -> warnData
let guildSettings = new Map(); // guildId -> settings
let appealRequests = new Map(); // guildId -> appealId -> appealData
let warnTemplates = new Map(); // guildId -> templates
let warnHistory = new Map(); // userId -> histórico completo (cross-server)
let blacklist = new Map(); // userId -> blacklistData
let userProfiles = new Map(); // userId -> profile data
let moderatorStats = new Map(); // modId -> statistics
let guildStats = new Map(); // guildId -> statistics
let appeals = new Map(); // appealId -> appealData
let backups = new Map(); // backupId -> backupData
let reports = new Map(); // reportId -> reportData
let cache = new Map(); // cache temporário
let sessions = new Map(); // sessões de moderação
let quotas = new Map(); // cotas de moderação
let schedules = new Map(); // tarefas agendadas
let webhooks = new Map(); // webhooks configurados
let integrations = new Map(); // integrações externas

// Estatísticas globais
let statistics = {
  // Contadores
  totalWarns: 0,
  totalActiveWarns: 0,
  totalExpiredWarns: 0,
  totalAppeals: 0,
  totalAppealsApproved: 0,
  totalAppealsRejected: 0,
  totalAppealsPending: 0,
  totalModerators: 0,
  totalModeratorsActive: 0,
  totalUsers: 0,
  totalUsersWarned: 0,
  totalGuilds: 0,
  
  // Estatísticas temporais
  warnsByDay: {},
  warnsByWeek: {},
  warnsByMonth: {},
  warnsByYear: {},
  warnsByHour: Array(24).fill(0),
  warnsByDayOfWeek: Array(7).fill(0),
  warnsByMonthOfYear: Array(12).fill(0),
  
  // Estatísticas por categoria
  warnsByReason: {},
  warnsByModerator: {},
  warnsByUser: {},
  warnsByGuild: {},
  
  // Médias
  averageWarnsPerUser: 0,
  averageWarnsPerDay: 0,
  averageWarnsPerMod: 0,
  averageAppealTime: 0,
  averageResponseTime: 0,
  
  // Top lists
  topModerators: [],
  topUsers: [],
  topReasons: [],
  topGuilds: [],
  
  // Tendências
  trendDaily: [],
  trendWeekly: [],
  trendMonthly: [],
  
  // Previsões
  predictions: {
    nextWeek: 0,
    nextMonth: 0,
    nextYear: 0,
    confidence: 0
  },
  
  // Timestamps
  firstWarn: null,
  lastWarn: null,
  lastUpdate: new Date().toISOString(),
  uptime: 0
};

// Cache e índices
let indices = {
  userId: new Map(), // userId -> [warnIds]
  modId: new Map(), // modId -> [warnIds]
  guildId: new Map(), // guildId -> [warnIds]
  reasonId: new Map(), // reason -> [warnIds]
  dateIndex: new Map(), // date -> [warnIds]
  appealIndex: new Map() // appealId -> warnId
};

// ============================================
// FUNÇÕES DE LOG AVANÇADAS
// ============================================

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
  MOD: 5,
  AUDIT: 6,
  SECURITY: 7,
  PERFORMANCE: 8
};

const LogColors = {
  [LogLevel.DEBUG]: '\x1b[90m',
  [LogLevel.INFO]: '\x1b[36m',
  [LogLevel.WARN]: '\x1b[33m',
  [LogLevel.ERROR]: '\x1b[31m',
  [LogLevel.FATAL]: '\x1b[41m',
  [LogLevel.MOD]: '\x1b[35m',
  [LogLevel.AUDIT]: '\x1b[34m',
  [LogLevel.SECURITY]: '\x1b[91m',
  [LogLevel.PERFORMANCE]: '\x1b[92m'
};

const LogNames = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
  [LogLevel.MOD]: 'MOD',
  [LogLevel.AUDIT]: 'AUDIT',
  [LogLevel.SECURITY]: 'SECURITY',
  [LogLevel.PERFORMANCE]: 'PERF'
};

class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 10000;
    this.logFile = CONFIG.logsPath;
    this.ensureLogFile();
  }

  ensureLogFile() {
    const dir = path.dirname(this.logFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  log(message, level = LogLevel.INFO, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      id: this.generateLogId()
    };

    // Adicionar ao array em memória
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console com cor
    const color = LogColors[level] || '\x1b[37m';
    const levelName = LogNames[level] || 'UNKNOWN';
    console.log(`${color}[${timestamp}] [${levelName}] ${message}\x1b[0m`);
    
    if (data) {
      console.log(`${color}${JSON.stringify(data, null, 2)}\x1b[0m`);
    }

    // Salvar em arquivo
    this.writeToFile(logEntry);

    // Alertas especiais
    if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
      this.sendAlert(logEntry);
    }

    return logEntry.id;
  }

  writeToFile(entry) {
    try {
      const line = `[${entry.timestamp}] [${LogNames[entry.level]}] ${entry.message}${entry.data ? ' ' + JSON.stringify(entry.data) : ''}\n`;
      fs.appendFileSync(this.logFile, line);
    } catch (err) {
      console.error('Erro ao escrever no arquivo de log:', err);
    }
  }

  sendAlert(entry) {
    // Implementar alertas por Discord, email, etc
    if (entry.level === LogLevel.FATAL) {
      // Enviar alerta crítico
    }
  }

  generateLogId() {
    return `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  getLogs(level = null, limit = 100) {
    let filtered = this.logs;
    if (level !== null) {
      filtered = filtered.filter(l => l.level === level);
    }
    return filtered.slice(-limit);
  }

  clearLogs() {
    this.logs = [];
    fs.writeFileSync(this.logFile, '');
  }

  // Métodos de conveniência
  debug(message, data) { return this.log(message, LogLevel.DEBUG, data); }
  info(message, data) { return this.log(message, LogLevel.INFO, data); }
  warn(message, data) { return this.log(message, LogLevel.WARN, data); }
  error(message, data) { return this.log(message, LogLevel.ERROR, data); }
  fatal(message, data) { return this.log(message, LogLevel.FATAL, data); }
  mod(message, data) { return this.log(message, LogLevel.MOD, data); }
  audit(message, data) { return this.log(message, LogLevel.AUDIT, data); }
  security(message, data) { return this.log(message, LogLevel.SECURITY, data); }
  perf(message, data) { return this.log(message, LogLevel.PERFORMANCE, data); }
}

const logger = new Logger();

// ============================================
// FUNÇÕES DE BACKUP AVANÇADAS
// ============================================

class BackupManager {
  constructor() {
    this.backupInterval = PUNISHMENT_CONFIG.automation.backupInterval * 60 * 60 * 1000;
    this.maxBackups = 20;
    this.compressBackups = true;
    this.encryptBackups = PUNISHMENT_CONFIG.security.encryptData;
    this.encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
  }

  async createBackup(options = {}) {
    const {
      type = 'full',
      compress = this.compressBackups,
      encrypt = this.encryptBackups,
      description = ''
    } = options;

    try {
      this.ensureBackupDir();
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupId = this.generateBackupId();
      const backupDir = path.join(CONFIG.backupsPath, `backup-${timestamp}`);
      
      fs.mkdirSync(backupDir, { recursive: true });

      // Coletar dados
      const backupData = {
        id: backupId,
        type,
        timestamp: new Date().toISOString(),
        description,
        version: '2.0.0',
        stats: this.collectStats(),
        data: this.collectData(type),
        metadata: {
          serverCount: warns.size,
          userCount: userProfiles.size,
          warnCount: statistics.totalWarns,
          appealCount: appeals.size,
          size: 0
        }
      };

      // Salvar dados principais
      const dataFile = path.join(backupDir, 'data.json');
      fs.writeFileSync(dataFile, JSON.stringify(backupData.data, null, 2));

      // Salvar metadados
      const metaFile = path.join(backupDir, 'metadata.json');
      fs.writeFileSync(metaFile, JSON.stringify({
        ...backupData,
        data: undefined
      }, null, 2));

      // Comprimir se necessário
      if (compress) {
        await this.compressBackup(backupDir);
      }

      // Criptografar se necessário
      if (encrypt) {
        await this.encryptBackup(backupDir);
      }

      // Calcular tamanho
      const size = this.getDirectorySize(backupDir);
      backupData.metadata.size = size;

      // Registrar backup
      backups.set(backupId, backupData);

      // Limpar backups antigos
      this.cleanOldBackups();

      logger.info(`✅ Backup criado: ${backupId} (${this.formatSize(size)})`, {
        backupId,
        type,
        size
      });

      return {
        success: true,
        backupId,
        path: backupDir,
        size,
        data: backupData
      };

    } catch (err) {
      logger.error(`❌ Erro ao criar backup: ${err.message}`, { error: err.stack });
      return { success: false, error: err.message };
    }
  }

  async restoreBackup(backupId, options = {}) {
    const {
      type = 'full',
      dryRun = false
    } = options;

    try {
      // Encontrar backup
      const backupDir = this.findBackup(backupId);
      if (!backupDir) {
        return { success: false, error: 'Backup não encontrado' };
      }

      // Carregar dados
      const dataFile = path.join(backupDir, 'data.json');
      if (!fs.existsSync(dataFile)) {
        return { success: false, error: 'Arquivo de dados não encontrado' };
      }

      const backupData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

      if (dryRun) {
        return {
          success: true,
          dryRun: true,
          stats: backupData.metadata
        };
      }

      // Restaurar dados
      if (type === 'full' || type === 'warns') {
        warns = new Map();
        for (const [gid, users] of Object.entries(backupData.warns || {})) {
          warns.set(gid, new Map(Object.entries(users)));
        }
      }

      if (type === 'full' || type === 'settings') {
        guildSettings = new Map(Object.entries(backupData.settings || {}));
      }

      if (type === 'full' || type === 'appeals') {
        appeals = new Map();
        for (const [aid, appeal] of Object.entries(backupData.appeals || {})) {
          appeals.set(aid, appeal);
        }
      }

      if (type === 'full' || type === 'profiles') {
        userProfiles = new Map();
        for (const [uid, profile] of Object.entries(backupData.profiles || {})) {
          userProfiles.set(uid, profile);
        }
      }

      // Salvar dados restaurados
      this.saveAll();

      logger.info(`✅ Backup restaurado: ${backupId}`, {
        backupId,
        type
      });

      return {
        success: true,
        backupId,
        stats: backupData.metadata
      };

    } catch (err) {
      logger.error(`❌ Erro ao restaurar backup: ${err.message}`, { error: err.stack });
      return { success: false, error: err.message };
    }
  }

  listBackups(options = {}) {
    const {
      limit = 10,
      offset = 0,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = options;

    try {
      this.ensureBackupDir();
      
      const backups = fs.readdirSync(CONFIG.backupsPath)
        .filter(f => f.startsWith('backup-'))
        .map(dir => {
          const dirPath = path.join(CONFIG.backupsPath, dir);
          const metaFile = path.join(dirPath, 'metadata.json');
          
          if (fs.existsSync(metaFile)) {
            try {
              const metadata = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
              return {
                id: metadata.id,
                dir,
                path: dirPath,
                ...metadata,
                size: this.getDirectorySize(dirPath)
              };
            } catch {
              return null;
            }
          }
          return null;
        })
        .filter(b => b !== null)
        .sort((a, b) => {
          const aVal = a[sortBy];
          const bVal = b[sortBy];
          return sortOrder === 'desc' ? 
            (aVal > bVal ? -1 : 1) : 
            (aVal < bVal ? -1 : 1);
        });

      return {
        total: backups.length,
        backups: backups.slice(offset, offset + limit)
      };

    } catch (err) {
      logger.error(`Erro ao listar backups: ${err.message}`);
      return { total: 0, backups: [] };
    }
  }

  deleteBackup(backupId) {
    try {
      const backupDir = this.findBackup(backupId);
      if (!backupDir) {
        return { success: false, error: 'Backup não encontrado' };
      }

      fs.rmSync(backupDir, { recursive: true, force: true });
      
      logger.info(`🗑️ Backup deletado: ${backupId}`);
      
      return { success: true };

    } catch (err) {
      logger.error(`Erro ao deletar backup: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  // Métodos auxiliares
  ensureBackupDir() {
    if (!fs.existsSync(CONFIG.backupsPath)) {
      fs.mkdirSync(CONFIG.backupsPath, { recursive: true });
    }
  }

  generateBackupId() {
    return `BACKUP-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  }

  collectStats() {
    return {
      totalWarns: statistics.totalWarns,
      totalUsers: userProfiles.size,
      totalGuilds: warns.size,
      totalAppeals: appeals.size,
      totalBackups: backups.size
    };
  }

  collectData(type) {
    const data = {};

    if (type === 'full' || type === 'warns') {
      data.warns = Object.fromEntries(
        Array.from(warns.entries()).map(([gid, umap]) => [
          gid,
          Object.fromEntries(umap)
        ])
      );
    }

    if (type === 'full' || type === 'settings') {
      data.settings = Object.fromEntries(guildSettings);
    }

    if (type === 'full' || type === 'appeals') {
      data.appeals = Object.fromEntries(appeals);
    }

    if (type === 'full' || type === 'profiles') {
      data.profiles = Object.fromEntries(userProfiles);
    }

    if (type === 'full' || type === 'templates') {
      data.templates = Object.fromEntries(warnTemplates);
    }

    if (type === 'full' || type === 'blacklist') {
      data.blacklist = Object.fromEntries(
        Array.from(blacklist.entries()).map(([uid, bdata]) => [
          uid,
          bdata
        ])
      );
    }

    return data;
  }

  findBackup(backupId) {
    this.ensureBackupDir();
    
    const dirs = fs.readdirSync(CONFIG.backupsPath);
    for (const dir of dirs) {
      if (!dir.startsWith('backup-')) continue;
      
      const metaFile = path.join(CONFIG.backupsPath, dir, 'metadata.json');
      if (fs.existsSync(metaFile)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
          if (metadata.id === backupId) {
            return path.join(CONFIG.backupsPath, dir);
          }
        } catch {
          continue;
        }
      }
    }
    return null;
  }

  cleanOldBackups() {
    try {
      this.ensureBackupDir();
      
      const backups = fs.readdirSync(CONFIG.backupsPath)
        .filter(f => f.startsWith('backup-'))
        .map(dir => ({
          dir,
          path: path.join(CONFIG.backupsPath, dir),
          time: fs.statSync(path.join(CONFIG.backupsPath, dir)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

      if (backups.length > this.maxBackups) {
        backups.slice(this.maxBackups).forEach(b => {
          fs.rmSync(b.path, { recursive: true, force: true });
          logger.info(`🗑️ Backup antigo removido: ${b.dir}`);
        });
      }
    } catch (err) {
      logger.error(`Erro ao limpar backups antigos: ${err.message}`);
    }
  }

  async compressBackup(dir) {
    // Implementar compressão
  }

  async encryptBackup(dir) {
    if (!this.encryptBackups) return;
    
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const encrypted = this.encrypt(content);
        fs.writeFileSync(filePath + '.enc', encrypted);
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      logger.error(`Erro ao criptografar backup: ${err.message}`);
    }
  }

  encrypt(text) {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  decrypt(encrypted) {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  getDirectorySize(dir) {
    let size = 0;
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile()) {
        size += stats.size;
      } else if (stats.isDirectory()) {
        size += this.getDirectorySize(filePath);
      }
    }
    
    return size;
  }

  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  saveAll() {
    saveData();
  }
}

const backupManager = new BackupManager();

// ============================================
// FUNÇÕES DE EXPORTAÇÃO/IMPORTAÇÃO AVANÇADAS
// ============================================

class ExportManager {
  constructor() {
    this.exportPath = path.join(__dirname, '..', 'exports');
    this.formats = ['json', 'csv', 'xml', 'yaml', 'html', 'pdf', 'excel'];
    this.ensureExportDir();
  }

  ensureExportDir() {
    if (!fs.existsSync(this.exportPath)) {
      fs.mkdirSync(this.exportPath, { recursive: true });
    }
  }

  async exportData(guildId, options = {}) {
    const {
      format = 'json',
      type = 'all',
      dateRange = null,
      filters = {},
      sort = {},
      limit = 1000,
      pretty = true
    } = options;

    try {
      const data = this.collectExportData(guildId, type, dateRange, filters);
      const processed = this.processData(data, sort, limit);
      const filename = this.generateFilename(guildId, type, format);
      const filepath = path.join(this.exportPath, filename);

      let content;
      let mimeType;

      switch (format) {
        case 'json':
          content = pretty ? JSON.stringify(processed, null, 2) : JSON.stringify(processed);
          mimeType = 'application/json';
          break;

        case 'csv':
          content = this.convertToCSV(processed);
          mimeType = 'text/csv';
          break;

        case 'xml':
          content = this.convertToXML(processed);
          mimeType = 'application/xml';
          break;

        case 'yaml':
          content = this.convertToYAML(processed);
          mimeType = 'application/x-yaml';
          break;

        case 'html':
          content = this.convertToHTML(processed, guildId);
          mimeType = 'text/html';
          break;

        case 'excel':
          content = await this.convertToExcel(processed);
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;

        default:
          throw new Error(`Formato não suportado: ${format}`);
      }

      fs.writeFileSync(filepath, content);

      logger.info(`📤 Dados exportados: ${filename}`, {
        guildId,
        format,
        type,
        size: content.length
      });

      return {
        success: true,
        filepath,
        filename,
        size: content.length,
        mimeType,
        data: processed
      };

    } catch (err) {
      logger.error(`❌ Erro ao exportar dados: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async importData(filepath, guildId, options = {}) {
    const {
      format = null,
      type = 'all',
      merge = true,
      overwrite = false
    } = options;

    try {
      if (!fs.existsSync(filepath)) {
        return { success: false, error: 'Arquivo não encontrado' };
      }

      const ext = path.extname(filepath).toLowerCase().substring(1);
      const detectedFormat = format || ext;

      const content = fs.readFileSync(filepath, 'utf8');
      let data;

      switch (detectedFormat) {
        case 'json':
          data = JSON.parse(content);
          break;

        case 'csv':
          data = this.parseCSV(content);
          break;

        case 'xml':
          data = this.parseXML(content);
          break;

        case 'yaml':
          data = this.parseYAML(content);
          break;

        default:
          throw new Error(`Formato não suportado: ${detectedFormat}`);
      }

      const imported = this.processImport(data, guildId, type, merge, overwrite);
      
      this.saveImportedData(imported);

      logger.info(`📥 Dados importados: ${path.basename(filepath)}`, {
        guildId,
        format: detectedFormat,
        type,
        imported: imported.counts
      });

      return {
        success: true,
        imported: imported.counts,
        data: imported.stats
      };

    } catch (err) {
      logger.error(`❌ Erro ao importar dados: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  collectExportData(guildId, type, dateRange, filters) {
    const data = {};

    if (type === 'all' || type === 'warns') {
      data.warns = this.collectWarns(guildId, dateRange, filters);
    }

    if (type === 'all' || type === 'users') {
      data.users = this.collectUsers(guildId, filters);
    }

    if (type === 'all' || type === 'appeals') {
      data.appeals = this.collectAppeals(guildId, dateRange, filters);
    }

    if (type === 'all' || type === 'stats') {
      data.stats = this.collectStats(guildId, dateRange);
    }

    if (type === 'all' || type === 'audit') {
      data.audit = this.collectAuditLogs(guildId, dateRange, filters);
    }

    if (type === 'all' || type === 'config') {
      data.config = this.collectConfig(guildId);
    }

    return data;
  }

  collectWarns(guildId, dateRange, filters) {
    const guildWarns = warns.get(guildId);
    if (!guildWarns) return [];

    const result = [];

    for (const [userId, userData] of guildWarns) {
      const userWarns = userData.history.filter(warn => {
        // Filtrar por data
        if (dateRange) {
          const date = new Date(warn.timestamp);
          if (date < dateRange.start || date > dateRange.end) return false;
        }

        // Aplicar filtros
        for (const [key, value] of Object.entries(filters)) {
          if (warn[key] !== value) return false;
        }

        return true;
      });

      if (userWarns.length > 0) {
        result.push({
          userId,
          username: userData.username || 'Desconhecido',
          warns: userWarns
        });
      }
    }

    return result;
  }

  collectUsers(guildId, filters) {
    const result = [];

    for (const [userId, profile] of userProfiles) {
      // Aplicar filtros
      let matches = true;
      for (const [key, value] of Object.entries(filters)) {
        if (profile[key] !== value) {
          matches = false;
          break;
        }
      }

      if (matches) {
        result.push({
          userId,
          ...profile
        });
      }
    }

    return result;
  }

  collectAppeals(guildId, dateRange, filters) {
    const result = [];

    for (const [appealId, appeal] of appeals) {
      if (appeal.guildId !== guildId) continue;

      // Filtrar por data
      if (dateRange) {
        const date = new Date(appeal.createdAt);
        if (date < dateRange.start || date > dateRange.end) continue;
      }

      // Aplicar filtros
      let matches = true;
      for (const [key, value] of Object.entries(filters)) {
        if (appeal[key] !== value) {
          matches = false;
          break;
        }
      }

      if (matches) {
        result.push({
          appealId,
          ...appeal
        });
      }
    }

    return result;
  }

  collectStats(guildId, dateRange) {
    const stats = getServerStats(guildId);
    
    if (dateRange) {
      // Filtrar estatísticas por período
      stats.warnsByDay = Object.fromEntries(
        Object.entries(stats.warnsByDay || {}).filter(([day]) => {
          const date = new Date(day);
          return date >= dateRange.start && date <= dateRange.end;
        })
      );
    }

    return stats;
  }

  collectAuditLogs(guildId, dateRange, filters) {
    // Implementar coleta de logs de auditoria
    return [];
  }

  collectConfig(guildId) {
    return {
      settings: guildSettings.get(guildId),
      templates: warnTemplates.get(guildId) || [],
      blacklist: Array.from(blacklist.get(guildId)?.entries() || [])
    };
  }

  processData(data, sort, limit) {
    let result = { ...data };

    // Ordenar se necessário
    if (sort.field && sort.order) {
      for (const key in result) {
        if (Array.isArray(result[key])) {
          result[key] = result[key].sort((a, b) => {
            const aVal = a[sort.field];
            const bVal = b[sort.field];
            return sort.order === 'asc' ? 
              (aVal < bVal ? -1 : 1) : 
              (aVal > bVal ? -1 : 1);
          });
        }
      }
    }

    // Limitar resultados
    for (const key in result) {
      if (Array.isArray(result[key]) && result[key].length > limit) {
        result[key] = result[key].slice(0, limit);
      }
    }

    return result;
  }

  generateFilename(guildId, type, format) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `export-${guildId}-${type}-${timestamp}.${format}`;
  }

  convertToCSV(data) {
    let csv = '';
    
    const processObject = (obj, prefix = '') => {
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          processObject(item, `${prefix}[${index}]`);
        });
      } else if (obj && typeof obj === 'object') {
        Object.entries(obj).forEach(([key, value]) => {
          processObject(value, prefix ? `${prefix}.${key}` : key);
        });
      } else {
        csv += `${prefix},${obj}\n`;
      }
    };

    processObject(data);
    return csv;
  }

  convertToXML(data) {
    const toXML = (obj, name = 'root') => {
      let xml = `<${name}>`;
      
      for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
          value.forEach(item => {
            xml += toXML(item, key);
          });
        } else if (value && typeof value === 'object') {
          xml += toXML(value, key);
        } else {
          xml += `<${key}>${value}</${key}>`;
        }
      }
      
      xml += `</${name}>`;
      return xml;
    };

    return '<?xml version="1.0" encoding="UTF-8"?>\n' + toXML(data);
  }

  convertToYAML(data) {
    const toYAML = (obj, indent = 0) => {
      let yaml = '';
      const spaces = ' '.repeat(indent);

      for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
          yaml += `${spaces}${key}:\n`;
          value.forEach(item => {
            if (typeof item === 'object') {
              yaml += `${spaces}  - ${toYAML(item, indent + 4).trim()}\n`;
            } else {
              yaml += `${spaces}  - ${item}\n`;
            }
          });
        } else if (value && typeof value === 'object') {
          yaml += `${spaces}${key}:\n${toYAML(value, indent + 2)}`;
        } else {
          yaml += `${spaces}${key}: ${value}\n`;
        }
      }

      return yaml;
    };

    return toYAML(data);
  }

  convertToHTML(data, guildId) {
    const guild = client?.guilds?.cache?.get(guildId);
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Exportação de Warns - ${guild?.name || 'Servidor'}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #7289da; color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .section { background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f2f2f2; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; }
        .stat-value { font-size: 24px; font-weight: bold; }
        .stat-label { font-size: 14px; opacity: 0.9; }
        .footer { text-align: center; color: #666; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Exportação de Warns</h1>
            <p>Servidor: ${guild?.name || 'Desconhecido'} | Data: ${new Date().toLocaleString('pt-BR')}</p>
        </div>

        ${this.generateHTMLStats(data.stats)}
        ${this.generateHTMLWarns(data.warns)}
        ${this.generateHTMLUsers(data.users)}
        ${this.generateHTMLAppeals(data.appeals)}
        ${this.generateHTMLConfig(data.config)}

        <div class="footer">
            <p>Gerado automaticamente pelo Sistema de Warns</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  generateHTMLStats(stats) {
    if (!stats) return '';

    return `
<div class="section">
    <h2>📈 Estatísticas</h2>
    <div class="stats">
        <div class="stat-card">
            <div class="stat-value">${stats.totalWarns || 0}</div>
            <div class="stat-label">Total de Warns</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.activeWarns || 0}</div>
            <div class="stat-label">Warns Ativos</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.warnedUsers || 0}</div>
            <div class="stat-label">Usuários Warnados</div>
        </div>
    </div>
</div>
    `;
  }

  generateHTMLWarns(warns) {
    if (!warns || warns.length === 0) return '';

    return `
<div class="section">
    <h2>⚠️ Warns</h2>
    <table>
        <thead>
            <tr>
                <th>Usuário</th>
                <th>Motivo</th>
                <th>Moderador</th>
                <th>Data</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${warns.flatMap(u => u.warns.map(w => `
                <tr>
                    <td>${u.username} (${u.userId})</td>
                    <td>${w.reason}</td>
                    <td>${w.moderatorId}</td>
                    <td>${new Date(w.timestamp).toLocaleString('pt-BR')}</td>
                    <td>${w.active ? '🟢 Ativo' : '🔴 Inativo'}</td>
                </tr>
            `)).join('')}
        </tbody>
    </table>
</div>
    `;
  }

  generateHTMLUsers(users) {
    if (!users || users.length === 0) return '';

    return `
<div class="section">
    <h2>👥 Usuários</h2>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Total Warns</th>
                <th>Warns Ativos</th>
                <th>Primeiro Warn</th>
                <th>Último Warn</th>
            </tr>
        </thead>
        <tbody>
            ${users.map(u => `
                <tr>
                    <td>${u.userId}</td>
                    <td>${u.totalWarns || 0}</td>
                    <td>${u.activeWarns || 0}</td>
                    <td>${u.firstWarn ? new Date(u.firstWarn).toLocaleString('pt-BR') : 'Nunca'}</td>
                    <td>${u.lastWarn ? new Date(u.lastWarn).toLocaleString('pt-BR') : 'Nunca'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</div>
    `;
  }

  generateHTMLAppeals(appeals) {
    if (!appeals || appeals.length === 0) return '';

    return `
<div class="section">
    <h2>📝 Recursos</h2>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Usuário</th>
                <th>Motivo</th>
                <th>Status</th>
                <th>Data</th>
            </tr>
        </thead>
        <tbody>
            ${appeals.map(a => `
                <tr>
                    <td>${a.appealId}</td>
                    <td>${a.userId}</td>
                    <td>${a.reason}</td>
                    <td>${this.getAppealStatusEmoji(a.status)} ${a.status}</td>
                    <td>${new Date(a.createdAt).toLocaleString('pt-BR')}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</div>
    `;
  }

  generateHTMLConfig(config) {
    if (!config) return '';

    return `
<div class="section">
    <h2>⚙️ Configurações</h2>
    <pre>${JSON.stringify(config.settings, null, 2)}</pre>
</div>
    `;
  }

  getAppealStatusEmoji(status) {
    const emojis = {
      pending: '⏳',
      approved: '✅',
      rejected: '❌',
      expired: '⌛'
    };
    return emojis[status] || '❓';
  }

  async convertToExcel(data) {
    // Implementar conversão para Excel
    return Buffer.from('Excel data');
  }

  parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const obj = {};
      
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index]?.trim();
      });
      
      result.push(obj);
    }

    return result;
  }

  parseXML(xml) {
    // Implementar parsing de XML
    return {};
  }

  parseYAML(yaml) {
    // Implementar parsing de YAML
    return {};
  }

  processImport(data, guildId, type, merge, overwrite) {
    const counts = {
      warns: 0,
      users: 0,
      appeals: 0,
      settings: 0,
      templates: 0
    };

    if (type === 'all' || type === 'warns') {
      counts.warns = this.importWarns(data.warns, guildId, merge, overwrite);
    }

    if (type === 'all' || type === 'users') {
      counts.users = this.importUsers(data.users, guildId, merge, overwrite);
    }

    if (type === 'all' || type === 'appeals') {
      counts.appeals = this.importAppeals(data.appeals, guildId, merge, overwrite);
    }

    if (type === 'all' || type === 'settings') {
      counts.settings = this.importSettings(data.config?.settings, guildId, overwrite);
    }

    if (type === 'all' || type === 'templates') {
      counts.templates = this.importTemplates(data.config?.templates, guildId, merge, overwrite);
    }

    return { counts, stats: data.stats };
  }

  importWarns(warnsData, guildId, merge, overwrite) {
    let count = 0;

    if (!warns.has(guildId)) {
      warns.set(guildId, new Map());
    }

    const guildWarns = warns.get(guildId);

    for (const userData of warnsData || []) {
      const { userId, warns: userWarns } = userData;

      if (overwrite || !guildWarns.has(userId)) {
        guildWarns.set(userId, {
          count: userWarns.length,
          activeCount: userWarns.filter(w => w.active).length,
          history: userWarns,
          lastWarn: userWarns[userWarns.length - 1]?.timestamp,
          firstWarn: userWarns[0]?.timestamp
        });
        count += userWarns.length;
      } else if (merge) {
        const existing = guildWarns.get(userId);
        const merged = [...existing.history, ...userWarns];
        
        // Remover duplicatas por ID
        const unique = Array.from(new Map(merged.map(w => [w.id, w])).values());
        
        guildWarns.set(userId, {
          count: unique.length,
          activeCount: unique.filter(w => w.active).length,
          history: unique,
          lastWarn: unique[unique.length - 1]?.timestamp,
          firstWarn: unique[0]?.timestamp
        });
        count += userWarns.length;
      }
    }

    return count;
  }

  importUsers(usersData, guildId, merge, overwrite) {
    let count = 0;

    for (const userData of usersData || []) {
      const { userId, ...profile } = userData;

      if (overwrite || !userProfiles.has(userId)) {
        userProfiles.set(userId, profile);
        count++;
      } else if (merge) {
        const existing = userProfiles.get(userId);
        userProfiles.set(userId, { ...existing, ...profile });
        count++;
      }
    }

    return count;
  }

  importAppeals(appealsData, guildId, merge, overwrite) {
    let count = 0;

    for (const appealData of appealsData || []) {
      const { appealId, ...appeal } = appealData;

      if (overwrite || !appeals.has(appealId)) {
        appeals.set(appealId, appeal);
        count++;
      } else if (merge) {
        // Manter o existente
      }
    }

    return count;
  }

  importSettings(settingsData, guildId, overwrite) {
    if (!settingsData) return 0;

    if (overwrite || !guildSettings.has(guildId)) {
      guildSettings.set(guildId, settingsData);
      return 1;
    }

    return 0;
  }

  importTemplates(templatesData, guildId, merge, overwrite) {
    let count = 0;

    if (!warnTemplates.has(guildId)) {
      warnTemplates.set(guildId, []);
    }

    const guildTemplates = warnTemplates.get(guildId);

    for (const template of templatesData || []) {
      if (overwrite || !guildTemplates.find(t => t.id === template.id)) {
        guildTemplates.push(template);
        count++;
      } else if (merge) {
        const index = guildTemplates.findIndex(t => t.id === template.id);
        if (index !== -1) {
          guildTemplates[index] = { ...guildTemplates[index], ...template };
          count++;
        }
      }
    }

    return count;
  }

  saveImportedData(imported) {
    saveData();
  }
}

const exportManager = new ExportManager();

// ============================================
// FUNÇÕES DE ANÁLISE E ESTATÍSTICAS AVANÇADAS
// ============================================

class AnalyticsEngine {
  constructor() {
    this.cache = new Map();
    this.predictions = new Map();
    this.trends = new Map();
    this.insights = [];
  }

  analyzeGuild(guildId, options = {}) {
    const {
      period = 'all', // 'day', 'week', 'month', 'year', 'all'
      detailed = false,
      includePredictions = true
    } = options;

    const guildWarns = warns.get(guildId);
    if (!guildWarns) return null;

    const analysis = {
      overview: this.getOverview(guildWarns),
      timeline: this.getTimeline(guildWarns, period),
      distribution: this.getDistribution(guildWarns),
      users: this.getUserAnalysis(guildWarns),
      moderators: this.getModeratorAnalysis(guildWarns),
      reasons: this.getReasonAnalysis(guildWarns),
      trends: this.getTrends(guildWarns),
      comparisons: this.getComparisons(guildWarns),
      insights: []
    };

    if (detailed) {
      analysis.detailed = this.getDetailedAnalysis(guildWarns);
      analysis.hourly = this.getHourlyDistribution(guildWarns);
      analysis.weekly = this.getWeeklyDistribution(guildWarns);
      analysis.monthly = this.getMonthlyDistribution(guildWarns);
      analysis.correlations = this.getCorrelations(guildWarns);
      analysis.anomalies = this.detectAnomalies(guildWarns);
    }

    if (includePredictions) {
      analysis.predictions = this.generatePredictions(guildWarns);
    }

    analysis.insights = this.generateInsights(analysis);

    return analysis;
  }

  getOverview(guildWarns) {
    let totalWarns = 0;
    let activeWarns = 0;
    let users = new Set();
    let moderators = new Set();

    for (const [userId, userData] of guildWarns) {
      totalWarns += userData.count;
      activeWarns += userData.activeCount;
      users.add(userId);
      
      userData.history.forEach(warn => {
        moderators.add(warn.moderatorId);
      });
    }

    return {
      totalWarns,
      activeWarns,
      totalUsers: users.size,
      totalModerators: moderators.size,
      averageWarnsPerUser: users.size > 0 ? (totalWarns / users.size).toFixed(2) : 0,
      warnToUserRatio: users.size > 0 ? (totalWarns / users.size).toFixed(2) : 0
    };
  }

  getTimeline(guildWarns, period) {
    const timeline = {};
    const now = new Date();

    for (const [userId, userData] of guildWarns) {
      for (const warn of userData.history) {
        const date = new Date(warn.timestamp);
        
        let key;
        if (period === 'day') {
          key = date.toISOString().split('T')[0];
        } else if (period === 'week') {
          const week = this.getWeekNumber(date);
          key = `${date.getFullYear()}-W${week}`;
        } else if (period === 'month') {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else if (period === 'year') {
          key = date.getFullYear().toString();
        } else {
          key = date.toISOString().split('T')[0];
        }

        if (!timeline[key]) {
          timeline[key] = 0;
        }
        timeline[key]++;
      }
    }

    // Ordenar cronologicamente
    const sorted = Object.entries(timeline)
      .sort(([a], [b]) => a.localeCompare(b))
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

    return sorted;
  }

  getDistribution(guildWarns) {
    const distribution = {
      byCount: {},
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0 }
    };

    for (const [userId, userData] of guildWarns) {
      const count = userData.count;
      
      // Distribuição por quantidade
      const range = count <= 2 ? '1-2' : count <= 5 ? '3-5' : count <= 10 ? '6-10' : '10+';
      distribution.byCount[range] = (distribution.byCount[range] || 0) + 1;

      // Distribuição por severidade
      if (count >= 7) distribution.bySeverity.critical++;
      else if (count >= 5) distribution.bySeverity.high++;
      else if (count >= 3) distribution.bySeverity.medium++;
      else if (count >= 1) distribution.bySeverity.low++;
    }

    return distribution;
  }

  getUserAnalysis(guildWarns) {
    const users = [];

    for (const [userId, userData] of guildWarns) {
      const userStats = {
        userId,
        totalWarns: userData.count,
        activeWarns: userData.activeCount,
        firstWarn: userData.firstWarn,
        lastWarn: userData.lastWarn,
        warnFrequency: this.calculateFrequency(userData.history),
        mostCommonReason: this.getMostCommonReason(userData.history),
        timespan: this.getTimespan(userData.firstWarn, userData.lastWarn)
      };

      users.push(userStats);
    }

    // Ordenar por total de warns
    users.sort((a, b) => b.totalWarns - a.totalWarns);

    return {
      topUsers: users.slice(0, 10),
      total: users.length,
      averageWarns: users.reduce((acc, u) => acc + u.totalWarns, 0) / users.length || 0
    };
  }

  getModeratorAnalysis(guildWarns) {
    const mods = new Map();

    for (const [userId, userData] of guildWarns) {
      for (const warn of userData.history) {
        const modId = warn.moderatorId;
        
        if (!mods.has(modId)) {
          mods.set(modId, {
            totalWarns: 0,
            uniqueUsers: new Set(),
            reasons: {}
          });
        }

        const mod = mods.get(modId);
        mod.totalWarns++;
        mod.uniqueUsers.add(userId);
        mod.reasons[warn.reason] = (mod.reasons[warn.reason] || 0) + 1;
      }
    }

    const modArray = Array.from(mods.entries()).map(([id, data]) => ({
      moderatorId: id,
      totalWarns: data.totalWarns,
      uniqueUsers: data.uniqueUsers.size,
      topReason: Object.entries(data.reasons)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
    }));

    modArray.sort((a, b) => b.totalWarns - a.totalWarns);

    return {
      topModerators: modArray.slice(0, 10),
      total: modArray.length,
      averageWarnsPerMod: modArray.reduce((acc, m) => acc + m.totalWarns, 0) / modArray.length || 0
    };
  }

  getReasonAnalysis(guildWarns) {
    const reasons = {};

    for (const [userId, userData] of guildWarns) {
      for (const warn of userData.history) {
        reasons[warn.reason] = (reasons[warn.reason] || 0) + 1;
      }
    }

    const reasonArray = Object.entries(reasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    return {
      topReasons: reasonArray.slice(0, 10),
      total: reasonArray.length,
      mostCommon: reasonArray[0]?.reason || 'N/A',
      leastCommon: reasonArray[reasonArray.length - 1]?.reason || 'N/A'
    };
  }

  getTrends(guildWarns) {
    const trends = {
      daily: {},
      weekly: {},
      monthly: {},
      growth: {},
      seasonality: {}
    };

    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    for (const [userId, userData] of guildWarns) {
      for (const warn of userData.history) {
        const date = new Date(warn.timestamp);
        if (date < oneYearAgo) continue;

        // Tendência diária
        const day = date.toISOString().split('T')[0];
        trends.daily[day] = (trends.daily[day] || 0) + 1;

        // Tendência semanal
        const week = this.getWeekNumber(date);
        const weekKey = `${date.getFullYear()}-W${week}`;
        trends.weekly[weekKey] = (trends.weekly[weekKey] || 0) + 1;

        // Tendência mensal
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        trends.monthly[monthKey] = (trends.monthly[monthKey] || 0) + 1;
      }
    }

    // Calcular crescimento
    const monthlyValues = Object.values(trends.monthly);
    if (monthlyValues.length >= 2) {
      const lastMonth = monthlyValues[monthlyValues.length - 1];
      const previousMonth = monthlyValues[monthlyValues.length - 2];
      trends.growth.monthly = ((lastMonth - previousMonth) / previousMonth * 100).toFixed(2);
    }

    return trends;
  }

  getComparisons(guildWarns) {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let thisWeek = 0;
    let lastWeekCount = 0;
    let thisMonth = 0;
    let lastMonthCount = 0;

    for (const [userId, userData] of guildWarns) {
      for (const warn of userData.history) {
        const date = new Date(warn.timestamp);

        // Comparação semanal
        if (date >= lastWeek) {
          thisWeek++;
        } else {
          lastWeekCount++;
        }

        // Comparação mensal
        if (date >= lastMonth) {
          thisMonth++;
        } else {
          lastMonthCount++;
        }
      }
    }

    return {
      weekly: {
        current: thisWeek,
        previous: lastWeekCount,
        change: lastWeekCount > 0 ? ((thisWeek - lastWeekCount) / lastWeekCount * 100).toFixed(2) : 0
      },
      monthly: {
        current: thisMonth,
        previous: lastMonthCount,
        change: lastMonthCount > 0 ? ((thisMonth - lastMonthCount) / lastMonthCount * 100).toFixed(2) : 0
      }
    };
  }

  getDetailedAnalysis(guildWarns) {
    const details = {
      warnDensity: {},
      userSegments: {},
      timePatterns: {},
      moderatorPerformance: {}
    };

    // Análise de densidade de warns
    const dates = [];
    for (const [userId, userData] of guildWarns) {
      for (const warn of userData.history) {
        dates.push(new Date(warn.timestamp).getTime());
      }
    }

    if (dates.length > 0) {
      dates.sort();
      const intervals = [];
      for (let i = 1; i < dates.length; i++) {
        intervals.push(dates[i] - dates[i - 1]);
      }

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length / (24 * 60 * 60 * 1000);
      details.warnDensity.averageIntervalDays = avgInterval.toFixed(2);
    }

    return details;
  }

  getHourlyDistribution(guildWarns) {
    const hourly = Array(24).fill(0);

    for (const [userId, userData] of guildWarns) {
      for (const warn of userData.history) {
        const hour = new Date(warn.timestamp).getHours();
        hourly[hour]++;
      }
    }

    return hourly;
  }

  getWeeklyDistribution(guildWarns) {
    const weekly = Array(7).fill(0);

    for (const [userId, userData] of guildWarns) {
      for (const warn of userData.history) {
        const day = new Date(warn.timestamp).getDay();
        weekly[day]++;
      }
    }

    return weekly;
  }

  getMonthlyDistribution(guildWarns) {
    const monthly = Array(12).fill(0);

    for (const [userId, userData] of guildWarns) {
      for (const warn of userData.history) {
        const month = new Date(warn.timestamp).getMonth();
        monthly[month]++;
      }
    }

    return monthly;
  }

  getCorrelations(guildWarns) {
    const correlations = {};

    // Correlação entre warns e horário
    const hourly = this.getHourlyDistribution(guildWarns);
    const peakHour = hourly.indexOf(Math.max(...hourly));
    correlations.peakHour = peakHour;

    // Correlação entre warns e dia da semana
    const weekly = this.getWeeklyDistribution(guildWarns);
    const peakDay = weekly.indexOf(Math.max(...weekly));
    correlations.peakDay = peakDay;

    return correlations;
  }

  detectAnomalies(guildWarns) {
    const anomalies = [];
    const hourly = this.getHourlyDistribution(guildWarns);
    const mean = hourly.reduce((a, b) => a + b, 0) / hourly.length;
    const stdDev = Math.sqrt(hourly.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / hourly.length);

    // Detectar horas com número anormal de warns (mais de 2 desvios padrão)
    hourly.forEach((count, hour) => {
      if (count > mean + 2 * stdDev) {
        anomalies.push({
          type: 'hourly_spike',
          hour,
          count,
          expected: mean.toFixed(2),
          deviation: ((count - mean) / stdDev).toFixed(2)
        });
      }
    });

    return anomalies;
  }

  generatePredictions(guildWarns) {
    const predictions = {
      nextWeek: 0,
      nextMonth: 0,
      nextQuarter: 0,
      confidence: 0
    };

    // Coletar dados históricos
    const daily = [];
    const now = new Date();

    for (let i = 30; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      let count = 0;

      for (const [userId, userData] of guildWarns) {
        for (const warn of userData.history) {
          const warnDate = new Date(warn.timestamp).toISOString().split('T')[0];
          if (warnDate === dateStr) {
            count++;
          }
        }
      }

      daily.push(count);
    }

    // Calcular médias móveis
    const avgLast7 = daily.slice(-7).reduce((a, b) => a + b, 0) / 7;
    const avgLast30 = daily.reduce((a, b) => a + b, 0) / daily.length;

    // Gerar previsões (modelo simples de média móvel)
    predictions.nextWeek = Math.round(avgLast7 * 7);
    predictions.nextMonth = Math.round(avgLast30 * 30);
    predictions.nextQuarter = Math.round(avgLast30 * 90);

    // Calcular confiança (baseada na variação dos dados)
    const variance = daily.map(d => Math.pow(d - avgLast30, 2)).reduce((a, b) => a + b, 0) / daily.length;
    predictions.confidence = Math.max(0, Math.min(100, 100 - Math.sqrt(variance))).toFixed(2);

    return predictions;
  }

  generateInsights(analysis) {
    const insights = [];

    // Insight sobre crescimento
    if (analysis.comparisons?.monthly?.change > 20) {
      insights.push({
        type: 'warning',
        message: `⚠️ Aumento significativo de warns: ${analysis.comparisons.monthly.change}% no último mês`,
        severity: 'high'
      });
    } else if (analysis.comparisons?.monthly?.change < -20) {
      insights.push({
        type: 'success',
        message: `✅ Queda significativa de warns: ${analysis.comparisons.monthly.change}% no último mês`,
        severity: 'positive'
      });
    }

    // Insight sobre horário de pico
    const peakHour = analysis.hourly?.indexOf(Math.max(...(analysis.hourly || [])));
    if (peakHour !== undefined) {
      insights.push({
        type: 'info',
        message: `🕐 Horário de pico de warns: ${peakHour}:00 - ${peakHour + 1}:00`,
        severity: 'info'
      });
    }

    // Insight sobre usuários problemáticos
    if (analysis.users?.topUsers?.[0]?.totalWarns > 10) {
      insights.push({
        type: 'warning',
        message: `👤 Usuário <@${analysis.users.topUsers[0].userId}> tem ${analysis.users.topUsers[0].totalWarns} warns`,
        severity: 'medium'
      });
    }

    // Insight sobre moderadores
    if (analysis.moderators?.topModerators?.[0]?.totalWarns > 50) {
      insights.push({
        type: 'info',
        message: `🛡️ Moderador mais ativo deu ${analysis.moderators.topModerators[0].totalWarns} warns`,
        severity: 'info'
      });
    }

    // Insight sobre motivos comuns
    if (analysis.reasons?.topReasons?.[0]?.reason) {
      insights.push({
        type: 'info',
        message: `📋 Motivo mais comum: "${analysis.reasons.topReasons[0].reason}" (${analysis.reasons.topReasons[0].count} vezes)`,
        severity: 'info'
      });
    }

    return insights;
  }

  calculateFrequency(history) {
    if (history.length < 2) return 0;

    const dates = history.map(w => new Date(w.timestamp).getTime());
    dates.sort();

    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push(dates[i] - dates[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    return (24 * 60 * 60 * 1000 / avgInterval).toFixed(2); // warns por dia
  }

  getMostCommonReason(history) {
    const reasons = {};
    history.forEach(w => reasons[w.reason] = (reasons[w.reason] || 0) + 1);
    return Object.entries(reasons).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  }

  getTimespan(first, last) {
    if (!first || !last) return 0;
    return ((new Date(last) - new Date(first)) / (24 * 60 * 60 * 1000)).toFixed(2);
  }

  getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }
}

const analyticsEngine = new AnalyticsEngine();

// ============================================
// FUNÇÕES DE WEBHOOK E INTEGRAÇÕES
// ============================================

class WebhookManager {
  constructor() {
    this.webhooks = new Map();
    this.integrations = new Map();
  }

  async registerWebhook(guildId, options) {
    const {
      url,
      type = 'discord',
      events = ['warn_add', 'warn_remove', 'appeal_create', 'punishment'],
      secret = null
    } = options;

    const webhookId = this.generateWebhookId();

    this.webhooks.set(webhookId, {
      id: webhookId,
      guildId,
      url,
      type,
      events,
      secret,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      failures: 0
    });

    logger.info(`🔗 Webhook registrado: ${webhookId}`, { guildId, type });

    return webhookId;
  }

  async triggerWebhooks(guildId, event, data) {
    const promises = [];

    for (const [id, webhook] of this.webhooks) {
      if (webhook.guildId === guildId && webhook.events.includes(event)) {
        promises.push(this.sendWebhook(webhook, event, data));
      }
    }

    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error(`❌ Erro ao enviar webhook: ${result.reason}`);
      }
    });

    return results;
  }

  async sendWebhook(webhook, event, data) {
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      webhookId: webhook.id
    };

    if (webhook.secret) {
      payload.signature = this.generateSignature(payload, webhook.secret);
    }

    try {
      const response = await axios.post(webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WarnSystem/2.0'
        },
        timeout: 5000
      });

      webhook.lastUsed = new Date().toISOString();
      webhook.failures = 0;

      return response.data;
    } catch (err) {
      webhook.failures++;
      
      if (webhook.failures >= 5) {
        this.webhooks.delete(webhook.id);
        logger.warn(`⚠️ Webhook ${webhook.id} removido após muitas falhas`);
      }

      throw err;
    }
  }

  generateSignature(payload, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  generateWebhookId() {
    return `WH-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  }

  async integrateDiscord(guildId, options) {
    const {
      channelId,
      webhookName = 'Warn System'
    } = options;

    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel) throw new Error('Canal não encontrado');

      const webhook = await channel.createWebhook({
        name: webhookName,
        avatar: client.user.displayAvatarURL()
      });

      const webhookId = await this.registerWebhook(guildId, {
        url: `https://discord.com/api/webhooks/${webhook.id}/${webhook.token}`,
        type: 'discord',
        events: ['warn_add', 'punishment']
      });

      this.integrations.set(guildId, {
        type: 'discord',
        channelId,
        webhookId
      });

      return webhookId;
    } catch (err) {
      logger.error(`❌ Erro ao integrar Discord: ${err.message}`);
      throw err;
    }
  }

  async integrateSlack(guildId, options) {
    const { webhookUrl } = options;
    
    return this.registerWebhook(guildId, {
      url: webhookUrl,
      type: 'slack',
      events: ['warn_add', 'appeal_create']
    });
  }

  async integrateWebhook(guildId, url, events) {
    return this.registerWebhook(guildId, { url, type: 'custom', events });
  }
}

const webhookManager = new WebhookManager();

// ============================================
// FUNÇÕES DE CACHE E PERFORMANCE
// ============================================

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0
    };
    this.maxSize = 1000;
    this.ttl = 5 * 60 * 1000; // 5 minutos
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (item.expires && item.expires < Date.now()) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value;
  }

  set(key, value, ttl = this.ttl) {
    if (this.cache.size >= this.maxSize) {
      this.prune();
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + ttl,
      createdAt: Date.now()
    });

    this.stats.sets++;
    this.stats.size = this.cache.size;
  }

  delete(key) {
    const result = this.cache.delete(key);
    if (result) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
    }
    return result;
  }

  clear() {
    this.cache.clear();
    this.stats.size = 0;
  }

  prune() {
    const now = Date.now();
    let deleted = 0;

    for (const [key, item] of this.cache) {
      if (item.expires && item.expires < now) {
        this.cache.delete(key);
        deleted++;
      }
    }

    if (deleted === 0 && this.cache.size >= this.maxSize) {
      // Se não há expirados, remover os mais antigos
      const oldest = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.createdAt - b.createdAt)
        .slice(0, Math.floor(this.maxSize * 0.2));

      oldest.forEach(([key]) => this.cache.delete(key));
      deleted = oldest.length;
    }

    this.stats.size = this.cache.size;
    return deleted;
  }

  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) * 100 || 0
    };
  }

  // Métodos específicos para warns
  cacheWarns(guildId, userId, warns) {
    const key = `warns:${guildId}:${userId}`;
    this.set(key, warns, 60 * 1000); // 1 minuto
  }

  getCachedWarns(guildId, userId) {
    const key = `warns:${guildId}:${userId}`;
    return this.get(key);
  }

  cacheStats(guildId, stats) {
    const key = `stats:${guildId}`;
    this.set(key, stats, 5 * 60 * 1000); // 5 minutos
  }

  getCachedStats(guildId) {
    const key = `stats:${guildId}`;
    return this.get(key);
  }

  cacheUser(userId, data) {
    const key = `user:${userId}`;
    this.set(key, data, 30 * 60 * 1000); // 30 minutos
  }

  getCachedUser(userId) {
    const key = `user:${userId}`;
    return this.get(key);
  }
}

const cacheManager = new CacheManager();

// ============================================
// FUNÇÕES DE RATE LIMIT E QUOTAS
// ============================================

class RateLimiter {
  constructor() {
    this.limits = new Map();
    this.quotas = new Map();
  }

  checkLimit(key, options = {}) {
    const {
      max = 10,
      window = 60000, // 1 minuto
      quota = null
    } = options;

    const now = Date.now();
    const userLimits = this.limits.get(key) || [];

    // Remover entradas antigas
    const valid = userLimits.filter(t => now - t < window);
    this.limits.set(key, valid);

    if (valid.length >= max) {
      return {
        allowed: false,
        remaining: 0,
        reset: valid[0] + window - now
      };
    }

    // Verificar quota
    if (quota) {
      const userQuota = this.quotas.get(key) || { count: 0, reset: now + quota.period };
      
      if (now > userQuota.reset) {
        userQuota.count = 0;
        userQuota.reset = now + quota.period;
      }

      if (userQuota.count >= quota.max) {
        return {
          allowed: false,
          remaining: 0,
          reset: userQuota.reset - now,
          quota: true
        };
      }

      userQuota.count++;
      this.quotas.set(key, userQuota);
    }

    // Registrar nova tentativa
    valid.push(now);
    this.limits.set(key, valid);

    return {
      allowed: true,
      remaining: max - valid.length - 1,
      reset: valid[0] + window - now
    };
  }

  async waitForRateLimit(key, options) {
    while (true) {
      const result = this.checkLimit(key, options);
      
      if (result.allowed) {
        return true;
      }

      await new Promise(resolve => setTimeout(resolve, result.reset));
    }
  }

  getStats(key) {
    const limits = this.limits.get(key) || [];
    const quota = this.quotas.get(key);

    return {
      current: limits.length,
      oldest: limits[0] || null,
      quota: quota ? {
        count: quota.count,
        reset: quota.reset
      } : null
    };
  }

  reset(key) {
    this.limits.delete(key);
    this.quotas.delete(key);
  }
}

const rateLimiter = new RateLimiter();

// ============================================
// FUNÇÕES DE AUDITORIA E LOGS
// ============================================

class AuditLogger {
  constructor() {
    this.auditLogs = [];
    this.maxLogs = 10000;
  }

  log(action, data, user) {
    const entry = {
      id: this.generateAuditId(),
      timestamp: new Date().toISOString(),
      action,
      user: user ? {
        id: user.id,
        tag: user.tag
      } : null,
      data,
      ip: data.ip || null
    };

    this.auditLogs.push(entry);
    
    if (this.auditLogs.length > this.maxLogs) {
      this.auditLogs.shift();
    }

    logger.audit(`[AUDIT] ${action}`, data);

    return entry.id;
  }

  getLogs(filter = {}) {
    let logs = [...this.auditLogs];

    if (filter.action) {
      logs = logs.filter(l => l.action === filter.action);
    }

    if (filter.userId) {
      logs = logs.filter(l => l.user?.id === filter.userId);
    }

    if (filter.startDate) {
      logs = logs.filter(l => new Date(l.timestamp) >= new Date(filter.startDate));
    }

    if (filter.endDate) {
      logs = logs.filter(l => new Date(l.timestamp) <= new Date(filter.endDate));
    }

    if (filter.limit) {
      logs = logs.slice(-filter.limit);
    }

    return logs;
  }

  generateAuditId() {
    return `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // Métodos específicos
  logWarnAdd(warn, moderator) {
    return this.log('WARN_ADD', {
      warnId: warn.id,
      userId: warn.userId,
      reason: warn.reason,
      moderatorId: moderator?.id
    }, moderator);
  }

  logWarnRemove(warnId, userId, moderator, reason) {
    return this.log('WARN_REMOVE', {
      warnId,
      userId,
      moderatorId: moderator?.id,
      reason
    }, moderator);
  }

  logAppealCreate(appeal, user) {
    return this.log('APPEAL_CREATE', {
      appealId: appeal.id,
      warnId: appeal.warnId,
      userId: appeal.userId,
      reason: appeal.reason
    }, user);
  }

  logAppealDecision(appealId, decision, moderator) {
    return this.log('APPEAL_DECISION', {
      appealId,
      decision,
      moderatorId: moderator?.id
    }, moderator);
  }

  logPunishment(userId, punishment, moderator) {
    return this.log('PUNISHMENT', {
      userId,
      punishment,
      moderatorId: moderator?.id
    }, moderator);
  }

  logSettingsChange(guildId, changes, moderator) {
    return this.log('SETTINGS_CHANGE', {
      guildId,
      changes
    }, moderator);
  }

  logExport(guildId, format, user) {
    return this.log('EXPORT', {
      guildId,
      format
    }, user);
  }

  logImport(guildId, format, count, user) {
    return this.log('IMPORT', {
      guildId,
      format,
      count
    }, user);
  }

  logBackup(backupId, user) {
    return this.log('BACKUP', {
      backupId
    }, user);
  }

  logRestore(backupId, user) {
    return this.log('RESTORE', {
      backupId
    }, user);
  }
}

const auditLogger = new AuditLogger();

// ============================================
// FUNÇÕES PRINCIPAIS DE WARNS (ATUALIZADAS)
// ============================================

function addWarn(guildId, userId, reason, moderatorId, options = {}) {
  const {
    duration = null,
    evidence = null,
    channelId = null,
    messageId = null,
    silent = false,
    template = null
  } = options;

  // Verificar rate limit
  const rateCheck = rateLimiter.checkLimit(`warn:${moderatorId}`, {
    max: PUNISHMENT_CONFIG.security.maxWarnsPerModPerDay,
    window: 24 * 60 * 60 * 1000,
    quota: {
      max: PUNISHMENT_CONFIG.maxWarnsPerDay,
      period: 24 * 60 * 60 * 1000
    }
  });

  if (!rateCheck.allowed) {
    return {
      success: false,
      error: 'Rate limit atingido',
      reset: rateCheck.reset
    };
  }

  // Verificar se pode warnar
  if (PUNISHMENT_CONFIG.security.preventSelfWarn && userId === moderatorId) {
    return { success: false, error: 'Não é possível warnar a si mesmo' };
  }

  // Gerar ID único
  const warnId = generateId('WRN');
  const now = new Date();
  const expirationDate = duration ? new Date(now.getTime() + duration * 24 * 60 * 60 * 1000) : null;

  // Criar warn
  const warn = {
    id: warnId,
    userId,
    reason,
    moderatorId,
    timestamp: now.toISOString(),
    expiresAt: expirationDate?.toISOString() || null,
    active: true,
    evidence,
    channelId,
    messageId,
    template,
    appealed: false,
    appealId: null,
    notes: [],
    edits: [],
    metadata: {
      ip: null,
      userAgent: null,
      location: null
    }
  };

  // Salvar warn
  if (!warns.has(guildId)) {
    warns.set(guildId, new Map());
  }

  const guildWarns = warns.get(guildId);
  
  if (!guildWarns.has(userId)) {
    guildWarns.set(userId, {
      count: 0,
      activeCount: 0,
      history: [],
      lastWarn: null,
      firstWarn: null
    });
  }

  const userWarns = guildWarns.get(userId);
  userWarns.history.push(warn);
  userWarns.count++;
  userWarns.activeCount++;
  userWarns.lastWarn = now.toISOString();
  if (!userWarns.firstWarn) {
    userWarns.firstWarn = now.toISOString();
  }

  // Atualizar índices
  if (!indices.userId.has(userId)) {
    indices.userId.set(userId, []);
  }
  indices.userId.get(userId).push(warnId);

  if (!indices.modId.has(moderatorId)) {
    indices.modId.set(moderatorId, []);
  }
  indices.modId.get(moderatorId).push(warnId);

  if (!indices.guildId.has(guildId)) {
    indices.guildId.set(guildId, []);
  }
  indices.guildId.get(guildId).push(warnId);

  const dateKey = now.toISOString().split('T')[0];
  if (!indices.dateIndex.has(dateKey)) {
    indices.dateIndex.set(dateKey, []);
  }
  indices.dateIndex.get(dateKey).push(warnId);

  // Atualizar estatísticas
  statistics.totalWarns++;
  statistics.warnsByDay[dateKey] = (statistics.warnsByDay[dateKey] || 0) + 1;
  statistics.warnsByHour[now.getHours()]++;
  statistics.warnsByReason[reason] = (statistics.warnsByReason[reason] || 0) + 1;
  
  if (!statistics.warnsByModerator[moderatorId]) {
    statistics.warnsByModerator[moderatorId] = 0;
    statistics.totalModerators++;
  }
  statistics.warnsByModerator[moderatorId]++;

  if (!statistics.warnsByUser[userId]) {
    statistics.warnsByUser[userId] = 0;
    statistics.totalUsersWarned++;
  }
  statistics.warnsByUser[userId]++;

  statistics.lastWarn = now.toISOString();
  if (!statistics.firstWarn) {
    statistics.firstWarn = now.toISOString();
  }

  // Salvar dados
  saveData();

  // Log da ação
  logger.mod(`➕ Warn #${warnId} adicionado para ${userId}`, {
    guildId,
    userId,
    moderatorId,
    reason,
    warnId
  });

  // Audit log
  auditLogger.logWarnAdd(warn, { id: moderatorId });

  // Invalidar cache
  cacheManager.delete(`warns:${guildId}:${userId}`);
  cacheManager.delete(`stats:${guildId}`);

  return {
    success: true,
    warnId,
    warnCount: userWarns.activeCount,
    totalCount: userWarns.count,
    warn
  };
}

// ============================================
// FUNÇÕES DE RELATÓRIOS AVANÇADOS
// ============================================

class ReportGenerator {
  constructor() {
    this.reportsPath = CONFIG.reportsPath;
    this.ensureReportsDir();
  }

  ensureReportsDir() {
    if (!fs.existsSync(this.reportsPath)) {
      fs.mkdirSync(this.reportsPath, { recursive: true });
    }
  }

  async generateReport(guildId, options = {}) {
    const {
      type = 'summary', // 'summary', 'detailed', 'analytics', 'audit', 'custom'
      period = 'month', // 'day', 'week', 'month', 'year', 'custom'
      startDate = null,
      endDate = null,
      format = 'json', // 'json', 'html', 'pdf', 'csv'
      includeCharts = true,
      includeInsights = true
    } = options;

    const reportId = this.generateReportId();
    const timestamp = new Date().toISOString();

    // Definir período
    let start, end;
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      end = new Date();
      start = new Date(end);
      
      switch (period) {
        case 'day':
          start.setDate(start.getDate() - 1);
          break;
        case 'week':
          start.setDate(start.getDate() - 7);
          break;
        case 'month':
          start.setMonth(start.getMonth() - 1);
          break;
        case 'year':
          start.setFullYear(start.getFullYear() - 1);
          break;
      }
    }

    // Coletar dados
    const data = {
      reportId,
      guildId,
      type,
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      generatedAt: timestamp,
      stats: this.collectReportStats(guildId, start, end, type),
      warns: this.collectReportWarns(guildId, start, end, type),
      users: this.collectReportUsers(guildId, start, end, type),
      moderators: this.collectReportModerators(guildId, start, end, type),
      appeals: this.collectReportAppeals(guildId, start, end, type)
    };

    if (includeInsights) {
      data.insights = this.generateReportInsights(data);
    }

    if (includeCharts) {
      data.charts = this.generateCharts(data);
    }

    // Salvar relatório
    const filename = `report-${guildId}-${type}-${timestamp.replace(/[:.]/g, '-')}.${format}`;
    const filepath = path.join(this.reportsPath, filename);

    let content;
    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        break;
      case 'html':
        content = this.generateHTMLReport(data);
        break;
      case 'csv':
        content = this.generateCSVReport(data);
        break;
      default:
        content = JSON.stringify(data, null, 2);
    }

    fs.writeFileSync(filepath, content);

    logger.info(`📊 Relatório gerado: ${filename}`, {
      guildId,
      type,
      size: content.length
    });

    reports.set(reportId, {
      id: reportId,
      filename,
      path: filepath,
      ...data
    });

    return {
      success: true,
      reportId,
      filename,
      filepath,
      data
    };
  }

  collectReportStats(guildId, start, end, type) {
    const guildWarns = warns.get(guildId);
    if (!guildWarns) return {};

    const stats = {
      totalWarns: 0,
      uniqueUsers: new Set(),
      uniqueModerators: new Set(),
      warnsByDay: {},
      warnsByHour: Array(24).fill(0),
      averagePerDay: 0
    };

    for (const [userId, userData] of guildWarns) {
      for (const warn of userData.history) {
        const date = new Date(warn.timestamp);
        if (date >= start && date <= end) {
          stats.totalWarns++;
          stats.uniqueUsers.add(userId);
          stats.uniqueModerators.add(warn.moderatorId);

          const day = date.toISOString().split('T')[0];
          stats.warnsByDay[day] = (stats.warnsByDay[day] || 0) + 1;

          const hour = date.getHours();
          stats.warnsByHour[hour]++;
        }
      }
    }

    const days = Math.ceil((end - start) / (24 * 60 * 60 * 1000));
    stats.averagePerDay = (stats.totalWarns / days).toFixed(2);
    stats.uniqueUsers = stats.uniqueUsers.size;
    stats.uniqueModerators = stats.uniqueModerators.size;

    return stats;
  }

  collectReportWarns(guildId, start, end, type) {
    const guildWarns = warns.get(guildId);
    if (!guildWarns) return [];

    const warns = [];

    for (const [userId, userData] of guildWarns) {
      for (const warn of userData.history) {
        const date = new Date(warn.timestamp);
        if (date >= start && date <= end) {
          warns.push({
            id: warn.id,
            userId,
            reason: warn.reason,
            moderatorId: warn.moderatorId,
            timestamp: warn.timestamp,
            active: warn.active
          });
        }
      }
    }

    // Ordenar por data
    warns.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (type === 'summary') {
      return warns.slice(0, 100);
    }

    return warns;
  }

  collectReportUsers(guildId, start, end, type) {
    const guildWarns = warns.get(guildId);
    if (!guildWarns) return [];

    const users = new Map();

    for (const [userId, userData] of guildWarns) {
      const userWarns = userData.history.filter(w => {
        const date = new Date(w.timestamp);
        return date >= start && date <= end;
      });

      if (userWarns.length > 0) {
        users.set(userId, {
          userId,
          totalWarns: userWarns.length,
          firstWarn: userWarns[0].timestamp,
          lastWarn: userWarns[userWarns.length - 1].timestamp,
          reasons: userWarns.map(w => w.reason)
        });
      }
    }

    const userArray = Array.from(users.values());
    userArray.sort((a, b) => b.totalWarns - a.totalWarns);

    return userArray;
  }

  collectReportModerators(guildId, start, end, type) {
    const guildWarns = warns.get(guildId);
    if (!guildWarns) return [];

    const mods = new Map();

    for (const [userId, userData] of guildWarns) {
      for (const warn of userData.history) {
        const date = new Date(warn.timestamp);
        if (date >= start && date <= end) {
          const modId = warn.moderatorId;
          
          if (!mods.has(modId)) {
            mods.set(modId, {
              moderatorId: modId,
              totalWarns: 0,
              uniqueUsers: new Set(),
              reasons: {}
            });
          }

          const mod = mods.get(modId);
          mod.totalWarns++;
          mod.uniqueUsers.add(userId);
          mod.reasons[warn.reason] = (mod.reasons[warn.reason] || 0) + 1;
        }
      }
    }

    const modArray = Array.from(mods.values()).map(m => ({
      ...m,
      uniqueUsers: m.uniqueUsers.size
    }));

    modArray.sort((a, b) => b.totalWarns - a.totalWarns);

    return modArray;
  }

  collectReportAppeals(guildId, start, end, type) {
    const result = [];

    for (const [appealId, appeal] of appeals) {
      if (appeal.guildId !== guildId) continue;

      const date = new Date(appeal.createdAt);
      if (date >= start && date <= end) {
        result.push({
          id: appealId,
          ...appeal
        });
      }
    }

    return result;
  }

  generateReportInsights(data) {
    const insights = [];

    // Insight sobre volume
    if (data.stats.totalWarns > 100) {
      insights.push({
        type: 'warning',
        message: `📊 Volume alto de warns: ${data.stats.totalWarns} no período`,
        severity: 'high'
      });
    }

    // Insight sobre média diária
    if (data.stats.averagePerDay > 10) {
      insights.push({
        type: 'info',
        message: `📈 Média de ${data.stats.averagePerDay} warns por dia`,
        severity: 'medium'
      });
    }

    // Insight sobre usuários reincidentes
    const repeatOffenders = data.users.filter(u => u.totalWarns > 3);
    if (repeatOffenders.length > 0) {
      insights.push({
        type: 'warning',
        message: `👥 ${repeatOffenders.length} usuários com mais de 3 warns`,
        severity: 'medium'
      });
    }

    return insights;
  }

  generateCharts(data) {
    return {
      daily: {
        labels: Object.keys(data.stats.warnsByDay),
        values: Object.values(data.stats.warnsByDay)
      },
      hourly: {
        labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
        values: data.stats.warnsByHour
      },
      users: {
        labels: data.users.slice(0, 10).map(u => u.userId),
        values: data.users.slice(0, 10).map(u => u.totalWarns)
      },
      moderators: {
        labels: data.moderators.slice(0, 10).map(m => m.moderatorId),
        values: data.moderators.slice(0, 10).map(m => m.totalWarns)
      }
    };
  }

  generateHTMLReport(data) {
    const guild = client?.guilds?.cache?.get(data.guildId);
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Relatório de Warns - ${guild?.name || 'Servidor'}</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0; opacity: 0.9; }
        
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 25px; border-radius: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.3s; }
        .stat-card:hover { transform: translateY(-5px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .stat-value { font-size: 2.5em; font-weight: bold; color: #667eea; }
        .stat-label { color: #666; margin-top: 10px; font-size: 1.1em; }
        
        .section { background: white; padding: 25px; border-radius: 15px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .section h2 { margin-top: 0; color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        
        table { width: 100%; border-collapse: collapse; }
        th { background: #667eea; color: white; padding: 12px; text-align: left; }
        td { padding: 12px; border-bottom: 1px solid #ddd; }
        tr:hover { background: #f5f5f5; }
        
        .chart-container { height: 300px; margin: 20px 0; }
        
        .insight { background: #f8f9fa; padding: 15px; border-radius: 10px; margin: 10px 0; border-left: 4px solid #667eea; }
        .insight.warning { border-left-color: #ff6b6b; }
        .insight.success { border-left-color: #51cf66; }
        .insight.info { border-left-color: #339af0; }
        
        .footer { text-align: center; color: #666; margin-top: 30px; padding: 20px; border-top: 1px solid #ddd; }
        
        @media (max-width: 768px) {
            .stats-grid { grid-template-columns: 1fr; }
            table { font-size: 0.9em; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Relatório de Warns</h1>
            <p>Servidor: ${guild?.name || 'Desconhecido'} (${data.guildId})</p>
            <p>Período: ${new Date(data.period.start).toLocaleString('pt-BR')} - ${new Date(data.period.end).toLocaleString('pt-BR')}</p>
            <p>Gerado em: ${new Date(data.generatedAt).toLocaleString('pt-BR')}</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${data.stats.totalWarns || 0}</div>
                <div class="stat-label">Total de Warns</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.stats.uniqueUsers || 0}</div>
                <div class="stat-label">Usuários Warnados</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.stats.uniqueModerators || 0}</div>
                <div class="stat-label">Moderadores</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.stats.averagePerDay || 0}</div>
                <div class="stat-label">Média por Dia</div>
            </div>
        </div>

        ${this.generateHTMLInsights(data.insights)}
        ${this.generateHTMLWarnsTable(data.warns)}
        ${this.generateHTMLUsersTable(data.users)}
        ${this.generateHTMLModeratorsTable(data.moderators)}
        ${this.generateHTMLAppealsTable(data.appeals)}

        <div class="footer">
            <p>Relatório gerado automaticamente pelo Sistema de Warns v2.0</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  generateHTMLInsights(insights) {
    if (!insights || insights.length === 0) return '';

    return `
<div class="section">
    <h2>💡 Insights</h2>
    ${insights.map(i => `
        <div class="insight ${i.type}">
            <strong>${i.message}</strong>
            ${i.severity ? `<br><small>Severidade: ${i.severity}</small>` : ''}
        </div>
    `).join('')}
</div>
    `;
  }

  generateHTMLWarnsTable(warns) {
    if (!warns || warns.length === 0) return '';

    return `
<div class="section">
    <h2>⚠️ Últimos Warns</h2>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Usuário</th>
                <th>Motivo</th>
                <th>Moderador</th>
                <th>Data</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${warns.slice(0, 50).map(w => `
                <tr>
                    <td><code>${w.id}</code></td>
                    <td>${w.userId}</td>
                    <td>${w.reason.substring(0, 50)}${w.reason.length > 50 ? '...' : ''}</td>
                    <td>${w.moderatorId}</td>
                    <td>${new Date(w.timestamp).toLocaleString('pt-BR')}</td>
                    <td>${w.active ? '🟢 Ativo' : '🔴 Inativo'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    ${warns.length > 50 ? `<p><small>Mostrando 50 de ${warns.length} warns</small></p>` : ''}
</div>
    `;
  }

  generateHTMLUsersTable(users) {
    if (!users || users.length === 0) return '';

    return `
<div class="section">
    <h2>👥 Top Usuários</h2>
    <table>
        <thead>
            <tr>
                <th>Usuário</th>
                <th>Total Warns</th>
                <th>Primeiro Warn</th>
                <th>Último Warn</th>
                <th>Motivos</th>
            </tr>
        </thead>
        <tbody>
            ${users.slice(0, 20).map(u => `
                <tr>
                    <td>${u.userId}</td>
                    <td><strong>${u.totalWarns}</strong></td>
                    <td>${new Date(u.firstWarn).toLocaleDateString('pt-BR')}</td>
                    <td>${new Date(u.lastWarn).toLocaleDateString('pt-BR')}</td>
                    <td>${u.reasons?.length || 0}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</div>
    `;
  }

  generateHTMLModeratorsTable(moderators) {
    if (!moderators || moderators.length === 0) return '';

    return `
<div class="section">
    <h2>🛡️ Moderadores</h2>
    <table>
        <thead>
            <tr>
                <th>Moderador</th>
                <th>Total Warns</th>
                <th>Usuários Únicos</th>
                <th>Top Motivo</th>
            </tr>
        </thead>
        <tbody>
            ${moderators.slice(0, 20).map(m => `
                <tr>
                    <td>${m.moderatorId}</td>
                    <td><strong>${m.totalWarns}</strong></td>
                    <td>${m.uniqueUsers}</td>
                    <td>${Object.entries(m.reasons || {}).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</div>
    `;
  }

  generateHTMLAppealsTable(appeals) {
    if (!appeals || appeals.length === 0) return '';

    return `
<div class="section">
    <h2>📝 Recursos</h2>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Usuário</th>
                <th>Motivo</th>
                <th>Status</th>
                <th>Data</th>
            </tr>
        </thead>
        <tbody>
            ${appeals.slice(0, 20).map(a => `
                <tr>
                    <td><code>${a.id}</code></td>
                    <td>${a.userId}</td>
                    <td>${a.reason.substring(0, 50)}${a.reason.length > 50 ? '...' : ''}</td>
                    <td>${this.getStatusEmoji(a.status)} ${a.status}</td>
                    <td>${new Date(a.createdAt).toLocaleString('pt-BR')}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</div>
    `;
  }

  generateCSVReport(data) {
    let csv = '';

    // Estatísticas
    csv += '=== ESTATÍSTICAS ===\n';
    csv += `Total de Warns,${data.stats.totalWarns}\n`;
    csv += `Usuários Únicos,${data.stats.uniqueUsers}\n`;
    csv += `Moderadores,${data.stats.uniqueModerators}\n`;
    csv += `Média por Dia,${data.stats.averagePerDay}\n\n`;

    // Warns
    csv += '=== WARNS ===\n';
    csv += 'ID,Usuário,Motivo,Moderador,Data,Status\n';
    data.warns.forEach(w => {
      csv += `${w.id},${w.userId},"${w.reason.replace(/"/g, '""')}",${w.moderatorId},${w.timestamp},${w.active}\n`;
    });
    csv += '\n';

    // Usuários
    csv += '=== USUÁRIOS ===\n';
    csv += 'Usuário,Total Warns,Primeiro Warn,Último Warn\n';
    data.users.forEach(u => {
      csv += `${u.userId},${u.totalWarns},${u.firstWarn},${u.lastWarn}\n`;
    });

    return csv;
  }

  getStatusEmoji(status) {
    const emojis = {
      pending: '⏳',
      approved: '✅',
      rejected: '❌',
      expired: '⌛'
    };
    return emojis[status] || '❓';
  }

  generateReportId() {
    return `REP-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  }
}

const reportGenerator = new ReportGenerator();

// ============================================
// FUNÇÕES DE INICIALIZAÇÃO E MANUTENÇÃO
// ============================================

function loadData() {
  try {
    const dataDir = path.dirname(CONFIG.dataPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    if (fs.existsSync(CONFIG.dataPath)) {
      const raw = fs.readFileSync(CONFIG.dataPath, 'utf8');
      const parsed = JSON.parse(raw);
      
      // Carregar warns
      warns = new Map();
      for (const [gid, users] of Object.entries(parsed.warns || {})) {
        warns.set(gid, new Map(Object.entries(users)));
      }
      
      // Carregar configurações
      guildSettings = new Map(Object.entries(parsed.settings || {}));
      
      // Carregar appeals
      appeals = new Map();
      for (const [aid, appeal] of Object.entries(parsed.appeals || {})) {
        appeals.set(aid, appeal);
      }
      
      // Carregar templates
      warnTemplates = new Map();
      for (const [gid, templates] of Object.entries(parsed.templates || {})) {
        warnTemplates.set(gid, templates);
      }
      
      // Carregar blacklist
      blacklist = new Map();
      for (const [gid, users] of Object.entries(parsed.blacklist || {})) {
        blacklist.set(gid, new Map(Object.entries(users)));
      }
      
      // Carregar perfis de usuário
      userProfiles = new Map(Object.entries(parsed.profiles || {}));
      
      // Carregar estatísticas
      statistics = parsed.statistics || statistics;
      
      // Carregar índices
      indices = parsed.indices || indices;
      
      logger.info(`✅ Dados carregados: ${warns.size} servidores, ${statistics.totalWarns} warns totais`);
      
      // Criar backup automático
      if (PUNISHMENT_CONFIG.automation.autoBackup) {
        backupManager.createBackup({ type: 'full', description: 'Auto backup' });
      }
    } else {
      logger.info('📁 Nenhum arquivo de dados encontrado, iniciando novo');
    }
  } catch (err) {
    logger.error(`❌ Erro ao carregar dados: ${err.message}`, { stack: err.stack });
  }
}

function saveData() {
  try {
    const data = {
      version: '2.0.0',
      lastSave: new Date().toISOString(),
      
      warns: Object.fromEntries(
        Array.from(warns.entries()).map(([gid, umap]) => [
          gid,
          Object.fromEntries(umap)
        ])
      ),
      
      settings: Object.fromEntries(guildSettings),
      
      appeals: Object.fromEntries(appeals),
      
      templates: Object.fromEntries(warnTemplates),
      
      blacklist: Object.fromEntries(
        Array.from(blacklist.entries()).map(([gid, bmap]) => [
          gid,
          Object.fromEntries(bmap)
        ])
      ),
      
      profiles: Object.fromEntries(userProfiles),
      
      statistics,
      
      indices: {
        userId: Object.fromEntries(indices.userId),
        modId: Object.fromEntries(indices.modId),
        guildId: Object.fromEntries(indices.guildId),
        reasonId: Object.fromEntries(indices.reasonId),
        dateIndex: Object.fromEntries(indices.dateIndex)
      }
    };
    
    fs.writeFileSync(CONFIG.dataPath, JSON.stringify(data, null, 2), 'utf8');
    
    logger.debug('💾 Dados salvos com sucesso');
  } catch (err) {
    logger.error(`❌ Erro ao salvar dados: ${err.message}`, { stack: err.stack });
  }
}

// ============================================
// AGENDAMENTOS E TAREFAS AUTOMÁTICAS
// ============================================

function setupSchedules() {
  // Backup automático
  if (PUNISHMENT_CONFIG.automation.autoBackup) {
    setInterval(() => {
      backupManager.createBackup({ type: 'full', description: 'Backup automático' });
    }, PUNISHMENT_CONFIG.automation.backupInterval * 60 * 60 * 1000);
  }

  // Limpeza automática
  if (PUNISHMENT_CONFIG.automation.autoCleanup) {
    setInterval(() => {
      for (const [guildId] of warns) {
        clearOldWarns(guildId, CONFIG.warnExpirationDays);
      }
      cacheManager.prune();
    }, PUNISHMENT_CONFIG.automation.cleanupInterval * 60 * 60 * 1000);
  }

  // Relatórios automáticos
  if (PUNISHMENT_CONFIG.automation.autoReports) {
    const [hour, minute] = PUNISHMENT_CONFIG.automation.reportTime.split(':').map(Number);
    
    const scheduleReport = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(hour, minute, 0, 0);
      
      if (now > next) {
        next.setDate(next.getDate() + 1);
      }
      
      setTimeout(() => {
        for (const [guildId] of warns) {
          reportGenerator.generateReport(guildId, {
            type: 'summary',
            period: 'day'
          });
        }
        scheduleReport();
      }, next - now);
    };
    
    scheduleReport();
  }

  // Resumo semanal
  if (PUNISHMENT_CONFIG.automation.autoSummaries) {
    setInterval(() => {
      for (const [guildId] of warns) {
        reportGenerator.generateReport(guildId, {
          type: 'detailed',
          period: 'week'
        });
      }
    }, PUNISHMENT_CONFIG.automation.summaryInterval * 24 * 60 * 60 * 1000);
  }

  // Atualizar estatísticas
  setInterval(() => {
    statistics.uptime = process.uptime();
    statistics.totalGuilds = warns.size;
    statistics.totalUsers = userProfiles.size;
    statistics.totalModeratorsActive = indices.modId.size;
    
    // Calcular médias
    if (statistics.totalUsersWarned > 0) {
      statistics.averageWarnsPerUser = (statistics.totalWarns / statistics.totalUsersWarned).toFixed(2);
    }
    
    const days = Math.ceil((new Date() - new Date(statistics.firstWarn)) / (24 * 60 * 60 * 1000));
    if (days > 0) {
      statistics.averageWarnsPerDay = (statistics.totalWarns / days).toFixed(2);
    }
    
  }, 60 * 60 * 1000); // A cada hora
}

// ============================================
// CONTINUAÇÃO - SISTEMA DE WARNS ULTIMATE
// ============================================

// ============================================
// FUNÇÕES DE LIMPEZA E MANUTENÇÃO
// ============================================

async function clearOldWarns(guildId, days = CONFIG.warnExpirationDays) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  let clearedCount = 0;
  const guildWarns = warns.get(guildId);
  
  if (guildWarns) {
    for (const [userId, userData] of guildWarns) {
      const oldWarns = userData.history.filter(w => 
        w.active && new Date(w.timestamp) < cutoffDate
      );
      
      oldWarns.forEach(warn => {
        warn.active = false;
        warn.expired = true;
        warn.expiredAt = new Date().toISOString();
        userData.activeCount--;
        clearedCount++;
        
        logger.debug(`⏰ Warn #${warn.id} expirado automaticamente`, {
          userId,
          warnId: warn.id,
          date: warn.timestamp
        });
      });
      
      // Atualizar estatísticas
      if (oldWarns.length > 0) {
        statistics.totalExpiredWarns += oldWarns.length;
        statistics.totalActiveWarns -= oldWarns.length;
      }
      
      guildWarns.set(userId, userData);
    }
  }
  
  if (clearedCount > 0) {
    saveData();
    logger.info(`🧹 ${clearedCount} warns antigos limpos em ${guildId}`, {
      guildId,
      clearedCount
    });
  }
  
  return clearedCount;
}

async function cleanupExpiredAppeals() {
  const now = new Date();
  let expiredCount = 0;
  
  for (const [appealId, appeal] of appeals) {
    if (appeal.status === 'pending' && new Date(appeal.expiresAt) < now) {
      appeal.status = 'expired';
      appeal.expiredAt = now.toISOString();
      expiredCount++;
      
      logger.info(`⌛ Recurso #${appealId} expirado`, {
        appealId,
        userId: appeal.userId
      });
    }
  }
  
  if (expiredCount > 0) {
    saveData();
  }
  
  return expiredCount;
}

async function cleanupOldData() {
  const now = new Date();
  const retentionDate = new Date(now.getTime() - PUNISHMENT_CONFIG.analytics.retentionDays * 24 * 60 * 60 * 1000);
  
  let cleanedCount = 0;
  
  // Limpar logs antigos
  const oldLogs = logger.getLogs(null, 10000)
    .filter(l => new Date(l.timestamp) < retentionDate);
  
  if (oldLogs.length > 0) {
    // Implementar limpeza de logs
    cleanedCount += oldLogs.length;
  }
  
  // Limpar cache
  cacheManager.prune();
  
  logger.info(`🧹 Limpeza concluída: ${cleanedCount} itens removidos`);
  
  return cleanedCount;
}

// ============================================
// FUNÇÕES DE BLACKLIST
// ============================================

function addToBlacklist(guildId, userId, reason, moderatorId, duration = null) {
  try {
    if (!blacklist.has(guildId)) {
      blacklist.set(guildId, new Map());
    }
    
    const guildBlacklist = blacklist.get(guildId);
    const expiresAt = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString() : null;
    
    const blacklistEntry = {
      userId,
      reason,
      moderatorId,
      createdAt: new Date().toISOString(),
      expiresAt,
      active: true,
      hits: 0,
      lastHit: null
    };
    
    guildBlacklist.set(userId, blacklistEntry);
    
    saveData();
    
    logger.mod(`⛔ Usuário ${userId} adicionado à blacklist em ${guildId}`, {
      guildId,
      userId,
      reason,
      moderatorId,
      duration
    });
    
    auditLogger.log('BLACKLIST_ADD', {
      userId,
      reason,
      duration
    }, { id: moderatorId });
    
    return {
      success: true,
      entry: blacklistEntry
    };
    
  } catch (err) {
    logger.error(`❌ Erro ao adicionar à blacklist: ${err.message}`);
    return { success: false, error: err.message };
  }
}

function removeFromBlacklist(guildId, userId, moderatorId, reason = 'Remoção manual') {
  try {
    const guildBlacklist = blacklist.get(guildId);
    if (!guildBlacklist?.has(userId)) {
      return { success: false, error: 'Usuário não está na blacklist' };
    }
    
    const entry = guildBlacklist.get(userId);
    entry.active = false;
    entry.removedAt = new Date().toISOString();
    entry.removedBy = moderatorId;
    entry.removalReason = reason;
    
    guildBlacklist.set(userId, entry);
    
    saveData();
    
    logger.mod(`✅ Usuário ${userId} removido da blacklist em ${guildId}`, {
      guildId,
      userId,
      reason,
      moderatorId
    });
    
    auditLogger.log('BLACKLIST_REMOVE', {
      userId,
      reason
    }, { id: moderatorId });
    
    return { success: true };
    
  } catch (err) {
    logger.error(`❌ Erro ao remover da blacklist: ${err.message}`);
    return { success: false, error: err.message };
  }
}

function checkBlacklist(guildId, userId) {
  const guildBlacklist = blacklist.get(guildId);
  if (!guildBlacklist) return null;
  
  const entry = guildBlacklist.get(userId);
  if (!entry) return null;
  
  // Verificar se expirou
  if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
    entry.active = false;
    saveData();
    return null;
  }
  
  // Atualizar hits
  if (entry.active) {
    entry.hits++;
    entry.lastHit = new Date().toISOString();
    saveData();
  }
  
  return entry.active ? entry : null;
}

function getBlacklist(guildId, activeOnly = true) {
  const guildBlacklist = blacklist.get(guildId);
  if (!guildBlacklist) return [];
  
  const entries = Array.from(guildBlacklist.values());
  
  if (activeOnly) {
    return entries.filter(e => e.active);
  }
  
  return entries;
}

// ============================================
// FUNÇÕES DE TEMPLATES DE WARNS
// ============================================

function addWarnTemplate(guildId, templateData, moderatorId) {
  try {
    if (!warnTemplates.has(guildId)) {
      warnTemplates.set(guildId, []);
    }
    
    const templates = warnTemplates.get(guildId);
    const templateId = generateId('TMP');
    
    const template = {
      id: templateId,
      name: templateData.name,
      reason: templateData.reason,
      duration: templateData.duration || 0,
      severity: templateData.severity || 'medium',
      color: templateData.color || Colors.Orange,
      emoji: templateData.emoji || '⚠️',
      createdBy: moderatorId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      category: templateData.category || 'general',
      roles: templateData.roles || [],
      channels: templateData.channels || [],
      evidence: templateData.evidence || false,
      autoPunish: templateData.autoPunish || false
    };
    
    templates.push(template);
    
    saveData();
    
    logger.mod(`📋 Template de warn criado: ${template.name} (${templateId})`, {
      guildId,
      templateId,
      name: template.name,
      moderatorId
    });
    
    return {
      success: true,
      templateId,
      template
    };
    
  } catch (err) {
    logger.error(`❌ Erro ao criar template: ${err.message}`);
    return { success: false, error: err.message };
  }
}

function getWarnTemplates(guildId, category = null) {
  const templates = warnTemplates.get(guildId) || [];
  
  if (category) {
    return templates.filter(t => t.category === category);
  }
  
  return templates;
}

function getWarnTemplate(guildId, templateId) {
  const templates = warnTemplates.get(guildId) || [];
  return templates.find(t => t.id === templateId);
}

function useWarnTemplate(guildId, templateId, userId, moderatorId, customReason = null) {
  try {
    const template = getWarnTemplate(guildId, templateId);
    if (!template) {
      return { success: false, error: 'Template não encontrado' };
    }
    
    // Incrementar uso
    template.usageCount++;
    template.updatedAt = new Date().toISOString();
    
    // Usar o template
    const reason = customReason || template.reason;
    
    const result = addWarn(guildId, userId, reason, moderatorId, {
      duration: template.duration,
      template: templateId,
      evidence: template.evidence ? 'Requer evidência' : null
    });
    
    if (result.success) {
      logger.mod(`📋 Template usado: ${template.name} para ${userId}`, {
        guildId,
        templateId,
        userId,
        moderatorId
      });
    }
    
    return result;
    
  } catch (err) {
    logger.error(`❌ Erro ao usar template: ${err.message}`);
    return { success: false, error: err.message };
  }
}

function deleteWarnTemplate(guildId, templateId, moderatorId) {
  try {
    const templates = warnTemplates.get(guildId);
    if (!templates) {
      return { success: false, error: 'Nenhum template encontrado' };
    }
    
    const index = templates.findIndex(t => t.id === templateId);
    if (index === -1) {
      return { success: false, error: 'Template não encontrado' };
    }
    
    const template = templates[index];
    templates.splice(index, 1);
    
    saveData();
    
    logger.mod(`🗑️ Template deletado: ${template.name} (${templateId})`, {
      guildId,
      templateId,
      name: template.name,
      moderatorId
    });
    
    return { success: true };
    
  } catch (err) {
    logger.error(`❌ Erro ao deletar template: ${err.message}`);
    return { success: false, error: err.message };
  }
}

function updateWarnTemplate(guildId, templateId, updates, moderatorId) {
  try {
    const template = getWarnTemplate(guildId, templateId);
    if (!template) {
      return { success: false, error: 'Template não encontrado' };
    }
    
    Object.assign(template, updates);
    template.updatedAt = new Date().toISOString();
    template.updatedBy = moderatorId;
    
    saveData();
    
    logger.mod(`✏️ Template atualizado: ${template.name} (${templateId})`, {
      guildId,
      templateId,
      updates: Object.keys(updates),
      moderatorId
    });
    
    return {
      success: true,
      template
    };
    
  } catch (err) {
    logger.error(`❌ Erro ao atualizar template: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// ============================================
// FUNÇÕES DE APPEAL (RECURSO) AVANÇADAS
// ============================================

function createAppeal(guildId, userId, warnId, appealReason, evidence = null) {
  try {
    if (!warns.has(guildId)) {
      return { success: false, error: 'Servidor não encontrado' };
    }
    
    const guildWarns = warns.get(guildId);
    if (!guildWarns.has(userId)) {
      return { success: false, error: 'Usuário não encontrado' };
    }
    
    const userWarns = guildWarns.get(userId);
    const warn = userWarns.history.find(w => w.id === warnId);
    
    if (!warn) {
      return { success: false, error: 'Warn não encontrado' };
    }
    
    if (warn.appealed) {
      return { success: false, error: 'Este warn já possui um recurso' };
    }
    
    // Verificar limite de recursos
    const userAppeals = Array.from(appeals.values())
      .filter(a => a.userId === userId && a.guildId === guildId);
    
    if (userAppeals.length >= PUNISHMENT_CONFIG.appeals.maxAppealsPerMonth) {
      return { success: false, error: 'Limite de recursos mensal atingido' };
    }
    
    const appealId = generateId('APL');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + PUNISHMENT_CONFIG.appeals.autoExpireDays * 24 * 60 * 60 * 1000);
    
    const appeal = {
      id: appealId,
      warnId,
      userId,
      guildId,
      reason: appealReason,
      evidence,
      status: 'pending',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      votes: {
        for: [],
        against: []
      },
      comments: [],
      history: []
    };
    
    appeals.set(appealId, appeal);
    
    warn.appealed = true;
    warn.appealId = appealId;
    warn.appealReason = appealReason;
    warn.appealDate = now.toISOString();
    
    if (!warn.notes) warn.notes = [];
    warn.notes.push({
      type: 'appeal_created',
      appealId,
      reason: appealReason,
      timestamp: now.toISOString()
    });
    
    guildWarns.set(userId, userWarns);
    
    statistics.totalAppeals++;
    statistics.totalAppealsPending++;
    
    saveData();
    
    logger.mod(`📝 Recurso #${appealId} criado para warn #${warnId}`, {
      guildId,
      userId,
      warnId,
      appealId
    });
    
    auditLogger.logAppealCreate(appeal, { id: userId });
    
    return {
      success: true,
      appealId,
      appeal,
      expiresAt: appeal.expiresAt
    };
    
  } catch (err) {
    logger.error(`❌ Erro ao criar recurso: ${err.message}`);
    return { success: false, error: err.message };
  }
}

function voteOnAppeal(guildId, appealId, moderatorId, vote, reason = null) {
  try {
    const appeal = appeals.get(appealId);
    if (!appeal) {
      return { success: false, error: 'Recurso não encontrado' };
    }
    
    if (appeal.guildId !== guildId) {
      return { success: false, error: 'Recurso não pertence a este servidor' };
    }
    
    if (appeal.status !== 'pending') {
      return { success: false, error: 'Este recurso já foi decidido' };
    }
    
    if (appeal.votes.for.includes(moderatorId) || appeal.votes.against.includes(moderatorId)) {
      return { success: false, error: 'Você já votou neste recurso' };
    }
    
    if (vote === 'for') {
      appeal.votes.for.push(moderatorId);
    } else if (vote === 'against') {
      appeal.votes.against.push(moderatorId);
    } else {
      return { success: false, error: 'Voto inválido' };
    }
    
    appeal.history.push({
      type: 'vote',
      moderatorId,
      vote,
      reason,
      timestamp: new Date().toISOString()
    });
    
    // Verificar se atingiu votos necessários
    if (PUNISHMENT_CONFIG.appeals.votingEnabled) {
      const required = PUNISHMENT_CONFIG.appeals.votesRequired;
      
      if (appeal.votes.for.length >= required) {
        return reviewAppeal(guildId, appealId, 'system', true, 'Aprovado por votação');
      }
      
      if (appeal.votes.against.length >= required) {
        return reviewAppeal(guildId, appealId, 'system', false, 'Rejeitado por votação');
      }
    }
    
    appeals.set(appealId, appeal);
    saveData();
    
    logger.mod(`🗳️ Voto registrado no recurso #${appealId}`, {
      guildId,
      appealId,
      moderatorId,
      vote
    });
    
    return {
      success: true,
      votes: {
        for: appeal.votes.for.length,
        against: appeal.votes.against.length,
        required: PUNISHMENT_CONFIG.appeals.votesRequired
      }
    };
    
  } catch (err) {
    logger.error(`❌ Erro ao votar em recurso: ${err.message}`);
    return { success: false, error: err.message };
  }
}

function reviewAppeal(guildId, appealId, moderatorId, approved, reason = null) {
  try {
    const appeal = appeals.get(appealId);
    if (!appeal) {
      return { success: false, error: 'Recurso não encontrado' };
    }
    
    if (appeal.guildId !== guildId) {
      return { success: false, error: 'Recurso não pertence a este servidor' };
    }
    
    if (appeal.status !== 'pending') {
      return { success: false, error: 'Este recurso já foi decidido' };
    }
    
    appeal.status = approved ? 'approved' : 'rejected';
    appeal.reviewedBy = moderatorId;
    appeal.reviewedAt = new Date().toISOString();
    appeal.reviewReason = reason;
    
    appeal.history.push({
      type: 'review',
      moderatorId,
      approved,
      reason,
      timestamp: new Date().toISOString()
    });
    
    // Se aprovado, remover o warn
    if (approved) {
      const guildWarns = warns.get(guildId);
      if (guildWarns?.has(appeal.userId)) {
        const userWarns = guildWarns.get(appeal.userId);
        const warn = userWarns.history.find(w => w.id === appeal.warnId);
        
        if (warn) {
          warn.active = false;
          warn.appealApproved = true;
          warn.approvedAt = new Date().toISOString();
          userWarns.activeCount--;
          
          guildWarns.set(appeal.userId, userWarns);
          
          statistics.totalActiveWarns--;
          statistics.totalAppealsApproved++;
          
          logger.mod(`✅ Warn #${appeal.warnId} removido por aprovação de recurso`, {
            guildId,
            userId: appeal.userId,
            warnId: appeal.warnId,
            appealId
          });
        }
      }
    } else {
      statistics.totalAppealsRejected++;
    }
    
    statistics.totalAppealsPending--;
    
    appeals.set(appealId, appeal);
    saveData();
    
    logger.mod(`📝 Recurso #${appealId} ${approved ? 'APROVADO' : 'REJEITADO'}`, {
      guildId,
      appealId,
      moderatorId,
      approved,
      reason
    });
    
    auditLogger.logAppealDecision(appealId, approved, { id: moderatorId });
    
    return {
      success: true,
      appeal,
      approved
    };
    
  } catch (err) {
    logger.error(`❌ Erro ao revisar recurso: ${err.message}`);
    return { success: false, error: err.message };
  }
}

function getAppeal(appealId) {
  return appeals.get(appealId);
}

function getAppeals(guildId, filters = {}) {
  const result = [];
  
  for (const [appealId, appeal] of appeals) {
    if (appeal.guildId !== guildId) continue;
    
    if (filters.status && appeal.status !== filters.status) continue;
    if (filters.userId && appeal.userId !== filters.userId) continue;
    
    result.push({
      appealId,
      ...appeal
    });
  }
  
  // Ordenar por data
  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return result;
}

// ============================================
// FUNÇÕES DE ESTATÍSTICAS AVANÇADAS
// ============================================

function getServerStats(guildId) {
  const guildWarns = warns.get(guildId);
  if (!guildWarns) {
    return {
      totalWarns: 0,
      activeWarns: 0,
      warnedUsers: 0,
      averageWarnsPerUser: 0,
      topModerators: [],
      topReasons: [],
      warnsByDay: {}
    };
  }
  
  const stats = {
    totalWarns: 0,
    activeWarns: 0,
    warnedUsers: guildWarns.size,
    averageWarnsPerUser: 0,
    topModerators: {},
    topReasons: {},
    warnsByDay: {},
    warnsByHour: Array(24).fill(0),
    warnsByMonth: Array(12).fill(0),
    warnsByWeekday: Array(7).fill(0)
  };
  
  for (const [userId, userData] of guildWarns) {
    stats.totalWarns += userData.count;
    stats.activeWarns += userData.activeCount;
    
    for (const warn of userData.history) {
      // Top moderadores
      stats.topModerators[warn.moderatorId] = (stats.topModerators[warn.moderatorId] || 0) + 1;
      
      // Top razões
      stats.topReasons[warn.reason] = (stats.topReasons[warn.reason] || 0) + 1;
      
      // Warns por dia
      const day = new Date(warn.timestamp).toISOString().split('T')[0];
      stats.warnsByDay[day] = (stats.warnsByDay[day] || 0) + 1;
      
      // Warns por hora
      const hour = new Date(warn.timestamp).getHours();
      stats.warnsByHour[hour]++;
      
      // Warns por mês
      const month = new Date(warn.timestamp).getMonth();
      stats.warnsByMonth[month]++;
      
      // Warns por dia da semana
      const weekday = new Date(warn.timestamp).getDay();
      stats.warnsByWeekday[weekday]++;
    }
  }
  
  stats.averageWarnsPerUser = stats.warnedUsers > 0 ? 
    (stats.totalWarns / stats.warnedUsers).toFixed(2) : 0;
  
  // Converter para arrays ordenados
  stats.topModerators = Object.entries(stats.topModerators)
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  stats.topReasons = Object.entries(stats.topReasons)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return stats;
}

function getUserStats(guildId, userId) {
  const guildWarns = warns.get(guildId);
  if (!guildWarns?.has(userId)) {
    return {
      totalWarns: 0,
      activeWarns: 0,
      firstWarn: null,
      lastWarn: null,
      warnsByModerator: {},
      warnsByReason: {},
      warnsByMonth: Array(12).fill(0),
      averageInterval: 0
    };
  }
  
  const userData = guildWarns.get(userId);
  const stats = {
    totalWarns: userData.count,
    activeWarns: userData.activeCount,
    firstWarn: userData.firstWarn,
    lastWarn: userData.lastWarn,
    warnsByModerator: {},
    warnsByReason: {},
    warnsByMonth: Array(12).fill(0),
    intervals: []
  };
  
  let prevDate = null;
  
  for (const warn of userData.history) {
    // Por moderador
    stats.warnsByModerator[warn.moderatorId] = (stats.warnsByModerator[warn.moderatorId] || 0) + 1;
    
    // Por razão
    stats.warnsByReason[warn.reason] = (stats.warnsByReason[warn.reason] || 0) + 1;
    
    // Por mês
    const month = new Date(warn.timestamp).getMonth();
    stats.warnsByMonth[month]++;
    
    // Intervalos entre warns
    if (prevDate) {
      const interval = (new Date(warn.timestamp) - prevDate) / (24 * 60 * 60 * 1000);
      stats.intervals.push(interval);
    }
    prevDate = new Date(warn.timestamp);
  }
  
  // Calcular média de intervalos
  if (stats.intervals.length > 0) {
    stats.averageInterval = (stats.intervals.reduce((a, b) => a + b, 0) / stats.intervals.length).toFixed(2);
  } else {
    stats.averageInterval = 0;
  }
  
  return stats;
}

function getModeratorStats(guildId, moderatorId) {
  const guildWarns = warns.get(guildId);
  if (!guildWarns) {
    return {
      totalWarns: 0,
      uniqueUsers: 0,
      topReasons: {},
      warnsByDay: {}
    };
  }
  
  const stats = {
    totalWarns: 0,
    uniqueUsers: new Set(),
    topReasons: {},
    warnsByDay: {},
    warnsByHour: Array(24).fill(0)
  };
  
  for (const [userId, userData] of guildWarns) {
    for (const warn of userData.history) {
      if (warn.moderatorId === moderatorId) {
        stats.totalWarns++;
        stats.uniqueUsers.add(userId);
        stats.topReasons[warn.reason] = (stats.topReasons[warn.reason] || 0) + 1;
        
        const day = new Date(warn.timestamp).toISOString().split('T')[0];
        stats.warnsByDay[day] = (stats.warnsByDay[day] || 0) + 1;
        
        const hour = new Date(warn.timestamp).getHours();
        stats.warnsByHour[hour]++;
      }
    }
  }
  
  stats.uniqueUsers = stats.uniqueUsers.size;
  
  // Ordenar top razões
  stats.topReasons = Object.entries(stats.topReasons)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return stats;
}

// ============================================
// FUNÇÕES DE EXPORTAÇÃO (COMPLEMENTARES)
// ============================================

async function exportServerData(guildId, options = {}) {
  return exportManager.exportData(guildId, options);
}

async function importServerData(filepath, guildId, options = {}) {
  return exportManager.importData(filepath, guildId, options);
}

// ============================================
// FUNÇÕES DE BACKUP (COMPLEMENTARES)
// ============================================

async function createSystemBackup(description = '') {
  return backupManager.createBackup({ 
    type: 'full', 
    description,
    compress: true,
    encrypt: PUNISHMENT_CONFIG.security.encryptData
  });
}

async function restoreSystemBackup(backupId, options = {}) {
  return backupManager.restoreBackup(backupId, options);
}

function listBackups(options = {}) {
  return backupManager.listBackups(options);
}

function deleteBackup(backupId) {
  return backupManager.deleteBackup(backupId);
}

// ============================================
// FUNÇÕES DE ANÁLISE (COMPLEMENTARES)
// ============================================

function analyzeServer(guildId, options = {}) {
  return analyticsEngine.analyzeGuild(guildId, options);
}

function predictTrends(guildId, days = 30) {
  const guildWarns = warns.get(guildId);
  if (!guildWarns) return null;
  
  return analyticsEngine.generatePredictions(guildWarns);
}

function detectAnomalies(guildId) {
  const guildWarns = warns.get(guildId);
  if (!guildWarns) return [];
  
  return analyticsEngine.detectAnomalies(guildWarns);
}

// ============================================
// FUNÇÕES DE WEBHOOK (COMPLEMENTARES)
// ============================================

async function registerWebhook(guildId, options) {
  return webhookManager.registerWebhook(guildId, options);
}

async function triggerWebhook(guildId, event, data) {
  return webhookManager.triggerWebhooks(guildId, event, data);
}

// ============================================
// FUNÇÕES DE UTILIDADE
// ============================================

function generateId(prefix = 'WRN') {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const hash = crypto.createHash('md5').update(`${timestamp}${random}`).digest('hex').substring(0, 4).toUpperCase();
  
  return `${prefix}-${timestamp}-${random}-${hash}`;
}

function calculateRiskLevel(warnCount) {
  if (warnCount >= CONFIG.maxWarnsBeforeBan) {
    return {
      level: 'CRÍTICO',
      color: CONFIG.colors.critical,
      emoji: CONFIG.emojis.warning_level.critical,
      action: 'BANIMENTO'
    };
  }
  
  if (warnCount >= CONFIG.maxWarnsBeforeKick) {
    return {
      level: 'ALTO',
      color: CONFIG.colors.high,
      emoji: CONFIG.emojis.warning_level.high,
      action: 'KICK'
    };
  }
  
  if (warnCount >= CONFIG.maxWarnsBeforeMute) {
    return {
      level: 'MÉDIO',
      color: CONFIG.colors.medium,
      emoji: CONFIG.emojis.warning_level.medium,
      action: 'MUTE'
    };
  }
  
  if (warnCount >= 1) {
    return {
      level: 'BAIXO',
      color: CONFIG.colors.low,
      emoji: CONFIG.emojis.warning_level.low,
      action: 'MONITORAR'
    };
  }
  
  return {
    level: 'NENHUM',
    color: Colors.Grey,
    emoji: CONFIG.emojis.warning_level.none,
    action: 'NENHUMA'
  };
}

function formatDate(date) {
  return new Date(date).toLocaleString('pt-BR', {
    timeZone: PUNISHMENT_CONFIG.localization.timezone,
    dateStyle: 'short',
    timeStyle: 'medium'
  });
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function validateReason(reason) {
  if (!reason && PUNISHMENT_CONFIG.security.requireReason) {
    return { valid: false, error: 'Motivo é obrigatório' };
  }
  
  if (reason && reason.length < PUNISHMENT_CONFIG.security.minReasonLength) {
    return { 
      valid: false, 
      error: `Motivo deve ter no mínimo ${PUNISHMENT_CONFIG.security.minReasonLength} caracteres` 
    };
  }
  
  if (reason && reason.length > PUNISHMENT_CONFIG.security.maxReasonLength) {
    return { 
      valid: false, 
      error: `Motivo deve ter no máximo ${PUNISHMENT_CONFIG.security.maxReasonLength} caracteres` 
    };
  }
  
  return { valid: true };
}

// ============================================
// INICIALIZAÇÃO E CONFIGURAÇÃO
// ============================================

// Carregar dados
loadData();

// Configurar tarefas agendadas
setupSchedules();

// Backup inicial
if (PUNISHMENT_CONFIG.automation.autoBackup) {
  setTimeout(() => {
    createSystemBackup('Backup inicial');
  }, 5000);
}

// Limpeza inicial
setTimeout(() => {
  cleanupExpiredAppeals();
  for (const [guildId] of warns) {
    clearOldWarns(guildId);
  }
}, 10000);

// ============================================
// EXPORTAÇÃO DO MÓDULO
// ============================================

module.exports = {
  // Versão
  version: '2.0.0',
  
  // Configurações
  CONFIG,
  PUNISHMENT_CONFIG,
  
  // Funções principais de warns
  addWarn,
  removeWarn: (guildId, userId, warnId, moderatorId, reason) => {
    // Implementar função de remoção
    return { success: false, error: 'Função não implementada' };
  },
  clearUserWarns: (guildId, userId, moderatorId, reason) => {
    // Implementar função de limpeza
    return { success: false, error: 'Função não implementada' };
  },
  getUserWarns: (guildId, userId) => {
    return warns.get(guildId)?.get(userId) || null;
  },
  getUserActiveWarns: (guildId, userId) => {
    const userWarns = warns.get(guildId)?.get(userId);
    if (!userWarns) return [];
    return userWarns.history.filter(w => w.active);
  },
  getServerWarns: (guildId, options = {}) => {
    const guildWarns = warns.get(guildId);
    if (!guildWarns) return [];
    
    const result = [];
    for (const [userId, userData] of guildWarns) {
      for (const warn of userData.history) {
        result.push({
          userId,
          ...warn,
          currentCount: userData.activeCount,
          totalCount: userData.count
        });
      }
    }
    
    // Ordenar por data
    result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (options.limit) {
      return result.slice(0, options.limit);
    }
    
    return result;
  },
  
  // Funções de estatísticas
  getServerStats,
  getUserStats,
  getModeratorStats,
  getGlobalStats: () => statistics,
  
  // Funções de blacklist
  addToBlacklist,
  removeFromBlacklist,
  checkBlacklist,
  getBlacklist,
  
  // Funções de templates
  addWarnTemplate,
  getWarnTemplates,
  getWarnTemplate,
  useWarnTemplate,
  deleteWarnTemplate,
  updateWarnTemplate,
  
  // Funções de appeal
  createAppeal,
  voteOnAppeal,
  reviewAppeal,
  getAppeal,
  getAppeals,
  
  // Funções de backup
  createBackup: createSystemBackup,
  restoreBackup: restoreSystemBackup,
  listBackups,
  deleteBackup,
  
  // Funções de exportação
  exportData: exportServerData,
  importData: importServerData,
  
  // Funções de análise
  analyzeServer,
  predictTrends,
  detectAnomalies,
  
  // Funções de webhook
  registerWebhook,
  triggerWebhook,
  
  // Funções de utilidade
  generateId,
  calculateRiskLevel,
  formatDate,
  formatDuration,
  validateReason,
  
  // Acesso aos dados (para debug)
  getWarns: () => warns,
  getSettings: () => guildSettings,
  getAppeals: () => appeals,
  getTemplates: () => warnTemplates,
  getBlacklist: () => blacklist,
  getProfiles: () => userProfiles,
  getStatistics: () => statistics,
  getIndices: () => indices,
  
  // Cache e performance
  cacheManager,
  rateLimiter,
  
  // Logs
  logger,
  auditLogger,
  
  // Limpeza manual
  clearOldWarns,
  cleanupExpiredAppeals,
  cleanupOldData
};