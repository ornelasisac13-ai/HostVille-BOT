const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');

const TOKEN = process.env.TOKEN; // Certifique-se de setar a variável de ambiente TOKEN
const CLIENT_ID = '1473705296101900420'; // Seu client/application ID
const GUILD_ID = '928614664840052757';  // O ID do servidor que você mandou

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Comandos
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

client.on('clientReady', () => {
  console.log(`${client.user.tag} está online!`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'rule') {
    const embed = new EmbedBuilder()
      .setTitle('📜 REGRAS OFICIAIS - HOSTVILLE Greenville RP')
      .setDescription(`🔒 O descumprimento pode resultar em: ⚠️ Advertência | ❌ Kick | ⛔ Banimento
Respeite a simulação e colabore com a experiência de todos!

━━━━━━━━━━━━━━━━━━━━━━━  
🚦 **REGRAS DE TRÂNSITO**
- Obedeça os **limites de velocidade**: **Máx. 85 MPH**
- Respeite todas as **sinalizações**.
- Use **setas** ao virar ou mudar de faixa.
- Pare **completamente** em sinais **STOP** e **vermelhos**.

━━━━━━━━━━━━━━━━━━━━━━━  
⚖️ **LEIS GERAIS**
- ❌ É proibido: **vandalismo**, **roubo** ou **uso de armas** sem permissão da staff.
- 🚫 Não cause **caos em áreas públicas** sem combinar previamente com os envolvidos.

━━━━━━━━━━━━━━━━━━━━━━━  
🎭 **ROLEPLAY (RP)**
- ✅ Siga a **história do seu personagem** e respeite o RP dos outros.
- ⚠️ **Todo jogador deve criar uma história para seu personagem**: nome, profissão, personalidade, etc.
- ❌ Proibido:
  - **Trollar**
  - **Power-Gaming**
  - **Fail-RP**
- 🕒 Após **morte ou prisão**, aguarde **3 minutos** antes de retornar (NLR).

━━━━━━━━━━━━━━━━━━━━━━━  
💼 **TRABALHO E ECONOMIA**
- 👷‍♂️ **1 trabalho por sessão**. Respeite o **horário definido**.
- 💰 **Salários** só pelo **sistema oficial**.
- 🚫 **Proibido dar ou receber dinheiro** fora de eventos da staff.

━━━━━━━━━━━━━━━━━━━━━━━  
🗣️ **COMUNICAÇÃO**
- 🤝 Fale com **respeito**. Sem ofensas, spam ou discussões desnecessárias.
- 🎙️ Use **voz apenas em emergências**. Nada de flood.
- 📱 Para falar com alguém à distância, **use o telefone do jogo**.
- 💬 Para falar algo **fora do RP**, use // antes da frase

━━━━━━━━━━━━━━━━━━━━━━━  
🔔 **LEMBRETE FINAL**
> Estas regras existem para garantir uma experiência divertida, organizada e realista para todos os jogadores.
> 💡 Em caso de dúvidas, chame a staff ou abra um ticket.

🔗 [Termos de Serviço](https://nativo-00.gitbook.io/hostville-bot-terms/) | [Política de Privacidade](https://nativo-00.gitbook.io/hostville-bot-privacy-policy/)`)
      .setColor(0xFF8C00) // cor laranja, você pode trocar
      .setImage('https://image2url.com/r2/default/images/1771440901443-9e36d15c-9cfa-4869-a1f1-40f26367256f.jpg');

    await interaction.reply({ embeds: [embed], ephemeral: false });
  }

  if (interaction.commandName === 'info') {
    await interaction.reply({ content: 'Informações do servidor aqui!', ephemeral: false });
  }
});

client.login(TOKEN);
