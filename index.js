// ===============================
// BOT MODERAÇÃO COMPLETA VERSÃO INTEGRADA
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
  PermissionFlagsBits
} = require('discord.js');
const dotenv = require('dotenv');
const chalk = require('chalk');
const readline = require('readline');
const os = require('os');
const fs = require('fs');
const path = require('path');

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
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildIntegrations
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.Reaction, Partials.User],
});

// ===============================
// CONFIGURAÇÕES GERAIS
// ===============================
const CONFIG = {
  logChannelId: process.env.LOG_CHANNEL_ID || "",
  adminRoles: process.env.ADMIN_ROLES ? process.env.ADMIN_ROLES.split(',') : [],
  ACCESS_CODE: process.env.ACCESS_CODE || "1234",
};

// ===============================
// LISTA DE PALAVRAS OFENSIVAS
// ===============================
const offensiveWords = [
  "idiota", "burro", "estúpido", "estupido", "retardado", "lixo",
  "merda", "fdp", "vai se foder", "otário", "otario", "desgraçado", "desgracado",
  "cala a boca", "se mata", "vtnc", "imbecil", "inútil", "inutil",
  "seu merda", "seu lixo", "seu inútil", "seu inutil", "seu retardado",
  "arrombado", "filho da puta", "vai tomar no cu",
  "viado", "bicha", "piranha", "prostituta", "corno", "babaca",
  "palhaço", "palhaco", "nojento", "escroto", "cretino", "canalha",
  "maldito", "peste", "verme", "trouxa", "otária", "otaria",
  "burra", "burro do caralho", "cacete", "caralho", "merdinha",
  "vagabundo", "vagabunda", "babaca do caralho", "puta que pariu",
  "cuzao", "viado do caralho", "idiotinha", "fodido", "fuderoso", "bosta",
  "otário do caralho", "babaca inútil", "burro filho da puta",
  "estúpido do caralho", "escroto do caralho", "corno do caralho",
  "puta velha", "vagabunda do caralho", "merda seca", "cacete do caralho",
  "idiota inútil", "nojento do caralho", "filho da puta do caralho",
  "otária do caralho", "vtnc do caralho",
  "fdp do caralho", "vai se fuder", "vai tomar no cu", "filho da puta do caralho",
  "merda do caralho", "cu do caralho",
  // NOVAS ADIÇÕES - Abreviações e gírias comuns
  "porra", "prr", "poha", "pô", "caralho", "krl", "krlh", "caramba",
  "fds", "foda-se", "foda", "fudeu", "fodase", "fodassi",
  "pqp", "puta que pariu", "puta merda", "puta", "puta q pariu",
  "vs fuder", "vs fd", "vsf", "vai se fuder", "vai se ferrar",
  "tnc", "tmnc", "tomar no cu", "vtnc", "vai tomar no cu",
  "pq no cu", "no cu", "cuzão", "cuzão do caralho", "cú", "cu",
  "buceta", "bct", "bucetuda", "xota", "xoxota", "ppk", "perereca",
  "rapariga", "putinha", "putão", "putona", "puto",
  "filho da puta", "fdp", "fdp do caralho", "fdp arrombado",
  "arrombado", "arrombado do caralho", "rombudo",
  "cacete", "cacetada", "cacetinho", "cacetão",
  "merda", "merd4", "m3rd4", "merdinha", "merdoso",
  "bosta", "b0sta", "bostão", "bosteiro", "bostinha",
  "desgraçado", "desgracado", "desgraça", "desgraca",
  "inútil", "inutil", "inutel", "inutil do caralho",
  "babaca", "b4b4c4", "babaquinha", "babacão",
  "otário", "otario", "ot4r1o", "otária", "otaria",
  "idiota", "1d1ot4", "idiot4", "idiotice", "idiotinha",
  "burro", "burro velho", "burro empacado", "burra", "burrinho",
  "estúpido", "estupido", "stupido", "estúpida", "estupida",
  "retardado", "retardada", "retardadinho", "retardado mental",
  "nojento", "nojenta", "nojeira", "nojentinha",
  "escroto", "escrota", "escrotão", "escrotice",
  "palhaço", "palhaco", "palhaçada", "palhacinho",
  "trouxa", "trouxinha", "trouxão", "trouxola",
  "verme", "verminoso", "verminozinho",
  "peste", "pestinha", "pestosa", "pestilento",
  "canalha", "canalhice", "canalhinha",
  "cretino", "cretina", "cretinice",
  "maldito", "maldita", "malditoso",
  "corno", "corninho", "cornão", "cornudo", "chifrudo",
  "chifrudo", "chifrudinho", "chifrudão",
  "vagabundo", "vagabunda", "vagaba", "v4g4bund0", "v4g4bund4",
  "piranha", "piranhuda", "pir4nh4", "piriguete",
  "viado", "viadinho", "viadão", "v1ad0", "boiola", "boiolinha",
  "bicha", "bichinha", "bichona", "baitola", "baitolão",
  "sapatão", "sapata", "sapatona",
  "galinha", "galinhagem", "galinhuda",
  "cachorra", "cachorro", "cachorrão", "cachorrinho",
  "vaca", "vaquinha", "vacão", "vaca velha",
  "égua", "égua do caralho", "égua filha da puta",
  "cabra", "cabra da peste", "cabra safado",
  "mula", "mula velha", "mula manca",
  "jumento", "jumenta", "jumentinho",
  "asno", "asno velho", "asno empacado",
  "anta", "antão", "antinha",
  "bestalhão", "bestalhona", "besta",
  "bocó", "bocozinho", "bocozão",
  "boçal", "boçalhão", "boçalona",
  "bronco", "broncoide", "broncão",
  "ignorante", "ignorantão", "ignorantinho",
  "analfabeto", "analfabeta", "analfabetão",
  "sem noção", "sem nocao", "sem noção do caralho",
  "sem vergonha", "sem vergonhice", "sem vergonha do caralho",
  "cara de pau", "cara de pau do caralho", "cara de pau filho da puta",
  "pilantra", "pilantragem", "pilantrinha",
  "malandro", "malandrinho", "malandragem",
  "safado", "safada", "safadinho", "safadão",
  "tarado", "tarada", "taradinho", "taradão",
  "pervertido", "pervertida", "pervertidinho",
  "depravado", "depravada", "depravadinho",
  "nojento", "nojenta", "nojentinho", "nojentão",
  "asqueroso", "asquerosa", "asquerosinho",
  "repugnante", "repugnantinho", "repugnantão",
  "desprezível", "desprezivel", "desprezível do caralho",
  "horrível", "horrivel", "horroroso",
  "feio", "feia", "feioso", "feiosa", "feinho",
  "crápula", "crapula", "crapulazinha",
  "infeliz", "infeliz do caralho", "infeliz arrombado",
  "miserável", "miseravel", "miserável do caralho",
  "pobre coitado", "coitado", "coitadinho",
  "zé ruela", "zé ruela do caralho", "zé ninguém",
  "zé povinho", "zé povinho do caralho",
  "joão ninguém", "joão ninguém do caralho",
  "ninguém", "ninguém do caralho",
  "zero à esquerda", "zero a esquerda", "zero do caralho",
  "nulo", "nula", "nulo do caralho",
  "aberração", "aberração da natureza", "aberração do caralho",
  "defeito", "defeituoso", "defeituosa",
  "aborto", "aborto da natureza", "aborto do caralho",
  "abortinho", "abortinho do caralho",
  "lixo", "lixinho", "lixão", "lixo do caralho",
  "lixo atômico", "lixo radioativo", "lixo do caralho",
  "resto", "resto de ser humano", "resto de aborto",
  "sobra", "sobra de gente", "sobra de hospital",
  "escória", "escória da sociedade", "escória do caralho",
  "ralé", "ralé do caralho", "ralé filha da puta",
  "plebe", "plebeu", "plebeia",
  "traste", "traste do caralho", "traste filho da puta",
  "peste", "peste do caralho", "peste filho da puta",
  "praga", "praga do caralho", "praga filho da puta",
  "maldição", "maldição do caralho", "maldição filho da puta",
  "desgraça", "desgraça do caralho", "desgraça filho da puta",
  "maldito", "maldito do caralho", "maldito arrombado",
  "condenado", "condenado do caralho", "condenado filho da puta",
  "fudido", "fudida", "fudidinho", "fudidão",
  "lascado", "lascada", "lascadinho", "lascadão",
  "ferrado", "ferrada", "ferradinho", "ferradão",
  "danado", "danada", "danadinho", "danadão",
  "capeta", "capeta do caralho", "capiroto",
  "demônio", "demonio", "demônio do caralho",
  "diabo", "diaba", "diabinho", "diabão",
  "satanás", "satanás do caralho", "satanás filho da puta",
  "lúcifer", "lucifer", "lúcifer do caralho",
  "besta-fera", "besta fera", "besta-fera do caralho",
  "alimária", "alimária do caralho", "alimária filho da puta",
  "animal", "animal do caralho", "animal filho da puta",
  "bicho", "bicho do mato", "bicho do caralho",
  "fera", "fera do caralho", "fera filho da puta",
  "monstro", "monstra", "monstrinho", "monstrão",
  "abominável", "abominavel", "abominável do caralho",
  "abjeto", "abjeta", "abjeto do caralho",
  "desprezível", "desprezivel", "desprezível do caralho",
  "desprezado", "desprezada", "desprezadinho",
  "rejeitado", "rejeitada", "rejeitadinho",
  "excluído", "excluída", "excluído do caralho",
  "marginal", "marginalzinho", "marginal do caralho",
  "delinquente", "delinquente do caralho", "delinquente filho da puta",
  "criminoso", "criminosa", "criminosinho", "criminosão",
  "bandido", "bandida", "bandidinho", "bandidão",
  "ladrão", "ladra", "ladrãozinho", "ladrão do caralho",
  "assaltante", "assaltante do caralho", "assaltante filho da puta",
  "estelionatário", "estelionatário do caralho", "estelionatário filho da puta",
  "golpista", "golpista do caralho", "golpista filho da puta",
  "mentiroso", "mentirosa", "mentiroso do caralho",
  "enganador", "enganadora", "enganador do caralho",
  "trapaceiro", "trapaceira", "trapaceiro do caralho",
  "manipulador", "manipuladora", "manipulador do caralho",
  "manipulador", "manipulador do caralho", "manipulador filho da puta",
  "abusador", "abusadora", "abusador do caralho",
  "abusado", "abusada", "abusadinho",
  "folgado", "folgada", "folgadinho", "folgadão",
  "sem-vergonha", "sem-vergonhice", "sem-vergonha do caralho",
  "descarado", "descarada", "descaradinho",
  "desaforado", "desaforada", "desaforadinho",
  "atrevido", "atrevida", "atrevidinho",
  "insolente", "insolente do caralho", "insolente filho da puta",
  "arrogante", "arrogante do caralho", "arrogante filho da puta",
  "pretensioso", "pretensiosa", "pretensioso do caralho",
  "metido", "metida", "metidinho", "metidão",
  "convencido", "convencida", "convencidinho",
  "soberbo", "soberba", "soberbo do caralho",
  "orgulhoso", "orgulhosa", "orgulhoso do caralho",
  "vaidoso", "vaidosa", "vaidoso do caralho",
  "fútil", "futil", "fútil do caralho", "futilidade",
  "superficial", "superficial do caralho", "superficial filho da puta",
  "banal", "banal do caralho", "banal filho da puta",
  "vazio", "vazia", "vazio do caralho",
  "oco", "oca", "oco do caralho",
  "cabeça oca", "cabeça oca do caralho", "cabeça de vento",
  "cabeça de bagre", "cabeça de bagre do caralho",
  "cabeça de piroca", "cabeça de piroca do caralho",
  "cabeça chata", "cabeça chata do caralho",
  "cabeça dura", "cabeça dura do caralho",
  "teimoso", "teimosa", "teimoso do caralho",
  "birrento", "birrenta", "birrentinho",
  "chato", "chata", "chatinho", "chatão",
  "pentelho", "pentelha", "pentelhudo", "pentelhuda",
  "insuportável", "insuportavel", "insuportável do caralho",
  "intolerável", "intoleravel", "intolerável do caralho",
  "insuportável", "insuportavel", "insuportável do caralho",
  "chato do caralho", "chata do caralho", "chatão do caralho",
  "enjoado", "enjoada", "enjoadinho",
  "maçante", "maçante do caralho", "maçante filho da puta",
  "cansativo", "cansativa", "cansativo do caralho",
  "enfadonho", "enfadonha", "enfadonho do caralho",
  "tedioso", "tediosa", "tedioso do caralho",
  "monótono", "monótona", "monotono", "monotona",
  "repetitivo", "repetitiva", "repetitivo do caralho",
  "chato pra caralho", "chata pra caralho", "chato pra cacete",
  "chato pra krl", "chata pra krl", "chato pra porra",
  "chata pra porra", "chato pra caramba", "chata pra caramba"
];

