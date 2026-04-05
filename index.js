
require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    Collection, 
    PermissionsBitField,
    ChannelType,
    MessageFlags,
    Events,
    ActivityType,
    WebhookClient,
    codeBlock,
    inlineCode,
    time,
    TimestampStyles,
    version as discordVersion
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const os = require('os');

// ============================================
// CONFIGURAÇÃO DO CLIENT
// ============================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent
    ],
    allowedMentions: { 
        parse: ['users', 'roles'], 
        repliedUser: true,
        users: [],
        roles: []
    },
    retryLimit: 3,
    presence: {
        status: 'online',
        activities: [{ name: 'Inicializando...', type: ActivityType.Playing }]
    }
});

// Collections para armazenamento em memória
client.commands = new Collection();
client.slashCommands = new Collection();
client.cooldowns = new Collection();
client.tempReviewData = new Map();
client.userCache = new Map();
client.roleCache = new Map();
client.channelCache = new Map();
client.commandUsage = new Map();
client.rateLimits = new Map();

// ============================================
// VARIÁVEIS DE AMBIENTE COM VALIDAÇÃO
// ============================================
const TOKEN = process.env.TOKEN;
const STAFF_ROLE_IDS = process.env.STAFF_ROLE_IDS ? process.env.STAFF_ROLE_IDS.split(',').map(id => id.trim()).filter(id => id.length > 0) : [];
const REVIEWS_CHANNEL_ID = process.env.REVIEWS_CHANNEL_ID;
const REVIEWS_LOG_CHANNEL_ID = process.env.REVIEWS_LOG_CHANNEL_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

// Validação das variáveis de ambiente
if (!TOKEN) {
    console.error('❌ TOKEN não configurado no arquivo .env');
    process.exit(1);
}
if (!STAFF_ROLE_IDS.length) {
    console.warn('⚠️ Nenhum cargo staff configurado. Os comandos de moderação não funcionarão corretamente.');
}
if (!REVIEWS_CHANNEL_ID) {
    console.warn('⚠️ REVIEWS_CHANNEL_ID não configurado. O sistema de avaliação não funcionará.');
}
if (!REVIEWS_LOG_CHANNEL_ID) {
    console.warn('⚠️ REVIEWS_LOG_CHANNEL_ID não configurado. Os logs de avaliação não serão enviados.');
}
if (!LOG_CHANNEL_ID) {
    console.warn('⚠️ LOG_CHANNEL_ID não configurado. Os logs gerais não serão enviados.');
}

// ============================================
// CONSTANTES DE CONFIGURAÇÃO
// ============================================
const PREFIX = '!';
const EMBED_COLOR = '#341539';
const MAX_FEEDBACK_LENGTH = 700;
const MAX_CLEAR_MESSAGES = 1000;
const MAX_CLEAR_USER_MESSAGES = 500;
const COOLDOWN_DURATION = 3000;
const BACKUP_INTERVAL_HOURS = 24;
const AUTO_DELETE_LOGS_DAYS = 30;
const MAX_REVIEWS_PER_USER_PER_DAY = 10;
const MIN_REVIEWS_FOR_RANKING = 3;
const RANKING_TOP_SIZE = 10;
const WEEKLY_RANKING_TOP = 3;
const CACHE_TTL = 3600000; // 1 hora

