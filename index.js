import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';

// ==== CONFIGURAÇÃO ====
// Coloque aqui seu token
const TOKEN = 'SEU_TOKEN_AQUI';
const CLIENT_ID = '1473705296101900420';

// Comandos do bot
const commands = [
  new SlashCommandBuilder()
    .setName('rule')
    .setDescription('Envia as regras do servidor'),
  new SlashCommandBuilder()
    .setName('info')
    .setDescription('Mostra informações do servidor')
].map(cmd => cmd.toJSON());

// ==== REGISTRO DOS COMANDOS ====
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Registrando comandos...');
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log('Comandos registrados com sucesso!');
  } catch (err) {
    console.error(err);
  }
})();

// ==== CLIENTE DO BOT ====
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
  console.log(`Bot online! Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // Só permitir admins
  if (!interaction.member.permissions.has('Administrator')) {
    return interaction.reply({ content: 'Você não tem permissão para usar este comando.', ephemeral: true });
  }

  if (interaction.commandName === 'rule') {
    await interaction.reply('📜 **Regras do servidor:**\n1. Seja respeitoso\n2. Nada de spam\n3. Divirta-se!');
  }

  if (interaction.commandName === 'info') {
    await interaction.reply('ℹ️ **Informações do servidor:**\nServidor de exemplo para o bot HostVille.');
  }
});

client.login(TOKEN);
