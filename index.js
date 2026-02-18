// index.cjs (CommonJS)
const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');

const TOKEN = 'SEU_TOKEN_AQUI';
const CLIENT_ID = '1473705296101900420';
const GUILD_ID = '928614664840052757';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Comandos slash
const commands = [
  new SlashCommandBuilder()
    .setName('rule')
    .setDescription('Mostra as regras do Hostville!')
    .toJSON(),
  new SlashCommandBuilder()
    .setName('info')
    .setDescription('Informações do servidor')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

// Registrando comandos
(async () => {
  try {
    console.log('Registrando comandos...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('Comandos registrados com sucesso!');
  } catch (err) {
    console.error(err);
  }
})();

// Bot online
client.on('ready', () => {
  console.log(`${client.user.tag} está online!`);
});

// Interações
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'rule') {
    const embed = new EmbedBuilder()
      .setTitle('📜 REGRAS OFICIAIS - HOSTVILLE Greenville RP')
      .setDescription(`🔒 O descumprimento pode resultar em: ⚠️ Advertência | ❌ Kick | ⛔ Banimento  
Respeite a simulação e colabore com a experiência de todos!

━━━━━━━━━━━━━━━━━━━━━━━  
🚦 **REGRAS DE TRÂNSITO**  
- Máx. 85 MPH, siga sinais, use setas, pare no STOP.

⚖️ **LEIS GERAIS**  
- ❌ Sem vandalismo, roubo ou armas sem permissão.

🎭 **ROLEPLAY (RP)**  
- ✅ Siga a história do seu personagem.  
- ❌ Sem troll, powergaming ou fail-RP.

💼 **TRABALHO E ECONOMIA**  
- 👷‍♂️ 1 trabalho por sessão, salários só pelo sistema oficial.

🗣️ **COMUNICAÇÃO**  
- 🤝 Respeite todos, sem flood.  
- 📱 Para falar fora do RP, use // antes da frase.

🔗 [Termos](https://nativo-00.gitbook.io/hostville-bot-terms/) | [Política](https://nativo-00.gitbook.io/hostville-bot-privacy-policy/)`)
      .setColor(0xFF8C00)
      .setImage('https://image2url.com/r2/default/images/1771440901443-9e36d15c-9cfa-4869-a1f1-40f26367256f.jpg');

    await interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'info') {
    await interaction.reply({ content: 'Informações do servidor aqui!' });
  }
});

// Login
client.login(TOKEN);