// ============================================
// SISTEMA DE ARMAZENAMENTO EM ARQUIVO JSON
// ============================================
const DATA_DIR = path.join(__dirname, 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const LOGS_DIR = path.join(DATA_DIR, 'logs');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const RANKINGS_FILE = path.join(DATA_DIR, 'rankings.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');
const LOGS_FILE = path.join(LOGS_DIR, 'system-logs.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const USER_STATS_FILE = path.join(DATA_DIR, 'user-stats.json');
const WEEKLY_STATS_FILE = path.join(DATA_DIR, 'weekly-stats.json');

// Criar diretórios necessários
const directories = [DATA_DIR, BACKUP_DIR, LOGS_DIR];
directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Diretório criado: ${dir}`);
    }
});

// ============================================
// FUNÇÕES DE LEITURA/ESCRITA DE DADOS
// ============================================

function readJSONFile(filePath, defaultValue = []) {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
            return defaultValue;
        }
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`❌ Erro ao ler arquivo ${filePath}:`, error);
        return defaultValue;
    }
}

function writeJSONFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`❌ Erro ao escrever arquivo ${filePath}:`, error);
        return false;
    }
}

// Funções específicas para cada tipo de dado
function loadReviews() { return readJSONFile(REVIEWS_FILE, []); }
function saveReviews(reviews) { return writeJSONFile(REVIEWS_FILE, reviews); }

function loadRankings() { return readJSONFile(RANKINGS_FILE, []); }
function saveRankings(rankings) { return writeJSONFile(RANKINGS_FILE, rankings); }

function loadStats() { return readJSONFile(STATS_FILE, { reviews: 0, users: {}, lastWeeklyReset: null, botStartTime: Date.now() }); }
function saveStats(stats) { return writeJSONFile(STATS_FILE, stats); }

function loadUserStats() { return readJSONFile(USER_STATS_FILE, {}); }
function saveUserStats(userStats) { return writeJSONFile(USER_STATS_FILE, userStats); }

function loadWeeklyStats() { return readJSONFile(WEEKLY_STATS_FILE, []); }
function saveWeeklyStats(weeklyStats) { return writeJSONFile(WEEKLY_STATS_FILE, weeklyStats); }

function loadConfig() { return readJSONFile(CONFIG_FILE, { autoBackup: true, weeklyRankingEnabled: true, mentionOnRanking: false }); }
function saveConfig(config) { return writeJSONFile(CONFIG_FILE, config); }

// ============================================
// SISTEMA DE LOGS AVANÇADO
// ============================================

class AdvancedLogger {
    constructor() {
        this.logLevels = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3,
            FATAL: 4
        };
        this.currentLevel = this.logLevels.INFO;
    }

    formatMessage(level, message, details = {}) {
        const timestamp = new Date().toISOString();
        const pid = process.pid;
        return `[${timestamp}] [${level}] [PID:${pid}] ${message} ${Object.keys(details).length ? JSON.stringify(details) : ''}`;
    }

    log(level, message, details = {}) {
        const levelValue = this.logLevels[level] || this.logLevels.INFO;
        if (levelValue >= this.currentLevel) {
            const formattedMessage = this.formatMessage(level, message, details);
            if (level === 'ERROR' || level === 'FATAL') {
                console.error(formattedMessage);
            } else if (level === 'WARN') {
                console.warn(formattedMessage);
            } else {
                console.log(formattedMessage);
            }
            
            // Salvar no arquivo de logs
            const logs = this.getLogs();
            logs.push({ level, message, details, timestamp: new Date().toISOString() });
            this.saveLogs(logs.slice(-5000)); // Manter últimos 5000 logs
        }
    }

    getLogs() {
        return readJSONFile(LOGS_FILE, []);
    }

    saveLogs(logs) {
        writeJSONFile(LOGS_FILE, logs);
    }

    debug(message, details = {}) { this.log('DEBUG', message, details); }
    info(message, details = {}) { this.log('INFO', message, details); }
    warn(message, details = {}) { this.log('WARN', message, details); }
    error(message, details = {}) { this.log('ERROR', message, details); }
    fatal(message, details = {}) { this.log('FATAL', message, details); }
}

const logger = new AdvancedLogger();

// ============================================
// FUNÇÕES DE UTILIDADE AVANÇADAS
// ============================================

// Verificar se usuário é staff (qualquer um dos cargos configurados)
function isStaff(member) {
    if (!member || !member.roles) return false;
    return STAFF_ROLE_IDS.some(roleId => member.roles.cache.has(roleId));
}

// Verificar se usuário tem um cargo específico
function hasRole(member, roleId) {
    return member && member.roles && member.roles.cache.has(roleId);
}

// Obter todos os cargos staff
function getStaffRoles(guild) {
    const roles = [];
    for (const roleId of STAFF_ROLE_IDS) {
        const role = guild.roles.cache.get(roleId);
        if (role) roles.push(role);
    }
    return roles;
}

// Obter todos os membros staff
function getAllStaffMembers(guild) {
    const members = new Set();
    for (const roleId of STAFF_ROLE_IDS) {
        const role = guild.roles.cache.get(roleId);
        if (role) {
            role.members.forEach(member => members.add(member));
        }
    }
    return Array.from(members);
}

// Obter cor baseada na nota (0-10)
function getColorByScore(score) {
    if (score >= 0 && score <= 3) return 0xFF0000; // Vermelho
    if (score >= 4 && score <= 6) return 0xFFFF00; // Amarelo
    if (score >= 7 && score <= 8) return 0x00AA00; // Verde claro
    return 0x00FF00; // Verde brilhante
}

// Obter emoji baseado na nota
function getScoreEmoji(score) {
    if (score === 0) return '💀';
    if (score === 1) return '😭';
    if (score === 2) return '😞';
    if (score === 3) return '😐';
    if (score === 4) return '🤔';
    if (score === 5) return '😐';
    if (score === 6) return '🙂';
    if (score === 7) return '😊';
    if (score === 8) return '😃';
    if (score === 9) return '🌟';
    if (score === 10) return '⭐';
    return '📊';
}

// Obter descrição da nota
function getScoreDescription(score) {
    if (score === 0) return 'Precisa melhorar drasticamente';
    if (score === 1) return 'Muito insatisfatório';
    if (score === 2) return 'Insatisfatório';
    if (score === 3) return 'Abaixo da média';
    if (score === 4) return 'Regular baixo';
    if (score === 5) return 'Regular';
    if (score === 6) return 'Regular alto';
    if (score === 7) return 'Bom';
    if (score === 8) return 'Muito bom';
    if (score === 9) return 'Excelente';
    if (score === 10) return 'Perfeito!';
    return 'Nota inválida';
}

// Formatar data em vários formatos
function formatDate(date, format = 'full') {
    const d = new Date(date);
    const formats = {
        short: d.toLocaleDateString('pt-BR'),
        long: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
        full: d.toLocaleString('pt-BR'),
        time: d.toLocaleTimeString('pt-BR'),
        iso: d.toISOString(),
        relative: time(d, TimestampStyles.RelativeTime)
    };
    return formats[format] || formats.full;
}

// Obter número da semana (ISO)
function getWeekNumber(date) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + 3 - (d.getUTCDay() + 6) % 7);
    const week1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getUTCDay() + 6) % 7) / 7);
}

// Obter ano da data
function getYear(date) {
    return new Date(date).getFullYear();
}

// Calcular média de um array
function calculateAverage(numbers) {
    if (!numbers || numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

// Calcular mediana
function calculateMedian(numbers) {
    if (!numbers || numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Calcular desvio padrão
function calculateStandardDeviation(numbers) {
    if (!numbers || numbers.length === 0) return 0;
    const avg = calculateAverage(numbers);
    const squareDiffs = numbers.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(calculateAverage(squareDiffs));
}

// Validar feedback
function validateFeedback(feedback) {
    if (!feedback || feedback.trim().length === 0) return { valid: true, cleaned: '' };
    const cleaned = feedback.trim().substring(0, MAX_FEEDBACK_LENGTH);
    return { valid: true, cleaned };
}

// Verificar cooldown de usuário
function checkCooldown(userId, command) {
    const key = `${userId}-${command}`;
    const cooldown = client.cooldowns.get(key);
    if (cooldown && Date.now() < cooldown) {
        return { onCooldown: true, remaining: Math.ceil((cooldown - Date.now()) / 1000) };
    }
    client.cooldowns.set(key, Date.now() + COOLDOWN_DURATION);
    setTimeout(() => client.cooldowns.delete(key), COOLDOWN_DURATION);
    return { onCooldown: false };
}

// Limpar dados antigos do cache
function cleanCache() {
    const now = Date.now();
    for (const [key, value] of client.userCache) {
        if (value.timestamp && now - value.timestamp > CACHE_TTL) {
            client.userCache.delete(key);
        }
    }
    for (const [key, value] of client.roleCache) {
        if (value.timestamp && now - value.timestamp > CACHE_TTL) {
            client.roleCache.delete(key);
        }
    }
}

// ============================================
// FUNÇÕES DE ESTATÍSTICAS DE USUÁRIO
// ============================================

function calculateUserStats(userId) {
    const reviews = loadReviews();
    const userReviews = reviews.filter(r => r.reviewedId === userId);
    
    if (userReviews.length === 0) {
        return {
            count: 0,
            average: 0,
            median: 0,
            highest: 0,
            lowest: 0,
            standardDeviation: 0,
            recentReviews: [],
            weeklyTrend: 0
        };
    }
    
    const scores = userReviews.map(r => r.score);
    const sortedByDate = [...userReviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Calcular tendência semanal
    const now = new Date();
    const thisWeek = userReviews.filter(r => {
        const reviewDate = new Date(r.createdAt);
        return getWeekNumber(reviewDate) === getWeekNumber(now) && getYear(reviewDate) === getYear(now);
    });
    const lastWeek = userReviews.filter(r => {
        const reviewDate = new Date(r.createdAt);
        const lastWeekNum = getWeekNumber(new Date(now.setDate(now.getDate() - 7)));
        return getWeekNumber(reviewDate) === lastWeekNum && getYear(reviewDate) === getYear(now);
    });
    
    const thisWeekAvg = calculateAverage(thisWeek.map(r => r.score));
    const lastWeekAvg = calculateAverage(lastWeek.map(r => r.score));
    const weeklyTrend = thisWeekAvg - lastWeekAvg;
    
    return {
        count: userReviews.length,
        average: parseFloat(calculateAverage(scores).toFixed(2)),
        median: parseFloat(calculateMedian(scores).toFixed(2)),
        highest: Math.max(...scores),
        lowest: Math.min(...scores),
        standardDeviation: parseFloat(calculateStandardDeviation(scores).toFixed(2)),
        recentReviews: sortedByDate.slice(0, 5),
        weeklyTrend: parseFloat(weeklyTrend.toFixed(2)),
        thisWeekCount: thisWeek.length,
        lastWeekCount: lastWeek.length
    };
}

function calculateReviewerStats(userId) {
    const reviews = loadReviews();
    const userReviews = reviews.filter(r => r.reviewerId === userId);
    
    if (userReviews.length === 0) {
        return { count: 0, averageGiven: 0, mostCommonScore: 0 };
    }
    
    const scores = userReviews.map(r => r.score);
    const scoreFrequency = {};
    scores.forEach(score => {
        scoreFrequency[score] = (scoreFrequency[score] || 0) + 1;
    });
    const mostCommonScore = parseInt(Object.keys(scoreFrequency).reduce((a, b) => scoreFrequency[a] > scoreFrequency[b] ? a : b, 0));
    
    return {
        count: userReviews.length,
        averageGiven: parseFloat(calculateAverage(scores).toFixed(2)),
        mostCommonScore: mostCommonScore
    };
}

// ============================================
// SISTEMA DE RANKING SEMANAL AVANÇADO
// ============================================

async function generateWeeklyRanking() {
    const reviews = loadReviews();
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = getYear(now);
    
    // Filtrar avaliações da semana atual
    const weekReviews = reviews.filter(review => {
        const reviewDate = new Date(review.createdAt);
        return getWeekNumber(reviewDate) === weekNumber && getYear(reviewDate) === year;
    });
    
    if (weekReviews.length === 0) {
        logger.info('Nenhuma avaliação encontrada para o ranking semanal', { weekNumber, year });
        return null;
    }
    
    // Agrupar por usuário avaliado
    const userScores = new Map();
    
    weekReviews.forEach(review => {
        if (!userScores.has(review.reviewedId)) {
            userScores.set(review.reviewedId, {
                userId: review.reviewedId,
                userName: review.reviewedName,
                userTag: review.reviewedTag,
                scores: [],
                totalScore: 0,
                count: 0,
                reviewers: new Set()
            });
        }
        const userData = userScores.get(review.reviewedId);
        userData.scores.push(review.score);
        userData.totalScore += review.score;
        userData.count++;
        userData.reviewers.add(review.reviewerId);
    });
    
    // Calcular métricas e ordenar
    const rankings = [];
    for (const [userId, data] of userScores) {
        const averageScore = data.totalScore / data.count;
        const medianScore = calculateMedian(data.scores);
        const stdDev = calculateStandardDeviation(data.scores);
        
        rankings.push({
            userId: data.userId,
            userName: data.userName,
            userTag: data.userTag,
            averageScore: parseFloat(averageScore.toFixed(2)),
            medianScore: parseFloat(medianScore.toFixed(2)),
            totalReviews: data.count,
            highestScore: Math.max(...data.scores),
            lowestScore: Math.min(...data.scores),
            standardDeviation: parseFloat(stdDev.toFixed(2)),
            uniqueReviewers: data.reviewers.size
        });
    }
    
    // Ordenar por média (decrescente) e depois por quantidade de reviews
    rankings.sort((a, b) => {
        if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
        return b.totalReviews - a.totalReviews;
    });
    
    const topRankings = rankings.slice(0, WEEKLY_RANKING_TOP);
    
    // Salvar ranking histórico
    const rankingsData = loadRankings();
    rankingsData.push({
        weekNumber,
        year,
        weekStart: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()),
        weekEnd: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 6),
        totalReviews: weekReviews.length,
        totalUsers: rankings.length,
        rankings: topRankings,
        allRankings: rankings,
        createdAt: new Date().toISOString()
    });
    saveRankings(rankingsData);
    
    // Salvar estatísticas semanais
    const weeklyStats = loadWeeklyStats();
    weeklyStats.push({
        weekNumber,
        year,
        totalReviews: weekReviews.length,
        totalUsers: rankings.length,
        averageScoreOverall: parseFloat(calculateAverage(weekReviews.map(r => r.score)).toFixed(2)),
        topScore: topRankings[0]?.averageScore || 0,
        generatedAt: new Date().toISOString()
    });
    saveWeeklyStats(weeklyStats.slice(-52)); // Manter último ano
    
    return { topRankings, rankings, weekReviews: weekReviews.length };
}

async function sendWeeklyRanking() {
    const rankingData = await generateWeeklyRanking();
    
    if (!rankingData || rankingData.topRankings.length === 0) {
        logger.info('Nenhum dado de ranking para enviar');
        return false;
    }
    
    const { topRankings, rankings, weekReviews } = rankingData;
    const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
    
    if (!logChannel) {
        logger.error('Canal de logs não encontrado para enviar ranking', { channelId: LOG_CHANNEL_ID });
        return false;
    }
    
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = getYear(now);
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    
    const embed = new EmbedBuilder()
        .setTitle('🏆 Ranking Semanal da Equipe')
        .setDescription(`Semana ${weekNumber} de ${year}\n${formatDate(weekStart, 'short')} - ${formatDate(weekEnd, 'short')}`)
        .setColor(0xFFD700)
        .setThumbnail('https://cdn.discordapp.com/emojis/890915467471437854.png')
        .setTimestamp()
        .setFooter({ text: `Total de avaliações: ${weekReviews} | Sistema de Avaliação Automático` });
    
    const medals = ['🥇', '🥈', '🥉'];
    const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
    const medalNames = ['OURO', 'PRATA', 'BRONZE'];
    
    for (let i = 0; i < topRankings.length; i++) {
        const member = topRankings[i];
        const scoreEmoji = getScoreEmoji(member.averageScore);
        
        embed.addFields({
            name: `${medals[i]} ${medalNames[i]} - ${member.userName}`,
            value: `${scoreEmoji} **Média:** ${member.averageScore}/10\n` +
                   `📊 **Mediana:** ${member.medianScore}/10\n` +
                   `📝 **Total de avaliações:** ${member.totalReviews}\n` +
                   `📈 **Maior nota:** ${member.highestScore} | **Menor nota:** ${member.lowestScore}\n` +
                   `👥 **Avaliadores únicos:** ${member.uniqueReviewers}\n` +
                   `📉 **Desvio padrão:** ${member.standardDeviation}`,
            inline: false
        });
    }
    
    // Adicionar estatísticas adicionais
    const totalAverage = calculateAverage(rankings.map(r => r.averageScore));
    embed.addFields({
        name: '📊 Estatísticas da Semana',
        value: `🏅 **Total de avaliados:** ${rankings.length}\n` +
               `⭐ **Média geral:** ${totalAverage.toFixed(2)}/10\n` +
               `🎯 **Participação:** ${(rankings.length / getAllStaffMembers(logChannel.guild).length * 100).toFixed(1)}% da staff`,
        inline: false
    });
    
    await logChannel.send({ embeds: [embed] });
    
    // Adicionar menções para os top 3 se configurado
    const config = loadConfig();
    if (config.mentionOnRanking) {
        const mentions = topRankings.map(r => `<@${r.userId}>`).join(' ');
        await logChannel.send(`🎉 Parabéns ${mentions}! Continuem com o bom trabalho!`);
    }
    
    logger.info('Ranking semanal enviado com sucesso', { weekNumber, year, topMembers: topRankings.length });
    return true;
}

function checkAndSendRanking() {
    const now = new Date();
    const lastSunday = new Date(now);
    lastSunday.setDate(now.getDate() - now.getDay());
    lastSunday.setHours(23, 59, 0, 0);
    
    const stats = loadStats();
    const lastReset = stats.lastWeeklyReset ? new Date(stats.lastWeeklyReset) : null;
    
    if (!lastReset || lastReset < lastSunday) {
        sendWeeklyRanking();
        stats.lastWeeklyReset = new Date().toISOString();
        saveStats(stats);
        logger.info('Ranking semanal gerado e enviado', { resetDate: lastSunday });
    }
}

// ============================================
// FUNÇÕES DE BACKUP E MANUTENÇÃO
// ============================================

function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData = {
        version: '3.0.0',
        timestamp: new Date().toISOString(),
        botInfo: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            nodeVersion: process.version,
            discordVersion: discordVersion
        },
        data: {
            reviews: loadReviews(),
            rankings: loadRankings(),
            stats: loadStats(),
            userStats: loadUserStats(),
            weeklyStats: loadWeeklyStats(),
            config: loadConfig()
        },
        systemInfo: {
            platform: os.platform(),
            cpus: os.cpus().length,
            totalMemory: os.totalmem(),
            freeMemory: os.freemem()
        }
    };
    
    const backupFile = path.join(BACKUP_DIR, `backup_${timestamp}.json`);
    writeJSONFile(backupFile, backupData);
    
    // Limpar backups antigos (manter últimos 20)
    const backups = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json')).sort();
    while (backups.length > 20) {
        const oldBackup = backups.shift();
        fs.unlinkSync(path.join(BACKUP_DIR, oldBackup));
        logger.info(`Backup antigo removido: ${oldBackup}`);
    }
    
    logger.info(`Backup criado: ${path.basename(backupFile)}`, { size: JSON.stringify(backupData).length });
    return backupFile;
}

function restoreBackup(backupFile) {
    try {
        const backupData = readJSONFile(backupFile, null);
        if (!backupData || !backupData.data) {
            throw new Error('Arquivo de backup inválido');
        }
        
        saveReviews(backupData.data.reviews);
        saveRankings(backupData.data.rankings);
        saveStats(backupData.data.stats);
        saveUserStats(backupData.data.userStats);
        saveWeeklyStats(backupData.data.weeklyStats);
        saveConfig(backupData.data.config);
        
        logger.info(`Backup restaurado: ${path.basename(backupFile)}`);
        return true;
    } catch (error) {
        logger.error('Erro ao restaurar backup', { error: error.message, file: backupFile });
        return false;
    }
}

function cleanupOldData() {
    const reviews = loadReviews();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const newReviews = reviews.filter(review => new Date(review.createdAt) > sixMonthsAgo);
    if (newReviews.length !== reviews.length) {
        saveReviews(newReviews);
        logger.info(`Limpeza de dados antigos: ${reviews.length - newReviews.length} avaliações removidas`);
    }
    
    // Limpar logs antigos
    const logs = logger.getLogs();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - AUTO_DELETE_LOGS_DAYS);
    const newLogs = logs.filter(log => new Date(log.timestamp) > thirtyDaysAgo);
    if (newLogs.length !== logs.length) {
        logger.saveLogs(newLogs);
        logger.info(`Limpeza de logs antigos: ${logs.length - newLogs.length} logs removidos`);
    }
}

// ============================================
// SISTEMA DE MENSAGENS E EMBEDS
// ============================================

class MessageBuilder {
    static createSuccessEmbed(title, description, fields = []) {
        const embed = new EmbedBuilder()
            .setTitle(`✅ ${title}`)
            .setDescription(description)
            .setColor(0x00FF00)
            .setTimestamp();
        
        fields.forEach(field => {
            embed.addFields({ name: field.name, value: field.value, inline: field.inline || false });
        });
        
        return embed;
    }
    
    static createErrorEmbed(title, description, fields = []) {
        const embed = new EmbedBuilder()
            .setTitle(`❌ ${title}`)
            .setDescription(description)
            .setColor(0xFF0000)
            .setTimestamp();
        
        fields.forEach(field => {
            embed.addFields({ name: field.name, value: field.value, inline: field.inline || false });
        });
        
        return embed;
    }
    
    static createWarningEmbed(title, description, fields = []) {
        const embed = new EmbedBuilder()
            .setTitle(`⚠️ ${title}`)
            .setDescription(description)
            .setColor(0xFFFF00)
            .setTimestamp();
        
        fields.forEach(field => {
            embed.addFields({ name: field.name, value: field.value, inline: field.inline || false });
        });
        
        return embed;
    }
    
    static createInfoEmbed(title, description, fields = []) {
        const embed = new EmbedBuilder()
            .setTitle(`ℹ️ ${title}`)
            .setDescription(description)
            .setColor(0x00AAFF)
            .setTimestamp();
        
        fields.forEach(field => {
            embed.addFields({ name: field.name, value: field.value, inline: field.inline || false });
        });
        
        return embed;
    }
}

// ============================================
// SISTEMA DE PERMISSÕES
// ============================================

class PermissionManager {
    static hasPermission(member, permission) {
        if (!member) return false;
        if (member.id === member.guild.ownerId) return true;
        return member.permissions.has(permission);
    }
    
    static canManageMessages(member) { return this.hasPermission(member, PermissionsBitField.Flags.ManageMessages); }
    static canKickMembers(member) { return this.hasPermission(member, PermissionsBitField.Flags.KickMembers); }
    static canBanMembers(member) { return this.hasPermission(member, PermissionsBitField.Flags.BanMembers); }
    static canAdministrator(member) { return this.hasPermission(member, PermissionsBitField.Flags.Administrator); }
    
    static getStaffRolesList(guild) {
        return STAFF_ROLE_IDS.map(id => guild.roles.cache.get(id)).filter(r => r);
    }
}

// ============================================
// COMANDOS SLASH - DEFINIÇÃO
// ============================================

// Comando /clearall
const clearAllCommand = new SlashCommandBuilder()
    .setName('clearall')
    .setDescription('Apaga todas as mensagens de um canal específico')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
    .addChannelOption(option =>
        option.setName('channel')
            .setDescription('Canal que terá as mensagens apagadas')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText))
    .addIntegerOption(option =>
        option.setName('limit')
            .setDescription('Quantidade de mensagens para apagar (padrão: 100, máximo: 1000)')
            .setMinValue(1)
            .setMaxValue(MAX_CLEAR_MESSAGES)
            .setRequired(false))
    .addBooleanOption(option =>
        option.setName('silent')
            .setDescription('Não enviar log da ação?')
            .setRequired(false));

// Comando /clear
const clearCommand = new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Apaga todas as mensagens de um usuário específico')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
    .addUserOption(option =>
        option.setName('user')
            .setDescription('Usuário que terá as mensagens apagadas')
            .setRequired(true))
    .addIntegerOption(option =>
        option.setName('limit')
            .setDescription('Quantidade de mensagens para apagar (padrão: 100, máximo: 500)')
            .setMinValue(1)
            .setMaxValue(MAX_CLEAR_USER_MESSAGES)
            .setRequired(false))
    .addBooleanOption(option =>
        option.setName('silent')
            .setDescription('Não enviar log da ação?')
            .setRequired(false));

// Comando /stats
const statsCommand = new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Mostra estatísticas do sistema de avaliação')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('Usuário para ver estatísticas (opcional)')
            .setRequired(false))
    .addStringOption(option =>
        option.setName('period')
            .setDescription('Período das estatísticas')
            .setRequired(false)
            .addChoices(
                { name: 'Geral', value: 'all' },
                { name: 'Esta semana', value: 'week' },
                { name: 'Este mês', value: 'month' }
            ));

// Comando /ranking
const rankingCommand = new SlashCommandBuilder()
    .setName('ranking')
    .setDescription('Mostra o ranking atual da semana')
    .addIntegerOption(option =>
        option.setName('week')
            .setDescription('Número da semana (opcional)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(52))
    .addIntegerOption(option =>
        option.setName('year')
            .setDescription('Ano (opcional)')
            .setRequired(false)
            .setMinValue(2020)
            .setMaxValue(2030));

// Comando /review
const reviewCommand = new SlashCommandBuilder()
    .setName('review')
    .setDescription('Ver avaliações de um usuário')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('Usuário para ver avaliações')
            .setRequired(true));

// Comando /botinfo
const botInfoCommand = new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Mostra informações detalhadas do bot');

// Comando /backup (staff apenas)
const backupCommand = new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Gerencia backups do sistema (Staff)')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addSubcommand(sub => sub.setName('create').setDescription('Cria um novo backup'))
    .addSubcommand(sub => sub.setName('list').setDescription('Lista backups disponíveis'))
    .addSubcommand(sub => sub.setName('restore').setDescription('Restaura um backup')
        .addStringOption(opt => opt.setName('file').setDescription('Nome do arquivo de backup').setRequired(true)));

// Comando /config (staff apenas)
const configCommand = new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configura o bot (Staff)')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addSubcommand(sub => sub.setName('show').setDescription('Mostra configurações atuais'))
    .addSubcommand(sub => sub.setName('set').setDescription('Define uma configuração')
        .addStringOption(opt => opt.setName('key').setDescription('Chave da configuração').setRequired(true))
        .addStringOption(opt => opt.setName('value').setDescription('Valor da configuração').setRequired(true)));

// Registrar todos os comandos
const commands = [
    clearAllCommand, 
    clearCommand, 
    statsCommand, 
    rankingCommand, 
    reviewCommand, 
    botInfoCommand,
    backupCommand,
    configCommand
];

// ============================================
// EVENTO: READY
// ============================================

client.once('ready', async () => {
    const startTime = Date.now();
    
    console.log('='.repeat(60));
    console.log(`🤖 Bot logado como ${client.user.tag}`);
    console.log(`📡 ID: ${client.user.id}`);
    console.log(`🕐 Inicializado em: ${formatDate(new Date(), 'full')}`);
    console.log('='.repeat(60));
    
    // Registrar comandos slash
    try {
        const rest = new REST({ version: '10' }).setToken(TOKEN);
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands.map(cmd => cmd.toJSON()) }
        );
        console.log('✅ Comandos slash registrados globalmente');
        logger.info('Comandos slash registrados', { count: commands.length });
    } catch (error) {
        console.error('❌ Erro ao registrar comandos:', error);
        logger.error('Erro ao registrar comandos slash', { error: error.message });
    }
    
    // Configurar canal de avaliações
    await setupReviewsChannel();
    
    // Iniciar sistema de ranking semanal
    setupWeeklyRankingSystem();
    
    // Iniciar sistema de backup automático
    setupAutoBackup();
    
    // Iniciar limpeza periódica
    setupPeriodicCleanup();
    
    // Atualizar status
    setupStatusRotation();
    
    // Criar backup inicial
    setTimeout(() => {
        createBackup();
        cleanupOldData();
    }, 10000);
    
    const loadTime = Date.now() - startTime;
    console.log(`🚀 Bot totalmente carregado em ${loadTime}ms`);
    logger.info('Bot inicializado completamente', { loadTime, guilds: client.guilds.cache.size });
});

// ============================================
// CONFIGURAÇÃO DO CANAL DE AVALIAÇÕES
// ============================================

async function setupReviewsChannel() {
    const channel = client.channels.cache.get(REVIEWS_CHANNEL_ID);
    if (!channel) {
        logger.error('Canal de avaliações não encontrado', { channelId: REVIEWS_CHANNEL_ID });
        return;
    }
    
    const guild = channel.guild;
    const staffRoles = getStaffRoles(guild);
    
    // Criar embed principal
    const embed = new EmbedBuilder()
        .setTitle('📊 Sistema de Avaliação da Equipe')
        .setDescription('Clique no botão abaixo para avaliar um membro da nossa equipe!')
        .setColor(EMBED_COLOR)
        .setThumbnail(guild.iconURL({ dynamic: true }) || client.user.displayAvatarURL())
        .addFields(
            { 
                name: '📋 Como funciona', 
                value: '```\n1️⃣ Selecione o cargo do membro\n2️⃣ Escolha o membro que deseja avaliar\n3️⃣ Selecione uma nota de 0 a 10\n4️⃣ Escreva seu feedback (opcional)\n5️⃣ Envie sua avaliação\n```', 
                inline: false 
            },
            { 
                name: '🎯 Quem pode avaliar', 
                value: `Apenas membros com um dos seguintes cargos podem avaliar:\n${staffRoles.map(r => `• ${r.name} (${r.members.size} membros)`).join('\n') || '• Nenhum cargo configurado'}`, 
                inline: false 
            },
            { 
                name: '⭐ Sistema de Notas', 
                value: '🔴 **0-3:** Insatisfatório - Precisa melhorar\n🟡 **4-6:** Regular - Bom, mas pode melhorar\n🟢 **7-10:** Excelente - Ótimo trabalho!', 
                inline: false 
            },
            { 
                name: '📈 Estatísticas', 
                value: `📝 Total de avaliações: ${loadReviews().length}\n👥 Membros avaliados: ${Object.keys(loadUserStats()).length}\n🏆 Ranking semanal: Ativo`, 
                inline: false 
            }
        )
        .setFooter({ text: `Sistema de Avaliação • ${guild.name}`, iconURL: guild.iconURL() })
        .setTimestamp();
    
    const button = new ButtonBuilder()
        .setCustomId('open_review_menu')
        .setLabel('🛠 Avaliar equipe')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('⭐');
    
    const row = new ActionRowBuilder().addComponents(button);
    
    // Limpar mensagens antigas do bot
    try {
        const messages = await channel.messages.fetch({ limit: 50 });
        const botMessages = messages.filter(m => m.author.id === client.user.id);
        for (const msg of botMessages.values()) {
            await msg.delete().catch(() => {});
        }
    } catch (error) {
        logger.warn('Erro ao limpar mensagens antigas', { error: error.message });
    }
    
    await channel.send({ embeds: [embed], components: [row] });
    logger.info('Canal de avaliações configurado', { channelId: REVIEWS_CHANNEL_ID });
}

// ============================================
// SISTEMAS AUTOMÁTICOS
// ============================================

function setupWeeklyRankingSystem() {
    // Verificar a cada hora se precisa enviar ranking
    setInterval(() => {
        checkAndSendRanking();
    }, 60 * 60 * 1000);
    
    // Verificar imediatamente
    checkAndSendRanking();
    logger.info('Sistema de ranking semanal inicializado');
}

function setupAutoBackup() {
    // Backup a cada BACKUP_INTERVAL_HOURS horas
    setInterval(() => {
        createBackup();
    }, BACKUP_INTERVAL_HOURS * 60 * 60 * 1000);
    
    logger.info(`Sistema de backup automático inicializado (a cada ${BACKUP_INTERVAL_HOURS}h)`);
}

function setupPeriodicCleanup() {
    // Limpeza diária às 04:00
    setInterval(() => {
        const now = new Date();
        if (now.getHours() === 4 && now.getMinutes() === 0) {
            cleanupOldData();
            cleanCache();
            logger.info('Limpeza periódica executada');
        }
    }, 60 * 60 * 1000);
}

function setupStatusRotation() {
    const activities = [
        { name: `${STAFF_ROLE_IDS.length} cargos da staff`, type: ActivityType.Watching },
        { name: '/clearall | /clear', type: ActivityType.Listening },
        { name: 'Sistema de Avaliação', type: ActivityType.Playing },
        { name: `${loadReviews().length} avaliações`, type: ActivityType.Watching },
        { name: 'Avalie sua equipe!', type: ActivityType.Competing }
    ];
    
    let index = 0;
    setInterval(() => {
        const activity = activities[index % activities.length];
        client.user.setPresence({
            activities: [activity],
            status: 'online'
        });
        index++;
    }, 15000);
    
    logger.info('Sistema de status rotativo inicializado');
}

// ============================================
// HANDLER: COMANDOS SLASH
// ============================================

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    const { commandName, member, options } = interaction;
    
    // Verificar permissão para comandos de moderação
    if (commandName === 'clearall' || commandName === 'clear' || commandName === 'backup' || commandName === 'config') {
        if (!isStaff(member)) {
            return interaction.reply({
                embeds: [MessageBuilder.createErrorEmbed(
                    'Permissão Negada',
                    'Você não tem permissão para usar este comando! Apenas membros da staff podem usar.'
                )],
                ephemeral: true
            });
        }
    }
    
    // Verificar cooldown
    const cooldown = checkCooldown(interaction.user.id, commandName);
    if (cooldown.onCooldown) {
        return interaction.reply({
            embeds: [MessageBuilder.createWarningEmbed(
                'Aguarde!',
                `Você está em cooldown. Tente novamente em ${cooldown.remaining} segundos.`
            )],
            ephemeral: true
        });
    }
    
    // ========== COMANDO /clearall ==========
    if (commandName === 'clearall') {
        const channel = options.getChannel('channel');
        const limit = options.getInteger('limit') || 100;
        const silent = options.getBoolean('silent') || false;
        
        if (!channel.isTextBased()) {
            return interaction.reply({
                embeds: [MessageBuilder.createErrorEmbed('Canal Inválido', 'Este não é um canal de texto válido!')],
                ephemeral: true
            });
        }
        
        await interaction.reply({
            embeds: [MessageBuilder.createInfoEmbed('Processando', `🔄 Apagando até ${limit} mensagens do canal ${channel}...`)],
            ephemeral: true
        });
        
        try {
            let deletedCount = 0;
            let fetched;
            let remaining = limit;
            
            while (remaining > 0) {
                const fetchLimit = Math.min(remaining, 100);
                fetched = await channel.messages.fetch({ limit: fetchLimit });
                
                if (fetched.size === 0) break;
                
                const deleted = await channel.bulkDelete(fetched, true);
                deletedCount += deleted.size;
                remaining -= deleted.size;
                
                if (fetched.size < fetchLimit) break;
            }
            
            await interaction.editReply({
                embeds: [MessageBuilder.createSuccessEmbed(
                    'Limpeza Concluída',
                    `✅ ${deletedCount} mensagens foram apagadas do canal ${channel}!`
                )]
            });
            
            if (!silent) {
                const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('📝 Ação de Moderação')
                        .setColor(0xFFA500)
                        .addFields(
                            { name: '👮 Ação', value: 'Limpeza de Canal', inline: true },
                            { name: '👤 Staff', value: member.user.tag, inline: true },
                            { name: '📺 Canal', value: channel.toString(), inline: true },
                            { name: '🗑️ Mensagens', value: deletedCount.toString(), inline: true },
                            { name: '🕐 Data', value: formatDate(new Date(), 'full'), inline: true }
                        )
                        .setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
            
            logger.info('Comando /clearall executado', { 
                moderator: member.user.tag, 
                channel: channel.name, 
                messagesDeleted: deletedCount 
            });
            
        } catch (error) {
            logger.error('Erro ao executar /clearall', { error: error.message });
            await interaction.editReply({
                embeds: [MessageBuilder.createErrorEmbed(
                    'Erro',
                    '❌ Erro ao apagar mensagens! Mensagens podem ser muito antigas (mais de 14 dias) ou você não tem permissão.'
                )]
            });
        }
    }
    
    // ========== COMANDO /clear ==========
    else if (commandName === 'clear') {
        const targetUser = options.getUser('user');
        const limit = options.getInteger('limit') || 100;
        const silent = options.getBoolean('silent') || false;
        const channel = interaction.channel;
        
        await interaction.reply({
            embeds: [MessageBuilder.createInfoEmbed('Processando', `🔄 Apagando até ${limit} mensagens de ${targetUser.tag}...`)],
            ephemeral: true
        });
        
        try {
            let deletedCount = 0;
            let fetched;
            let remaining = limit;
            
            while (remaining > 0) {
                const fetchLimit = Math.min(remaining, 100);
                fetched = await channel.messages.fetch({ limit: fetchLimit });
                const messagesToDelete = fetched.filter(msg => msg.author.id === targetUser.id);
                
                if (messagesToDelete.size === 0) break;
                
                const deleted = await channel.bulkDelete(messagesToDelete, true);
                deletedCount += deleted.size;
                remaining -= deleted.size;
            }
            
            await interaction.editReply({
                embeds: [MessageBuilder.createSuccessEmbed(
                    'Limpeza Concluída',
                    `✅ ${deletedCount} mensagens de ${targetUser.tag} foram apagadas!`
                )]
            });
            
            if (!silent) {
                const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('📝 Ação de Moderação')
                        .setColor(0xFFA500)
                        .addFields(
                            { name: '👮 Ação', value: 'Limpeza de Usuário', inline: true },
                            { name: '👤 Staff', value: member.user.tag, inline: true },
                            { name: '🎯 Alvo', value: targetUser.tag, inline: true },
                            { name: '🗑️ Mensagens', value: deletedCount.toString(), inline: true },
                            { name: '🕐 Data', value: formatDate(new Date(), 'full'), inline: true }
                        )
                        .setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
            
            logger.info('Comando /clear executado', { 
                moderator: member.user.tag, 
                target: targetUser.tag, 
                messagesDeleted: deletedCount 
            });
            
        } catch (error) {
            logger.error('Erro ao executar /clear', { error: error.message });
            await interaction.editReply({
                embeds: [MessageBuilder.createErrorEmbed(
                    'Erro',
                    '❌ Erro ao apagar mensagens! Mensagens podem ser muito antigas (mais de 14 dias).'
                )]
            });
        }
    }
    
    // ========== COMANDO /stats ==========
    else if (commandName === 'stats') {
        const targetUser = options.getUser('user') || interaction.user;
        const period = options.getString('period') || 'all';
        
        let reviews = loadReviews();
        const now = new Date();
        
        if (period === 'week') {
            const weekNumber = getWeekNumber(now);
            const year = getYear(now);
            reviews = reviews.filter(r => {
                const reviewDate = new Date(r.createdAt);
                return getWeekNumber(reviewDate) === weekNumber && getYear(reviewDate) === year;
            });
        } else if (period === 'month') {
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            reviews = reviews.filter(r => {
                const reviewDate = new Date(r.createdAt);
                return reviewDate.getMonth() === currentMonth && reviewDate.getFullYear() === currentYear;
            });
        }
        
        const userReviews = reviews.filter(r => r.reviewedId === targetUser.id);
        const stats = calculateUserStats(targetUser.id);
        const reviewerStats = calculateReviewerStats(targetUser.id);
        
        const embed = new EmbedBuilder()
            .setTitle(`📊 Estatísticas de ${targetUser.tag}`)
            .setColor(getColorByScore(stats.average))
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '📝 Total de avaliações recebidas', value: stats.count.toString(), inline: true },
                { name: '⭐ Média de notas', value: stats.average.toString(), inline: true },
                { name: '📊 Mediana', value: stats.median.toString(), inline: true },
                { name: '📈 Maior nota', value: stats.highest.toString(), inline: true },
                { name: '📉 Menor nota', value: stats.lowest.toString(), inline: true },
                { name: '📉 Desvio padrão', value: stats.standardDeviation.toString(), inline: true },
                { name: '📊 Avaliações feitas', value: reviewerStats.count.toString(), inline: true },
                { name: '⭐ Média de notas dadas', value: reviewerStats.averageGiven.toString(), inline: true }
            )
            .setFooter({ text: `Período: ${period === 'all' ? 'Geral' : period === 'week' ? 'Esta semana' : 'Este mês'}` })
            .setTimestamp();
        
        // Adicionar últimas avaliações
        if (stats.recentReviews.length > 0) {
            const recentText = stats.recentReviews.slice(0, 3).map(r => {
                const emoji = getScoreEmoji(r.score);
                return `${emoji} **${r.score}/10** - ${r.feedback.substring(0, 50)}${r.feedback.length > 50 ? '...' : ''}\n*por ${r.reviewerName}*`;
            }).join('\n\n');
            embed.addFields({ name: '📋 Últimas avaliações', value: recentText, inline: false });
        }
        
        await interaction.reply({ embeds: [embed] });
        logger.debug('Comando /stats executado', { user: targetUser.tag, period });
    }
    
    // ========== COMANDO /ranking ==========
    else if (commandName === 'ranking') {
        const weekNum = options.getInteger('week');
        const yearNum = options.getInteger('year') || getYear(new Date());
        
        let rankingsData;
        
        if (weekNum) {
            const rankings = loadRankings();
            rankingsData = rankings.find(r => r.weekNumber === weekNum && r.year === yearNum);
        } else {
            const now = new Date();
            const currentWeek = getWeekNumber(now);
            rankingsData = (await generateWeeklyRanking());
        }
        
        if (!rankingsData || (rankingsData.rankings && rankingsData.rankings.length === 0)) {
            return interaction.reply({
                embeds: [MessageBuilder.createWarningEmbed(
                    'Sem Dados',
                    `Nenhum dado de ranking encontrado${weekNum ? ` para a semana ${weekNum} de ${yearNum}` : ' para esta semana'}.`
                )],
                ephemeral: true
            });
        }
        
        const rankings = rankingsData.rankings || rankingsData.topRankings || [];
        const weekNumber = rankingsData.weekNumber || weekNum;
        const year = rankingsData.year || yearNum;
        
        const embed = new EmbedBuilder()
            .setTitle('🏆 Ranking da Semana')
            .setDescription(`Semana ${weekNumber} de ${year}\nTotal de avaliações: ${rankingsData.totalReviews || rankingsData.weekReviews || 'N/A'}`)
            .setColor(0xFFD700)
            .setTimestamp();
        
        const medals = ['🥇', '🥈', '🥉', '📊', '📊'];
        for (let i = 0; i < Math.min(rankings.length, 10); i++) {
            const r = rankings[i];
            const medal = medals[i] || `${i + 1}º`;
            embed.addFields({
                name: `${medal} ${r.userName}`,
                value: `⭐ Média: ${r.averageScore}/10 | 📝 ${r.totalReviews} avaliação(ões)`,
                inline: false
            });
        }
        
        await interaction.reply({ embeds: [embed] });
        logger.debug('Comando /ranking executado', { weekNumber, year });
    }
    
    // ========== COMANDO /review ==========
    else if (commandName === 'review') {
        const targetUser = options.getUser('user');
        const reviews = loadReviews();
        const userReviews = reviews.filter(r => r.reviewedId === targetUser.id);
        
        if (userReviews.length === 0) {
            return interaction.reply({
                embeds: [MessageBuilder.createWarningEmbed('Sem Avaliações', `Nenhuma avaliação encontrada para ${targetUser.tag}.`)],
                ephemeral: true
            });
        }
        
        const stats = calculateUserStats(targetUser.id);
        
        const embed = new EmbedBuilder()
            .setTitle(`📝 Avaliações de ${targetUser.tag}`)
            .setColor(getColorByScore(stats.average))
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '📊 Total de avaliações', value: stats.count.toString(), inline: true },
                { name: '⭐ Média', value: stats.average.toString(), inline: true },
                { name: '📈 Melhor nota', value: stats.highest.toString(), inline: true },
                { name: '📉 Pior nota', value: stats.lowest.toString(), inline: true }
            )
            .setTimestamp();
        
        // Adicionar últimas 5 avaliações
        const last5 = userReviews.slice(-5).reverse();
        if (last5.length > 0) {
            const reviewsText = last5.map(r => {
                const emoji = getScoreEmoji(r.score);
                return `${emoji} **${r.score}/10** - ${r.feedback.substring(0, 100)}${r.feedback.length > 100 ? '...' : ''}\n*por ${r.reviewerName} em ${formatDate(r.createdAt, 'short')}*`;
            }).join('\n\n---\n\n');
            
            embed.addFields({ name: '📋 Últimas avaliações', value: reviewsText, inline: false });
        }
        
        await interaction.reply({ embeds: [embed] });
        logger.debug('Comando /review executado', { target: targetUser.tag });
    }
    
    // ========== COMANDO /botinfo ==========
    else if (commandName === 'botinfo') {
        const reviews = loadReviews();
        const stats = loadStats();
        const uptime = process.uptime();
        const memory = process.memoryUsage();
        
        const embed = new EmbedBuilder()
            .setTitle('🤖 Informações do Bot')
            .setDescription('Bot de avaliação para equipes Discord')
            .setColor(EMBED_COLOR)
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '📊 Estatísticas', value: `📝 Total de avaliações: ${reviews.length}\n👥 Usuários avaliados: ${Object.keys(stats.users).length}\n🔧 Cargos Staff: ${STAFF_ROLE_IDS.length}\n📡 Servidores: ${client.guilds.cache.size}`, inline: true },
                { name: '⏰ Sistema', value: `⏱️ Uptime: ${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h ${Math.floor((uptime % 3600) / 60)}m\n💾 Memória: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB\n🖥️ Node.js: ${process.version}\n📦 Discord.js: ${discordVersion}`, inline: true },
                { name: '🛠️ Comandos', value: `🔹 /clearall - Limpar canal\n🔹 /clear - Limpar usuário\n🔹 /stats - Estatísticas\n🔹 /ranking - Ranking semanal\n🔹 /review - Ver avaliações`, inline: false }
            )
            .setFooter({ text: `Bot criado para avaliação de equipes | ID: ${client.user.id}` })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
        logger.debug('Comando /botinfo executado');
    }
    
    // ========== COMANDO /backup ==========
    else if (commandName === 'backup') {
        const subcommand = options.getSubcommand();
        
        if (subcommand === 'create') {
            const backupFile = createBackup();
            await interaction.reply({
                embeds: [MessageBuilder.createSuccessEmbed('Backup Criado', `Backup criado com sucesso!\nArquivo: ${path.basename(backupFile)}`)],
                ephemeral: true
            });
        } 
        else if (subcommand === 'list') {
            const backups = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json')).sort().reverse();
            
            if (backups.length === 0) {
                return interaction.reply({
                    embeds: [MessageBuilder.createWarningEmbed('Sem Backups', 'Nenhum backup encontrado.')],
                    ephemeral: true
                });
            }
            
            const backupList = backups.slice(0, 10).map((f, i) => {
                const stats = fs.statSync(path.join(BACKUP_DIR, f));
                return `${i + 1}. ${f} - ${(stats.size / 1024).toFixed(2)} KB - ${formatDate(stats.mtime, 'full')}`;
            }).join('\n');
            
            const embed = MessageBuilder.createInfoEmbed('Backups Disponíveis', `\`\`\`\n${backupList}\n\`\`\``);
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        else if (subcommand === 'restore') {
            const fileName = options.getString('file');
            const backupPath = path.join(BACKUP_DIR, fileName);
            
            if (!fs.existsSync(backupPath)) {
                return interaction.reply({
                    embeds: [MessageBuilder.createErrorEmbed('Backup Não Encontrado', `Arquivo ${fileName} não encontrado.`)],
                    ephemeral: true
                });
            }
            
            const success = restoreBackup(backupPath);
            if (success) {
                await interaction.reply({
                    embeds: [MessageBuilder.createSuccessEmbed('Backup Restaurado', `Backup ${fileName} restaurado com sucesso!`)],
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    embeds: [MessageBuilder.createErrorEmbed('Erro', `Falha ao restaurar backup ${fileName}.`)],
                    ephemeral: true
                });
            }
        }
    }
    
    // ========== COMANDO /config ==========
    else if (commandName === 'config') {
        const subcommand = options.getSubcommand();
        const config = loadConfig();
        
        if (subcommand === 'show') {
            const embed = new EmbedBuilder()
                .setTitle('⚙️ Configurações do Bot')
                .setColor(EMBED_COLOR)
                .addFields(
                    { name: '🤖 Backup Automático', value: config.autoBackup ? '✅ Ativado' : '❌ Desativado', inline: true },
                    { name: '🏆 Ranking Semanal', value: config.weeklyRankingEnabled ? '✅ Ativado' : '❌ Desativado', inline: true },
                    { name: '📢 Menção no Ranking', value: config.mentionOnRanking ? '✅ Ativado' : '❌ Desativado', inline: true }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        else if (subcommand === 'set') {
            const key = options.getString('key');
            const value = options.getString('value');
            
            const validKeys = ['autoBackup', 'weeklyRankingEnabled', 'mentionOnRanking'];
            if (!validKeys.includes(key)) {
                return interaction.reply({
                    embeds: [MessageBuilder.createErrorEmbed('Chave Inválida', `Chaves válidas: ${validKeys.join(', ')}`)],
                    ephemeral: true
                });
            }
            
            const boolValue = value === 'true' || value === '1' || value === 'on' || value === 'ativado';
            config[key] = boolValue;
            saveConfig(config);
            
            await interaction.reply({
                embeds: [MessageBuilder.createSuccessEmbed('Configuração Atualizada', `${key} agora está ${boolValue ? 'ativado' : 'desativado'}.`)],
                ephemeral: true
            });
            
            logger.info('Configuração alterada', { key, value: boolValue, moderator: member.user.tag });
        }
    }
});

// ============================================
// HANDLER: BOTÕES E MENUS
// ============================================

// Botão para abrir menu de avaliação
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== 'open_review_menu') return;
    
    const member = interaction.member;
    
    if (!isStaff(member)) {
        return interaction.reply({
            embeds: [MessageBuilder.createErrorEmbed(
                'Permissão Negada',
                'Apenas membros da staff podem avaliar outros membros!'
            )],
            ephemeral: true
        });
    }
    
    const guild = interaction.guild;
    const rolesWithMembers = [];
    
    for (const roleId of STAFF_ROLE_IDS) {
        const role = guild.roles.cache.get(roleId);
        if (role) {
            const membersList = role.members.filter(m => m.id !== interaction.user.id);
            if (membersList.size > 0) {
                rolesWithMembers.push({
                    id: role.id,
                    name: role.name,
                    memberCount: membersList.size,
                    members: membersList
                });
            }
        }
    }
    
    if (rolesWithMembers.length === 0) {
        return interaction.reply({
            embeds: [MessageBuilder.createWarningEmbed('Sem Membros', 'Nenhum outro membro da staff disponível para avaliação!')],
            ephemeral: true
        });
    }
    
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_role')
        .setPlaceholder('📌 Selecione um cargo para avaliar')
        .addOptions(
            rolesWithMembers.map(role => ({
                label: role.name.substring(0, 25),
                value: role.id,
                description: `${role.memberCount} membro(s) neste cargo`,
                emoji: '👥'
            }))
        );
    
    const row = new ActionRowBuilder().addComponents(selectMenu);
    
    await interaction.reply({
        content: '**📋 Selecione o cargo do membro que deseja avaliar:**',
        components: [row],
        ephemeral: true
    });
});

