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
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.DirectMessages
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
  welcomeChannelId: process.env.WELCOME_CHANNEL_ID || "",
  autoRoleId: process.env.AUTO_ROLE_ID || "",
  suggestChannelId: process.env.SUGGEST_CHANNEL_ID || "",
  reportChannelId: process.env.REPORT_CHANNEL_ID || "",
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
  // Abreviações e gírias comuns
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
// FUNÇÕES DE LOG PERSONALIZADAS
// ===============================
function getTimestamp() {
  return chalk.gray(`[${new Date().toLocaleString('pt-BR')}]`);
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

function logModeration(message, user, content, channel) {
  console.log(chalk.red.bgBlack.bold('\n 🛡️ MENSAGEM MODERADA '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Usuário:   ${user.tag}`));
  console.log(chalk.red(`   ID:        ${user.id}`));
  console.log(chalk.red(`   Conteúdo:  ${content}`));
  console.log(chalk.red(`   Canal:     #${channel.name}`));
  console.log(chalk.red(`   Motivo:    ${message}`));
  console.log(chalk.red('────────────────────────────────\n'));
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
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('commands')
          .setLabel('📋 Comandos')
          .setStyle(ButtonStyle.Primary)
      );

      const embed = new EmbedBuilder()
        .setTitle('🔐 Painel Administrativo')
        .setDescription('Bem-vindo ao painel de controle do bot!')
        .setColor(Colors.Blue)
        .addFields(
          { name: '👤 Usuário', value: interaction.user.tag, inline: true },
          { name: '🆔 ID', value: interaction.user.id, inline: true },
          { name: '🤖 Bot Version', value: '4.2.0', inline: true }
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

// === COMANDO /PING - TESTE DE CONEXÃO ===
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
        { name: '⏱️ Uptime', value: `${Math.floor(client.uptime / 1000)}s`, inline: true },
        { name: '📊 Status', value: '✅ Online', inline: true }
      )
      .setFooter({ text: 'Bot está funcionando corretamente!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: 64 });
    logInfo(`Comando /ping usado por ${interaction.user.tag}`);
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
        { name: '/userinfo', value: 'Ver informações de um usuário', inline: false },
        { name: '/serverinfo', value: 'Ver informações do servidor', inline: false },
        { name: '/avatar', value: 'Ver avatar de um usuário', inline: false },
        { name: '/clear', value: 'Limpar mensagens (Staff)', inline: false },
        { name: '/sugestao', value: 'Enviar uma sugestão', inline: false },
        { name: '/reportar', value: 'Reportar um usuário', inline: false },
        { name: '/calc', value: 'Calculadora simples', inline: false },
        { name: '/random', value: 'Número aleatório', inline: false }
      )
      .setFooter({ text: 'Digite /help para mais informações' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: 64 });
    logInfo(`Comando /help usado por ${interaction.user.tag}`);
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
    } catch (error) {
      await interaction.reply({
        content: '❌ Erro ao enviar a mensagem. Verifique se o usuário tem DMs abertos.',
        flags: 64
      });
      logError(`Erro ao enviar mensagem privada: ${error.message}`);
    }
  }
};

// === COMANDO /USERINFO - INFORMAÇÕES DO USUÁRIO ===
const userinfoCommand = {
  data: {
    name: 'userinfo',
    description: 'Mostra informações sobre um usuário',
    options: [
      {
        name: 'usuario',
        description: 'Usuário para ver informações',
        type: 6,
        required: false
      }
    ]
  },
  async execute(interaction) {
    const user = interaction.options.getUser('usuario') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    
    const embed = new EmbedBuilder()
      .setTitle(`👤 Informações do Usuário`)
      .setColor(Colors.Blue)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '📛 Nome', value: user.tag, inline: true },
        { name: '🆔 ID', value: user.id, inline: true },
        { name: '🤖 Bot', value: user.bot ? 'Sim' : 'Não', inline: true },
        { name: '📅 Conta criada', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: false }
      );
    
    if (member) {
      embed.addFields(
        { name: '📅 Entrou no servidor', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: false },
        { name: '🎭 Cargos', value: member.roles.cache.filter(r => r.name !== '@everyone').map(r => r.name).join(', ') || 'Nenhum', inline: false }
      );
    }
    
    await interaction.reply({ embeds: [embed], flags: 64 });
    logInfo(`/userinfo usado por ${interaction.user.tag}`);
  },
};

