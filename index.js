import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';

// Variáveis do bot
const TOKEN = process.env.TOKEN; // Seu token definido como variável de ambiente
const CLIENT_ID = '1473705296101900420'; // Seu Client ID
const GUILD_ID = 'SUA_GUILD_ID_AQUI'; // Substitua pelo ID do seu servidor

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Comandos do bot
const commands = [
  new SlashCommandBuilder()
    .setName('rule')
    .setDescription('Mostra as regras do servidor'),
  new SlashCommandBuilder()
    .setName('info')
    .setDescription('Mostra os links de Termos e Política de Privacidade')
].map(cmd => cmd.toJSON());

// Registrar comandos
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Registrando comandos...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('Comandos registrados!');
  } catch (error) {
    console.error(error);
  }
})();

// Evento de inicialização
client.on('ready', () => {
  console.log(`${client.user.tag} está online!`);
});

// Resposta aos comandos
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'rule') {
    await interaction.reply(`📜 **REGRAS OFICIAIS - HOSTVILLE Greenville RP**  
🔒 O descumprimento pode resultar em: ⚠️ Advertência | ❌ Kick | ⛔ Banimento  
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
  - **Trollar** (atrapalhar intencionalmente)
  - **Power-Gaming** (forçar ações irreais/injustas)
  - **Fail-RP** (quebrar a lógica do RP)
- 🕒 Após **morte ou prisão**, aguarde **3 minutos** antes de retornar (NLR - New Life Rule).

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
- 💬 Para falar algo **fora do RP**, use \`//\` antes da frase.  
  *Exemplo:* \`// minha internet caiu rapidão\`

━━━━━━━━━━━━━━━━━━━━━━━  
🔔 **LEMBRETE FINAL**
> Estas regras existem para garantir uma experiência divertida, organizada e realista para todos os jogadores.  
> 💡 Em caso de dúvidas, chame a staff ou abra um ticket.`);
  }

  if (interaction.commandName === 'info') {
    await interaction.reply(`📄 **Termos e Política de Privacidade:**  
- Termos: [https://nativo-00.gitbook.io/hostville-bot-terms/](https://nativo-00.gitbook.io/hostville-bot-terms/)  
- Política de Privacidade: [https://nativo-00.gitbook.io/hostville-bot-privacy-policy/](https://nativo-00.gitbook.io/hostville-bot-privacy-policy/)`);
  }
});

// Login do bot
client.login(TOKEN);