// ===============================
// VARIÁVEL PARA CONTAGEM DE LOGS E ESTATÍSTICAS
// ===============================
let logCounter = 0;
let moderationCounter = 0;
let commandCounter = 0;
let eventCounter = 0;
let errorCounter = 0;
let warningCounter = 0;
let apiCallCounter = 0;
let databaseCallCounter = 0;
let messageCounter = 0;
let voiceEventCounter = 0;
let reactionCounter = 0;
let roleEventCounter = 0;
let channelEventCounter = 0;
let guildEventCounter = 0;
let memberEventCounter = 0;
let startTime = Date.now();
let lastHeartbeat = Date.now();
let heartbeatInterval = null;

// ===============================
// FUNÇÕES DE TIMESTAMP
// ===============================
function getTimestamp() {
  return chalk.gray(`[${new Date().toLocaleString('pt-BR')}]`);
}

function getColoredTimestamp() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const ms = now.getMilliseconds().toString().padStart(3, '0');
  return chalk.gray(`[${hours}:${minutes}:${seconds}.${ms}]`);
}

function getShortTimestamp() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
}

// ===============================
// FUNÇÕES DE LOG BASE
// ===============================
function logBase(level, color, symbol, message, category = 'GERAL') {
  logCounter++;
  console.log(`${getColoredTimestamp()} ${color(symbol)} ${chalk[color.name](level.padEnd(7))} ${chalk.cyan(`[${category}]`)} ${chalk.white(message)} ${chalk.gray(`(#${logCounter})`)}`);
}

// ===============================
// FUNÇÕES DE LOG ESPECÍFICAS
// ===============================
function logInfo(message, category = 'INFO') {
  logBase('INFO', chalk.green, '➜', message, category);
}

function logError(message, error = null, category = 'ERRO') {
  errorCounter++;
  logBase('ERRO', chalk.red, '✖', message, category);
  if (error) {
    if (error.stack) {
      console.log(chalk.gray(`   Stack: ${error.stack.split('\n')[1]?.trim() || error.stack}`));
    } else {
      console.log(chalk.gray(`   Detalhe: ${error}`));
    }
  }
}

function logWarn(message, category = 'AVISO') {
  warningCounter++;
  logBase('AVISO', chalk.yellow, '⚠', message, category);
}

function logSuccess(message, category = 'SUCESSO') {
  logBase('SUCESSO', chalk.green, '✔', message, category);
}

function logDebug(message, data = null, category = 'DEBUG') {
  logBase('DEBUG', chalk.magenta, '🔍', message, category);
  if (data) {
    if (typeof data === 'object') {
      try {
        const str = JSON.stringify(data, null, 2);
        if (str.length < 500) {
          console.log(chalk.gray(`   Dados: ${str}`));
        } else {
          console.log(chalk.gray(`   Dados: [Objeto grande - ${str.length} caracteres]`));
        }
      } catch {
        console.log(chalk.gray(`   Dados: [Não serializável]`));
      }
    } else {
      console.log(chalk.gray(`   Dados: ${data}`));
    }
  }
}

function logModeration(message, user, content, channel) {
  moderationCounter++;
  console.log(chalk.red.bgBlack.bold('\n 🛡️ MENSAGEM MODERADA '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Usuário:   ${user.tag}`));
  console.log(chalk.red(`   ID:        ${user.id}`));
  console.log(chalk.red(`   Conteúdo:  ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`));
  console.log(chalk.red(`   Canal:     #${channel.name}`));
  console.log(chalk.red(`   Motivo:    ${message}`));
  console.log(chalk.red(`   Mod #:     ${moderationCounter}`));
  console.log(chalk.red(`   Hora:      ${getShortTimestamp()}`));
  console.log(chalk.red('────────────────────────────────\n'));
}

function logCommand(command, user, guild = null, options = null) {
  commandCounter++;
  const cmdInfo = `${chalk.blue(command)} ${chalk.white(`por ${user.tag}`)} ${guild ? chalk.gray(`em ${guild.name}`) : ''}`;
  logBase('COMANDO', chalk.blue, '⚙', cmdInfo, 'CMD');
  if (options) {
    console.log(chalk.gray(`   Opções: ${JSON.stringify(options)}`));
  }
}

function logEvent(event, details = null, guild = null) {
  eventCounter++;
  const eventInfo = `${chalk.cyan(event)} ${guild ? chalk.gray(`em ${guild}`) : ''}`;
  logBase('EVENTO', chalk.cyan, '📢', eventInfo, 'EVT');
  if (details) {
    if (typeof details === 'object') {
      const detailStr = Object.entries(details)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      if (detailStr.length < 100) {
        console.log(chalk.gray(`   Detalhes: ${detailStr}`));
      }
    } else {
      console.log(chalk.gray(`   Detalhes: ${details}`));
    }
  }
}

function logDatabase(operation, status, details = null, category = 'DB') {
  databaseCallCounter++;
  const dbInfo = `${chalk.yellow(operation)} - ${status}`;
  logBase('DB', chalk.yellow, '💾', dbInfo, category);
  if (details) {
    console.log(chalk.gray(`   Detalhes: ${details}`));
  }
}

function logNetwork(endpoint, method, status, responseTime = null, category = 'REDE') {
  apiCallCounter++;
  let netInfo = `${chalk.blue(method)} ${chalk.white(endpoint)} - ${status}`;
  if (responseTime) {
    netInfo += chalk.gray(` (${responseTime}ms)`);
  }
  logBase('REDE', chalk.blue, '🌐', netInfo, category);
}

function logPerformance(action, timeMs, threshold = null, category = 'PERF') {
  const timeColor = threshold && timeMs > threshold ? chalk.red : chalk.green;
  const perfInfo = `${chalk.white(action)} ${timeColor(`(${timeMs}ms)`)}`;
  if (threshold && timeMs > threshold) {
    logBase('PERF', chalk.magenta, '⚡', perfInfo + chalk.yellow(` ⚠ acima de ${threshold}ms`), category);
  } else {
    logBase('PERF', chalk.magenta, '⚡', perfInfo, category);
  }
}

function logSystem(message, category = 'SISTEMA') {
  logBase('SISTEMA', chalk.cyan, '🖥️', message, category);
}

function logAPI(endpoint, method, status, responseData = null, category = 'API') {
  apiCallCounter++;
  const apiInfo = `${chalk.yellow(method)} ${chalk.white(endpoint)} - ${status}`;
  logBase('API', chalk.yellow, '🔌', apiInfo, category);
  if (responseData) {
    if (typeof responseData === 'object' && Object.keys(responseData).length < 5) {
      console.log(chalk.gray(`   Resposta: ${JSON.stringify(responseData)}`));
    }
  }
}

function logMemory(category = 'MEMÓRIA') {
  const used = process.memoryUsage();
  const memoryInfo = `RSS: ${Math.round(used.rss / 1024 / 1024)}MB | Heap: ${Math.round(used.heapUsed / 1024 / 1024)}/${Math.round(used.heapTotal / 1024 / 1024)}MB | Ext: ${Math.round(used.external / 1024 / 1024)}MB`;
  logBase('MEMÓRIA', chalk.cyan, '📊', memoryInfo, category);
}

function logCPU(category = 'CPU') {
  const loadAvg = os.loadavg();
  const cpuInfo = `Load: ${loadAvg[0].toFixed(2)} (1m) ${loadAvg[1].toFixed(2)} (5m) ${loadAvg[2].toFixed(2)} (15m) | CPUs: ${os.cpus().length}`;
  logBase('CPU', chalk.yellow, '⚙️', cpuInfo, category);
}

function logSystemInfo(category = 'SISTEMA') {
  const totalMem = Math.round(os.totalmem() / 1024 / 1024 / 1024 * 10) / 10;
  const freeMem = Math.round(os.freemem() / 1024 / 1024 / 1024 * 10) / 10;
  const uptime = Math.floor(os.uptime() / 3600);
  const sysInfo = `${os.type()} ${os.release()} | RAM: ${freeMem}GB/${totalMem}GB | Uptime: ${uptime}h | Host: ${os.hostname()}`;
  logBase('SISTEMA', chalk.cyan, '💻', sysInfo, category);
}

function logNetworkStatus(category = 'REDE') {
  const interfaces = os.networkInterfaces();
  let netInfo = 'Interfaces: ';
  for (const [name, addrs] of Object.entries(interfaces)) {
    const ipv4 = addrs.find(addr => addr.family === 'IPv4' && !addr.internal);
    if (ipv4) {
      netInfo += `${name}:${ipv4.address} `;
      break;
    }
  }
  logBase('REDE', chalk.blue, '📡', netInfo, category);
}

function logDiscordStatus(category = 'DISCORD') {
  if (!client || !client.ws) {
    logBase('DISCORD', chalk.red, '🔴', 'Cliente não inicializado', category);
    return;
  }
  const status = client.ws.status === 0 ? 'Conectado' : 
                 client.ws.status === 1 ? 'Conectando' : 
                 client.ws.status === 2 ? 'Reconectando' : 
                 client.ws.status === 3 ? 'Desconectado' : 'Desconhecido';
  const statusColor = client.ws.status === 0 ? chalk.green : chalk.yellow;
  const ping = client.ws.ping;
  const guilds = client.guilds?.cache?.size || 0;
  const users = client.users?.cache?.size || 0;
  const statusInfo = `Status: ${statusColor(status)} | Ping: ${ping}ms | Guilds: ${guilds} | Users: ${users}`;
  logBase('DISCORD', chalk.blue, '🤖', statusInfo, category);
}

function logMessage(message, type = 'CRIADA', category = 'MSG') {
  messageCounter++;
  const msgInfo = `${chalk.white(message.author?.tag || 'Desconhecido')} em #${message.channel?.name || 'DM'}: ${message.content?.substring(0, 50) || '[sem texto]'}${message.content?.length > 50 ? '...' : ''}`;
  logBase('MSG', type === 'CRIADA' ? chalk.green : type === 'DELETADA' ? chalk.red : chalk.yellow, 
          type === 'CRIADA' ? '📨' : type === 'DELETADA' ? '🗑️' : '📝', msgInfo, category);
}

function logVoice(user, action, channel, category = 'VOZ') {
  voiceEventCounter++;
  const voiceInfo = `${chalk.white(user)} ${action} ${channel ? `#${channel}` : ''}`;
  logBase('VOZ', action.includes('Entrou') ? chalk.green : action.includes('Saiu') ? chalk.red : chalk.yellow, '🎤', voiceInfo, category);
}

function logReaction(user, emoji, action, category = 'REAÇÃO') {
  reactionCounter++;
  const reactInfo = `${chalk.white(user)} ${action} ${emoji}`;
  logBase('REAÇÃO', action === 'adicionou' ? chalk.green : chalk.yellow, '👍', reactInfo, category);
}

function logRole(role, action, category = 'CARGO') {
  roleEventCounter++;
  const roleInfo = `${chalk.white(role.name)} foi ${action} em ${role.guild?.name || 'Desconhecido'}`;
  logBase('CARGO', action === 'criado' ? chalk.green : action === 'deletado' ? chalk.red : chalk.yellow, '🎭', roleInfo, category);
}

function logChannel(channel, action, category = 'CANAL') {
  channelEventCounter++;
  const channelInfo = `#${chalk.white(channel.name)} foi ${action} em ${channel.guild?.name || 'Desconhecido'}`;
  logBase('CANAL', action === 'criado' ? chalk.green : action === 'deletado' ? chalk.red : chalk.yellow, 
          action === 'criado' ? '📁' : action === 'deletado' ? '🗑️' : '🔄', channelInfo, category);
}

function logGuild(guild, action, category = 'SERVIDOR') {
  guildEventCounter++;
  const guildInfo = `${chalk.white(guild.name)} teve ${action}`;
  logBase('SERVIDOR', action.includes('entrou') ? chalk.green : action.includes('saiu') ? chalk.red : chalk.yellow, '🏛️', guildInfo, category);
}

function logMember(member, action, category = 'MEMBRO') {
  memberEventCounter++;
  const memberInfo = `${chalk.white(member.user?.tag || member)} ${action}`;
  logBase('MEMBRO', action.includes('entrou') ? chalk.green : action.includes('saiu') ? chalk.red : chalk.yellow, '👤', memberInfo, category);
}

function logAuth(user, action, success, category = 'AUTH') {
  const authInfo = `${chalk.white(user)} ${action} - ${success ? '✅' : '❌'}`;
  logBase('AUTH', success ? chalk.green : chalk.red, '🔐', authInfo, category);
}

function logFile(operation, file, size = null, category = 'ARQUIVO') {
  const fileInfo = `${operation} ${chalk.white(file)}${size ? ` (${Math.round(size/1024)}KB)` : ''}`;
  logBase('ARQUIVO', chalk.cyan, '📄', fileInfo, category);
}

function logConfig(key, value, action = 'carregado', category = 'CONFIG') {
  const configInfo = `${chalk.white(key)} = ${chalk.yellow(value)} ${action}`;
  logBase('CONFIG', chalk.blue, '⚙️', configInfo, category);
}

function logHeartbeat(category = 'HEARTBEAT') {
  const now = Date.now();
  const diff = now - lastHeartbeat;
  lastHeartbeat = now;
  const heartbeatInfo = `Intervalo: ${diff}ms | Uptime: ${Math.floor((now - startTime)/1000)}s`;
  logBase('HEARTBEAT', diff < 60000 ? chalk.green : chalk.yellow, '💓', heartbeatInfo, category);
}

function logStartup() {
  console.log(chalk.green('\n' + '═'.repeat(70)));
  console.log(chalk.green('  🚀 INICIANDO BOT - SISTEMA DE LOGS ULTRA COMPLETO'));
  console.log(chalk.green('═'.repeat(70)));
  logSystem(`Inicialização em ${new Date().toLocaleString('pt-BR')}`);
  logSystem(`Node.js: ${process.version} | Plataforma: ${process.platform} ${process.arch}`);
  logSystem(`PID: ${process.pid} | Diretório: ${process.cwd()}`);
  logSystemInfo();
  logMemory();
  logCPU();
  logNetworkStatus();
  logConfig('Admin Roles', CONFIG.adminRoles.join(', ') || 'Nenhum');
  logConfig('Log Channel', CONFIG.logChannelId || 'Não configurado');
  logConfig('Access Code', '********');
  console.log(chalk.green('═'.repeat(70) + '\n'));
}

function logShutdown() {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;
  
  console.log(chalk.red('\n' + '═'.repeat(70)));
  console.log(chalk.red('  🔴 ENCERRANDO BOT - RESUMO FINAL'));
  console.log(chalk.red('═'.repeat(70)));
  logSystem(`Uptime total: ${hours}h ${minutes}m ${seconds}s`);
  logSystem(`Logs totais: ${logCounter}`);
  logMemory();
  console.log(chalk.yellow('\n  📊 ESTATÍSTICAS POR CATEGORIA:'));
  console.log(chalk.white(`     • Moderações: ${moderationCounter}`));
  console.log(chalk.white(`     • Comandos:   ${commandCounter}`));
  console.log(chalk.white(`     • Eventos:    ${eventCounter}`));
  console.log(chalk.white(`     • Erros:      ${errorCounter}`));
  console.log(chalk.white(`     • Avisos:     ${warningCounter}`));
  console.log(chalk.white(`     • API Calls:  ${apiCallCounter}`));
  console.log(chalk.white(`     • DB Calls:   ${databaseCallCounter}`));
  console.log(chalk.white(`     • Mensagens:  ${messageCounter}`));
  console.log(chalk.white(`     • Eventos Voz: ${voiceEventCounter}`));
  console.log(chalk.white(`     • Reações:    ${reactionCounter}`));
  console.log(chalk.white(`     • Cargos:     ${roleEventCounter}`));
  console.log(chalk.white(`     • Canais:     ${channelEventCounter}`));
  console.log(chalk.white(`     • Servidores: ${guildEventCounter}`));
  console.log(chalk.white(`     • Membros:    ${memberEventCounter}`));
  console.log(chalk.red('═'.repeat(70) + '\n'));
}

function logStats() {
  console.log(chalk.cyan('\n' + '═'.repeat(70)));
  console.log(chalk.cyan('  📊 ESTATÍSTICAS DO SISTEMA'));
  console.log(chalk.cyan('═'.repeat(70)));
  logSystem(`Uptime: ${Math.floor((Date.now() - startTime)/1000)}s`);
  logMemory();
  logCPU();
  logDiscordStatus();
  console.log(chalk.yellow('\n  📈 CONTADORES:'));
  console.log(chalk.white(`     • Logs:       ${logCounter}`));
  console.log(chalk.white(`     • Moderações: ${moderationCounter}`));
  console.log(chalk.white(`     • Comandos:   ${commandCounter}`));
  console.log(chalk.white(`     • Eventos:    ${eventCounter}`));
  console.log(chalk.white(`     • Erros:      ${errorCounter}`));
  console.log(chalk.white(`     • Avisos:     ${warningCounter}`));
  console.log(chalk.cyan('═'.repeat(70) + '\n'));
}

function startHeartbeat(intervalMs = 60000) {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => {
    logHeartbeat();
    if (logCounter % 10 === 0) {
      logMemory();
    }
  }, intervalMs);
  logSuccess(`Heartbeat iniciado (intervalo: ${intervalMs/1000}s)`);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    logInfo('Heartbeat parado');
  }
}

// ===============================
// FUNÇÃO PARA CHECAR PALAVRAS OFENSIVAS
// ===============================
function containsOffensiveWord(text) {
  if (!text) return false;
  const msg = text.toLowerCase();
  return offensiveWords.some(word => msg.includes(word));
}

// ===============================
// FUNÇÃO PARA VERIFICAR PERMISSÕES DE ADMIN
// ===============================
function isAdmin(member) {
  if (!member) return false;
  if (CONFIG.adminRoles.length === 0) return false;
  
  return member.roles.cache.some(role => 
    CONFIG.adminRoles.includes(role.id) || CONFIG.adminRoles.includes(role.name)
  );
}

// ===============================
// COMANDOS DO BOT - ATUALIZADOS
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
      const startCmd = Date.now();
      const code = interaction.options.getString('code');
      
      logCommand('/adm', interaction.user, interaction.guild);
      logDebug('Verificando código de acesso', { codeProvided: '********' });
      
      if (code !== CONFIG.ACCESS_CODE) {
        logWarn(`Tentativa de acesso inválida por ${interaction.user.tag}`, 'SEGURANÇA');
        logAuth(interaction.user.tag, 'tentativa de acesso admin', false);
        await interaction.reply({ 
          content: '❌ Código de acesso incorreto!', 
          flags: 64
        });
        logPerformance('/adm (falha)', Date.now() - startCmd);
        return;
      }

      logSuccess(`Acesso administrativo concedido para ${interaction.user.tag}`, 'SEGURANÇA');
      logAuth(interaction.user.tag, 'acesso admin', true);

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
      
      logInfo(`/adm usado por ${interaction.user.tag}`, 'COMANDOS');
      logPerformance('/adm', Date.now() - startCmd);
    },
  },
];