// === COMANDO /SERVERINFO - INFORMAÇÕES DO SERVIDOR ===
const serverinfoCommand = {
  data: {
    name: 'serverinfo',
    description: 'Mostra informações sobre o servidor'
  },
  async execute(interaction) {
    const guild = interaction.guild;
    const owner = await guild.fetchOwner();
    
    const embed = new EmbedBuilder()
      .setTitle(`🏛️ Informações do Servidor`)
      .setColor(Colors.Gold)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '📛 Nome', value: guild.name, inline: true },
        { name: '🆔 ID', value: guild.id, inline: true },
        { name: '👑 Dono', value: owner.user.tag, inline: true },
        { name: '👥 Membros', value: guild.memberCount.toString(), inline: true },
        { name: '💬 Canais', value: guild.channels.cache.size.toString(), inline: true },
        { name: '🎭 Cargos', value: guild.roles.cache.size.toString(), inline: true },
        { name: '😊 Emojis', value: `${guild.emojis.cache.size}`, inline: true },
        { name: '📅 Criado em', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false }
      )
      .setFooter({ text: `Requerido por ${interaction.user.tag}` })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], flags: 64 });
    logInfo(`/serverinfo usado por ${interaction.user.tag}`);
  },
};

// === COMANDO /AVATAR - VER AVATAR DO USUÁRIO ===
const avatarCommand = {
  data: {
    name: 'avatar',
    description: 'Mostra o avatar de um usuário',
    options: [
      {
        name: 'usuario',
        description: 'Usuário para ver o avatar',
        type: 6,
        required: false
      }
    ]
  },
  async execute(interaction) {
    const user = interaction.options.getUser('usuario') || interaction.user;
    
    const embed = new EmbedBuilder()
      .setTitle(`🖼️ Avatar de ${user.tag}`)
      .setColor(Colors.Purple)
      .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setFooter({ text: `Requerido por ${interaction.user.tag}` })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], flags: 64 });
    logInfo(`/avatar usado por ${interaction.user.tag}`);
  },
};

