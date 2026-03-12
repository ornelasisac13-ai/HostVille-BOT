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
// VARIÁVEL PARA CONTAGEM DE LOGS
// ===============================
let logCounter = 0;
let moderationCounter = 0;
let commandCounter = 0;
const startTime = Date.now();

// ===============================
// FUNÇÕES DE LOG PERSONALIZADAS
// ===============================
function getTimestamp() {
  return chalk.gray(`[${new Date().toLocaleString('pt-BR')}]`);
}

function getColoredTimestamp() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return chalk.gray(`[${hours}:${minutes}:${seconds}]`);
}

function logInfo(message) {
  logCounter++;
  console.log(`${getColoredTimestamp()} ${chalk.green('➜ INFO')}: ${chalk.cyan(message)} ${chalk.gray(`(#${logCounter})`)}`);
}

function logError(message) {
  logCounter++;
  console.log(`${getColoredTimestamp()} ${chalk.red('✖ ERRO')}: ${chalk.yellow(message)} ${chalk.gray(`(#${logCounter})`)}`);
}

function logWarn(message) {
  logCounter++;
  console.log(`${getColoredTimestamp()} ${chalk.yellow('⚠ AVISO')}: ${chalk.white(message)} ${chalk.gray(`(#${logCounter})`)}`);
}

function logSuccess(message) {
  logCounter++;
  console.log(`${getColoredTimestamp()} ${chalk.green('✔ SUCESSO')}: ${chalk.white(message)} ${chalk.gray(`(#${logCounter})`)}`);
}

function logDebug(message, data = null) {
  logCounter++;
  console.log(`${getColoredTimestamp()} ${chalk.magenta('🔍 DEBUG')}: ${chalk.white(message)}`);
  if (data) {
    console.log(chalk.gray('   Dados:'), data);
  }
  console.log(chalk.gray(`   Log #${logCounter}`));
}

function logModeration(message, user, content, channel) {
  moderationCounter++;
  console.log(chalk.red.bgBlack.bold('\n 🛡️ MENSAGEM MODERADA '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Usuário:   ${user.tag}`));
  console.log(chalk.red(`   ID:        ${user.id}`));
  console.log(chalk.red(`   Conteúdo:  ${content}`));
  console.log(chalk.red(`   Canal:     #${channel.name}`));
  console.log(chalk.red(`   Motivo:    ${message}`));
  console.log(chalk.red(`   Mod #:     ${moderationCounter}`));
  console.log(chalk.red('────────────────────────────────\n'));
}

function logCommand(command, user, guild = null) {
  commandCounter++;
  console.log(`${getColoredTimestamp()} ${chalk.blue('⚙ COMANDO')}: ${chalk.white(command)} ${chalk.gray(`por ${user.tag}`)} ${guild ? chalk.gray(`em ${guild.name}`) : ''} ${chalk.gray(`(#${commandCounter})`)}`);
}

function logEvent(event, details) {
  console.log(`${getColoredTimestamp()} ${chalk.cyan('📢 EVENTO')}: ${chalk.white(event)}`);
  if (details) {
    console.log(chalk.gray('   Detalhes:'), details);
  }
}

function logDatabase(action, status) {
  console.log(`${getColoredTimestamp()} ${chalk.yellow('💾 DB')}: ${chalk.white(action)} - ${status}`);
}

function logNetwork(action, status) {
  console.log(`${getColoredTimestamp()} ${chalk.blue('🌐 NET')}: ${chalk.white(action)} - ${status}`);
}

function logPerformance(action, timeMs) {
  console.log(`${getColoredTimestamp()} ${chalk.magenta('⚡ PERF')}: ${chalk.white(action)} ${chalk.gray(`(${timeMs}ms)`)}`);
}

function logSystem(message) {
  console.log(`${getColoredTimestamp()} ${chalk.cyan('🖥️ SISTEMA')}: ${chalk.white(message)}`);
}

function logAPI(endpoint, method, status) {
  console.log(`${getColoredTimestamp()} ${chalk.yellow('🔌 API')}: ${chalk.white(method)} ${endpoint} - ${status}`);
}

function logMemoryUsage() {
  const used = process.memoryUsage();
  console.log(chalk.cyan('\n📊 MEMORY USAGE:'));
  console.log(chalk.white(`   RSS:       ${Math.round(used.rss / 1024 / 1024)} MB`));
  console.log(chalk.white(`   Heap Total: ${Math.round(used.heapTotal / 1024 / 1024)} MB`));
  console.log(chalk.white(`   Heap Used:  ${Math.round(used.heapUsed / 1024 / 1024)} MB`));
  console.log(chalk.white(`   External:   ${Math.round(used.external / 1024 / 1024)} MB`));
}

function logStartup() {
  console.log(chalk.green('\n' + '═'.repeat(60)));
  console.log(chalk.green('  🚀 INICIANDO BOT - SISTEMA DE LOGS AMPLIADO'));
  console.log(chalk.green('═'.repeat(60)));
  logSystem(`Inicializando em ${new Date().toLocaleString('pt-BR')}`);
  logSystem(`Node.js version: ${process.version}`);
  logSystem(`Plataforma: ${process.platform} ${process.arch}`);
  logMemoryUsage();
}

function logShutdown() {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;
  
  console.log(chalk.red('\n' + '═'.repeat(60)));
  console.log(chalk.red('  🔴 ENCERRANDO BOT'));
  console.log(chalk.red('═'.repeat(60)));
  logSystem(`Uptime total: ${hours}h ${minutes}m ${seconds}s`);
  logSystem(`Total de logs: ${logCounter}`);
  logSystem(`Moderações: ${moderationCounter}`);
  logSystem(`Comandos: ${commandCounter}`);
  logMemoryUsage();
  console.log(chalk.red('═'.repeat(60) + '\n'));
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
      logDebug('Verificando código de acesso', { codeProvided: code, expected: CONFIG.ACCESSODE });
      
      if (code !== CONFIG.ACCESS_CODE) {
        logWarn(`Tentativa de acesso inválida por ${interaction.user.tag}`);
        await interaction.reply({ 
          content: '❌ Código de acesso incorreto!', 
          flags: 64
        });
        logPerformance('/adm', Date.now() - startCmd);
        return;
      }

      logSuccess(`Acesso administrativo concedido para ${interaction.user.tag}`);

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
    logInfo(`Comando /ping usado por ${interaction.user.tag} - Ping: ${client.ws.ping}ms`);
    logPerformance('/ping', Date.now() - startCmd);
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
    logInfo(`Comando /help usado por ${interaction.user.tag}`);
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

    // Verifica se o código está correto
    if (code !== CONFIG.ACCESS_CODE) {
      logWarn(`Tentativa de /private com código inválido por ${interaction.user.tag}`);
      await interaction.reply({
        content: '❌ Código de acesso incorreto!',
        flags: 64
      });
      logPerformance('/private', Date.now() - startCmd);
      return;
    }

    try {
      // Envia mensagem no canal
      await interaction.channel.send(
        `🛠 **Mensagem da Staff 🛠**\n\n${user}\n\n${message}`
      );

      // Envia mensagem privada para o usuário
      await user.send({
        content: `📬 **Mensagem da Staff**\n\n${message}`
      });

      await interaction.reply({
        content:
          `✅ Mensagem enviada\n\nPara ${user}\n\nMensagem enviada:\n${message}`,
        flags: 64
      });

      logInfo(`${interaction.user.tag} enviou mensagem para ${user.tag}`);
      logPerformance('/private', Date.now() - startCmd);
    } catch (error) {
      logError(`Erro ao enviar mensagem privada: ${error.message}`);
      logDebug('Detalhes do erro', { error: error.stack });
      
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
  // Ignora bots
  if (message.author.bot) {
    logDebug(`Mensagem de bot ignorada: ${message.author.tag}`);
    return;
  }

  logEvent('messageCreate', { 
    author: message.author.tag, 
    channel: message.channel.name,
    contentPreview: message.content.substring(0, 30) + (message.content.length > 30 ? '...' : '')
  });

  // Ignora membros com cargos de Admin/Staff
  if (isAdmin(message.member)) {
    logDebug(`Mensagem de admin ignorada: ${message.author.tag}`);
    return;
  }

  // Verifica se a mensagem contém palavra ofensiva
  if (containsOffensiveWord(message.content)) {
    logWarn(`Palavra ofensiva detectada de ${message.author.tag}`);
    
    try {
      // Verifica se o bot tem permissão para deletar
      const permissions = message.channel.permissionsFor(client.user);
      if (!permissions.has(PermissionFlagsBits.ManageMessages)) {
        logWarn(`Bot não tem permissão para deletar mensagens em #${message.channel.name}`);
        return;
      }

      // Verifica se a mensagem pode ser deletada (não pode ser > 14 dias)
      if (!message.deletable) {
        logWarn(`Mensagem muito antiga para ser deletada em #${message.channel.name}`);
        return;
      }

      // Deleta a mensagem
      await message.delete();
      logSuccess(`Mensagem deletada de ${message.author.tag}`);

      // Avisa o usuário no chat
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

      // Log detalhado
      logModeration("Palavras ofensivas detectadas", message.author, message.content, message.channel);

    } catch (err) {
      logError(`Erro ao moderar mensagem: ${err.message}`);
      logDebug('Stack do erro', err.stack);
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
  
  logSystem(`Bot iniciado como ${client.user.tag}`);
  logSystem(`ID do bot: ${client.user.id}`);
  logSystem(`Total de servidores: ${client.guilds.cache.size}`);
  
  // Registrar comandos em TODOS os servidores
  if (client.guilds.cache.size > 0) {
    try {
      let registeredCount = 0;
      for (const guild of client.guilds.cache.values()) {
        await guild.commands.set([
          ...commands.map(c => c.data),
          pingCommand.data,
          helpCommand.data,
          privateCommand.data
        ]);
        logSuccess(`Comandos registrados em: ${guild.name}`);
        registeredCount++;
      }
      logInfo(`Comandos registrados em ${registeredCount} servidores com sucesso!`);
      logDatabase('Registro de comandos', 'Sucesso');
    } catch (error) {
      logError(`Erro ao registrar comandos: ${error.message}`);
      logDatabase('Registro de comandos', `Falha: ${error.message}`);
    }
  } else {
    logWarn('Nenhum servidor encontrado. Comandos não registrados.');
  }

  console.log(chalk.green('\n  ✅ Tudo pronto! Bot conectado com sucesso.\n'));
  
  // Inicia o menu interativo
  initReadline();
  showMenu();
  
  // Log de performance inicial
  logPerformance('Inicialização completa', Date.now() - startTime);
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
  // Handler para comandos de chat input (slash commands)
  if (interaction.isChatInputCommand()) {
    const command = commands.find(c => c.data.name === interaction.commandName);
    if (!command) {
      // Verifica comandos adicionais
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
      logWarn(`Comando desconhecido: ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logError(`Erro ao executar comando ${interaction.commandName}: ${error.message}`);
      logDebug('Stack do erro', error.stack);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '❌ Ocorreu um erro ao executar este comando.', flags: 64 });
      } else {
        await interaction.reply({ content: '❌ Ocorreu um erro ao executar este comando.', flags: 64 });
      }
    }
    return;
  }

  // Handler para botões
  if (interaction.isButton()) {
    logEvent('buttonInteraction', { user: interaction.user.tag, customId: interaction.customId });
    await handleButtonInteraction(interaction);
    return;
  }

  // Handler para modais
  if (interaction.isModalSubmit()) {
    logEvent('modalSubmit', { user: interaction.user.tag, customId: interaction.customId });
    logInfo(`Modal submetido por ${interaction.user.tag}`);
  }

  // Handler para select menus
  if (interaction.isStringSelectMenu()) {
    logEvent('selectMenu', { 
      user: interaction.user.tag, 
      customId: interaction.customId,
      values: interaction.values 
    });
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
          { name: '🎵 Atividade', value: activity, inline: true },
          { name: '📊 Logs Totais', value: `${logCounter}`, inline: true },
          { name: '🛡️ Moderações', value: `${moderationCounter}`, inline: true },
          { name: '⚙️ Comandos', value: `${commandCounter}`, inline: true }
        )
        .setFooter({ text: 'Estatísticas atualizadas' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
      logInfo(`${interaction.user.tag} abriu estatísticas`);
      break;
    }

    case 'console': {
      console.log(chalk.yellow('\n═══ ESTATÍSTICAS DO BOT ═══'));
      console.log(chalk.white(`Ping:    ${client.ws.ping}ms`));
      console.log(chalk.white(`Uptime:  ${Math.floor(client.uptime / 3600000)}h`));
      console.log(chalk.white(`Servers: ${client.guilds.cache.size}`));
      console.log(chalk.white(`Users:   ${client.users.cache.size}`));
      console.log(chalk.white(`Logs:    ${logCounter}`));
      console.log(chalk.white(`Mods:    ${moderationCounter}`));
      console.log(chalk.white(`Comandos: ${commandCounter}`));
      console.log(chalk.yellow('═════════════════════════════\n'));
      await interaction.reply({ content: '✅ Verifique o console!', flags: 64 });
      logDebug('Estatísticas enviadas para o console');
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
      break;
    }

    default:
      logWarn(`Botão desconhecido: ${interaction.customId}`);
      await interaction.reply({ content: '❌ Botão desconhecido!', flags: 64 });
  }
  
  logPerformance(`Button: ${interaction.customId}`, Date.now() - startBtn);
}

// ===============================
// MENU INTERATIVO NO CONSOLE
// ===============================

function showMenu() {
  if (isMenuActive) return;
  isMenuActive = true;
  
  console.log(chalk.cyan('\n╔═══════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║                  𝙷𝚘𝚜𝚝𝚅𝚒𝚕𝚕𝚎-𝙱𝙾𝚃 𝚅𝚎𝚛𝚜ã𝚘 𝟺.𝟸.𝟶                     ║'));
  console.log(chalk.cyan('╠═══════════════════════════════════════════════════════╣'));
  console.log(chalk.cyan('║  1.  Ver estatísticas detalhadas                                ║'));
  console.log(chalk.cyan('║  2.  Listar todos os servidores                                 ║'));
  console.log(chalk.cyan('║  3.  Ver membros de um servidor                                 ║'));
  console.log(chalk.cyan('║  4.  Enviar mensagem para canal                                 ║'));
  console.log(chalk.cyan('║  5.  Atualizar dados                                            ║'));
  console.log(chalk.cyan('║  6.  Ver logs recentes                                          ║'));
  console.log(chalk.cyan('║  7.  Ver status do bot                                          ║'));
  console.log(chalk.cyan('║  8.  Ver estatísticas de logs                                   ║'));
  console.log(chalk.cyan('║  9.  Ver uso de memória                                         ║'));
  console.log(chalk.cyan('║  10. Limpar console                                             ║'));
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
  
  logDebug(`Menu option selected: ${option}`);
  
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
      logInfo('Dados do menu atualizados manualmente');
      showMenu();
      break;
    case '6':
      showRecentLogs();
      break;
    case '7':
      showBotStatus();
      break;
    case '8':
      showLogStats();
      break;
    case '9':
      logMemoryUsage();
      showMenu();
      break;
    case '10':
      console.clear();
      logInfo('Console limpo');
      showMenu();
      break;
    case '0':
      logShutdown();
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
  console.log(chalk.yellow('═══════════════════════════════\n'));
  
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
      logInfo(`Listando membros de ${guild.name}`);
      
      try {
        const startFetch = Date.now();
        await guild.members.fetch();
        logPerformance(`Fetch membros ${guild.name}`, Date.now() - startFetch);
        
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
        logError(`Erro ao buscar membros: ${error.message}`);
        logDebug('Detalhes do erro', error.stack);
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
              logPerformance('Envio de mensagem', Date.now() - startSend);
              console.log(chalk.green(`\n✅ Mensagem enviada para #${channel.name}!`));
              logInfo(`Mensagem enviada para #${channel.name} em ${guild.name}`);
            } catch (error) {
              logError(`Erro ao enviar mensagem: ${error.message}`);
              logDebug('Detalhes do erro', error.stack);
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
  console.log(chalk.yellow('══════════════════════════════\n'));
  showMenu();
}

function showLogStats() {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const logsPerHour = (logCounter / (uptimeSeconds / 3600)).toFixed(2);
  
  console.log(chalk.yellow('\n═══ 📊 ESTATÍSTICAS DE LOGS ═══'));
  console.log(chalk.white(`📝 Total de logs: ${logCounter}`));
  console.log(chalk.white(`🛡️  Moderações: ${moderationCounter}`));
  console.log(chalk.white(`⚙️  Comandos: ${commandCounter}`));
  console.log(chalk.white(`📈 Logs por hora: ${logsPerHour}`));
  console.log(chalk.white(`⏱️  Uptime: ${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`));
  console.log(chalk.yellow('═══════════════════════════════\n'));
  showMenu();
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
    logWarn('Não foi possível buscar logs de auditoria');
  }

  console.log(chalk.red.bgBlack.bold('\n 🗑️ MENSAGEM DELETADA '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Autor:     ${message.author.tag}`));
  console.log(chalk.red(`   Conteúdo:  ${message.content || '[sem texto]'}`));
  console.log(chalk.red(`   Deletado por: ${deleter}`));
  console.log(chalk.red(`   Canal:     #${message.channel.name}`));
  console.log(chalk.red(`   Servidor:  ${message.guild.name}`));
  console.log(chalk.red(`   Data:      ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.red('────────────────────────────────\n'));
  
  logEvent('messageDelete', { 
    author: message.author.tag, 
    channel: message.channel.name,
    deleter: deleter
  });
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
  console.log(chalk.yellow(`   Servidor:  ${oldMessage.guild.name}`));
  console.log(chalk.yellow(`   Data:      ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.yellow('────────────────────────────────\n'));
  
  logEvent('messageUpdate', { 
    author: oldMessage.author.tag, 
    channel: oldMessage.channel.name 
  });
});

client.on('guildMemberAdd', async (member) => {
  console.log(chalk.green.bgBlack.bold('\n 👤 NOVO MEMBRO '));
  console.log(chalk.green('────────────────────────────────'));
  console.log(chalk.green(`   Usuário: ${member.user.tag}`));
  console.log(chalk.green(`   ID:      ${member.user.id}`));
  console.log(chalk.green(`   Servidor: ${member.guild.name}`));
  console.log(chalk.green(`   Conta criada: ${member.user.createdAt.toLocaleDateString('pt-BR')}`));
  console.log(chalk.green(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.green('────────────────────────────────\n'));
  
  logInfo(`Novo membro: ${member.user.tag} (${member.guild.name})`);
  logEvent('guildMemberAdd', { 
    user: member.user.tag, 
    guild: member.guild.name 
  });
});

client.on('guildMemberRemove', async (member) => {
  console.log(chalk.red.bgBlack.bold('\n ❌ MEMBRO SAIU '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Usuário: ${member.user.tag}`));
  console.log(chalk.red(`   Servidor: ${member.guild.name}`));
  console.log(chalk.red(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.red('────────────────────────────────\n'));
  
  logInfo(`Membro saiu: ${member.user.tag} (${member.guild.name})`);
  logEvent('guildMemberRemove', { 
    user: member.user.tag, 
    guild: member.guild.name 
  });
});

client.on('channelCreate', async (channel) => {
  if (!channel.guild) return;
  console.log(chalk.blue.bgBlack.bold('\n 📁 CANAL CRIADO '));
  console.log(chalk.blue('────────────────────────────────'));
  console.log(chalk.blue(`   Nome:  #${channel.name}`));
  console.log(chalk.blue(`   Tipo:  ${channel.type}`));
  console.log(chalk.blue(`   Servidor: ${channel.guild.name}`));
  console.log(chalk.blue(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.blue('────────────────────────────────\n'));
  
  logEvent('channelCreate', { 
    name: channel.name, 
    type: channel.type,
    guild: channel.guild.name 
  });
});

client.on('channelDelete', async (channel) => {
  if (!channel.guild) return;
  console.log(chalk.red.bgBlack.bold('\n 🗑️ CANAL DELETADO '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Nome:  #${channel.name}`));
  console.log(chalk.red(`   Servidor: ${channel.guild.name}`));
  console.log(chalk.red(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.red('────────────────────────────────\n'));
  
  logEvent('channelDelete', { 
    name: channel.name, 
    guild: channel.guild.name 
  });
});

client.on('channelUpdate', async (oldChannel, newChannel) => {
  if (!oldChannel.guild) return;
  if (oldChannel.name === newChannel.name) return;

  console.log(chalk.yellow.bgBlack.bold('\n 🔄 CANAL ATUALIZADO '));
  console.log(chalk.yellow('────────────────────────────────'));
  console.log(chalk.yellow(`   Nome Antigo: #${oldChannel.name}`));
  console.log(chalk.yellow(`   Nome Novo:   #${newChannel.name}`));
  console.log(chalk.yellow(`   Servidor:    ${oldChannel.guild.name}`));
  console.log(chalk.yellow(`   Data:        ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.yellow('────────────────────────────────\n'));
  
  logEvent('channelUpdate', { 
    oldName: oldChannel.name, 
    newName: newChannel.name,
    guild: oldChannel.guild.name 
  });
});

client.on('roleCreate', async (role) => {
  if (!role.guild) return;
  console.log(chalk.magenta.bgBlack.bold('\n 🎭 ROLE CRIADA '));
  console.log(chalk.magenta('────────────────────────────────'));
  console.log(chalk.magenta(`   Nome:  ${role.name}`));
  console.log(chalk.magenta(`   ID:    ${role.id}`));
  console.log(chalk.magenta(`   Cor:   ${role.hexColor}`));
  console.log(chalk.magenta(`   Servidor: ${role.guild.name}`));
  console.log(chalk.magenta(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.magenta('────────────────────────────────\n'));
  
  logEvent('roleCreate', { 
    name: role.name, 
    guild: role.guild.name 
  });
});

client.on('roleDelete', async (role) => {
  if (!role.guild) return;
  console.log(chalk.red.bgBlack.bold('\n 🗑️ ROLE DELETADA '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Nome:  ${role.name}`));
  console.log(chalk.red(`   ID:    ${role.id}`));
  console.log(chalk.red(`   Servidor: ${role.guild.name}`));
  console.log(chalk.red(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.red('────────────────────────────────\n'));
  
  logEvent('roleDelete', { 
    name: role.name, 
    guild: role.guild.name 
  });
});

client.on('roleUpdate', async (oldRole, newRole) => {
  if (!oldRole.guild) return;
  if (oldRole.name === newRole.name && oldRole.hexColor === newRole.hexColor) return;

  console.log(chalk.yellow.bgBlack.bold('\n 🔄 ROLE ATUALIZADA '));
  console.log(chalk.yellow('────────────────────────────────'));
  console.log(chalk.yellow(`   Nome Antigo: ${oldRole.name}`));
  console.log(chalk.yellow(`   Nome Novo:   ${newRole.name}`));
  console.log(chalk.yellow(`   Cor Antiga:  ${oldRole.hexColor}`));
  console.log(chalk.yellow(`   Cor Nova:    ${newRole.hexColor}`));
  console.log(chalk.yellow(`   Servidor:    ${oldRole.guild.name}`));
  console.log(chalk.yellow(`   Data:        ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.yellow('────────────────────────────────\n'));
  
  logEvent('roleUpdate', { 
    oldName: oldRole.name, 
    newName: newRole.name,
    guild: oldRole.guild.name 
  });
});

client.on('guildEmojiCreate', async (emoji) => {
  console.log(chalk.cyan.bgBlack.bold('\n 😊 EMOJI CRIADO '));
  console.log(chalk.cyan('────────────────────────────────'));
  console.log(chalk.cyan(`   Nome:  ${emoji.name}`));
  console.log(chalk.cyan(`   ID:    ${emoji.id}`));
  console.log(chalk.cyan(`   Animado: ${emoji.animated ? 'Sim' : 'Não'}`));
  console.log(chalk.cyan(`   Servidor: ${emoji.guild.name}`));
  console.log(chalk.cyan(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.cyan('────────────────────────────────\n'));
  
  logEvent('guildEmojiCreate', { 
    name: emoji.name, 
    guild: emoji.guild.name 
  });
});

client.on('guildEmojiDelete', async (emoji) => {
  console.log(chalk.red.bgBlack.bold('\n 🗑️ EMOJI DELETADO '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Nome:  ${emoji.name}`));
  console.log(chalk.red(`   ID:    ${emoji.id}`));
  console.log(chalk.red(`   Servidor: ${emoji.guild.name}`));
  console.log(chalk.red(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.red('────────────────────────────────\n'));
  
  logEvent('guildEmojiDelete', { 
    name: emoji.name, 
    guild: emoji.guild.name 
  });
});

client.on('guildEmojiUpdate', async (oldEmoji, newEmoji) => {
  if (oldEmoji.name === newEmoji.name) return;
  
  console.log(chalk.yellow.bgBlack.bold('\n 🔄 EMOJI ATUALIZADO '));
  console.log(chalk.yellow('────────────────────────────────'));
  console.log(chalk.yellow(`   Nome Antigo: ${oldEmoji.name}`));
  console.log(chalk.yellow(`   Nome Novo:   ${newEmoji.name}`));
  console.log(chalk.yellow(`   Servidor:    ${oldEmoji.guild.name}`));
  console.log(chalk.yellow(`   Data:        ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.yellow('────────────────────────────────\n'));
  
  logEvent('guildEmojiUpdate', { 
    oldName: oldEmoji.name, 
    newName: newEmoji.name,
    guild: oldEmoji.guild.name 
  });
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  if (!oldState.channel && newState.channel) {
    console.log(chalk.green.bgBlack.bold('\n 🎤 ENTROU NO CANAL DE VOZ '));
    console.log(chalk.green('────────────────────────────────'));
    console.log(chalk.green(`   Usuário: ${newState.member.user.tag}`));
    console.log(chalk.green(`   Canal:   #${newState.channel.name}`));
    console.log(chalk.green(`   Servidor: ${newState.guild.name}`));
    console.log(chalk.green(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
    console.log(chalk.green('────────────────────────────────\n'));
    
    logEvent('voiceJoin', { 
      user: newState.member.user.tag, 
      channel: newState.channel.name,
      guild: newState.guild.name 
    });
  } else if (oldState.channel && !newState.channel) {
    console.log(chalk.red.bgBlack.bold('\n 🎤 SAIU DO CANAL DE VOZ '));
    console.log(chalk.red('────────────────────────────────'));
    console.log(chalk.red(`   Usuário: ${oldState.member.user.tag}`));
    console.log(chalk.red(`   Canal:   #${oldState.channel.name}`));
    console.log(chalk.red(`   Servidor: ${oldState.guild.name}`));
    console.log(chalk.red(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
    console.log(chalk.red('────────────────────────────────\n'));
    
    logEvent('voiceLeave', { 
      user: oldState.member.user.tag, 
      channel: oldState.channel.name,
      guild: oldState.guild.name 
    });
  } else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
    console.log(chalk.yellow.bgBlack.bold('\n 🔄 MUDOU DE CANAL DE VOZ '));
    console.log(chalk.yellow('────────────────────────────────'));
    console.log(chalk.yellow(`   Usuário: ${newState.member.user.tag}`));
    console.log(chalk.yellow(`   Canal Antigo: #${oldState.channel.name}`));
    console.log(chalk.yellow(`   Canal Novo:   #${newState.channel.name}`));
    console.log(chalk.yellow(`   Servidor:     ${newState.guild.name}`));
    console.log(chalk.yellow(`   Data:         ${new Date().toLocaleString('pt-BR')}`));
    console.log(chalk.yellow('────────────────────────────────\n'));
    
    logEvent('voiceMove', { 
      user: newState.member.user.tag, 
      oldChannel: oldState.channel.name,
      newChannel: newState.channel.name,
      guild: newState.guild.name 
    });
  }
});

client.on('guildUpdate', async (oldGuild, newGuild) => {
  if (oldGuild.name !== newGuild.name) {
    console.log(chalk.yellow.bgBlack.bold('\n 🏛️ NOME DO SERVIDOR ALTERADO '));
    console.log(chalk.yellow('────────────────────────────────'));
    console.log(chalk.yellow(`   Antigo: ${oldGuild.name}`));
    console.log(chalk.yellow(`   Novo:   ${newGuild.name}`));
    console.log(chalk.yellow(`   Data:   ${new Date().toLocaleString('pt-BR')}`));
    console.log(chalk.yellow('────────────────────────────────\n'));
    
    logEvent('guildNameUpdate', { 
      oldName: oldGuild.name, 
      newName: newGuild.name 
    });
  }
});

client.on('guildBanAdd', async (guild, user) => {
  console.log(chalk.red.bgBlack.bold('\n 🚫 USUÁRIO BANIDO '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Usuário: ${user.tag}`));
  console.log(chalk.red(`   Servidor: ${guild.name}`));
  console.log(chalk.red(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.red('────────────────────────────────\n'));
  
  logEvent('guildBanAdd', { 
    user: user.tag, 
    guild: guild.name 
  });
});

client.on('guildBanRemove', async (guild, user) => {
  console.log(chalk.green.bgBlack.bold('\n ✅ USUÁRIO DESBANIDO '));
  console.log(chalk.green('────────────────────────────────'));
  console.log(chalk.green(`   Usuário: ${user.tag}`));
  console.log(chalk.green(`   Servidor: ${guild.name}`));
  console.log(chalk.green(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.green('────────────────────────────────\n'));
  
  logEvent('guildBanRemove', { 
    user: user.tag, 
    guild: guild.name 
  });
});

client.on('inviteCreate', async (invite) => {
  console.log(chalk.blue.bgBlack.bold('\n 📨 CONVITE CRIADO '));
  console.log(chalk.blue('────────────────────────────────'));
  console.log(chalk.blue(`   Código: ${invite.code}`));
  console.log(chalk.blue(`   Criado por: ${invite.inviter ? invite.inviter.tag : 'Desconhecido'}`));
  console.log(chalk.blue(`   Usos máximos: ${invite.maxUses || 'Ilimitado'}`));
  console.log(chalk.blue(`   Canal: #${invite.channel.name}`));
  console.log(chalk.blue(`   Servidor: ${invite.guild.name}`));
  console.log(chalk.blue(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.blue('────────────────────────────────\n'));
  
  logEvent('inviteCreate', { 
    code: invite.code, 
    inviter: invite.inviter ? invite.inviter.tag : 'Desconhecido',
    guild: invite.guild.name 
  });
});

client.on('inviteDelete', async (invite) => {
  console.log(chalk.red.bgBlack.bold('\n 🗑️ CONVITE DELETADO '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Código: ${invite.code}`));
  console.log(chalk.red(`   Canal: #${invite.channel.name}`));
  console.log(chalk.red(`   Servidor: ${invite.guild.name}`));
  console.log(chalk.red(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.red('────────────────────────────────\n'));
  
  logEvent('inviteDelete', { 
    code: invite.code, 
    guild: invite.guild.name 
  });
});

client.on('webhookUpdate', async (channel) => {
  console.log(chalk.cyan.bgBlack.bold('\n 🔗 WEBHOOK ATUALIZADO '));
  console.log(chalk.cyan('────────────────────────────────'));
  console.log(chalk.cyan(`   Canal: #${channel.name}`));
  console.log(chalk.cyan(`   Servidor: ${channel.guild.name}`));
  console.log(chalk.cyan(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.cyan('────────────────────────────────\n'));
  
  logEvent('webhookUpdate', { 
    channel: channel.name, 
    guild: channel.guild.name 
  });
});

client.on('guildIntegrationsUpdate', async (guild) => {
  console.log(chalk.magenta.bgBlack.bold('\n 🔄 INTEGRAÇÕES ATUALIZADAS '));
  console.log(chalk.magenta('────────────────────────────────'));
  console.log(chalk.magenta(`   Servidor: ${guild.name}`));
  console.log(chalk.magenta(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.magenta('────────────────────────────────\n'));
  
  logEvent('guildIntegrationsUpdate', { 
    guild: guild.name 
  });
});

client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  
  console.log(chalk.blue.bgBlack.bold('\n 👍 REAÇÃO ADICIONADA '));
  console.log(chalk.blue('────────────────────────────────'));
  console.log(chalk.blue(`   Usuário: ${user.tag}`));
  console.log(chalk.blue(`   Emoji: ${reaction.emoji.name}`));
  console.log(chalk.blue(`   Mensagem ID: ${reaction.message.id}`));
  console.log(chalk.blue(`   Canal: #${reaction.message.channel.name}`));
  console.log(chalk.blue(`   Servidor: ${reaction.message.guild.name}`));
  console.log(chalk.blue(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.blue('────────────────────────────────\n'));
  
  logEvent('messageReactionAdd', { 
    user: user.tag, 
    emoji: reaction.emoji.name,
    channel: reaction.message.channel.name 
  });
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;
  
  console.log(chalk.yellow.bgBlack.bold('\n 👎 REAÇÃO REMOVIDA '));
  console.log(chalk.yellow('────────────────────────────────'));
  console.log(chalk.yellow(`   Usuário: ${user.tag}`));
  console.log(chalk.yellow(`   Emoji: ${reaction.emoji.name}`));
  console.log(chalk.yellow(`   Mensagem ID: ${reaction.message.id}`));
  console.log(chalk.yellow(`   Canal: #${reaction.message.channel.name}`));
  console.log(chalk.yellow(`   Servidor: ${reaction.message.guild.name}`));
  console.log(chalk.yellow(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.yellow('────────────────────────────────\n'));
  
  logEvent('messageReactionRemove', { 
    user: user.tag, 
    emoji: reaction.emoji.name,
    channel: reaction.message.channel.name 
  });
});

client.on('messageReactionRemoveAll', async (message) => {
  console.log(chalk.red.bgBlack.bold('\n 🗑️ TODAS REAÇÕES REMOVIDAS '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Mensagem ID: ${message.id}`));
  console.log(chalk.red(`   Autor: ${message.author ? message.author.tag : 'Desconhecido'}`));
  console.log(chalk.red(`   Canal: #${message.channel.name}`));
  console.log(chalk.red(`   Servidor: ${message.guild.name}`));
  console.log(chalk.red(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.red('────────────────────────────────\n'));
  
  logEvent('messageReactionRemoveAll', { 
    messageId: message.id,
    channel: message.channel.name 
  });
});

client.on('messageReactionRemoveEmoji', async (reaction) => {
  console.log(chalk.yellow.bgBlack.bold('\n 🗑️ EMOJI DE REAÇÃO REMOVIDO '));
  console.log(chalk.yellow('────────────────────────────────'));
  console.log(chalk.yellow(`   Emoji: ${reaction.emoji.name}`));
  console.log(chalk.yellow(`   Mensagem ID: ${reaction.message.id}`));
  console.log(chalk.yellow(`   Canal: #${reaction.message.channel.name}`));
  console.log(chalk.yellow(`   Servidor: ${reaction.message.guild.name}`));
  console.log(chalk.yellow(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.yellow('────────────────────────────────\n'));
  
  logEvent('messageReactionRemoveEmoji', { 
    emoji: reaction.emoji.name,
    messageId: reaction.message.id 
  });
});

client.on('guildScheduledEventCreate', async (event) => {
  console.log(chalk.blue.bgBlack.bold('\n 📅 EVENTO AGENDADO CRIADO '));
  console.log(chalk.blue('────────────────────────────────'));
  console.log(chalk.blue(`   Nome: ${event.name}`));
  console.log(chalk.blue(`   Descrição: ${event.description || 'Sem descrição'}`));
  console.log(chalk.blue(`   Início: ${event.scheduledStartAt.toLocaleString('pt-BR')}`));
  console.log(chalk.blue(`   Fim: ${event.scheduledEndAt ? event.scheduledEndAt.toLocaleString('pt-BR') : 'Não definido'}`));
  console.log(chalk.blue(`   Servidor: ${event.guild.name}`));
  console.log(chalk.blue(`   Data criação: ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.blue('────────────────────────────────\n'));
  
  logEvent('guildScheduledEventCreate', { 
    name: event.name, 
    guild: event.guild.name 
  });
});

client.on('guildScheduledEventUpdate', async (oldEvent, newEvent) => {
  if (oldEvent.name === newEvent.name) return;
  
  console.log(chalk.yellow.bgBlack.bold('\n 🔄 EVENTO AGENDADO ATUALIZADO '));
  console.log(chalk.yellow('────────────────────────────────'));
  console.log(chalk.yellow(`   Nome Antigo: ${oldEvent.name}`));
  console.log(chalk.yellow(`   Nome Novo:   ${newEvent.name}`));
  console.log(chalk.yellow(`   Servidor:    ${newEvent.guild.name}`));
  console.log(chalk.yellow(`   Data:        ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.yellow('────────────────────────────────\n'));
  
  logEvent('guildScheduledEventUpdate', { 
    oldName: oldEvent.name, 
    newName: newEvent.name,
    guild: newEvent.guild.name 
  });
});

client.on('guildScheduledEventDelete', async (event) => {
  console.log(chalk.red.bgBlack.bold('\n 🗑️ EVENTO AGENDADO DELETADO '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Nome: ${event.name}`));
  console.log(chalk.red(`   Servidor: ${event.guild.name}`));
  console.log(chalk.red(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.red('────────────────────────────────\n'));
  
  logEvent('guildScheduledEventDelete', { 
    name: event.name, 
    guild: event.guild.name 
  });
});

client.on('guildScheduledEventUserAdd', async (event, user) => {
  console.log(chalk.green.bgBlack.bold('\n 👤 USUÁRIO INSCRITO EM EVENTO '));
  console.log(chalk.green('────────────────────────────────'));
  console.log(chalk.green(`   Evento: ${event.name}`));
  console.log(chalk.green(`   Usuário: ${user.tag}`));
  console.log(chalk.green(`   Servidor: ${event.guild.name}`));
  console.log(chalk.green(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.green('────────────────────────────────\n'));
  
  logEvent('guildScheduledEventUserAdd', { 
    event: event.name, 
    user: user.tag,
    guild: event.guild.name 
  });
});

client.on('guildScheduledEventUserRemove', async (event, user) => {
  console.log(chalk.red.bgBlack.bold('\n 👤 USUÁRIO CANCELOU INSCRIÇÃO EM EVENTO '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Evento: ${event.name}`));
  console.log(chalk.red(`   Usuário: ${user.tag}`));
  console.log(chalk.red(`   Servidor: ${event.guild.name}`));
  console.log(chalk.red(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.red('────────────────────────────────\n'));
  
  logEvent('guildScheduledEventUserRemove', { 
    event: event.name, 
    user: user.tag,
    guild: event.guild.name 
  });
});

// ===============================
// ERROS NÃO TRATADOS
// ===============================
process.on('unhandledRejection', (error) => {
  logError(`Erro não tratado: ${error.message}`);
  logDebug('Stack do erro não tratado', error.stack);
  console.error(error);
});

process.on('uncaughtException', (error) => {
  logError(`Exceção não tratada: ${error.message}`);
  logDebug('Stack da exceção não tratada', error.stack);
  console.error(error);
  process.exit(1);
});

process.on('SIGINT', () => {
  logShutdown();
  console.log(chalk.red('❌ Bot encerrado por Ctrl+C'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  logShutdown();
  console.log(chalk.red('❌ Bot encerrado por SIGTERM'));
  process.exit(0);
});

// ===============================
// LOG DE INICIALIZAÇÃO
// ===============================
logStartup();

// ===============================
// LOGIN DO BOT
// ===============================
client.login(process.env.TOKEN);
