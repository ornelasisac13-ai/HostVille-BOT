import 'dotenv/config';
import { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, REST, Routes } from 'discord.js';

// === CONFIGURAÇÃO ===
const token = process.env.TKD; // TKD = variável do token no Railway
const guildId = '928614664840052757'; // sua guild
const clientId = '1473705296101900420'; // id do bot
const embedColor = 0xD3AF37;
const rulesImage = 'https://image2url.com/r2/default/images/1771434058556-31be1385-d620-4c2d-a19d-54ce3c9acd6f.jpg';

// === CLIENT ===
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', () => {
  console.log(`🚀 Bot online: ${client.user.tag}`);
});

// === SLASH COMMANDS ===
const commands = [
  new SlashCommandBuilder()
    .setName('info')
    .setDescription('Mostra informações do bot'),
  new SlashCommandBuilder()
    .setName('rule')
    .setDescription('Mostra as regras do servidor')
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Registrando comandos...');
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands.map(cmd => cmd.toJSON()) }
    );
    console.log('Comandos registrados com sucesso!');
  } catch (err) {
    console.error(err);
  }
})();

// === INTERAÇÕES ===
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'info') {
    const uptime = Math.floor(client.uptime / 1000);
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;

    const embed = new EmbedBuilder()
      .setTitle('ℹ️ HostVille Bot Info')
      .setColor(embedColor)
      .setDescription(
        `**Online:** ${client.guilds.cache.get(guildId)?.memberCount ?? '0'}\n` +
        `**Servidores:** ${client.guilds.cache.size}\n` +
        `**Uptime:** ${days}d ${hours}h ${minutes}m ${seconds}s\n` +
        `**Powered by:** Y2k_Nat`
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (interaction.commandName === 'rule') {
    const embed = new EmbedBuilder()
      .setTitle('📜 Regras e Diretrizes - HostVille Greenville RP')
      .setColor(embedColor)
      .setDescription(
        `As regras gerais têm como objetivo garantir a ordem, o respeito e a boa convivência entre todos.\n` +
        `➤ Ao participar de HostVille Greenville RP, você concorda em agir com educação, responsabilidade e bom senso, respeitando os demais jogadores, a staff e as diretrizes do servidor.\n\n` +
        `🤖 AutoMod\n` +
        `Para garantir um ambiente seguro, organizado e agradável para todos, o HostVille conta com um sistema AutoMod ativo 24 horas por dia.\n` +
        `Ele atua de forma automática na prevenção de spam, flood, palavras proibidas, links suspeitos e comportamentos que fogem das regras da comunidade.\n\n` +
        `⚠️ Blacklist\n` +
        `Estar na blacklist significa a proibição total de participação no servidor, incluindo acesso ao Discord, eventos, roleplays e qualquer atividade vinculada à HostVille.\n` +
        `Práticas que podem levar à blacklist:\n` +
        `• Tentativas de burlar regras ou punições\n` +
        `• Uso de exploits, bugs ou vantagens indevidas\n` +
        `• Contas alternativas para contornar sanções\n` +
        `• Atitudes que prejudiquem o servidor ou a comunidade\n\n` +
        `🔒 Segurança e Integridade\n` +
        `Não será tolerado qualquer forma de burlar, contornar ou violar as regras e diretrizes estabelecidas pelo Discord ou pelo próprio servidor.\n\n` +
        `✅ Regras Oficiais - HostVille Greenville RP\n` +
        `O descumprimento pode resultar em: ⚠️ Advertência | ❌ Kick | ⛔ Banimento\n` +
        `Respeite a simulação e colabore com a experiência de todos!\n\n` +
        `🚦 Regras de Trânsito\n` +
        `• Obedeça os limites de velocidade: Máx. 85 MPH\n` +
        `• Respeite todas as sinalizações\n` +
        `• Use setas ao virar ou mudar de faixa\n` +
        `• Pare completamente em sinais STOP e vermelhos\n\n` +
        `⚖️ Leis Gerais\n` +
        `• ❌ É proibido: vandalismo, roubo ou uso de armas sem permissão da staff\n` +
        `• 🚫 Não cause caos em áreas públicas sem combinar previamente com os envolvidos\n\n` +
        `🎭 Roleplay (RP)\n` +
        `• ✅ Siga a história do seu personagem e respeite o RP dos outros\n` +
        `• ⚠️ Todo jogador deve criar uma história para seu personagem: nome, profissão, personalidade, etc.\n` +
        `• ❌ Proibido:\n` +
        `  • Trollar (atrapalhar intencionalmente)\n` +
        `  • Power-Gaming (forçar ações irreais/injustas)\n` +
        `  • Fail-RP (quebrar a lógica do RP)\n` +
        `• 🕒 Após morte ou prisão, aguarde 3 minutos antes de retornar (NLR - New Life Rule)\n\n` +
        `💼 Trabalho e Economia\n` +
        `• 👷‍♂️ 1 trabalho por sessão. Respeite o horário definido\n` +
        `• 💰 Salários só pelo sistema oficial\n` +
        `• 🚫 Proibido dar ou receber dinheiro fora de eventos da staff\n\n` +
        `🗣️ Comunicação\n` +
        `• 🤝 Fale com respeito. Sem ofensas, spam ou discussões desnecessárias\n` +
        `• 🎙️ Use voz apenas em emergências. Nada de flood\n` +
        `• 📱 Para falar com alguém à distância, use o telefone do jogo\n` +
        `• 💬 Para falar algo fora do RP, use // antes da frase\n` +
        `Exemplo: // minha internet caiu rapidão`
      )
      .setImage(rulesImage);

    await interaction.reply({ embeds: [embed], ephemeral: true });
    await interaction.followUp({ content: 'O comando foi executado com sucesso!', ephemeral: true });
  }
});

// === LOGIN ===
client.login(token);