// Menu de seleção de cargo
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== 'select_role') return;
    
    const selectedRoleId = interaction.values[0];
    const guild = interaction.guild;
    const role = guild.roles.cache.get(selectedRoleId);
    
    if (!role) {
        return interaction.update({
            content: '❌ Cargo não encontrado!',
            components: [],
            ephemeral: true
        });
    }
    
    const members = role.members.filter(m => m.id !== interaction.user.id);
    
    if (members.size === 0) {
        return interaction.update({
            content: '❌ Não há membros neste cargo para avaliar!',
            components: [],
            ephemeral: true
        });
    }
    
    const userSelectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_user')
        .setPlaceholder('👤 Selecione o usuário para avaliar')
        .addOptions(
            members.map(member => ({
                label: member.user.tag.length > 25 ? member.user.tag.substring(0, 22) + '...' : member.user.tag,
                value: member.id,
                description: `Avaliar ${member.user.displayName}`,
                emoji: '⭐'
            })).slice(0, 25)
        );
    
    const row = new ActionRowBuilder().addComponents(userSelectMenu);
    
    await interaction.update({
        content: `**📌 Cargo selecionado:** ${role.name}\n**👤 Selecione o usuário para avaliar:**`,
        components: [row],
        ephemeral: true
    });
});

// Menu de seleção de usuário
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== 'select_user') return;
    
    const selectedUserId = interaction.values[0];
    const guild = interaction.guild;
    const targetMember = await guild.members.fetch(selectedUserId).catch(() => null);
    
    if (!targetMember) {
        return interaction.update({
            content: '❌ Usuário não encontrado!',
            components: [],
            ephemeral: true
        });
    }
    
    if (targetMember.id === interaction.user.id) {
        return interaction.update({
            content: '❌ Você não pode avaliar a si mesmo!',
            components: [],
            ephemeral: true
        });
    }
    
    // Verificar limite de avaliações por dia
    const reviews = loadReviews();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayReviews = reviews.filter(r => 
        r.reviewerId === interaction.user.id && 
        new Date(r.createdAt) >= today
    );
    
    if (todayReviews.length >= MAX_REVIEWS_PER_USER_PER_DAY) {
        return interaction.update({
            content: `❌ Você atingiu o limite de ${MAX_REVIEWS_PER_USER_PER_DAY} avaliações por dia!`,
            components: [],
            ephemeral: true
        });
    }
    
    // Criar modal para avaliação
    const modal = new ModalBuilder()
        .setCustomId(`review_modal_${selectedUserId}`)
        .setTitle(`Avaliar ${targetMember.user.displayName}`);
    
    const scoreInput = new TextInputBuilder()
        .setCustomId('score')
        .setLabel('Nota (0 a 10)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Digite um número entre 0 e 10')
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(2);
    
    const feedbackInput = new TextInputBuilder()
        .setCustomId('feedback')
        .setLabel('Feedback (máx. 700 caracteres)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('O que você achou? O que podia melhorar?')
        .setRequired(false)
        .setMaxLength(MAX_FEEDBACK_LENGTH);
    
    const firstRow = new ActionRowBuilder().addComponents(scoreInput);
    const secondRow = new ActionRowBuilder().addComponents(feedbackInput);
    
    modal.addComponents(firstRow, secondRow);
    
    client.tempReviewData.set(interaction.user.id, {
        targetId: selectedUserId,
        targetName: targetMember.user.tag,
        targetDisplayName: targetMember.user.displayName,
        timestamp: Date.now()
    });
    
    await interaction.showModal(modal);
});

