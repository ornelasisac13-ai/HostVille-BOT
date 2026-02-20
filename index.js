// index.js
import { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const TOKEN = process.env.TOKEN;
const ACCESS_CODE = process.env.ACCESS_CODE;

if (!TOKEN || !ACCESS_CODE) {
  console.error(chalk.red('⚠️ TOKEN ou ACCESS_CODE não definidos no .env'));
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// Função de log de comandos no console
function logCommand(commandName) {
  console.log(`
${chalk.green('=== Comando Registrado:')} ${chalk.cyan(commandName)}
`);
}

// Array de comandos
const commands = [];

// /rules
commands.push({
  data: {
    name: 'rules',
    description: 'Mostra as regras do servidor',
    options: [
      { name: 'code', type: 3, description: 'Senha de acesso', required: true },
    ],
  },
  async execute(interaction) {
    const code = interaction.options.getString('code');
    if (code !== ACCESS_CODE) return interaction.reply({ content: 'Código incorreto!', ephemeral: true });

    await interaction.reply({ content: 'Comando executado com sucesso!', ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor('#FFFDD0')
      .setDescription(`**As regras gerais têm como objetivo garantir a ordem e o respeito.**

➤ Ao participar do HostVille Greenville RP, você concorda em agir com educação, responsabilidade e bom senso.

━━━━━━━━━━━━━━━━━━━━

📘 **Mais informações:** [Regras](https://docs.google.com/document/d/1ZU-oLyI88HEB2RMDunr4NNF1nkGQ3BWmcyYagY0T3dk/edit?usp=drivesdk)

━━━━━━━━━━━━━━━━━━━━

🔗 **Documentos Oficiais**
📄 [Política de Privacidade](https://docs.google.com/document/d/1hoL-0AcJhrTXZAPIschLxoeF3kzAi7knTVPDXdT20nE/edit?usp=drivesdk)
📜 [Termos de Uso](https://docs.google.com/document/d/1ZrScgrEAb7NnBGZW1XLQvBRaGIDrzatq8XBjlVyYP_k/edit?usp=drivesdk)

━━━━━━━━━━━━━━━━━━━━
✨ Powered by Y2k_Nat`);

    await interaction.channel.send({ embeds: [embed] });
    await interaction.channel.send({ content: 'https://image2url.com/r2/default/images/1771466090995-ea6150ee-52be-4f03-953e-f6a41480320e.png' });
  },
});

// /serverinfo
commands.push({
  data: {
    name: 'serverinfo',
    description: 'Mostra informações do servidor',
    options: [
      { name: 'code', type: 3, description: 'Senha de acesso', required: true },
    ],
  },
  async execute(interaction) {
    const code = interaction.options.getString('code');
    if (code !== ACCESS_CODE) return interaction.reply({ content: 'Código incorreto!', ephemeral: true });

    const guild = interaction.guild;
    return interaction.reply(`
Servidor: ${guild.name}
ID: ${guild.id}
Total de membros: ${guild.memberCount}
Criado em: ${guild.createdAt.toDateString()}
`);
  },
});

// /adm
commands.push({
  data: {
    name: 'adm',
    description: 'Painel administrativo',
    options: [
      { name: 'code', type: 3, description: 'Senha de acesso', required: true },
    ],
  },
  async execute(interaction) {
    const code = interaction.options.getString('code');
    if (code !== ACCESS_CODE) return interaction.reply({ content: 'Código incorreto!', ephemeral: true });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('stats').setLabel('Estatísticas').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('console').setLabel('Enviar para console').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ content: 'Painel Administrativo:', components: [row], ephemeral: true });
  },
});

// Parte 1 termina aqui 
// Listener para interações de comandos e botões
client.on('interactionCreate', async (interaction) => {
  try {
    // Comandos Slash
    if (interaction.isChatInputCommand()) {
      const command = commands.find(c => c.data.name === interaction.commandName);
      if (!command) return interaction.reply({ content: 'Comando não encontrado.', ephemeral: true });
      await command.execute(interaction);
    }

    // Botões do /adm
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
          console.log(chalk.yellow('=== Estatísticas do Bot ==='));
          console.log(`Ping: ${client.ws.ping}ms`);
          console.log(`Uptime: ${Math.floor(client.uptime / 3600000)}h`);
          console.log(`Servidores: ${client.guilds.cache.size}`);
          console.log(`Usuários: ${client.users.cache.size}`);
          console.log(chalk.yellow('==========================='));
          await interaction.reply({ content: 'Estatísticas enviadas ao console!', ephemeral: true });
          break;
        }
      }
    }
  } catch (err) {
    console.error(chalk.red('Erro ao processar interação:'), err);
    if (!interaction.replied) {
      interaction.reply({ content: 'Ocorreu um erro ao processar o comando.', ephemeral: true });
    }
  }
});

// Quando o bot estiver pronto
client.once('ready', async () => {
  console.log(chalk.yellow('Bot está online!'));

  // Log de comandos registrados
  for (const cmd of commands) logCommand(cmd.data.name);

  // Registrar comandos apenas na guild específica
  const GUILD_ID = '928614664840052757'; // ID do servidor
  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) {
    console.error(chalk.red(`⚠️ Não consegui encontrar a guild com ID ${GUILD_ID}`));
    return;
  }

  try {
    await guild.commands.set(commands.map(c => c.data));
    console.log(chalk.green('✅ Comandos registrados na guild com sucesso!'));
  } catch (err) {
    console.error(chalk.red('Erro ao registrar comandos na guild:'), err);
  }
});

// Login do bot
client.login(TOKEN);