// === COMANDO /CLEAR - LIMPAR MENSAGENS (APENAS STAFF) ===
const clearCommand = {
  data: {
    name: 'clear',
    description: 'Limpa mensagens do canal (Staff)',
    options: [
      {
        name: 'quantidade',
        description: 'Número de mensagens para limpar (1-100)',
        type: 4,
        required: true,
        min_value: 1,
        max_value: 100
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
    const amount = interaction.options.getInteger('quantidade');
    const code = interaction.options.getString('code');

    if (code !== CONFIG.ACCESS_CODE) {
      return interaction.reply({
        content: '❌ Código de acesso incorreto!',
        flags: 64
      });
    }

    try {
      const messages = await interaction.channel.bulkDelete(amount, true);
      
      const embed = new EmbedBuilder()
        .setTitle('🧹 Mensagens Limpas')
        .setColor(Colors.Green)
        .addFields(
          { name: '📊 Quantidade', value: `${messages.size} mensagens`, inline: true },
          { name: '👤 Moderador', value: interaction.user.tag, inline: true },
          { name: '📅 Data', value: new Date().toLocaleString('pt-BR'), inline: true }
        )
        .setFooter({ text: 'Mensagens deletadas com sucesso!' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
      logInfo(`${interaction.user.tag} limpou ${amount} mensagens em #${interaction.channel.name}`);
    } catch (error) {
      await interaction.reply({
        content: '❌ Erro ao limpar mensagens. Mensagens com mais de 14 dias não podem ser deletadas.',
        flags: 64
      });
      logError(`Erro ao limpar mensagens: ${error.message}`);
    }
  },
};

// === COMANDO /SUGESTAO - ENVIAR SUGESTÃO ===
const suggestCommand = {
  data: {
    name: 'sugestao',
    description: 'Envia uma sugestão para o servidor',
    options: [
      {
        name: 'sugestao',
        description: 'Sua sugestão',
        type: 3,
        required: true
      }
    ]
  },
  async execute(interaction) {
    const sugestao = interaction.options.getString('sugestao');
    
    const embed = new EmbedBuilder()
      .setTitle('💡 Nova Sugestão')
      .setColor(Colors.Yellow)
      .setDescription(sugestao)
      .addFields(
        { name: '👤 Autor', value: interaction.user.tag, inline: true },
        { name: '📅 Data', value: new Date().toLocaleString('pt-BR'), inline: true }
      )
      .setFooter({ text: 'Reaja para votar: 👍 Sim | 👎 Não' })
      .setTimestamp();

    const channel = interaction.guild.channels.cache.get(CONFIG.suggestChannelId) || interaction.channel;
    
    const message = await channel.send({ embeds: [embed] });
    await message.react('👍');
    await message.react('👎');
    
    await interaction.reply({
      content: '✅ Sua sugestão foi enviada com sucesso!',
      flags: 64
    });
    
    logInfo(`${interaction.user.tag} enviou uma sugestão`);
  },
};

// === COMANDO /REPORTAR - REPORTAR USUÁRIO ===
const reportCommand = {
  data: {
    name: 'reportar',
    description: 'Reporta um usuário para a staff',
    options: [
      {
        name: 'usuario',
        description: 'Usuário a ser reportado',
        type: 6,
        required: true
      },
      {
        name: 'motivo',
        description: 'Motivo do report',
        type: 3,
        required: true
      }
    ]
  },
  async execute(interaction) {
    const user = interaction.options.getUser('usuario');
    const motivo = interaction.options.getString('motivo');
    
    const embed = new EmbedBuilder()
      .setTitle('🚨 Novo Report')
      .setColor(Colors.Red)
      .addFields(
        { name: '👤 Reportado', value: user.tag, inline: true },
        { name: '🆔 ID', value: user.id, inline: true },
        { name: '👮 Reportado por', value: interaction.user.tag, inline: true },
        { name: '📝 Motivo', value: motivo, inline: false },
        { name: '📅 Data', value: new Date().toLocaleString('pt-BR'), inline: true }
      )
      .setFooter({ text: 'Report enviado' })
      .setTimestamp();

    const channel = interaction.guild.channels.cache.get(CONFIG.reportChannelId) || interaction.channel;
    
    await channel.send({ embeds: [embed] });
    
    await interaction.reply({
      content: '✅ Seu report foi enviado para a staff!',
      flags: 64
    });
    
    logInfo(`${interaction.user.tag} reportou ${user.tag}`);
  },
};

// === COMANDO /CALC - CALCULADORA SIMPLES ===
const calcCommand = {
  data: {
    name: 'calc',
    description: 'Calculadora simples',
    options: [
      {
        name: 'numero1',
        description: 'Primeiro número',
        type: 10,
        required: true
      },
      {
        name: 'operacao',
        description: 'Operação (+, -, *, /)',
        type: 3,
        required: true,
        choices: [
          { name: '➕ Soma', value: '+' },
          { name: '➖ Subtração', value: '-' },
          { name: '✖️ Multiplicação', value: '*' },
          { name: '➗ Divisão', value: '/' }
        ]
      },
      {
        name: 'numero2',
        description: 'Segundo número',
        type: 10,
        required: true
      }
    ]
  },
  async execute(interaction) {
    const num1 = interaction.options.getNumber('numero1');
    const num2 = interaction.options.getNumber('numero2');
    const operacao = interaction.options.getString('operacao');
    
    let resultado;
    let simbolo;
    
    switch(operacao) {
      case '+':
        resultado = num1 + num2;
        simbolo = '➕';
        break;
      case '-':
        resultado = num1 - num2;
        simbolo = '➖';
        break;
      case '*':
        resultado = num1 * num2;
        simbolo = '✖️';
        break;
      case '/':
        if (num2 === 0) {
          return interaction.reply({ content: '❌ Não é possível dividir por zero!', flags: 64 });
        }
        resultado = num1 / num2;
        simbolo = '➗';
        break;
    }
    
    const embed = new EmbedBuilder()
      .setTitle('🧮 Calculadora')
      .setColor(Colors.Blue)
      .addFields(
        { name: '📊 Operação', value: `${num1} ${simbolo} ${num2}`, inline: true },
        { name: '✅ Resultado', value: resultado.toString(), inline: true }
      )
      .setFooter({ text: `Calculado por ${interaction.user.tag}` })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], flags: 64 });
    logInfo(`${interaction.user.tag} usou a calculadora`);
  },
};

// === COMANDO /RANDOM - NÚMERO ALEATÓRIO ===
const randomCommand = {
  data: {
    name: 'random',
    description: 'Gera um número aleatório',
    options: [
      {
        name: 'minimo',
        description: 'Valor mínimo (padrão: 1)',
        type: 4,
        required: false,
        min_value: 1
      },
      {
        name: 'maximo',
        description: 'Valor máximo (padrão: 100)',
        type: 4,
        required: false,
        min_value: 1
      }
    ]
  },
  async execute(interaction) {
    const min = interaction.options.getInteger('minimo') || 1;
    const max = interaction.options.getInteger('maximo') || 100;
    
    if (min > max) {
      return interaction.reply({ content: '❌ O valor mínimo não pode ser maior que o máximo!', flags: 64 });
    }
    
    const numero = Math.floor(Math.random() * (max - min + 1)) + min;
    
    const embed = new EmbedBuilder()
      .setTitle('🎲 Número Aleatório')
      .setColor(Colors.Purple)
      .addFields(
        { name: '📊 Intervalo', value: `${min} - ${max}`, inline: true },
        { name: '✅ Resultado', value: numero.toString(), inline: true }
      )
      .setFooter({ text: `Gerado por ${interaction.user.tag}` })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], flags: 64 });
    logInfo(`${interaction.user.tag} gerou um número aleatório`);
  },
};

