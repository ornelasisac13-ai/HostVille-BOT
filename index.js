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
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
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
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageTyping
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User],
});

// ===============================
// CONFIGURAÇÕES GERAIS
// ===============================
const CONFIG = {
  logChannelId: process.env.LOG_CHANNEL_ID || "",
  adminRoles: process.env.ADMIN_ROLES ? process.env.ADMIN_ROLES.split(',') : [],
  ACCESS_CODE: process.env.ACCESS_CODE || "1234",
  STAFF_USER_ID: process.env.STAFF_USER_ID || "Y2k_Nat",
  DAILY_REPORT_TIME: process.env.DAILY_REPORT_TIME || "08:00",
};

// ===============================
// VARIÁVEIS GLOBAIS
// ===============================
const serverMonitoring = new Map(); // Key: guildId, Value: boolean (true = monitoramento ativo)
const pendingActions = new Map(); // Armazena ações pendentes para seleção de servidor

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
// LISTA DE PALAVRAS OFENSIVAS
// ===============================
const offensiveWords = [
"idiota", "burro", "estúpido", "estupido", "retardado", "lixo",
"merda", "fdp", "otário", "otario", "desgraçado", "desgracado",
"vtnc", "imbecil", "inútil", "inutil",
"arrombado", "viado", "bicha", "piranha", "prostituta", "corno", "babaca",
"palhaço", "palhaco", "nojento", "escroto", "cretino", "canalha",
"maldito", "peste", "verme", "trouxa", "otária", "otaria",
"burra", "cacete", "caralho", "merdinha",
"vagabundo", "vagabunda", "cuzao", "idiotinha", "fodido", "bosta",
"porra", "prr", "poha", "krl", "krlh", "caramba",
"fds", "foda", "fudeu", "fodase", "fodassi",
"pqp", "puta", "vsf", "tnc", "tmnc", "cuzão", "cú", "cu",
"buceta", "bct", "xota", "xoxota", "ppk", "perereca",
"rapariga", "putinha", "putão", "putona", "puto",
"b0sta", "bostinha", "inutel", "idiot4", "burrinho",
"stupido", "estupida", "retardada", "nojenta", "escrota",
"trouxinha", "verminoso", "pestinha", "cretina", "maldita",
"corninho", "chifrudo", "vagaba", "piriguete",
"viadinho", "boiola", "bichinha", "baitola",
"sapatão", "sapata", "galinha", "cachorra", "cachorro",
"vaca", "égua", "cabra", "mula", "jumento", "asno", "anta",
"besta", "bocó", "boçal", "bronco", "ignorante", "analfabeto",
"pilantra", "malandro", "safado", "tarado", "pervertido", "depravado",
"asqueroso", "repugnante", "horrivel", "feio", "crápula", "infeliz",
"miseravel", "coitado", "nulo", "aborto", "lixinho", "traste",
"praga", "desgraça", "fudido", "lascado", "ferrado", "danado",
"capeta", "demonio", "diabo", "satanás", "lucifer", "animal",
"bicho", "monstro", "abominavel", "marginal", "delinquente",
"criminoso", "bandido", "ladrão", "assaltante", "golpista",
"enganador", "trapaceiro", "manipulador", "abusador",
"abusado", "folgado", "atrevido", "arrogante", "pretensioso",
"metido", "convencido", "soberbo", "orgulhoso", "vaidoso",
"futil", "oco", "teimoso", "birrento",
"pentelho", "maçante", "enfadonho", "mrd", "merda"
];

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
  
  // Calcular comandos mais usados
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
  
  // Criar embed do relatório
  const reportEmbed = new EmbedBuilder()
    .setTitle('📊 Relatório Diário do Bot')
    .setDescription(`Período: **${reportDate}**`)
    .setColor(Colors.Blue)
    .addFields(
      { 
        name: '🛡️ **Ações de Moderação**', 
        value: `• Mensagens deletadas: **${stats.messagesDeleted}**\n• Avisos dados: **${stats.warnsGiven}**`,
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
    })
    .setTimestamp();

  return reportEmbed;
}

