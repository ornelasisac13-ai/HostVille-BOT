// index.js
import { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,         // necessário para guild
    GatewayIntentBits.GuildMessages,  // necessário para mensagens
    GatewayIntentBits.MessageContent, // para ler conteúdo das mensagens
  ],
  partials: [Partials.Message, Partials.Channel], // necessário para deletadas
});

// Função para log ASCII colorido
function logInfo(message) {
  console.log(chalk.green('=== INFO ==='), chalk.cyan(message));
}

// Comando /adm
const commands = [
  {
    data: {
      name: 'adm',
      description: 'Painel administrativo',
      options: [
        {
          name: 'code',
          type: 3, // STRING
          description: 'Senha de acesso',
          required: true,
        },
      ],
    },
    async execute(interaction) {
      const code = interaction.options.getString('code');
      if (code !== process.env.ACCESS_CODE) {
        return interaction.reply({ content: 'Código incorreto!', ephemeral: true });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('stats')
          .setLabel('Estatísticas')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('console')
          .setLabel('Enviar para console')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({ content: 'Painel Administrativo:', components: [row], ephemeral: true });
      logInfo(`/adm usado por ${interaction.user.tag}`);
    },
  },
];

// Registrar comandos globais quando o bot estiver pronto
client.once('clientReady', async () => {  // ← CORREÇÃO AQUI
  console.log(chalk.yellow('Bot está online!'));
  if (client.application?.commands) {
    await client.application.commands.set(commands.map(c => c.data));
    logInfo('Comando /adm registrado globalmente.');
  }
});

// Listener para botões
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  switch (interaction.customId) {
    case 'stats': {
      const uptimeSeconds = Math.floor(client.uptime / 1000);
      const embed = new EmbedBuilder()
        .setTitle('Estatísticas do Bot')
        .setColor('#00FF00')
        .addFields(
          { name: 'Ping', value: `${client.ws.ping}ms`, inline: true },
          { name: 'Uptime', value: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`, inline: true },
          { name: 'Servidores', value: `${client.guilds.cache.size}`, inline: true },
          { name: 'Usuários', value: `${client.users.cache.size}`, inline: true }
        );
      await interaction.reply({ embeds: [embed], ephemeral: true });
      logInfo(`${interaction.user.tag} abriu as estatísticas`);
      break;
    }

    case 'console': {
      console.log('=== Estatísticas do Bot ===');
      console.log(`Ping: ${client.ws.ping}ms`);
      console.log(`Uptime: ${Math.floor(client.uptime / 3600000)}h`);
      console.log(`Servidores: ${client.guilds.cache.size}`);
      console.log(`Usuários: ${client.users.cache.size}`);
      console.log('===========================');
      await interaction.reply({ content: 'Estatísticas enviadas ao console!', ephemeral: true });
      break;
    }
  }
});

// Listener para mensagens deletadas
client.on('messageDelete', async (message) => {
  // Pega quem deletou a mensagem se for log de audit
  let deleter = 'Desconhecido';
  if (message.guild) {
    const auditLogs = await message.guild.fetchAuditLogs({ type: 72, limit: 1 }); // 72 = MESSAGE_DELETE
    const entry = auditLogs.entries.first();
    if (entry && entry.target.id === message.author?.id && entry.createdTimestamp > (Date.now() - 5000)) {
      deleter = entry.executor.tag;
    }
  }

  const content = message.content || '[sem conteúdo]';
  const authorTag = message.author?.tag || 'Desconhecido';
  console.log(chalk.red('=== Mensagem Deletada ==='));
  console.log(`Conteúdo: ${content}`);
  console.log(`Autor: ${authorTag}`);
  console.log(`Deletado por: ${deleter}`);
  console.log('===========================');
});

// Login
client.login(process.env.TOKEN);