// === COMANDO /PING - TESTE DE CONEXÃO ===
const pingCommand = {
  data: {
    name: 'ping',
    description: 'Verifica a latência do bot',
  },
  async execute(interaction) {
    const startCmd = Date.now();
    logCommand('/ping', interaction.user, interaction.guild);
    
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
    logInfo(`Comando /ping usado por ${interaction.user.tag} - Ping: ${client.ws.ping}ms`, 'COMANDOS');
    logPerformance('/ping', Date.now() - startCmd);
    logNetwork('websocket', 'PING', 'sucesso', client.ws.ping);
  },
};

// === COMANDO /HELP - AJUDA ===
const helpCommand = {
  data: {
    name: 'help',
    description: 'Mostra a lista de comandos disponíveis',
  },
  async execute(interaction) {
    const startCmd = Date.now();
    logCommand('/help', interaction.user, interaction.guild);
    
    const embed = new EmbedBuilder()
      .setTitle('❓ Comandos Disponíveis')
      .setDescription('Lista de comandos que você pode usar no bot:')
      .setColor(Colors.Blue)
      .addFields(
        { name: '/ping', value: 'Verifica a latência do bot', inline: false },
        { name: '/help', value: 'Mostra esta lista de ajuda', inline: false },
        { name: '/adm', value: 'Acesso ao painel administrativo', inline: false },
        { name: '/private', value: 'Enviar mensagem privada (Staff)', inline: false }
      )
      .setFooter({ text: 'Digite /help para mais informações' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: 64 });
    logInfo(`Comando /help usado por ${interaction.user.tag}`, 'COMANDOS');
    logPerformance('/help', Date.now() - startCmd);
  },
};

