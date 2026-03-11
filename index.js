const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  Colors, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder, 
  ChatInputCommandInteraction,
  ChannelType
} = require('discord.js');

const dotenv = require('dotenv');
const chalk = require('chalk');
const readline = require('readline');

// carregar variáveis do .env
dotenv.config();

// sistema de IA
const {
  isOffensive,
  enableAI,
  disableAI,
  getAIStatus
} = require('./aiModeration');

// variáveis do bot
const TOKEN = process.env.TOKEN;
const ACCESS_CODE = process.env.ACCESS_CODE;
const OWNER_ID = process.env.OWNER_ID;

// criar cliente do discord (somente UMA vez)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.GuildMember,
    Partials.Reaction
  ]
});

// === VARIÁVEL GLOBAL PARA CONTROLAR O READLINE ===
let rl = null;        // apenas uma declaração
let isMenuActive = false;

// === FUNÇÕES DE LOG PERSONALIZADAS ===
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

// === COMANDO /adm - DEFINIÇÃO ===
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
      
      if (code !== process.env.ACCESS_CODE) {
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

// === COMANDO /ping - TESTE DE CONEXÃO ===
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
  },
};

// === COMANDO /help - AJUDA ===
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
        { name: '/private', value: 'Enviar mensagem privada (Staff)', inline: false }
      )
      .setFooter({ text: 'Digite /help para mais informações' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: 64 });
    logInfo(`Comando /help usado por ${interaction.user.tag}`);
  },
};

// === COMANDO /private - MENSAGEM DA STAFF (COM SENHA ACCESS_CODE) ===
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

    // Verifica se o código está correto
    if (code !== process.env.ACCESS_CODE) {
      return interaction.reply({
        content: '❌ Código de acesso incorreto!',
        flags: 64
      });
    }

    try {
      await interaction.channel.send(
        `🛠 **Mensagem da Staff 🛠**\n\n${user}\n\n${message}`
      );

      await interaction.reply({
        content:
          `✅ Mensagem enviada\n\nPara ${user}\n\nMensagem enviada:\n${message}`,
        flags: 64
      });

      logInfo(`${interaction.user.tag} enviou mensagem para ${user.tag}`);
    } catch (error) {
      await interaction.reply({
        content: '❌ Erro ao enviar a mensagem.',
        flags: 64
      });
    }
  }
};

// === EVENTO: BOT PRONTO (CORRIGIDO - usa clientReady) ===
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
// === INICIALIZAR READLINE ===
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

// === EVENTO: INTERAÇÃO (COMANDOS DE TEXTO) ===
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
    await handleButtonInteraction(interaction);
    return;
  }

  // Handler para modais (futuro)
  if (interaction.isModalSubmit()) {
    logInfo(`Modal submetido por ${interaction.user.tag}`);
  }
});

// === EVENTO: MENSAGEM DELETADA ===
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

// === EVENTO: MENSAGEM ATUALIZADA ===
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