// ===============================
// FUNÇÃO PARA ENVIAR RELATÓRIO PARA STAFF
// ===============================
async function sendReportToStaff() {
  try {
    const reportEmbed = await generateDailyReport();
    
    // Dividir STAFF_USER_ID se houver múltiplos
    const staffIds = CONFIG.STAFF_USER_ID.split(',');
    
    for (const staffId of staffIds) {
      const staffIdTrimmed = staffId.trim();
      
      // Se for menção (<@ID>), extrair apenas o ID
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
    
    // Também enviar para o canal de logs se configurado
    if (CONFIG.logChannelId) {
      const logChannel = await client.channels.fetch(CONFIG.logChannelId).catch(() => null);
      if (logChannel) {
        await logChannel.send({ 
          content: '📊 **Relatório Diário do Bot**',
          embeds: [reportEmbed] 
        });
      }
    }
    
    // Resetar estatísticas para o próximo dia
    stats.reset();
    
  } catch (error) {
    logError(`Erro ao gerar/enviar relatório: ${error.message}`);
  }
}

// ===============================
// FUNÇÃO PARA CALCULAR PRÓXIMO ENVIO
// ===============================
function scheduleDailyReport() {
  const now = new Date();
  const [reportHour, reportMinute] = CONFIG.DAILY_REPORT_TIME.split(':').map(Number);
  
  // Criar data para hoje no horário do relatório
  const nextReport = new Date(now);
  nextReport.setHours(reportHour, reportMinute, 0, 0);
  
  // Se já passou do horário hoje, agendar para amanhã
  if (now > nextReport) {
    nextReport.setDate(nextReport.getDate() + 1);
  }
  
  const timeUntilReport = nextReport - now;
  
  logInfo(`📊 Próximo relatório diário agendado para: ${nextReport.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  
  // Agendar o relatório
  setTimeout(() => {
    sendReportToStaff();
    
    // Agendar para os próximos dias (a cada 24h)
    setInterval(sendReportToStaff, 24 * 60 * 60 * 1000);
    
    logInfo('📊 Relatórios diários agendados (a cada 24h)');
  }, timeUntilReport);
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
// FUNÇÃO PARA ENCONTRAR A PALAVRA OFENSIVA
// ===============================
function findOffensiveWord(text) {
  if (!text) return null;
  const msg = text.toLowerCase();
  return offensiveWords.find(word => msg.includes(word));
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
// FUNÇÃO PARA ATIVAR/DESATIVAR MONITORAMENTO
// ===============================
function setServerMonitoring(guildId, status, user) {
  serverMonitoring.set(guildId, status);
  
  // Log no console
  const action = status ? 'ATIVADO' : 'DESATIVADO';
  console.log(chalk.cyan.bgBlack.bold(`\n 🛡️ MONITORAMENTO ${action}`));
  console.log(chalk.cyan('────────────────────────────────'));
  console.log(chalk.cyan(`   Servidor: ${client.guilds.cache.get(guildId)?.name || guildId}`));
  console.log(chalk.cyan(`   ID:       ${guildId}`));
  console.log(chalk.cyan(`   Staff:    ${user.tag}`));
  console.log(chalk.cyan(`   Data:     ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`));
  console.log(chalk.cyan('────────────────────────────────\n'));
}

// ===============================
// FUNÇÃO PARA CRIAR EMBED DE STATUS
// ===============================
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

// === COMANDO /PING ===
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
    
    // Registrar comando usado
    stats.commandsUsed['ping'] = (stats.commandsUsed['ping'] || 0) + 1;
  },
};

// === COMANDO /HELP - AJUDA ===
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
        { name: '/adm', value: 'Acesso ao painel administrativo', inline: false },
        { name: '/private', value: 'Enviar mensagem privada (Staff)', inline: false },
        { name: '/report', value: 'Gerar relatório manual (Staff)', inline: false }
      )
      .setFooter({ text: 'Comandos de texto na DM: !clear, !clearAll, !MonitorOn, !MonitorOff' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: 64 });
    logInfo(`Comando /help usado por ${interaction.user.tag}`);
    
    // Registrar comando usado
    stats.commandsUsed['help'] = (stats.commandsUsed['help'] || 0) + 1;
  },
};

// === COMANDO /PRIVATE ===
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

      logInfo(`${interaction.user.tag} enviou mensagem para ${user.tag}`);
      
      // Registrar comando usado
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

// === COMANDO /REPORT ===
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
    
    await interaction.followUp({
      content: '📊 **Relatório Atual:**',
      embeds: [reportEmbed],
      flags: 64
    });
    
    logInfo(`${interaction.user.tag} gerou relatório manual`);
    
    // Registrar comando usado
    stats.commandsUsed['report'] = (stats.commandsUsed['report'] || 0) + 1;
  }
};

// ===============================
// FUNÇÃO PARA ENVIAR MENSAGEM EFÊMERA NA DM
// ===============================
async function sendEphemeralDM(user, content, options = {}) {
  try {
    // Tenta enviar como mensagem direta com flags efêmeras (só funciona em interações)
    // Como é DM normal, não temos como fazer mensagem realmente efêmera,
    // então vamos enviar e depois apagar após alguns segundos
    const msg = await user.send(content);
    
    // Se tiver tempo para auto-apagar
    if (options.deleteAfter) {
      setTimeout(async () => {
        try {
          await msg.delete();
        } catch (e) {
          // Ignora erro se não conseguir apagar
        }
      }, options.deleteAfter);
    }
    
    return msg;
  } catch (error) {
    logError(`Erro ao enviar mensagem efêmera: ${error.message}`);
    return null;
  }
}

// ===============================
// EVENTO PRINCIPAL DE MENSAGENS (DM E MODERAÇÃO)
// ===============================
client.on("messageCreate", async (message) => {
  // Ignora mensagens do próprio bot
  if (message.author.bot) return;

  // VERIFICAÇÃO DE MENSAGEM NA DM
  if (message.channel.type === ChannelType.DM) {
    
    // COMANDO !MonitorOn na DM
    if (message.content.startsWith('!MonitorOn')) {
      const args = message.content.split(' ');
      const password = args[1];
      
      if (!password) {
        await message.reply('❌ Use: `!MonitorOn ACCESS_CODE`');
        // Apaga a mensagem de erro após 5 segundos
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
      
      // Criar botões para escolher ação
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
      
      // Apaga a mensagem do comando e a resposta após 2 minutos
      setTimeout(async () => {
        try {
          await message.delete();
          await reply.delete();
        } catch (e) {}
      }, 120000);
      
      return;
    }
    
    // COMANDO !MonitorOff na DM
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
      
      // Criar botões para escolher ação
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
      
      // Apaga a mensagem do comando e a resposta após 2 minutos
      setTimeout(async () => {
        try {
          await message.delete();
          await reply.delete();
        } catch (e) {}
      }, 120000);
      
      return;
    }
    
    // COMANDO !clearAll
    if (message.content.startsWith('!clearAll')) {
      
      // Extrai a senha
      const args = message.content.split(' ');
      const password = args[1];
      
      // Verifica se a senha foi fornecida
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
      
      // Verifica senha
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
      
      // Apaga a mensagem do comando imediatamente
      try {
        await message.delete();
      } catch (e) {}
      
      try {
        const processingMsg = await message.channel.send('🔄 Limpando mensagens de TODAS as DMs... Isso pode levar alguns minutos...');
        
        let totalDeleted = 0;
        let totalChannels = 0;
        
        // Para cada canal de DM que o bot tem acesso
        for (const [channelId, channel] of client.channels.cache) {
          if (channel.type === ChannelType.DM) {
            totalChannels++;
            let channelCount = 0;
            
            try {
              let fetchedMessages;
              do {
                fetchedMessages = await channel.messages.fetch({ limit: 100 });
                
                if (fetchedMessages.size === 0) break;
                
                const deletableMessages = fetchedMessages.filter(msg => 
                  msg.author.id === client.user.id // Só mensagens do bot
                );
                
                if (deletableMessages.size === 0) break;
                
                for (const [id, msg] of deletableMessages) {
                  try {
                    await msg.delete();
                    channelCount++;
                    totalDeleted++;
                    await new Promise(resolve => setTimeout(resolve, 500));
                  } catch (err) {
                    logError(`Erro ao deletar mensagem ${id}: ${err.message}`);
                  }
                }
                
              } while (fetchedMessages.size >= 100);
              
              logInfo(`Limpou ${channelCount} mensagens do bot na DM com ${channel.recipient ? channel.recipient.tag : 'desconhecido'}`);
              
            } catch (err) {
              logError(`Erro ao processar DM ${channelId}: ${err.message}`);
            }
          }
        }
        
        await processingMsg.edit(`✅ **${totalDeleted} mensagens** do bot foram limpas de **${totalChannels} DMs**!`);
        
        // Apaga a mensagem de processamento após 10 segundos
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
    
    // COMANDO !clear - TODAS AS MENSAGENS SÃO EFÊMERAS (APAGAM AUTOMATICAMENTE)
    if (message.content.startsWith('!clear')) {
      
      // Apaga a mensagem do comando imediatamente
      try {
        await message.delete();
      } catch (e) {}
      
      try {
        // Cria botões para o usuário confirmar
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('confirm_clear')
              .setLabel('✅ Sim, limpar mensagens')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId('cancel_clear')
              .setLabel('❌ Não, ignorar')
              .setStyle(ButtonStyle.Secondary)
          );
        
        // Envia mensagem de confirmação com botões
        const confirmMsg = await message.channel.send({
          content: '⚠️ **Tem certeza que deseja limpar todas as mensagens desta DM?**',
          components: [row]
        });
        
        // Criar um coletor para os botões
        const filter = (interaction) => {
          return interaction.user.id === message.author.id;
        };
        
        const collector = confirmMsg.createMessageComponentCollector({ 
          filter, 
          time: 60000,
          max: 1
        });
        
        collector.on('collect', async (interaction) => {
          try {
            if (interaction.customId === 'confirm_clear') {
              // Atualiza a mensagem de confirmação
              await interaction.update({ content: '🔄 Limpando mensagens...', components: [] });
              
              let deletedCount = 0;
              let fetchedMessages;
              
              try {
                do {
                  fetchedMessages = await message.channel.messages.fetch({ limit: 100 });
                  
                  if (fetchedMessages.size === 0) break;
                  
                  const deletableMessages = fetchedMessages.filter(msg => 
                    msg.id !== confirmMsg.id // Não apaga a mensagem de confirmação atual
                  );
                  
                  if (deletableMessages.size === 0) break;
                  
                  for (const [id, msg] of deletableMessages) {
                    try {
                      await msg.delete();
                      deletedCount++;
                      await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (err) {
                      logError(`Erro ao deletar mensagem ${id}: ${err.message}`);
                    }
                  }
                  
                } while (fetchedMessages.size >= 100);
                
                console.log(chalk.green.bgBlack.bold(`\n🧹 ${deletedCount} mensagens foram limpas do histórico da DM de ${message.author.tag}!`));
                
                // Atualiza a mensagem de confirmação com sucesso
                await interaction.editReply({ 
                  content: '✅ **Mensagens limpas com sucesso!**',
                  components: [] 
                });
                
                // Apaga a mensagem de confirmação após 5 segundos
                setTimeout(async () => {
                  try {
                    await confirmMsg.delete();
                  } catch (e) {}
                }, 5000);
                
                logInfo(`${message.author.tag} limpou ${deletedCount} mensagens na DM`);
                
              } catch (error) {
                logError(`Erro ao limpar DM: ${error.message}`);
                await interaction.editReply({ 
                  content: '❌ Erro ao limpar mensagens. Tente novamente.',
                  components: [] 
                });
                
                setTimeout(async () => {
                  try {
                    await confirmMsg.delete();
                  } catch (e) {}
                }, 5000);
              }
              
            } else if (interaction.customId === 'cancel_clear') {
              await interaction.update({ content: '❌ Operação cancelada.', components: [] });
              
              setTimeout(async () => {
                try {
                  await confirmMsg.delete();
                } catch (e) {}
              }, 3000);
            }
          } catch (error) {
            logError(`Erro no coletor do !clear: ${error.message}`);
          }
        });
        
        collector.on('end', async (collected) => {
          if (collected.size === 0) {
            try {
              await confirmMsg.edit({ 
                content: '⏰ Tempo esgotado. Operação cancelada.',
                components: [] 
              });
              
              setTimeout(async () => {
                try {
                  await confirmMsg.delete();
                } catch (e) {}
              }, 3000);
            } catch (error) {}
          }
        });
        
      } catch (error) {
        logError(`Erro ao processar !clear: ${error.message}`);
      }
      
      return;
    }
    
    // RESPOSTA AUTOMÁTICA para outras mensagens na DM
    try {
      const reply = await message.reply({
        content: `❌ **Não é possível enviar esta mensagem.**\nCaso tenha algo para falar, entre em contato com <@${CONFIG.STAFF_USER_ID}> `
      });
      
      // Apaga a resposta automática após 10 segundos
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

  // MODERAÇÃO EM CANAIS DE SERVIDOR
  // Verificar se o monitoramento está ativo para este servidor
  const isMonitoringActive = serverMonitoring.get(message.guild.id) !== false;
  
  if (!isMonitoringActive) {
    return;
  }
  
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

      // Apaga o aviso após 10 segundos
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
  
  // Inicializar monitoramento para todos os servidores (padrão: ativo)
  for (const guild of client.guilds.cache.values()) {
    serverMonitoring.set(guild.id, true);
  }
  
  // Registrar comandos em TODOS os servidores
  if (client.guilds.cache.size > 0) {
    try {
      for (const guild of client.guilds.cache.values()) {
        await guild.commands.set([
          ...commands.map(c => c.data),
          pingCommand.data,
          helpCommand.data,
          privateCommand.data,
          reportCommand.data
        ]);
        logSuccess(`Comandos registrados em: ${guild.name}`);
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
  console.log(chalk.yellow('  • !clear - Limpa mensagens da DM (mensagens temporárias)'));
  console.log(chalk.yellow('  • !clearAll SUA_SENHA - Limpa TODAS as DMs'));
  console.log(chalk.yellow('  • !MonitorOn SUA_SENHA - Ativar monitoramento'));
  console.log(chalk.yellow('  • !MonitorOff SUA_SENHA - Desativar monitoramento\n'));
  
  scheduleDailyReport();
  
  // Inicia o menu interativo
  initReadline();
  showMenu();
});

// ===============================
// HANDLER PARA BOTÕES DE MONITORAMENTO
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
      
      // Apaga após 10 segundos
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
// HANDLER PARA SELEÇÃO DE SERVIDOR
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
// EVENTO: INTERAÇÃO (BOTÕES E MENUS)
// ===============================
client.on('interactionCreate', async (interaction) => {
  try {
    // Handler para comandos de chat input
    if (interaction.isChatInputCommand()) {
      const cmdName = interaction.commandName;
      stats.commandsUsed[cmdName] = (stats.commandsUsed[cmdName] || 0) + 1;
      
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
        if (interaction.commandName === 'report') {
          await reportCommand.execute(interaction);
          return;
        }
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        logError(`Erro ao executar comando ${interaction.commandName}: ${error.message}`);
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
      if (interaction.customId === 'stats' || interaction.customId === 'console' || interaction.customId === 'help') {
        await handleButtonInteraction(interaction);
        return;
      }
      
      if (interaction.customId === 'confirm_clear' || interaction.customId === 'cancel_clear') {
        return;
      }
      
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
    
    // Handler para menus de seleção
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith('select_server_')) {
        await handleServerSelection(interaction);
        return;
      }
    }
  } catch (error) {
    logError(`Erro geral no interactionCreate: ${error.message}`);
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
// EVENTO: BOTÃO INTERAÇÃO (PAINEL ADMIN)
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
// MENU INTERATIVO NO CONSOLE
// ===============================

function showMenu() {
  if (isMenuActive) return;
  isMenuActive = true;
  
  console.log(chalk.cyan('\n╔═══════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║                  𝙷𝚘𝚜𝚝𝚅𝚒𝚕𝚕𝚎-𝙱𝙾𝚃 𝚅𝚎𝚛𝚜ã𝚘 𝟺.𝟷.𝟸                     ║'));
  console.log(chalk.cyan('╠═══════════════════════════════════════════════════════╣'));
  console.log(chalk.cyan('║  1.  Ver estatísticas detalhadas                                ║'));
  console.log(chalk.cyan('║  2.  Listar todos os servidores                                 ║'));
  console.log(chalk.cyan('║  3.  Ver membros de um servidor                                 ║'));
  console.log(chalk.cyan('║  4.  Enviar mensagem para canal                                 ║'));
  console.log(chalk.cyan('║  5.  Atualizar dados                                            ║'));
  console.log(chalk.cyan('║  6.  Ver logs recentes                                          ║'));
  console.log(chalk.cyan('║  7.  Ver status do bot                                          ║'));
  console.log(chalk.cyan('║  0.  Sair                                                       ║'));
  console.log(chalk.cyan('╚═════════════════════════𝚈𝟸𝚔═𝙽𝚊𝚝════════════════════════╝'));
  
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
    const reportEmbed = await generateDailyReport();
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
      
      if (channels.length === 0) {
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
        
        if (channelIndex >= 0 && channelIndex < channels.length) {
          const channel = channels[channelIndex];
          
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