// === COMANDO /PRIVATE - MENSAGEM DA STAFF (COM SENHA ACCESS_CODE) ===
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
    const startCmd = Date.now();
    const user = interaction.options.getUser('user');
    const message = interaction.options.getString('message');
    const code = interaction.options.getString('code');

    logCommand('/private', interaction.user, interaction.guild);
    logDebug('Enviando mensagem privada', { targetUser: user.tag, messageLength: message.length });

    if (code !== CONFIG.ACCESS_CODE) {
      logWarn(`Tentativa de /private com código inválido por ${interaction.user.tag}`, 'SEGURANÇA');
      logAuth(interaction.user.tag, 'tentativa de comando private', false);
      await interaction.reply({
        content: '❌ Código de acesso incorreto!',
        flags: 64
      });
      logPerformance('/private (falha)', Date.now() - startCmd);
      return;
    }

    logAuth(interaction.user.tag, 'comando private', true);

    try {
      await interaction.channel.send(
        `🛠 **Mensagem da Staff 🛠**\n\n${user}\n\n${message}`
      );

      await user.send({
        content: `📬 **Mensagem da Staff**\n\n${message}`
      });

      await interaction.reply({
        content:
          `✅ Mensagem enviada\n\nPara ${user}\n\nMensagem enviada:\n${message}`,
        flags: 64
      });

      logInfo(`${interaction.user.tag} enviou mensagem para ${user.tag}`, 'MENSAGENS');
      logPerformance('/private', Date.now() - startCmd);
      logNetwork('DM', 'SEND', 'sucesso');
    } catch (error) {
      logError(`Erro ao enviar mensagem privada: ${error.message}`, error, 'MENSAGENS');
      logDebug('Detalhes do erro', { error: error.message, stack: error.stack?.split('\n')[0] });
      
      await interaction.reply({
        content: '❌ Erro ao enviar a mensagem. Verifique se o usuário tem DMs abertos.',
        flags: 64
      });
    }
  }
};