// === EVENTO: MEMBRO ENTROU ===
client.on('guildMemberAdd', async (member) => {
  console.log(chalk.green.bgBlack.bold('\n 👤 NOVO MEMBRO '));
  console.log(chalk.green('────────────────────────────────'));
  console.log(chalk.green(`   Usuário: ${member.user.tag}`));
  console.log(chalk.green(`   ID:      ${member.user.id}`));
  console.log(chalk.green(`   Servidor:${member.guild.name}`));
  console.log(chalk.green(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.green('────────────────────────────────\n'));
  logInfo(`Novo membro: ${member.user.tag} (${member.guild.name})`);
});

// === EVENTO: MEMBRO SAIU ===
client.on('guildMemberRemove', async (member) => {
  console.log(chalk.red.bgBlack.bold('\n ❌ MEMBRO SAIU '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Usuário: ${member.user.tag}`));
  console.log(chalk.red(`   Servidor:${member.guild.name}`));
  console.log(chalk.red(`   Data:    ${new Date().toLocaleString('pt-BR')}`));
  console.log(chalk.red('────────────────────────────────\n'));
  logInfo(`Membro saiu: ${member.user.tag} (${member.guild.name})`);
});

// === EVENTO: CANAL CRIADO ===
client.on('channelCreate', async (channel) => {
  if (!channel.guild) return;
  console.log(chalk.blue.bgBlack.bold('\n 📁 CANAL CRIADO '));
  console.log(chalk.blue('────────────────────────────────'));
  console.log(chalk.blue(`   Nome:  #${channel.name}`));
  console.log(chalk.blue(`   Tipo:  ${channel.type}`));
  console.log(chalk.blue(`   Servidor: ${channel.guild.name}`));
  console.log(chalk.blue('────────────────────────────────\n'));
});

// === EVENTO: CANAL DELETADO ===
client.on('channelDelete', async (channel) => {
  if (!channel.guild) return;
  console.log(chalk.red.bgBlack.bold('\n 🗑️ CANAL DELETADO '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Nome:  #${channel.name}`));
  console.log(chalk.red(`   Servidor: ${channel.guild.name}`));
  console.log(chalk.red('────────────────────────────────\n'));
});

// === EVENTO: CANAL ATUALIZADO ===
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

// === EVENTO: ROLE CRIADA ===
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
// === EVENTO: ROLE DELETADA ===
client.on('roleDelete', async (role) => {
  if (!role.guild) return;
  console.log(chalk.red.bgBlack.bold('\n 🗑️ ROLE DELETADA '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Nome:  ${role.name}`));
  console.log(chalk.red(`   ID:    ${role.id}`));
  console.log(chalk.red(`   Servidor: ${role.guild.name}`));
  console.log(chalk.red('────────────────────────────────\n'));
});

// === EVENTO: ROLE ATUALIZADA ===
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

// === EVENTO: EMOJI CRIADO ===
client.on('guildEmojiCreate', async (emoji) => {
  console.log(chalk.cyan.bgBlack.bold('\n 😊 EMOJI CRIADO '));
  console.log(chalk.cyan('────────────────────────────────'));
  console.log(chalk.cyan(`   Nome:  ${emoji.name}`));
  console.log(chalk.cyan(`   ID:    ${emoji.id}`));
  console.log(chalk.cyan(`   Servidor: ${emoji.guild.name}`));
  console.log(chalk.cyan('────────────────────────────────\n'));
});

// === EVENTO: EMOJI DELETADO ===
client.on('guildEmojiDelete', async (emoji) => {
  console.log(chalk.red.bgBlack.bold('\n 🗑️ EMOJI DELETADO '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Nome:  ${emoji.name}`));
  console.log(chalk.red(`   ID:    ${emoji.id}`));
  console.log(chalk.red(`   Servidor: ${emoji.guild.name}`));
  console.log(chalk.red('────────────────────────────────\n'));
});

// === EVENTO: VOICE STATE UPDATE ===
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
  }
});

// === EVENTO: GUILD UPDATE ===
client.on('guildUpdate', async (oldGuild, newGuild) => {
  if (oldGuild.name !== newGuild.name) {
    console.log(chalk.yellow.bgBlack.bold('\n 🏛️ NOME DO SERVIDOR ALTERADO '));
    console.log(chalk.yellow('────────────────────────────────'));
    console.log(chalk.yellow(`   Antigo: ${oldGuild.name}`));
    console.log(chalk.yellow(`   Novo:   ${newGuild.name}`));
    console.log(chalk.yellow('────────────────────────────────\n'));
  }
});

// === EVENTO: GUILD BAN ADD ===
client.on('guildBanAdd', async (guild, user) => {
  console.log(chalk.red.bgBlack.bold('\n 🚫 USUÁRIO BANIDO '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Usuário: ${user.tag}`));
  console.log(chalk.red(`   Servidor: ${guild.name}`));
  console.log(chalk.red('────────────────────────────────\n'));
});

// === EVENTO: GUILD BAN REMOVE ===
client.on('guildBanRemove', async (guild, user) => {
  console.log(chalk.green.bgBlack.bold('\n ✅ USUÁRIO DESBANIDO '));
  console.log(chalk.green('────────────────────────────────'));
  console.log(chalk.green(`   Usuário: ${user.tag}`));
  console.log(chalk.green(`   Servidor: ${guild.name}`));
  console.log(chalk.green('────────────────────────────────\n'));
});

// === ERROS NÃO TRATADOS ===
process.on('unhandledRejection', (error) => {
  logError(`Erro não tratado: ${error.message}`);
  console.error(error);
});

process.on('uncaughtException', (error) => {
  logError(`Exceção não tratada: ${error.message}`);
  console.error(error);
  process.exit(1);
});

// ==========================================
//        MENU INTERATIVO NO CONSOLE
// ==========================================

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
      console.log(chalk.green('🔄 Dados atualizados!'));
      showMenu();
      break;
    case '6':
      showRecentLogs();
      break;
    case '7':
      showBotStatus();
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

// === FUNÇÃO PARA TRATAR BOTÕES (PAINEL ADMIN) ===
async function handleButtonInteraction(interaction) {
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
        .setTimestamp();      await interaction.reply({ embeds: [embed], flags: 64 });
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
          { name: '🔐 Segurança', value: 'Use o comando /adm com a senha correta', inline: false }
        )
        .setFooter({ text: 'Painel Administrativo' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
      logInfo(`${interaction.user.tag} pediu ajuda no painel`);
      break;
    }

    default:
      await interaction.reply({ content: '❌ Botão desconhecido!', flags: 64 });
  }
}

// === LOGIN ===
client.login(process.env.TOKEN);