// === COMANDO /TEMPO - VER TEMPO NO SERVIDOR (UPTIME) ===
const tempoCommand = {
  data: {
    name: 'tempo',
    description: 'Mostra há quanto tempo o bot está online'
  },
  async execute(interaction) {
    const uptimeSeconds = Math.floor(client.uptime / 1000);
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    
    const embed = new EmbedBuilder()
      .setTitle('⏱️ Tempo Online do Bot')
      .setColor(Colors.Green)
      .addFields(
        { name: '📅 Dias', value: `${days}`, inline: true },
        { name: '⏰ Horas', value: `${hours}`, inline: true },
        { name: '⏱️ Minutos', value: `${minutes}`, inline: true },
        { name: '⌛ Segundos', value: `${seconds}`, inline: true },
        { name: '📊 Total', value: `${uptimeSeconds} segundos`, inline: true }
      )
      .setFooter({ text: `Requerido por ${interaction.user.tag}` })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], flags: 64 });
    logInfo(`/tempo usado por ${interaction.user.tag}`);
  },
};

// === COMANDO /MEMBROS - LISTAR MEMBROS DO SERVIDOR ===
const membrosCommand = {
  data: {
    name: 'membros',
    description: 'Mostra estatísticas de membros do servidor'
  },
  async execute(interaction) {
    const guild = interaction.guild;
    await guild.members.fetch();
    
    const total = guild.memberCount;
    const bots = guild.members.cache.filter(m => m.user.bot).size;
    const humanos = total - bots;
    const online = guild.members.cache.filter(m => m.presence?.status === 'online').size;
    const idle = guild.members.cache.filter(m => m.presence?.status === 'idle').size;
    const dnd = guild.members.cache.filter(m => m.presence?.status === 'dnd').size;
    const offline = total - online - idle - dnd;
    
    const embed = new EmbedBuilder()
      .setTitle('👥 Estatísticas de Membros')
      .setColor(Colors.Blue)
      .addFields(
        { name: '📊 Total', value: `${total}`, inline: true },
        { name: '👤 Humanos', value: `${humanos}`, inline: true },
        { name: '🤖 Bots', value: `${bots}`, inline: true },
        { name: '🟢 Online', value: `${online}`, inline: true },
        { name: '🟡 Ausente', value: `${idle}`, inline: true },
        { name: '🔴 Ocupado', value: `${dnd}`, inline: true },
        { name: '⚫ Offline', value: `${offline}`, inline: true }
      )
      .setFooter({ text: guild.name })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], flags: 64 });
    logInfo(`/membros usado por ${interaction.user.tag}`);
  },
};

// ===============================
// EVENTO: MENSAGEM CRIADA (MODERAÇÃO)
// ===============================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (isAdmin(message.member)) return;

  if (containsOffensiveWord(message.content)) {
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
      logError(`Erro ao moderar mensagem: ${err.message}`);
    }
  }

  // Sistema de auto-resposta para saudações
  const greetings = ['oi', 'ola', 'olá', 'hello', 'hi', 'eae', 'e aí', 'fala', 'oie', 'oii'];
  if (greetings.includes(message.content.toLowerCase())) {
    message.channel.send(`Olá ${message.author}! 👋 Como posso ajudar?`);
  }
});