// ===============================
// EVENTO: MENSAGEM CRIADA (MODERAÇÃO)
// ===============================
client.on("messageCreate", async (message) => {
  if (message.author.bot) {
    logDebug(`Mensagem de bot ignorada: ${message.author.tag}`, null, 'BOTS');
    return;
  }

  logMessage(message, 'CRIADA');

  if (isAdmin(message.member)) {
    logDebug(`Mensagem de admin ignorada: ${message.author.tag}`, null, 'ADMIN');
    return;
  }

  if (containsOffensiveWord(message.content)) {
    logWarn(`Palavra ofensiva detectada de ${message.author.tag}`, 'MODERAÇÃO');
    
    try {
      const permissions = message.channel.permissionsFor(client.user);
      if (!permissions.has(PermissionFlagsBits.ManageMessages)) {
        logWarn(`Bot não tem permissão para deletar mensagens em #${message.channel.name}`, 'PERMISSÕES');
        return;
      }

      if (!message.deletable) {
        logWarn(`Mensagem muito antiga para ser deletada em #${message.channel.name}`, 'MODERAÇÃO');
        return;
      }

      await message.delete();
      logSuccess(`Mensagem deletada de ${message.author.tag}`, 'MODERAÇÃO');

      await message.channel.send({
        embeds: [new EmbedBuilder()
          .setTitle('🚫 Mensagem Removida')
          .setDescription('Sua mensagem foi removida, pois continha palavras ofensivas.')
          .setColor(Colors.Red)
          .addFields(
            { name: '👤 Usuário', value: message.author.tag, inline: true },
            { name: '📅 Data', value: new Date().toLocaleString('pt-BR'), inline: true }
          )
          .setFooter({ text: 'Caso isso tenha sido um erro, contate a staff.' })
          .setTimestamp()
        ]
      });

      logModeration("Palavras ofensivas detectadas", message.author, message.content, message.channel);

    } catch (err) {
      logError(`Erro ao moderar mensagem: ${err.message}`, err, 'MODERAÇÃO');
      logDebug('Stack do erro', err.stack?.split('\n')[0]);
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
  
  // Registrar comandos em TODOS os servidores
  if (client.guilds.cache.size > 0) {
    try {
      for (const guild of client.guilds.cache.values()) {
        await guild.commands.set([
          ...commands.map(c => c.data),
          pingCommand.data,
          helpCommand.data,
          privateCommand.data
        ]);
        logSuccess(`Comandos registrados em: ${guild.name}`);
      }
      logInfo('Comandos registrados globalmente com sucesso!');
    } catch (error) {
      logError(`Erro ao registrar comandos: ${error.message}`);
    }
  } else {
    logWarn('Nenhum servidor encontrado. Comandos não registrados.');
  }

  console.log(chalk.green('\n  ✅ Tudo pronto! Bot conectado com sucesso.\n'));
  
  // Inicia o menu interativo
  initReadline();
  showMenu();
});

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
// EVENTO: INTERAÇÃO (COMANDOS DE TEXTO)
// ===============================
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = commands.find(c => c.data.name === interaction.commandName);
    if (!command) {
      if (interaction.commandName === 'ping') {
        await pingCommand.execute(interaction);
        return;
      }
      if (interaction.commandName === 'help') {
        await helpCommand.execute(interaction);
        return;
      }
      if (interaction.commandName === 'private') {
        await privateCommand.execute(interaction);
        return;
      }
      logWarn(`Comando desconhecido: ${interaction.commandName}`, 'COMANDOS');
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logError(`Erro ao executar comando ${interaction.commandName}: ${error.message}`, error, 'COMANDOS');
      logDebug('Stack do erro', error.stack?.split('\n')[0]);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '❌ Ocorreu um erro ao executar este comando.', flags: 64 });
      } else {
        await interaction.reply({ content: '❌ Ocorreu um erro ao executar este comando.', flags: 64 });
      }
    }
    return;
  }

  if (interaction.isButton()) {
    logEvent('buttonInteraction', { user: interaction.user.tag, customId: interaction.customId }, interaction.guild?.name);
    await handleButtonInteraction(interaction);
    return;
  }

  if (interaction.isModalSubmit()) {
    logEvent('modalSubmit', { user: interaction.user.tag, customId: interaction.customId }, interaction.guild?.name);
    logInfo(`Modal submetido por ${interaction.user.tag}`, 'INTERAÇÕES');
  }

  if (interaction.isStringSelectMenu()) {
    logEvent('selectMenu', { 
      user: interaction.user.tag, 
      customId: interaction.customId,
      values: interaction.values 
    }, interaction.guild?.name);
  }
});