// Modal de avaliação
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isModalSubmit()) return;
    if (!interaction.customId.startsWith('review_modal_')) return;
    
    const targetId = interaction.customId.replace('review_modal_', '');
    const score = parseInt(interaction.fields.getTextInputValue('score'));
    const feedback = interaction.fields.getTextInputValue('feedback') || 'Sem feedback fornecido';
    
    if (isNaN(score) || score < 0 || score > 10) {
        return interaction.reply({
            embeds: [MessageBuilder.createErrorEmbed('Nota Inválida', 'Por favor, insira um número entre 0 e 10.')],
            ephemeral: true
        });
    }
    
    const tempData = client.tempReviewData.get(interaction.user.id);
    if (!tempData || tempData.targetId !== targetId) {
        return interaction.reply({
            embeds: [MessageBuilder.createErrorEmbed('Sessão Expirada', 'Por favor, inicie uma nova avaliação clicando no botão novamente.')],
            ephemeral: true
        });
    }
    
    const guild = interaction.guild;
    const reviewer = interaction.user;
    const reviewed = await guild.members.fetch(targetId).catch(() => null);
    
    if (!reviewed) {
        return interaction.reply({
            embeds: [MessageBuilder.createErrorEmbed('Usuário Não Encontrado', 'O usuário que você está tentando avaliar não foi encontrado.')],
            ephemeral: true
        });
    }
    
    // Validar feedback
    const validated = validateFeedback(feedback);
    
    // Salvar avaliação
    const reviews = loadReviews();
    const newReview = {
        id: Date.now().toString(),
        reviewerId: reviewer.id,
        reviewedId: reviewed.id,
        reviewerName: reviewer.displayName,
        reviewedName: reviewed.user.displayName,
        reviewerTag: reviewer.tag,
        reviewedTag: reviewed.user.tag,
        score: score,
        feedback: validated.cleaned || 'Sem feedback fornecido',
        createdAt: new Date().toISOString(),
        weekNumber: getWeekNumber(new Date()),
        year: getYear(new Date())
    };
    
    reviews.push(newReview);
    saveReviews(reviews);
    
    // Atualizar estatísticas
    const stats = loadStats();
    stats.reviews = reviews.length;
    if (!stats.users[reviewed.id]) {
        stats.users[reviewed.id] = { name: reviewed.user.tag, reviews: 0, totalScore: 0 };
    }
    stats.users[reviewed.id].reviews++;
    stats.users[reviewed.id].totalScore += score;
    saveStats(stats);
    
    // Atualizar user stats
    const userStats = loadUserStats();
    if (!userStats[reviewed.id]) {
        userStats[reviewed.id] = { received: 0, given: 0 };
    }
    userStats[reviewed.id].received = (userStats[reviewed.id].received || 0) + 1;
    if (!userStats[reviewer.id]) {
        userStats[reviewer.id] = { received: 0, given: 0 };
    }
    userStats[reviewer.id].given = (userStats[reviewer.id].given || 0) + 1;
    saveUserStats(userStats);
    
    // Criar embed para o canal de logs
    const color = getColorByScore(score);
    const scoreEmoji = getScoreEmoji(score);
    const scoreDesc = getScoreDescription(score);
    
    const logEmbed = new EmbedBuilder()
        .setTitle(`${scoreEmoji} Nova Avaliação - ${scoreDesc}`)
        .setColor(color)
        .addFields(
            { name: '👤 Avaliador', value: `<@${reviewer.id}> (${reviewer.tag})`, inline: true },
            { name: '⭐ Avaliado', value: `<@${reviewed.id}> (${reviewed.user.tag})`, inline: true },
            { name: '🎯 Nota', value: `${score}/10`, inline: true },
            { name: '💬 Feedback', value: validated.cleaned.length > 1024 ? validated.cleaned.substring(0, 1021) + '...' : validated.cleaned, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: `ID: ${newReview.id} | Semana ${getWeekNumber(new Date())}` });
    
    const logChannel = client.channels.cache.get(REVIEWS_LOG_CHANNEL_ID);
    if (logChannel) {
        await logChannel.send({ embeds: [logEmbed] });
    }
    
    // Limpar dados temporários
    client.tempReviewData.delete(interaction.user.id);
    
    // Resposta de sucesso
    const successEmbed = new EmbedBuilder()
        .setTitle('✅ Avaliação Enviada!')
        .setDescription(`Sua avaliação para **${reviewed.user.displayName}** foi registrada com sucesso!`)
        .setColor(0x00FF00)
        .addFields(
            { name: 'Nota atribuída', value: `${score}/10 - ${scoreDesc}`, inline: true },
            { name: 'Feedback', value: validated.cleaned.length > 200 ? validated.cleaned.substring(0, 197) + '...' : validated.cleaned, inline: false }
        )
        .setTimestamp();
    
    await interaction.reply({
        embeds: [successEmbed],
        ephemeral: true
    });
    
    logger.info('Nova avaliação criada', { 
        reviewer: reviewer.tag, 
        reviewed: reviewed.user.tag, 
        score 
    });
});