// ===============================
// EVENTO: BEM-VINDO (MEMBER ADD)
// ===============================
client.on('guildMemberAdd', async (member) => {
  console.log(chalk.green.bgBlack.bold('\n 👤 NOVO MEMBRO '));
  console.log(chalk.green('────────────────────────────────'));
  console.log(chalk.green(`   Usuário: ${member.user.tag}`));
  console.log(chalk.green(`   ID:      ${member.user.id}`));
  console.log(chalk.green(`   Servidor: ${member.guild.name}`));
  console.log(chalk.green(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.green('────────────────────────────────\n'));
  
  // Mensagem de boas-vindas
  if (CONFIG.welcomeChannelId) {
    const channel = member.guild.channels.cache.get(CONFIG.welcomeChannelId);
    if (channel) {
      const embed = new EmbedBuilder()
        .setTitle('👋 Bem-vindo ao Servidor!')
        .setDescription(`Olá ${member.user}, seja bem-vindo(a) ao **${member.guild.name}**!`)
        .setColor(Colors.Green)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '📅 Entrou', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
          { name: '👤 Membro nº', value: `${member.guild.memberCount}`, inline: true }
        )
        .setFooter({ text: 'Divirta-se e siga as regras!' })
        .setTimestamp();
      
      channel.send({ embeds: [embed] });
    }
  }
  
  // Auto-role
  if (CONFIG.autoRoleId) {
    try {
      const role = member.guild.roles.cache.get(CONFIG.autoRoleId);
      if (role) {
        await member.roles.add(role);
        logInfo(`Cargo automático adicionado para ${member.user.tag}`);
      }
    } catch (error) {
      logError(`Erro ao adicionar cargo automático: ${error.message}`);
    }
  }
  
  logInfo(`Novo membro: ${member.user.tag} (${member.guild.name})`);
});