// ===============================
// EVENTO: BOTÃO INTERAÇÃO (PAINEL ADMIN)
// ===============================
async function handleButtonInteraction(interaction) {
  const startBtn = Date.now();
  
  switch (interaction.customId) {
    case 'stats': {
      const uptimeSeconds = Math.floor(client.uptime / 1000);
      const hours = Math.floor(uptimeSeconds / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = uptimeSeconds % 60;

      const presence = client.user.presence;
      const status = presence ? presence.status : 'offline';
      const activity = presence && presence.activities.length > 0 ? presence.activities[0].name : 'Nenhuma';

      const embed = new EmbedBuilder()
        .setTitle('📊 Estatísticas do Bot')
        .setColor(Colors.Green)
        .addFields(
          { name: '🏓 Ping', value: `${client.ws.ping}ms`, inline: true },
          { name: '⏱️ Uptime', value: `${hours}h ${minutes}m ${seconds}s`, inline: true },
          { name: '🏛️ Servidores', value: `${client.guilds.cache.size}`, inline: true },
          { name: '👥 Usuários', value: `${client.users.cache.size}`, inline: true },
          { name: '🟢 Status', value: status, inline: true },
          { name: '🎵 Atividade', value: activity, inline: true }
        )
        .setFooter({ text: 'Estatísticas atualizadas' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
      logInfo(`${interaction.user.tag} abriu estatísticas`, 'PAINEL');
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
      logDebug('Estatísticas enviadas para o console', null, 'PAINEL');
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
      logInfo(`${interaction.user.tag} pediu ajuda no painel`, 'PAINEL');
      break;
    }

    default:
      logWarn(`Botão desconhecido: ${interaction.customId}`, 'PAINEL');
      await interaction.reply({ content: '❌ Botão desconhecido!', flags: 64 });
  }
  
  logPerformance(`Button: ${interaction.customId}`, Date.now() - startBtn, 2000, 'PAINEL');
}

// ===============================
// MENU INTERATIVO NO CONSOLE
// ===============================

function showMenu() {
  if (isMenuActive) return;
  isMenuActive = true;
  
  console.log(chalk.cyan('\n╔═══════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║                  𝙷𝚘𝚜𝚝𝚅𝚒𝚕𝚕𝚎-𝙱𝙾𝚃 𝚅𝚎𝚛𝚜ã𝚘 𝟺.𝟹.𝟶                     ║'));
  console.log(chalk.cyan('╠═══════════════════════════════════════════════════════╣'));
  console.log(chalk.cyan('║  1.  Ver estatísticas detalhadas                                ║'));
  console.log(chalk.cyan('║  2.  Listar todos os servidores                                 ║'));
  console.log(chalk.cyan('║  3.  Ver membros de um servidor                                 ║'));
  console.log(chalk.cyan('║  4.  Enviar mensagem para canal                                 ║'));
  console.log(chalk.cyan('║  5.  Atualizar dados                                            ║'));
  console.log(chalk.cyan('║  6.  Ver logs recentes                                          ║'));
  console.log(chalk.cyan('║  7.  Ver status do bot                                          ║'));
  console.log(chalk.cyan('║  8.  Ver estatísticas completas de logs                         ║'));
  console.log(chalk.cyan('║  9.  Ver uso de memória detalhado                               ║'));
  console.log(chalk.cyan('║  10. Ver informações do sistema                                 ║'));
  console.log(chalk.cyan('║  11. Ver status da rede                                         ║'));
  console.log(chalk.cyan('║  12. Ver status do Discord                                      ║'));
  console.log(chalk.cyan('║  13. Limpar console                                             ║'));
  console.log(chalk.cyan('║  14. Iniciar/Parar Heartbeat                                    ║'));
  console.log(chalk.cyan('║  15. Exportar estatísticas para arquivo                         ║'));
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
  
  logDebug(`Menu option selected: ${option}`, null, 'MENU');
  
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
      console.log(chalk.green('🔄 Dados atualizados!'));
      logInfo('Dados do menu atualizados manualmente', 'MENU');
      showMenu();
      break;
    case '6':
      showRecentLogs();
      break;
    case '7':
      showBotStatus();
      break;
    case '8':
      showFullLogStats();
      break;
    case '9':
      logMemory();
      console.log('');
      logCPU();
      showMenu();
      break;
    case '10':
      logSystemInfo();
      showMenu();
      break;
    case '11':
      logNetworkStatus();
      showMenu();
      break;
    case '12':
      logDiscordStatus();
      showMenu();
      break;
    case '13':
      console.clear();
      logInfo('Console limpo', 'SISTEMA');
      showMenu();
      break;
    case '14':
      toggleHeartbeat();
      showMenu();
      break;
    case '15':
      exportStats();
      showMenu();
      break;
    case '0':
      logShutdown();
      stopHeartbeat();
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
  console.log(chalk.white(`📊 Logs:       ${logCounter}`));
  console.log(chalk.white(`🛡️  Mods:       ${moderationCounter}`));
  console.log(chalk.white(`⚙️  Comandos:   ${commandCounter}`));
  console.log(chalk.white(`📢 Eventos:    ${eventCounter}`));
  console.log(chalk.white(`❌ Erros:      ${errorCounter}`));
  console.log(chalk.white(`⚠️  Avisos:     ${warningCounter}`));
  console.log(chalk.yellow('═══════════════════════════════\n'));
  
  showMenu();
}

function showFullLogStats() {
  console.log(chalk.cyan('\n' + '═'.repeat(60)));
  console.log(chalk.cyan('  📊 ESTATÍSTICAS COMPLETAS DE LOGS'));
  console.log(chalk.cyan('═'.repeat(60)));
  console.log(chalk.white(`📝 Logs totais:        ${logCounter}`));
  console.log(chalk.white(`🛡️  Moderações:         ${moderationCounter}`));
  console.log(chalk.white(`⚙️  Comandos:           ${commandCounter}`));
  console.log(chalk.white(`📢 Eventos:            ${eventCounter}`));
  console.log(chalk.white(`❌ Erros:              ${errorCounter}`));
  console.log(chalk.white(`⚠️  Avisos:             ${warningCounter}`));
  console.log(chalk.white(`🌐 Chamadas API:       ${apiCallCounter}`));
  console.log(chalk.white(`💾 Chamadas DB:        ${databaseCallCounter}`));
  console.log(chalk.white(`📨 Mensagens:          ${messageCounter}`));
  console.log(chalk.white(`🎤 Eventos de voz:     ${voiceEventCounter}`));
  console.log(chalk.white(`👍 Reações:            ${reactionCounter}`));
  console.log(chalk.white(`🎭 Eventos de cargo:   ${roleEventCounter}`));
  console.log(chalk.white(`📁 Eventos de canal:   ${channelEventCounter}`));
  console.log(chalk.white(`🏛️  Eventos de server:  ${guildEventCounter}`));
  console.log(chalk.white(`👤 Eventos de membro:  ${memberEventCounter}`));
  
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const logsPerHour = (logCounter / (uptimeSeconds / 3600)).toFixed(2);
  console.log(chalk.white(`📈 Logs por hora:      ${logsPerHour}`));
  console.log(chalk.cyan('═'.repeat(60) + '\n'));
  showMenu();
}

function listServers() {
  console.log(chalk.yellow('\n═══ 🏛️ SERVIDORES DO BOT ═══'));
  
  if (client.guilds.cache.size === 0) {
    console.log(chalk.gray('Nenhum servidor encontrado.'));
  } else {
    client.guilds.cache.forEach((guild, index) => {
      console.log(chalk.white(`${index + 1}. ${guild.name} (${guild.memberCount} membros) - ID: ${guild.id}`));
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
      logInfo(`Listando membros de ${guild.name}`, 'MENU');
      
      try {
        const startFetch = Date.now();
        await guild.members.fetch();
        logPerformance(`Fetch membros ${guild.name}`, Date.now() - startFetch, 5000, 'MENU');
        
        const members = guild.members.cache;
        
        console.log(chalk.yellow(`\n═══ MEMBROS DE ${guild.name.toUpperCase()} ═══`));
        console.log(chalk.white(`Total: ${members.size} membros\n`));
        
        let count = 0;
        members.forEach((member) => {
          if (count < 10) {
            const status = member.user.bot ? chalk.blue('[BOT]') : chalk.green('[USER]');
            const status2 = member.manageable ? chalk.yellow(' [MOD]') : '';
            console.log(`  ${status}${status2} ${member.user.tag} - ${member.user.id}`);
            count++;
          }
        });
        
        if (members.size > 10) {
          console.log(chalk.gray(`  ... e mais ${members.size - 10} membros`));
        }
        
        console.log(chalk.yellow('══════════════════════════════════════\n'));
      } catch (error) {
        logError(`Erro ao buscar membros: ${error.message}`, error, 'MENU');
        logDebug('Detalhes do erro', error.stack?.split('\n')[0]);
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
              const startSend = Date.now();
              await channel.send(message);
              logPerformance('Envio de mensagem', Date.now() - startSend, 2000, 'MENU');
              console.log(chalk.green(`\n✅ Mensagem enviada para #${channel.name}!`));
              logInfo(`Mensagem enviada para #${channel.name} em ${guild.name}`, 'MENU');
            } catch (error) {
              logError(`Erro ao enviar mensagem: ${error.message}`, error, 'MENU');
              logDebug('Detalhes do erro', error.stack?.split('\n')[0]);
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
  console.log(chalk.white(`Total de logs desde o início: ${logCounter}`));
  console.log(chalk.white(`Moderações: ${moderationCounter}`));
  console.log(chalk.white(`Comandos executados: ${commandCounter}`));
  console.log(chalk.white(`Eventos: ${eventCounter}`));
  console.log(chalk.white(`Erros: ${errorCounter}`));
  console.log(chalk.white(`Avisos: ${warningCounter}`));
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
  console.log(chalk.white(`📊 Logs totais: ${logCounter}`));
  console.log(chalk.white(`📈 Logs/hora: ${(logCounter / (uptimeSeconds / 3600)).toFixed(2)}`));
  console.log(chalk.yellow('══════════════════════════════\n'));
  showMenu();
}

function toggleHeartbeat() {
  if (heartbeatInterval) {
    stopHeartbeat();
    console.log(chalk.yellow('❤️ Heartbeat parado'));
  } else {
    startHeartbeat();
    console.log(chalk.green('❤️ Heartbeat iniciado (60s)'));
  }
}

function exportStats() {
  try {
    const stats = {
      timestamp: new Date().toISOString(),
      bot: {
        tag: client.user?.tag || 'Desconhecido',
        id: client.user?.id || 'Desconhecido',
        uptime: Date.now() - startTime,
        ping: client.ws?.ping || 0,
        servers: client.guilds?.cache?.size || 0,
        users: client.users?.cache?.size || 0,
        channels: client.channels?.cache?.size || 0
      },
      logs: {
        total: logCounter,
        moderation: moderationCounter,
        commands: commandCounter,
        events: eventCounter,
        errors: errorCounter,
        warnings: warningCounter,
        apiCalls: apiCallCounter,
        dbCalls: databaseCallCounter,
        messages: messageCounter,
        voice: voiceEventCounter,
        reactions: reactionCounter,
        roles: roleEventCounter,
        channels: channelEventCounter,
        guilds: guildEventCounter,
        members: memberEventCounter
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        memory: process.memoryUsage(),
        os: {
          type: os.type(),
          release: os.release(),
          hostname: os.hostname(),
          uptime: os.uptime(),
          totalmem: os.totalmem(),
          freemem: os.freemem(),
          cpus: os.cpus().length,
          loadavg: os.loadavg()
        }
      }
    };

    const filename = `bot-stats-${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(stats, null, 2));
    logSuccess(`Estatísticas exportadas para ${filename}`, 'ARQUIVO');
    logFile('Exportado', filename, fs.statSync(filename).size);
    console.log(chalk.green(`✅ Estatísticas salvas em: ${filename}`));
  } catch (error) {
    logError(`Erro ao exportar estatísticas: ${error.message}`, error, 'ARQUIVO');
  }
}

// ===============================
// EVENTOS DE LOG (MENSAGENS, CANAIS, ETC)
// ===============================

client.on('messageDelete', async (message) => {
  if (!message.guild || !message.author) return;

  let deleter = 'Desconhecido';
  try {
    const auditLogs = await message.guild.fetchAuditLogs({ 
      type: 72, 
      limit: 1 
    });
    const entry = auditLogs.entries.first();
    if (entry && entry.target.id === message.author.id && entry.createdTimestamp > Date.now() - 5000) {
      deleter = entry.executor.tag;
    }
  } catch (e) {
    logWarn('Não foi possível buscar logs de auditoria', 'AUDITORIA');
  }

  logMessage(message, 'DELETADA');
  logEvent('messageDelete', { 
    author: message.author.tag, 
    channel: message.channel.name,
    deleter: deleter,
    content: message.content?.substring(0, 50)
  }, message.guild.name);
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (!oldMessage.guild || !oldMessage.author) return;
  if (oldMessage.content === newMessage.content) return;

  logMessage(oldMessage, 'ATUALIZADA');
  logEvent('messageUpdate', { 
    author: oldMessage.author.tag, 
    channel: oldMessage.channel.name,
    oldContent: oldMessage.content?.substring(0, 50),
    newContent: newMessage.content?.substring(0, 50)
  }, oldMessage.guild.name);
});

client.on('guildMemberAdd', async (member) => {
  logMember(member, 'entrou no servidor');
  logEvent('guildMemberAdd', { 
    user: member.user.tag, 
    id: member.user.id,
    created: member.user.createdAt.toISOString()
  }, member.guild.name);
});

client.on('guildMemberRemove', async (member) => {
  logMember(member, 'saiu do servidor');
  logEvent('guildMemberRemove', { 
    user: member.user.tag, 
    id: member.user.id
  }, member.guild.name);
});

client.on('channelCreate', async (channel) => {
  if (!channel.guild) return;
  logChannel(channel, 'criado');
  logEvent('channelCreate', { 
    name: channel.name, 
    type: channel.type,
    id: channel.id
  }, channel.guild.name);
});

client.on('channelDelete', async (channel) => {
  if (!channel.guild) return;
  logChannel(channel, 'deletado');
  logEvent('channelDelete', { 
    name: channel.name, 
    id: channel.id
  }, channel.guild.name);
});

client.on('channelUpdate', async (oldChannel, newChannel) => {
  if (!oldChannel.guild) return;
  if (oldChannel.name === newChannel.name) return;

  logChannel(newChannel, 'atualizado');
  logEvent('channelUpdate', { 
    oldName: oldChannel.name, 
    newName: newChannel.name
  }, oldChannel.guild.name);
});

client.on('roleCreate', async (role) => {
  if (!role.guild) return;
  logRole(role, 'criado');
  logEvent('roleCreate', { 
    name: role.name, 
    id: role.id,
    color: role.hexColor
  }, role.guild.name);
});

client.on('roleDelete', async (role) => {
  if (!role.guild) return;
  logRole(role, 'deletado');
  logEvent('roleDelete', { 
    name: role.name, 
    id: role.id
  }, role.guild.name);
});

client.on('roleUpdate', async (oldRole, newRole) => {
  if (!oldRole.guild) return;
  if (oldRole.name === newRole.name && oldRole.hexColor === newRole.hexColor) return;

  logRole(newRole, 'atualizado');
  logEvent('roleUpdate', { 
    oldName: oldRole.name, 
    newName: newRole.name,
    oldColor: oldRole.hexColor,
    newColor: newRole.hexColor
  }, oldRole.guild.name);
});

client.on('guildEmojiCreate', async (emoji) => {
  logEvent('guildEmojiCreate', { 
    name: emoji.name, 
    id: emoji.id,
    animated: emoji.animated
  }, emoji.guild.name);
});

client.on('guildEmojiDelete', async (emoji) => {
  logEvent('guildEmojiDelete', { 
    name: emoji.name, 
    id: emoji.id
  }, emoji.guild.name);
});

client.on('guildEmojiUpdate', async (oldEmoji, newEmoji) => {
  if (oldEmoji.name === newEmoji.name) return;
  
  logEvent('guildEmojiUpdate', { 
    oldName: oldEmoji.name, 
    newName: newEmoji.name
  }, oldEmoji.guild.name);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  if (!oldState.channel && newState.channel) {
    logVoice(newState.member.user.tag, 'entrou no canal de voz', newState.channel.name);
    voiceEventCounter++;
    logEvent('voiceJoin', { 
      user: newState.member.user.tag, 
      channel: newState.channel.name
    }, newState.guild.name);
  } else if (oldState.channel && !newState.channel) {
    logVoice(oldState.member.user.tag, 'saiu do canal de voz', oldState.channel.name);
    voiceEventCounter++;
    logEvent('voiceLeave', { 
      user: oldState.member.user.tag, 
      channel: oldState.channel.name
    }, oldState.guild.name);
  } else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
    logVoice(newState.member.user.tag, 'moveu de canal', `${oldState.channel.name} → ${newState.channel.name}`);
    voiceEventCounter++;
    logEvent('voiceMove', { 
      user: newState.member.user.tag, 
      oldChannel: oldState.channel.name,
      newChannel: newState.channel.name
    }, newState.guild.name);
  }
  
  if (oldState.serverMute !== newState.serverMute) {
    logEvent('voiceMute', {
      user: newState.member?.user?.tag,
      muted: newState.serverMute
    }, newState.guild?.name);
  }
  
  if (oldState.serverDeaf !== newState.serverDeaf) {
    logEvent('voiceDeaf', {
      user: newState.member?.user?.tag,
      deafened: newState.serverDeaf
    }, newState.guild?.name);
  }
  
  if (oldState.selfVideo !== newState.selfVideo) {
    logEvent('voiceVideo', {
      user: newState.member?.user?.tag,
      video: newState.selfVideo
    }, newState.guild?.name);
  }
  
  if (oldState.selfStream !== newState.selfStream) {
    logEvent('voiceStream', {
      user: newState.member?.user?.tag,
      streaming: newState.selfStream
    }, newState.guild?.name);
  }
});

client.on('guildUpdate', async (oldGuild, newGuild) => {
  logGuild(newGuild, 'atualizado');
  if (oldGuild.name !== newGuild.name) {
    logEvent('guildNameUpdate', { 
      oldName: oldGuild.name, 
      newName: newGuild.name 
    }, newGuild.name);
  }
  if (oldGuild.icon !== newGuild.icon) {
    logEvent('guildIconUpdate', {}, newGuild.name);
  }
  if (oldGuild.banner !== newGuild.banner) {
    logEvent('guildBannerUpdate', {}, newGuild.name);
  }
});

client.on('guildBanAdd', async (guild, user) => {
  logEvent('guildBanAdd', { 
    user: user.tag, 
    id: user.id
  }, guild.name);
});

client.on('guildBanRemove', async (guild, user) => {
  logEvent('guildBanRemove', { 
    user: user.tag, 
    id: user.id
  }, guild.name);
});

client.on('inviteCreate', async (invite) => {
  logEvent('inviteCreate', { 
    code: invite.code, 
    inviter: invite.inviter ? invite.inviter.tag : 'Desconhecido',
    maxUses: invite.maxUses || 'Ilimitado',
    channel: invite.channel.name
  }, invite.guild.name);
});

client.on('inviteDelete', async (invite) => {
  logEvent('inviteDelete', { 
    code: invite.code, 
    channel: invite.channel.name
  }, invite.guild.name);
});

client.on('webhookUpdate', async (channel) => {
  logEvent('webhookUpdate', { 
    channel: channel.name
  }, channel.guild.name);
});

client.on('guildIntegrationsUpdate', async (guild) => {
  logEvent('guildIntegrationsUpdate', {}, guild.name);
});

client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  
  logReaction(user.tag, reaction.emoji.name, 'adicionou');
  logEvent('messageReactionAdd', { 
    user: user.tag, 
    emoji: reaction.emoji.name,
    messageId: reaction.message.id
  }, reaction.message.guild?.name);
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;
  
  logReaction(user.tag, reaction.emoji.name, 'removeu');
  logEvent('messageReactionRemove', { 
    user: user.tag, 
    emoji: reaction.emoji.name,
    messageId: reaction.message.id
  }, reaction.message.guild?.name);
});

client.on('messageReactionRemoveAll', async (message) => {
  logEvent('messageReactionRemoveAll', { 
    messageId: message.id,
    author: message.author?.tag
  }, message.guild?.name);
});

client.on('messageReactionRemoveEmoji', async (reaction) => {
  logEvent('messageReactionRemoveEmoji', { 
    emoji: reaction.emoji.name,
    messageId: reaction.message.id
  }, reaction.message.guild?.name);
});

client.on('guildScheduledEventCreate', async (event) => {
  logEvent('guildScheduledEventCreate', { 
    name: event.name, 
    description: event.description?.substring(0, 50),
    start: event.scheduledStartAt?.toISOString()
  }, event.guild.name);
});

client.on('guildScheduledEventUpdate', async (oldEvent, newEvent) => {
  if (oldEvent.name === newEvent.name) return;
  
  logEvent('guildScheduledEventUpdate', { 
    oldName: oldEvent.name, 
    newName: newEvent.name
  }, newEvent.guild.name);
});

client.on('guildScheduledEventDelete', async (event) => {
  logEvent('guildScheduledEventDelete', { 
    name: event.name
  }, event.guild.name);
});

client.on('guildScheduledEventUserAdd', async (event, user) => {
  logEvent('guildScheduledEventUserAdd', { 
    event: event.name, 
    user: user.tag
  }, event.guild.name);
});

client.on('guildScheduledEventUserRemove', async (event, user) => {
  logEvent('guildScheduledEventUserRemove', { 
    event: event.name, 
    user: user.tag
  }, event.guild.name);
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  if (oldMember.nickname !== newMember.nickname) {
    logEvent('nicknameUpdate', {
      user: newMember.user.tag,
      oldNick: oldMember.nickname || 'Nenhum',
      newNick: newMember.nickname || 'Nenhum'
    }, newMember.guild.name);
  }
  
  if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
    const added = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
    const removed = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));
    
    if (added.size > 0) {
      logEvent('roleAdd', {
        user: newMember.user.tag,
        roles: added.map(r => r.name).join(', ')
      }, newMember.guild.name);
    }
    
    if (removed.size > 0) {
      logEvent('roleRemove', {
        user: newMember.user.tag,
        roles: removed.map(r => r.name).join(', ')
      }, newMember.guild.name);
    }
  }
});

client.on('presenceUpdate', async (oldPresence, newPresence) => {
  if (!newPresence || !newPresence.member) return;
  
  if (oldPresence?.status !== newPresence.status) {
    logEvent('presenceStatus', {
      user: newPresence.member.user.tag,
      oldStatus: oldPresence?.status || 'offline',
      newStatus: newPresence.status
    }, newPresence.guild?.name);
  }
  
  const oldActivity = oldPresence?.activities?.[0]?.name;
  const newActivity = newPresence.activities?.[0]?.name;
  
  if (oldActivity !== newActivity && newActivity) {
    logEvent('presenceActivity', {
      user: newPresence.member.user.tag,
      activity: newActivity
    }, newPresence.guild?.name);
  }
});

client.on('typingStart', async (typing) => {
  logEvent('typingStart', {
    user: typing.user.tag,
    channel: typing.channel.name
  }, typing.guild?.name);
});

client.on('userUpdate', async (oldUser, newUser) => {
  if (oldUser.username !== newUser.username) {
    logEvent('usernameUpdate', {
      oldUsername: oldUser.username,
      newUsername: newUser.username,
      userId: newUser.id
    });
  }
  
  if (oldUser.discriminator !== newUser.discriminator) {
    logEvent('discriminatorUpdate', {
      user: newUser.tag,
      oldDiscrim: oldUser.discriminator,
      newDiscrim: newUser.discriminator
    });
  }
  
  if (oldUser.avatar !== newUser.avatar) {
    logEvent('avatarUpdate', {
      user: newUser.tag
    });
  }
});

client.on('guildCreate', async (guild) => {
  logGuild(guild, 'entrou');
  logSuccess(`Bot adicionado ao servidor: ${guild.name} (${guild.memberCount} membros)`, 'SERVIDOR');
  logEvent('guildCreate', {
    name: guild.name,
    id: guild.id,
    members: guild.memberCount,
    owner: (await guild.fetchOwner()).user.tag
  }, guild.name);
});

client.on('guildDelete', async (guild) => {
  logGuild(guild, 'saiu');
  logWarn(`Bot removido do servidor: ${guild.name}`, 'SERVIDOR');
  logEvent('guildDelete', {
    name: guild.name,
    id: guild.id
  }, guild.name);
});

client.on('guildUnavailable', async (guild) => {
  logWarn(`Servidor indisponível: ${guild.name}`, 'SERVIDOR');
  logEvent('guildUnavailable', {
    name: guild.name,
    id: guild.id
  }, guild.name);
});

client.on('invalidated', () => {
  logError('Sessão do Discord invalidada!', null, 'DISCORD');
  logShutdown();
});

client.on('rateLimit', (rateLimit) => {
  logWarn(`Rate limit atingido: ${rateLimit.method} ${rateLimit.path} (limite: ${rateLimit.limit}, timeout: ${rateLimit.timeout}ms)`, 'DISCORD');
  logEvent('rateLimit', rateLimit);
});

client.on('debug', (info) => {
  if (process.env.DEBUG === 'true') {
    logDebug(`Debug Discord: ${info.substring(0, 200)}${info.length > 200 ? '...' : ''}`, null, 'DISCORD');
  }
});

client.on('warn', (info) => {
  logWarn(`Aviso Discord: ${info}`, 'DISCORD');
});

client.on('error', (error) => {
  logError(`Erro Discord: ${error.message}`, error, 'DISCORD');
});

client.on('shardDisconnect', (event, shardId) => {
  logWarn(`Shard ${shardId} desconectado`, 'SHARD');
  logEvent('shardDisconnect', { shardId, code: event.code, reason: event.reason });
});

client.on('shardError', (error, shardId) => {
  logError(`Erro no shard ${shardId}: ${error.message}`, error, 'SHARD');
});

client.on('shardReady', (shardId) => {
  logSuccess(`Shard ${shardId} pronto`, 'SHARD');
});

client.on('shardReconnecting', (shardId) => {
  logInfo(`Shard ${shardId} reconectando`, 'SHARD');
});

client.on('shardResume', (shardId, replayedEvents) => {
  logInfo(`Shard ${shardId} reconectado (eventos repetidos: ${replayedEvents})`, 'SHARD');
});

// ===============================
// ERROS NÃO TRATADOS
// ===============================
process.on('unhandledRejection', (error) => {
  logError(`Erro não tratado: ${error.message}`, error, 'PROCESSO');
  console.error(error);
});

process.on('uncaughtException', (error) => {
  logError(`Exceção não tratada: ${error.message}`, error, 'PROCESSO');
  console.error(error);
  process.exit(1);
});

process.on('SIGINT', () => {
  logShutdown();
  stopHeartbeat();
  console.log(chalk.red('❌ Bot encerrado por Ctrl+C'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  logShutdown();
  stopHeartbeat();
  console.log(chalk.red('❌ Bot encerrado por SIGTERM'));
  process.exit(0);
});

process.on('exit', (code) => {
  console.log(chalk.yellow(`Processo encerrado com código ${code}`));
});

// ===============================
// LOG DE INICIALIZAÇÃO
// ===============================
logStartup();
startHeartbeat(60000); // Inicia heartbeat automático a cada 60 segundos

// ===============================
// LOGIN DO BOT
// ===============================
client.login(process.env.TOKEN).catch(error => {
  logError(`Falha no login: ${error.message}`, error, 'LOGIN');
  process.exit(1);
});
