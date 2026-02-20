// index.js
import { Client, GatewayIntentBits, Partials, Colors } from 'discord.js';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,    // NOVO: monitorar membros
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember], // NOVO
});

// === FUNÇÕES DE LOG COLORIDO ===
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

function logEvent(event, message) {
  console.log(`${getTimestamp()} ${chalk.magenta('◆ ' + event)}: ${message}`);
}

// === COMANDO /adm ===
const commands = [
  {
    data: {
      name: 'adm',
      description: 'Painel administrativo',
      options: [{ name: 'code', type: 3, description: 'Senha de acesso', required: true }],
    },
    async execute(interaction) {
      const code = interaction.options.getString('code');
      if (code !== process.env.ACCESS_CODE) {
        return interaction.reply({ content: 'Código incorreto!', ephemeral: true });
      }
      
      const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js');
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('stats').setLabel('Estatísticas').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('console').setLabel('Ver no console').setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({ content: 'Painel Administrativo:', components: [row], ephemeral: true });
      logInfo(`/adm usado por ${interaction.user.tag}`);
    },
  },
];

// === EVENTO: BOT PRONTO ===
client.once('clientReady', async () => {
  console.log('\n' + chalk.green.underline('═'.repeat(40)));
  console.log(chalk.green('  🤖 BOT ESTÁ ONLINE!'));
  console.log(chalk.green.underline('═'.repeat(40)));
  
  console.log(chalk.cyan('\n  📊 ESTATÍSTICAS INICIAIS:'));
  console.log(chalk.white(`   • Tag: ${client.user.tag}`));
  console.log(chalk.white(`   • ID: ${client.user.id}`));
  console.log(chalk.white(`   • Servidores: ${client.guilds.cache.size}`));
  
  if (client.application?.commands) {
    await client.application.commands.set(commands.map(c => c.data));
    logInfo('Comando /adm registrado globalmente.');
  }
  
  console.log(chalk.green('\n  ✅ Tudo pronto! Bot conectado com sucesso.\n'));
});

// === EVENTO: INTERAÇÃO (BOTÕES) ===
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const { EmbedBuilder } = await import('discord.js');

  switch (interaction.customId) {
    case 'stats': {
      const uptimeSeconds = Math.floor(client.uptime / 1000);
      const embed = new EmbedBuilder()
        .setTitle('📊 Estatísticas do Bot')
        .setColor(Colors.Green)
        .addFields(
          { name: '🏓 Ping', value: `${client.ws.ping}ms`, inline: true },
          { name: '⏱️ Uptime', value: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`, inline: true },
          { name: '🏛️ Servidores', value: `${client.guilds.cache.size}`, inline: true }
        );
      await interaction.reply({ embeds: [embed], ephemeral: true });
      logInfo(`${interaction.user.tag} abriu estatísticas`);
      break;
    }

    case 'console': {
      console.log(chalk.yellow('\n═══ ESTATÍSTICAS DO BOT ═══'));
      console.log(chalk.white(`Ping:    ${client.ws.ping}ms`));
      console.log(chalk.white(`Uptime:  ${Math.floor(client.uptime / 3600000)}h`));
      console.log(chalk.white(`Servers: ${client.guilds.cache.size}`));
      console.log(chalk.yellow('═════════════════════════════\n'));
      await interaction.reply({ content: '✅ Verifique o console!', ephemeral: true });
      break;
    }
  }
});

// === EVENTO: MENSAGEM DELETADA ===
client.on('messageDelete', async (message) => {
  if (!message.guild || !message.author) return;

  let deleter = 'Desconhecido';
  try {
    const auditLogs = await message.guild.fetchAuditLogs({ type: 72, limit: 1 });
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
  console.log(chalk.red('────────────────────────────────\n'));
});

// === NOVO: MEMBRO ENTROU ===
client.on('guildMemberAdd', async (member) => {
  console.log(chalk.green.bgBlack.bold('\n 👤 NOVO MEMBRO '));
  console.log(chalk.green('────────────────────────────────'));
  console.log(chalk.green(`   Usuário: ${member.user.tag}`));
  console.log(chalk.green(`   ID:      ${member.user.id}`));
  console.log(chalk.green(`   Servidor:${member.guild.name}`));
  console.log(chalk.green('────────────────────────────────\n'));
  logInfo(`Novo membro: ${member.user.tag} (${member.guild.name})`);
});

// === NOVO: MEMBRO SAIU ===
client.on('guildMemberRemove', async (member) => {
  console.log(chalk.red.bgBlack.bold('\n ❌ MEMBRO SAIU '));
  console.log(chalk.red('────────────────────────────────'));
  console.log(chalk.red(`   Usuário: ${member.user.tag}`));
  console.log(chalk.red(`   Servidor:${member.guild.name}`));
  console.log(chalk.red('────────────────────────────────\n'));
  logInfo(`Membro saiu: ${member.user.tag} (${member.guild.name})`);
});

// === NOVO: ERROS NÃO TRATADOS ===
process.on('unhandledRejection', (error) => {
  logError(`Erro não tratado: ${error.message}`);
  console.error(error);
});

process.on('uncaughtException', (error) => {
  logError(`Exceção não tratada: ${error.message}`);
  console.error(error);
  process.exit(1);
});

// === LOGIN ===
client.login(process.env.TOKEN);