// ===============================
// EVENTO: MEMBER REMOVE
// ===============================
client.on('guildMemberRemove', async (member) => {
  console.log(chalk.red.bgBlack.bold('\n ❌ MEMBRO SAIU '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Usuário: ${member.user.tag}`));
  console.log(chalk.red(`   Servidor: ${member.guild.name}`));
  console.log(chalk.red(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.red('────────────────────────────────\n'));
  
  // Mensagem de despedida
  if (CONFIG.welcomeChannelId) {
    const channel = member.guild.channels.cache.get(CONFIG.welcomeChannelId);
    if (channel) {
      const embed = new EmbedBuilder()
        .setTitle('👋 Até logo!')
        .setDescription(`${member.user.tag} saiu do servidor.`)
        .setColor(Colors.Red)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '📅 Saiu', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
          { name: '👤 Membros restantes', value: `${member.guild.memberCount}`, inline: true }
        )
        .setFooter({ text: 'Esperamos que volte em breve!' })
        .setTimestamp();
      
      channel.send({ embeds: [embed] });
    }
  }
  
  logInfo(`Membro saiu: ${member.user.tag} (${member.guild.name})`);
});

// ===============================
// EVENTO: BOT PRONTO
// ===============================
client.once('ready', async () => {
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
          privateCommand.data,
          userinfoCommand.data,
          serverinfoCommand.data,
          avatarCommand.data,
          clearCommand.data,
          suggestCommand.data,
          reportCommand.data,
          calcCommand.data,
          randomCommand.data,
          tempoCommand.data,
          membrosCommand.data
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

  // Definir status personalizado
  client.user.setPresence({
    activities: [{ 
      name: `${client.guilds.cache.size} servidores | /help`, 
      type: 3 
    }],
    status: 'online'
  });

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
      const commandMap = {
        'ping': pingCommand,
        'help': helpCommand,
        'private': privateCommand,
        'userinfo': userinfoCommand,
        'serverinfo': serverinfoCommand,
        'avatar': avatarCommand,
        'clear': clearCommand,
        'sugestao': suggestCommand,
        'reportar': reportCommand,
        'calc': calcCommand,
        'random': randomCommand,
        'tempo': tempoCommand,
        'membros': membrosCommand
      };
      
      const cmd = commandMap[interaction.commandName];
      if (cmd) {
        await cmd.execute(interaction);
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

  if (interaction.isButton()) {
    await handleButtonInteraction(interaction);
    return;
  }

  if (interaction.isModalSubmit()) {
    logInfo(`Modal submetido por ${interaction.user.tag}`);
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

      const presence = client.user.presence;
      const status = presence ? presence.status : 'offline';

      const embed = new EmbedBuilder()
        .setTitle('📊 Estatísticas do Bot')
        .setColor(Colors.Green)
        .addFields(
          { name: '🏓 Ping', value: `${client.ws.ping}ms`, inline: true },
          { name: '⏱️ Uptime', value: `${hours}h ${minutes}m ${seconds}s`, inline: true },
          { name: '🏛️ Servidores', value: `${client.guilds.cache.size}`, inline: true },
          { name: '👥 Usuários', value: `${client.users.cache.size}`, inline: true },
          { name: '🟢 Status', value: status, inline: true },
          { name: '📊 Comandos', value: '14 comandos', inline: true }
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
      console.log(chalk.yellow('═════════════════════════════\n'));
      await interaction.reply({ content: '✅ Verifique o console!', flags: 64 });
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
          { name: '📋 Comandos', value: 'Lista todos os comandos disponíveis', inline: false },
          { name: '🔐 Segurança', value: 'Use o comando /adm com a senha correta', inline: false }
        )
        .setFooter({ text: 'Painel Administrativo' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
      logInfo(`${interaction.user.tag} pediu ajuda no painel`);
      break;
    }

    case 'commands': {
      const embed = new EmbedBuilder()
        .setTitle('📋 Lista de Comandos')
        .setDescription('Todos os comandos disponíveis:')
        .setColor(Colors.Purple)
        .addFields(
          { name: '👤 Usuário', value: '`/help`, `/ping`, `/userinfo`, `/avatar`, `/calc`, `/random`, `/tempo`, `/membros`', inline: false },
          { name: '🛡️ Staff', value: '`/adm`, `/private`, `/clear`, `/sugestao`, `/reportar`', inline: false },
          { name: '📊 Informações', value: '`/serverinfo`, `/membros`, `/tempo`', inline: false }
        )
        .setFooter({ text: 'Use /help para mais detalhes' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
      break;
    }

    default:
      await interaction.reply({ content: '❌ Botão desconhecido!', flags: 64 });
  }
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
  console.log(chalk.cyan('║  8.  Ver comandos disponíveis                                   ║'));
  console.log(chalk.cyan('║  9.  Sincronizar comandos                                       ║'));
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
      console.log(chalk.green('🔄 Dados atualizados!'));
      showMenu();
      break;
    case '6':
      showRecentLogs();
      break;
    case '7':
      showBotStatus();
      break;
    case '8':
      showCommandsList();
      break;
    case '9':
      syncCommands();
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
  console.log(chalk.white(`📁 Canais: ${client.channels.cache.size}`));
  console.log(chalk.white(`📊 Comandos: 14 comandos disponíveis`));
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
      
      try {
        await guild.members.fetch();
        const members = guild.members.cache;
        
        console.log(chalk.yellow(`\n═══ MEMBROS DE ${guild.name.toUpperCase()} ═══`));
        console.log(chalk.white(`Total: ${members.size} membros\n`));
        
        let count = 0;
        members.forEach((member) => {
          if (count < 10) {
            const status = member.user.bot ? chalk.blue('[BOT]') : chalk.green('[USER]');
            const status2 = member.manageable ? chalk.yellow(' [MOD]') : '';
            const presence = member.presence?.status === 'online' ? chalk.green('🟢') : 
                            member.presence?.status === 'idle' ? chalk.yellow('🟡') :
                            member.presence?.status === 'dnd' ? chalk.red('🔴') : chalk.gray('⚫');
            console.log(`  ${presence} ${status}${status2} ${member.user.tag}`);
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

function showRecentLogs() {
  console.log(chalk.yellow('\n═══ 📋 LOGS RECENTES ═══'));
  console.log(chalk.white('Os logs recentes foram exibidos no console acima.'));
  console.log(chalk.white('Use CTRL+F para pesquisar nos logs.'));
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
  console.log(chalk.white(`📊 Comandos: 14 disponíveis`));
  console.log(chalk.yellow('══════════════════════════════\n'));
  showMenu();
}

function showCommandsList() {
  console.log(chalk.yellow('\n═══ 📋 COMANDOS DISPONÍVEIS ═══'));
  console.log(chalk.white('📌 /ping - Verificar latência'));
  console.log(chalk.white('📌 /help - Lista de ajuda'));
  console.log(chalk.white('📌 /adm - Painel administrativo'));
  console.log(chalk.white('📌 /private - Mensagem privada (Staff)'));
  console.log(chalk.white('📌 /userinfo - Info de usuário'));
  console.log(chalk.white('📌 /serverinfo - Info do servidor'));
  console.log(chalk.white('📌 /avatar - Ver avatar'));
  console.log(chalk.white('📌 /clear - Limpar mensagens (Staff)'));
  console.log(chalk.white('📌 /sugestao - Enviar sugestão'));
  console.log(chalk.white('📌 /reportar - Reportar usuário'));
  console.log(chalk.white('📌 /calc - Calculadora'));
  console.log(chalk.white('📌 /random - Número aleatório'));
  console.log(chalk.white('📌 /tempo - Tempo online do bot'));
  console.log(chalk.white('📌 /membros - Estatísticas de membros'));
  console.log(chalk.yellow('═══════════════════════════════════\n'));
  showMenu();
}

async function syncCommands() {
  console.log(chalk.yellow('\n🔄 Sincronizando comandos...'));
  
  if (client.guilds.cache.size > 0) {
    try {
      for (const guild of client.guilds.cache.values()) {
        await guild.commands.set([
          ...commands.map(c => c.data),
          pingCommand.data,
          helpCommand.data,
          privateCommand.data,
          userinfoCommand.data,
          serverinfoCommand.data,
          avatarCommand.data,
          clearCommand.data,
          suggestCommand.data,
          reportCommand.data,
          calcCommand.data,
          randomCommand.data,
          tempoCommand.data,
          membrosCommand.data
        ]);
        console.log(chalk.green(`✅ Comandos sincronizados em: ${guild.name}`));
      }
      console.log(chalk.green('\n✅ Sincronização concluída!\n'));
    } catch (error) {
      logError(`Erro ao sincronizar comandos: ${error.message}`);
    }
  } else {
    console.log(chalk.red('Nenhum servidor encontrado.'));
  }
  
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

client.on('channelCreate', async (channel) => {
  if (!channel.guild) return;
  console.log(chalk.blue.bgBlack.bold('\n 📁 CANAL CRIADO '));
  console.log(chalk.blue('────────────────────────────────'));
  console.log(chalk.blue(`   Nome:  #${channel.name}`));
  console.log(chalk.blue(`   Tipo:  ${channel.type}`));
  console.log(chalk.blue(`   Servidor: ${channel.guild.name}`));
  console.log(chalk.blue('────────────────────────────────\n'));
});

client.on('channelDelete', async (channel) => {
  if (!channel.guild) return;
  console.log(chalk.red.bgBlack.bold('\n 🗑️ CANAL DELETADO '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Nome:  #${channel.name}`));
  console.log(chalk.red(`   Servidor: ${channel.guild.name}`));
  console.log(chalk.red('────────────────────────────────\n'));
});

client.on('channelUpdate', async (oldChannel, newChannel) => {
  if (!oldChannel.guild) return;
  if (oldChannel.name === newChannel.name) return;

  console.log(chalk.yellow.bgBlack.bold('\n 🔄 CANAL ATUALIZADO '));
  console.log(chalk.yellow('────────────────────────────────'));
  console.log(chalk.yellow(`   Nome Antigo: #${oldChannel.name}`));
  console.log(chalk.yellow(`   Nome Novo:   #${newChannel.name}`));
  console.log(chalk.yellow(`   Servidor:    ${oldChannel.guild.name}`));
  console.log(chalk.yellow('────────────────────────────────\n'));
});

client.on('roleCreate', async (role) => {
  if (!role.guild) return;
  console.log(chalk.magenta.bgBlack.bold('\n 🎭 ROLE CRIADA '));
  console.log(chalk.magenta('────────────────────────────────'));
  console.log(chalk.magenta(`   Nome:  ${role.name}`));
  console.log(chalk.magenta(`   ID:    ${role.id}`));
  console.log(chalk.magenta(`   Cor:   ${role.hexColor}`));
  console.log(chalk.magenta(`   Servidor: ${role.guild.name}`));
  console.log(chalk.magenta('────────────────────────────────\n'));
});

client.on('roleDelete', async (role) => {
  if (!role.guild) return;
  console.log(chalk.red.bgBlack.bold('\n 🗑️ ROLE DELETADA '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Nome:  ${role.name}`));
  console.log(chalk.red(`   ID:    ${role.id}`));
  console.log(chalk.red(`   Servidor: ${role.guild.name}`));
  console.log(chalk.red('────────────────────────────────\n'));
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
  console.log(chalk.yellow('────────────────────────────────\n'));
});

client.on('guildEmojiCreate', async (emoji) => {
  console.log(chalk.cyan.bgBlack.bold('\n 😊 EMOJI CRIADO '));
  console.log(chalk.cyan('────────────────────────────────'));
  console.log(chalk.cyan(`   Nome:  ${emoji.name}`));
  console.log(chalk.cyan(`   ID:    ${emoji.id}`));
  console.log(chalk.cyan(`   Servidor: ${emoji.guild.name}`));
  console.log(chalk.cyan('────────────────────────────────\n'));
});

client.on('guildEmojiDelete', async (emoji) => {
  console.log(chalk.red.bgBlack.bold('\n 🗑️ EMOJI DELETADO '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Nome:  ${emoji.name}`));
  console.log(chalk.red(`   ID:    ${emoji.id}`));
  console.log(chalk.red(`   Servidor: ${emoji.guild.name}`));
  console.log(chalk.red('────────────────────────────────\n'));
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  if (!oldState.channel && newState.channel) {
    console.log(chalk.green.bgBlack.bold('\n 🎤 ENTROU NO CANAL DE VOZ '));
    console.log(chalk.green('────────────────────────────────'));
    console.log(chalk.green(`   Usuário: ${newState.member.user.tag}`));
    console.log(chalk.green(`   Canal:   #${newState.channel.name}`));
    console.log(chalk.green('────────────────────────────────\n'));
  } else if (oldState.channel && !newState.channel) {
    console.log(chalk.red.bgBlack.bold('\n 🎤 SAIU DO CANAL DE VOZ '));
    console.log(chalk.red('────────────────────────────────'));
    console.log(chalk.red(`   Usuário: ${oldState.member.user.tag}`));
    console.log(chalk.red(`   Canal:   ${oldState.channel.name}`));
    console.log(chalk.red('────────────────────────────────\n'));
  } else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
    console.log(chalk.yellow.bgBlack.bold('\n 🔄 TROCOU DE CANAL DE VOZ '));
    console.log(chalk.yellow('────────────────────────────────'));
    console.log(chalk.yellow(`   Usuário: ${newState.member.user.tag}`));
    console.log(chalk.yellow(`   De:      #${oldState.channel.name}`));
    console.log(chalk.yellow(`   Para:    #${newState.channel.name}`));
    console.log(chalk.yellow('────────────────────────────────\n'));
  }
});

client.on('guildUpdate', async (oldGuild, newGuild) => {
  if (oldGuild.name !== newGuild.name) {
    console.log(chalk.yellow.bgBlack.bold('\n 🏛️ NOME DO SERVIDOR ALTERADO '));
    console.log(chalk.yellow('────────────────────────────────'));
    console.log(chalk.yellow(`   Antigo: ${oldGuild.name}`));
    console.log(chalk.yellow(`   Novo:   ${newGuild.name}`));
    console.log(chalk.yellow('────────────────────────────────\n'));
  }
});

client.on('guildBanAdd', async (guild, user) => {
  console.log(chalk.red.bgBlack.bold('\n 🚫 USUÁRIO BANIDO '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Usuário: ${user.tag}`));
  console.log(chalk.red(`   Servidor: ${guild.name}`));
  console.log(chalk.red('────────────────────────────────\n'));
});

client.on('guildBanRemove', async (guild, user) => {
  console.log(chalk.green.bgBlack.bold('\n ✅ USUÁRIO DESBANIDO '));
  console.log(chalk.green('────────────────────────────────'));
  console.log(chalk.green(`   Usuário: ${user.tag}`));
  console.log(chalk.green(`   Servidor: ${guild.name}`));
  console.log(chalk.green('────────────────────────────────\n'));
});

client.on('inviteCreate', async (invite) => {
  console.log(chalk.cyan.bgBlack.bold('\n 🔗 CONVITE CRIADO '));
  console.log(chalk.cyan('────────────────────────────────'));
  console.log(chalk.cyan(`   Código: ${invite.code}`));
  console.log(chalk.cyan(`   Criado por: ${invite.inviter?.tag || 'Desconhecido'}`));
  console.log(chalk.cyan(`   Usos máximos: ${invite.maxUses || 'Ilimitado'}`));
  console.log(chalk.cyan(`   Expira em: ${invite.maxAge ? `${invite.maxAge} segundos` : 'Nunca'}`));
  console.log(chalk.cyan(`   Servidor: ${invite.guild.name}`));
  console.log(chalk.cyan('────────────────────────────────\n'));
});

client.on('webhookUpdate', async (channel) => {
  console.log(chalk.magenta.bgBlack.bold('\n 📡 WEBHOOK ATUALIZADO '));
  console.log(chalk.magenta('────────────────────────────────'));
  console.log(chalk.magenta(`   Canal: #${channel.name}`));
  console.log(chalk.magenta(`   Servidor: ${channel.guild.name}`));
  console.log(chalk.magenta('────────────────────────────────\n'));
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