// ============================================
// HANDLER: MENSAGENS DE TEXTO (PREFIXO !)
// ============================================

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;
    
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    // Comando !help
    if (command === 'help') {
        const embed = new EmbedBuilder()
            .setTitle('📚 Central de Ajuda - Comandos Disponíveis')
            .setDescription('Aqui estão todos os comandos que você pode usar:')
            .setColor(EMBED_COLOR)
            .addFields(
                { name: '🔹 Comandos Slash', value: '`/clearall` - Limpar canal (Staff)\n`/clear` - Limpar mensagens de usuário (Staff)\n`/stats` - Ver estatísticas\n`/ranking` - Ver ranking semanal\n`/review` - Ver avaliações de um usuário\n`/botinfo` - Informações do bot', inline: false },
                { name: '🔸 Comandos de Texto', value: '`!help` - Mostra esta mensagem\n`!ping` - Verifica latência\n`!info` - Informações detalhadas\n`!top` - Ranking geral de todos os tempos\n`!review @user` - Ver avaliações\n`!stats @user` - Estatísticas de um usuário', inline: false },
                { name: '⭐ Sistema de Notas', value: '🔴 0-3: Insatisfatório\n🟡 4-6: Regular\n🟢 7-10: Excelente', inline: false }
            )
            .setFooter({ text: `Você está em ${message.guild.name}`, iconURL: message.guild.iconURL() })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
    
    // Comando !ping
    else if (command === 'ping') {
        const sent = await message.reply('🏓 Calculando ping...');
        const latency = sent.createdTimestamp - message.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);
        
        let emoji = '🟢';
        if (apiLatency > 200) emoji = '🟡';
        if (apiLatency > 500) emoji = '🔴';
        
        await sent.edit({
            content: null,
            embeds: [MessageBuilder.createInfoEmbed('🏓 Pong!', `**Latência do bot:** ${latency}ms\n**Latência da API:** ${apiLatency}ms ${emoji}`)]
        });
    }
    
    // Comando !info
    else if (command === 'info') {
        const reviews = loadReviews();
        const stats = loadStats();
        const uptime = process.uptime();
        const memory = process.memoryUsage();
        
        const embed = new EmbedBuilder()
            .setTitle('🤖 Informações do Bot')
            .setDescription('Bot de avaliação profissional para equipes Discord')
            .setColor(EMBED_COLOR)
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '📊 Estatísticas', value: `📝 Avaliações: ${reviews.length}\n👥 Usuários: ${Object.keys(stats.users).length}\n🔧 Cargos Staff: ${STAFF_ROLE_IDS.length}\n📡 Servidores: ${client.guilds.cache.size}`, inline: true },
                { name: '⏰ Sistema', value: `⏱️ Uptime: ${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h ${Math.floor((uptime % 3600) / 60)}m\n💾 RAM: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB\n🖥️ Node: ${process.version}\n📦 Discord.js: v${discordVersion}`, inline: true },
                { name: '🛠️ Funcionalidades', value: '✅ Sistema de avaliação\n✅ Ranking semanal automático\n✅ Comandos de moderação\n✅ Backup automático\n✅ Logs detalhados', inline: false }
            )
            .setFooter({ text: `Bot ID: ${client.user.id} | Desenvolvido para sua comunidade` })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
    
    // Comando !top (ranking geral)
    else if (command === 'top') {
        const reviews = loadReviews();
        const userScores = new Map();
        
        reviews.forEach(review => {
            if (!userScores.has(review.reviewedId)) {
                userScores.set(review.reviewedId, {
                    name: review.reviewedName,
                    tag: review.reviewedTag,
                    totalScore: 0,
                    count: 0
                });
            }
            const data = userScores.get(review.reviewedId);
            data.totalScore += review.score;
            data.count++;
        });
        
        const rankings = [];
        for (const [userId, data] of userScores) {
            rankings.push({
                userId,
                name: data.name,
                tag: data.tag,
                averageScore: parseFloat((data.totalScore / data.count).toFixed(2)),
                totalReviews: data.count
            });
        }
        
        rankings.sort((a, b) => b.averageScore - a.averageScore);
        const top10 = rankings.slice(0, 10);
        
        if (top10.length === 0) {
            return message.reply('📊 Nenhuma avaliação registrada ainda!');
        }
        
        const embed = new EmbedBuilder()
            .setTitle('🏆 Ranking Geral - Top 10 de Todos os Tempos')
            .setDescription(`Total de avaliações: ${reviews.length}`)
            .setColor(0xFFD700)
            .setTimestamp();
        
        for (let i = 0; i < top10.length; i++) {
            const r = top10[i];
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`;
            const scoreEmoji = getScoreEmoji(r.averageScore);
            embed.addFields({
                name: `${medal} ${r.name}`,
                value: `${scoreEmoji} **Média:** ${r.averageScore}/10 | **Avaliações:** ${r.totalReviews}`,
                inline: false
            });
        }
        
        await message.reply({ embeds: [embed] });
    }
    
    // Comando !review (alias para /review)
    else if (command === 'review') {
        const target = message.mentions.users.first();
        if (!target) {
            return message.reply('❌ Por favor, mencione um usuário para ver as avaliações! Ex: `!review @usuario`');
        }
        
        const reviews = loadReviews();
        const userReviews = reviews.filter(r => r.reviewedId === target.id);
        
        if (userReviews.length === 0) {
            return message.reply(`📊 Nenhuma avaliação encontrada para ${target.tag}.`);
        }
        
        const stats = calculateUserStats(target.id);
        
        const embed = new EmbedBuilder()
            .setTitle(`📝 Avaliações de ${target.tag}`)
            .setColor(getColorByScore(stats.average))
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '📊 Total', value: stats.count.toString(), inline: true },
                { name: '⭐ Média', value: stats.average.toString(), inline: true },
                { name: '📈 Melhor', value: stats.highest.toString(), inline: true },
                { name: '📉 Pior', value: stats.lowest.toString(), inline: true },
                { name: '📊 Mediana', value: stats.median.toString(), inline: true },
                { name: '📉 Desvio', value: stats.standardDeviation.toString(), inline: true }
            )
            .setTimestamp();
        
        const last5 = userReviews.slice(-5).reverse();
        if (last5.length > 0) {
            const reviewsText = last5.map(r => {
                const emoji = getScoreEmoji(r.score);
                return `${emoji} **${r.score}/10** - "${r.feedback.substring(0, 80)}${r.feedback.length > 80 ? '...' : '""'}\n*por ${r.reviewerName}*`;
            }).join('\n\n---\n\n');
            
            embed.addFields({ name: '📋 Últimas avaliações', value: reviewsText, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
    
    // Comando !stats (alias para /stats)
    else if (command === 'stats') {
        const target = message.mentions.users.first() || message.author;
        const stats = calculateUserStats(target.id);
        const reviewerStats = calculateReviewerStats(target.id);
        
        const embed = new EmbedBuilder()
            .setTitle(`📊 Estatísticas de ${target.tag}`)
            .setColor(getColorByScore(stats.average))
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '📝 Avaliações recebidas', value: stats.count.toString(), inline: true },
                { name: '⭐ Média recebida', value: stats.average.toString(), inline: true },
                { name: '📊 Mediana', value: stats.median.toString(), inline: true },
                { name: '📈 Melhor nota', value: stats.highest.toString(), inline: true },
                { name: '📉 Pior nota', value: stats.lowest.toString(), inline: true },
                { name: '📉 Desvio padrão', value: stats.standardDeviation.toString(), inline: true },
                { name: '📝 Avaliações feitas', value: reviewerStats.count.toString(), inline: true },
                { name: '⭐ Média das notas dadas', value: reviewerStats.averageGiven.toString(), inline: true }
            )
            .setFooter({ text: `ID: ${target.id}` })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
});

