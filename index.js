import { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, Routes } from 'discord.js';
import { config } from 'dotenv';
import { REST } from '@discordjs/rest';

config(); // Carrega .env

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

const TOKEN = process.env.TKD;
const CLIENT_ID = '1473705296101900420';
const GUILD_ID = '928614664840052757';

// Registro de comandos
const commands = [
  new SlashCommandBuilder().setName('rules').setDescription('Mostra todas as regras do servidor HostVille'),
  new SlashCommandBuilder().setName('info').setDescription('Mostra informações sobre o bot'),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Registrando comandos...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('Comandos registrados com sucesso!');
  } catch (err) {
    console.error('Erro ao registrar comandos:', err);
  }
})();

client.once('ready', () => {
  console.log(`🚀 Bot online: ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'rules') {
    const embed = new EmbedBuilder()
      .setTitle('📜 Regras e Diretrizes - HostVille Greenville RP')
      .setDescription(`As regras gerais têm como objetivo garantir a ordem, o respeito e a boa convivência entre todos.
➤ Ao participar de HostVille Greenville RP, você concorda em agir com educação, responsabilidade e bom senso, respeitando os demais jogadores, a staff e as diretrizes do servidor.

🤖 AutoMod
Para garantir um ambiente seguro, organizado e agradável para todos, o HostVille conta com um sistema AutoMod ativo 24 horas por dia.
Ele atua de forma automática na prevenção de spam, flood, palavras proibidas, links suspeitos e comportamentos que fogem das regras da comunidade.

⚠️ Blacklist
Estar na blacklist significa a proibição total de participação no servidor, incluindo acesso ao Discord, eventos, roleplays e qualquer atividade vinculada à HostVille, seja de forma direta ou indireta.
Práticas que podem levar à blacklist:
• Tentativas de burlar regras ou punições
• Uso de exploits, bugs ou vantagens indevidas
• Contas alternativas para contornar sanções
• Atitudes que prejudiquem o servidor ou a comunidade

🔒 Segurança e Integridade
Não será tolerado qualquer forma de burlar, contornar ou violar as regras e diretrizes estabelecidas pelo Discord ou pelo próprio servidor.
Qualquer prática que envolva exploits, uso de bugs, contas alternativas para vantagem indevida, automações ilegais ou qualquer outro meio que viole as regras é estritamente proibida.

✅ Regras Oficiais - HostVille Greenville RP
O descumprimento pode resultar em: ⚠️ Advertência | ❌ Kick | ⛔ Banimento
Respeite a simulação e colabore com a experiência de todos!

🚦 Regras de Trânsito
• Obedeça os limites de velocidade: Máx. 85 MPH
• Respeite todas as sinalizações
• Use setas ao virar ou mudar de faixa
• Pare completamente em sinais STOP e vermelhos

⚖️ Leis Gerais
• ❌ É proibido: vandalismo, roubo ou uso de armas sem permissão da staff
• 🚫 Não cause caos em áreas públicas sem combinar previamente com os envolvidos

🎭 Roleplay (RP)
• ✅ Siga a história do seu personagem e respeite o RP dos outros
• ⚠️ Todo jogador deve criar uma história para seu personagem: nome, profissão, personalidade, etc.
• ❌ Proibido: Trollar, Power-Gaming, Fail-RP
• 🕒 Após morte ou prisão, aguarde 3 minutos antes de retornar (NLR - New Life Rule)

💼 Trabalho e Economia
• 👷‍♂️ 1 trabalho por sessão. Respeite o horário definido
• 💰 Salários só pelo sistema oficial
• 🚫 Proibido dar ou receber dinheiro fora de eventos da staff

🗣️ Comunicação
• 🤝 Fale com respeito. Sem ofensas, spam ou discussões desnecessárias
• 🎙️ Use voz apenas em emergências. Nada de flood
• 📱 Para falar com alguém à distância, use o telefone do jogo
• 💬 Para falar algo fora do RP, use // antes da frase

🔗 Links importantes:
• Privacy Policy: https://nativo-00.gitbook.io/hostville-bot-privacy-policy/
• Terms of Service: https://nativo-00.gitbook.io/hostville-bot-terms/`)
      .setColor(0x00AE86)
      .setImage('https://image2url.com/r2/default/images/1771434058556-31be1385-d620-4c2d-a19d-54ce3c9acd6f.jpg');

    await interaction.reply({ embeds: [embed], ephemeral: false });
  }

  if (interaction.commandName === 'info') {
    const uptime = Math.floor(client.uptime / 1000); // segundos
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;

    const guild = client.guilds.cache.get(GUILD_ID);
    const onlineCount = guild?.members.cache.filter(m => m.presence?.status === 'online').size || 0;
    const totalCount = guild?.memberCount || 0;

    const embed = new EmbedBuilder()
      .setTitle('🤖 Informações do Bot - HostVille')
      .setDescription(`**Online:** ${onlineCount}\n**Total de membros:** ${totalCount}\n**Uptime:** ${days}d ${hours}h ${minutes}m ${seconds}s\n**Powered by:** Y2k_Nat`)
      .setColor(0x00AE86);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

client.login(TOKEN);
