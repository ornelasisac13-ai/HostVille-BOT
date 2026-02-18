const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  SlashCommandBuilder, 
  REST, 
  Routes 
} = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1473705296101900420';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder()
    .setName('rule')
    .setDescription('Envia as regras'),

  new SlashCommandBuilder()
    .setName('info')
    .setDescription('Envia termos e política')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log('Comandos registrados.');
  } catch (error) {
    console.error(error);
  }
})();

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'rule') {
    const embed = new EmbedBuilder()
      .setColor(0x2B2D31)
      .setImage('https://image2url.com/r2/default/images/1771440901443-9e36d15c-9cfa-4869-a1f1-40f26367256f.jpg')
      .setDescription(`📜 **REGRAS OFICIAIS - HOSTVILLE Greenville RP**  
🔒 O descumprimento pode resultar em: ⚠️ Advertência | ❌ Kick | ⛔ Banimento  
Respeite a simulação e colabore com a experiência de todos!

━━━━━━━━━━━━━━━━━━━━━━━  
🚦 **REGRAS DE TRÂNSITO**
Obedeça os limites de velocidade: Máx. 85 MPH  
Respeite todas as sinalizações  
Use setas ao virar ou mudar de faixa  
Pare completamente em sinais STOP e vermelhos  

━━━━━━━━━━━━━━━━━━━━━━━  
⚖️ **LEIS GERAIS**
Proibido vandalismo, roubo ou uso de armas sem permissão da staff  
Não cause caos em áreas públicas  

━━━━━━━━━━━━━━━━━━━━━━━  
🎭 **ROLEPLAY (RP)**
Siga a história do seu personagem  
Proibido Troll, Power-Gaming e Fail-RP  
Após morte ou prisão aguarde 3 minutos  

━━━━━━━━━━━━━━━━━━━━━━━  
💼 **TRABALHO E ECONOMIA**
1 trabalho por sessão  
Salários apenas pelo sistema oficial  
Proibido dar dinheiro fora de eventos  

━━━━━━━━━━━━━━━━━━━━━━━  
🗣️ **COMUNICAÇÃO**
Sem ofensas ou spam  
Use // para falar fora do RP  

━━━━━━━━━━━━━━━━━━━━━━━  
🔔 Em caso de dúvidas, abra um ticket.`);

    await interaction.channel.send({ embeds: [embed] });
  }

  if (interaction.commandName === 'info') {
    const embed = new EmbedBuilder()
      .setColor(0x2B2D31)
      .setImage('https://image2url.com/r2/default/images/1771440901443-9e36d15c-9cfa-4869-a1f1-40f26367256f.jpg')
      .setDescription(`📄 **Termos e Política de Privacidade**

🔗 Política de Privacidade:
https://nativo-00.gitbook.io/hostville-bot-privacy-policy/

🔗 Termos de Uso:
https://nativo-00.gitbook.io/hostville-bot-terms/`);

    await interaction.channel.send({ embeds: [embed] });
  }
});

client.login(TOKEN);