// ============================================
// HANDLER: EVENTOS DO SISTEMA
// ============================================

client.on(Events.GuildMemberAdd, async member => {
    logger.debug('Novo membro entrou no servidor', { user: member.user.tag, guild: member.guild.name });
});

client.on(Events.GuildMemberRemove, async member => {
    logger.debug('Membro saiu do servidor', { user: member.user.tag, guild: member.guild.name });
});

client.on(Events.Error, error => {
    logger.error('Erro no client', { error: error.message });
});

process.on('unhandledRejection', (error) => {
    logger.error('Promise rejection não tratada', { error: error.message, stack: error.stack });
});

process.on('uncaughtException', (error) => {
    logger.fatal('Exceção não capturada', { error: error.message, stack: error.stack });
    createBackup();
    setTimeout(() => {
        process.exit(1);
    }, 5000);
});

// ============================================
// LIMPEZA PERIÓDICA DE DADOS TEMPORÁRIOS
// ============================================

setInterval(() => {
    const now = Date.now();
    for (const [key, value] of client.tempReviewData) {
        if (value.timestamp && now - value.timestamp > 30 * 60 * 1000) {
            client.tempReviewData.delete(key);
        } else if (!value.timestamp) {
            value.timestamp = now;
        }
    }
    
    for (const [key, value] of client.cooldowns) {
        if (value < now) {
            client.cooldowns.delete(key);
        }
    }
    
    cleanCache();
}, 5 * 60 * 1000);

