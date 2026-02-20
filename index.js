// index.js
import { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.MessageDelete, // necessário para deletar mensagens
  ],
  partials: [Partials.Channel, Partials.Message],
});

// Função para logar eventos
function logEvent(title, content) {
  console.log(chalk.green(`=== ${title} ===`));
  console.log(content);
  console.log(chalk.green('===================\n'));
}

// Comando /adm
const commands = [
  {
    data: {
      name: 'adm',
      description: 'Painel Administrativo',
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
        return interaction.reply({ content: 'Código incorreto!', flags: 64 });
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

      await interaction.reply({ content: 'Painel Administrativo:', components: [row], flags: 64 });
    },
  },
];

// Registrar comandos no Discord
client.once('ready', async () => {
  console.log(chalk.yellow('Bot online! Registrando comando /adm...'));
  if (client.application?.commands) {
    await client.application.commands.set(commands.map(c => c.data));
    console.log(chalk.green('Comando /adm registrado com sucesso!'));
  }
});
// Interações de botões
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  switch (interaction.customId) {
    case 'stats': {
      const guild = interaction.guild;
      const uptimeSeconds = Math.floor(client.uptime / 1000);
      const embed = new EmbedBuilder()
        .setTitle('Estatísticas do Bot')
        .setColor('#00FF00')
        .addFields(
          { name: 'Servidor', value: `${guild.name}`, inline: true },
          { name: 'Criado em', value: `${guild.createdAt.toDateString()}`, inline: true },
          { name: 'Total de membros', value: `${guild.memberCount}`, inline: true },
          { name: 'Ping', value: `${client.ws.ping}ms`, inline: true },
          { name: 'Uptime', value: `${Math.floor(uptimeSeconds/3600)}h ${Math.floor((uptimeSeconds%3600)/60)}m ${uptimeSeconds%60}s`, inline: true }
        );
      await interaction.reply({ embeds: [embed], flags: 64 });
      break;
    }
    case 'console': {
      const guild = interaction.guild;
      const uptimeSeconds = Math.floor(client.uptime / 1000);
      console.log('=== Estatísticas do Bot ===');
      console.log(`Servidor: ${guild.name}`);
      console.log(`Criado em: ${guild.createdAt}`);
      console.log(`Total de membros: ${guild.memberCount}`);
      console.log(`Ping: ${client.ws.ping}ms`);
      console.log(`Uptime: ${Math.floor(uptimeSeconds/3600)}h ${Math.floor((uptimeSeconds%3600)/60)}m ${uptimeSeconds%60}s`);
      console.log('===========================');
      await interaction.reply({ content: 'Estatísticas enviadas ao console!', flags: 64 });
      break;
    }
  }
});

// Listener de mensagens deletadas
client.on('messageDelete', async (message) => {
  const author = message.author ? `${message.author.tag} (${message.author.id})` : 'Desconhecido';
  const content = message.content ? message.content : '[Conteúdo não disponível]';
  logEvent('Mensagem Apagada', `Autor: ${author}\nCanal: ${message.channel.name}\nConteúdo: ${content}`);
});

// Login do bot
client.login(process.env.TOKEN);
