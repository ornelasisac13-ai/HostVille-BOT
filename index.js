// index.js - Parte 1
import { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel],
});

// Função para logar comandos com ASCII colorido
function logCommand(commandName) {
  const asciiArt = `
${chalk.green('=== Comando Registrado:')} ${chalk.cyan(commandName)}
`;
  console.log(asciiArt);
}

// Array de comandos
const commands = [];

// /rules
commands.push({
  data: {
    name: 'rules',
    description: 'Mostra as regras do servidor',
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

    await interaction.reply({ content: 'Comando executado com sucesso!', ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor('#FFFDD0')
      .setDescription(
        `**As regras gerais têm como objetivo garantir a ordem, o respeito e a boa convivência entre todos.**

➤ Ao participar do HostVille Greenville RP, você concorda em agir com educação, responsabilidade e bom senso.

━━━━━━━━━━━━━━━━━━━━

📘 **Para mais informações sobre as regras, acesse o documento abaixo:**

📚 [Regras](https://docs.google.com/document/d/1ZU-oLyI88HEB2RMDunr4NNF1nkGQ3BWmcyYagY0T3dk/edit?usp=drivesdk)

━━━━━━━━━━━━━━━━━━━━

🔗 **Documentos Oficiais**

📄 [Política de Privacidade](https://docs.google.com/document/d/1hoL-0AcJhrTXZAPIschLxoeF3kzAi7knTVPDXdT20nE/edit?usp=drivesdk)

📜 [Termos de Uso](https://docs.google.com/document/d/1ZrScgrEAb7NnBGZW1XLQvBRaGIDrzatq8XBjlVyYP_k/edit?usp=drivesdk)

━━━━━━━━━━━━━━━━━━━━
✨ Powered by Y2k_Nat`
      );

    await interaction.channel.send({ embeds: [embed] });

    const imageUrl = 'https://image2url.com/r2/default/images/1771466090995-ea6150ee-52be-4f03-953e-f6a41480320e.png';
    await interaction.channel.send({ content: imageUrl });
  },
});

// /serverinfo
commands.push({
  data: {
    name: 'serverinfo',
    description: 'Mostra informações do servidor',
    options: [
      {
        name: 'code',
        type: 3,
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

    const guild = interaction.guild;
    const info = `
Servidor: ${guild.name}
ID: ${guild.id}
Total de membros: ${guild.memberCount}
Criado em: ${guild.createdAt.toDateString()}
`;
    return interaction.reply({ content: info });
  },
});

// /adm
commands.push({
  data: {
    name: 'adm',
    description: 'Painel administrativo',
    options: [
      {
        name: 'code',
        type: 3,
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
  },
});
// index.js - Parte 2

// Listener para interações (comandos e botões)
client.on('interactionCreate', async (interaction) => {
  // Botões
  if (interaction.isButton()) {
    switch (interaction.customId) {
      case 'stats': {
        const uptimeSeconds = Math.floor(client.uptime / 1000);
        const embed = new EmbedBuilder()
          .setTitle('Estatísticas do Bot')
          .setColor('#00FF00')
          .addFields(
            { name: 'Ping', value: `${client.ws.ping}ms`, inline: true },
            { name: 'Uptime', value: `${Math.floor(uptimeSeconds/3600)}h ${Math.floor((uptimeSeconds%3600)/60)}m ${uptimeSeconds%60}s`, inline: true },
            { name: 'Servidores', value: `${client.guilds.cache.size}`, inline: true },
            { name: 'Usuários', value: `${client.users.cache.size}`, inline: true }
          );
        await interaction.reply({ embeds: [embed], ephemeral: true });
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
    return;
  }

  // Comandos
  if (interaction.isChatInputCommand()) {
    const command = commands.find(c => c.data.name === interaction.commandName);
    if (!command) return;

    const userTag = interaction.user.tag;
    console.log(chalk.magenta(`[COMANDO EXECUTADO] ${userTag} -> /${interaction.commandName}`));

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(chalk.red(`[ERRO] ao executar /${interaction.commandName}:`), err);
      if (!interaction.replied) {
        await interaction.reply({ content: 'Ocorreu um erro.', ephemeral: true });
      }
    }
  }
});

// Listener de mensagens apagadas
client.on('messageDelete', async (message) => {
  const authorTag = message.author ? message.author.tag : 'Desconhecido';
  const deleterTag = message.guild
    ? (await message.guild.fetchAuditLogs({ type: 72, limit: 1 })
        .then(logs => logs.entries.first()?.executor?.tag || 'Desconhecido')
        .catch(() => 'Desconhecido'))
    : 'Desconhecido';
  console.log(chalk.yellow('=== MENSAGEM APAGADA ==='));
  console.log(`Conteúdo: ${message.content}`);
  console.log(`Autor: ${authorTag}`);
  console.log(`Apagado por: ${deleterTag}`);
  console.log('=========================');
});

// Quando o bot estiver pronto
client.once('ready', async () => {
  console.log(chalk.yellow('Bot está online!'));

  // Log de comandos registrados
  for (const cmd of commands) {
    logCommand(cmd.data.name);
  }

  // Registrar comandos em guild específica (HostVille)
  const GUILD_ID = '928614664840052757'; // Coloque seu Guild ID
  const guild = client.guilds.cache.get(GUILD_ID);
  if (guild?.commands) {
    await guild.commands.set(commands.map(c => c.data));
    console.log(chalk.green('Comandos registrados na guild HostVille.'));
  } else {
    console.warn(chalk.red('Guild não encontrada, comandos não registrados.'));
  }
});

// Login do bot
client.login(process.env.TOKEN);