// ============================================
// INICIALIZAÇÃO DO BOT
// ============================================

console.log('='.repeat(60));
console.log('🚀 INICIANDO BOT DE AVALIAÇÃO');
console.log('='.repeat(60));
console.log(`📂 Diretório de dados: ${DATA_DIR}`);
console.log(`🔧 Cargos Staff configurados: ${STAFF_ROLE_IDS.length}`);
console.log(`📺 REVIEWS_CHANNEL_ID: ${REVIEWS_CHANNEL_ID || 'NÃO CONFIGURADO'}`);
console.log(`📝 REVIEWS_LOG_CHANNEL_ID: ${REVIEWS_LOG_CHANNEL_ID || 'NÃO CONFIGURADO'}`);
console.log(`📊 LOG_CHANNEL_ID: ${LOG_CHANNEL_ID || 'NÃO CONFIGURADO'}`);
console.log('='.repeat(60));

client.login(TOKEN).catch(error => {
    console.error('❌ Erro ao fazer login:', error);
    process.exit(1);
});

// ============================================
// EXPORTS PARA TESTES E MÓDULOS EXTERNOS
// ============================================

module.exports = {
    client,
    isStaff,
    getColorByScore,
    getScoreEmoji,
    calculateUserStats,
    generateWeeklyRanking,
    createBackup,
    loadReviews,
    saveReviews,
    logger,
    MessageBuilder,
    PermissionManager
};