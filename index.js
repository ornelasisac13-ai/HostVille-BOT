import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import chalk from 'chalk';
import os from 'os';

// ==================== CONFIG ====================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1473705296101900420";
const GUILD_ID = "928614664840052757";
const ACCESS_CODE = process.env.ACCESS_CODE;

if (!TOKEN || !ACCESS_CODE) {
  console.log(chalk.red("❌ TOKEN ou ACCESS_CODE não definido!"));
  process.exit(1);
}

// ==================== CLIENT ====================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences
  ],
  presence: { activities: [{ name: '/rule | /info | /restart', type: 0 }], status: 'online' }
});

// ==================== STATS ====================
const stats = {
  totalCommands: 0,
  commandsUsed: {},
  errors: 0,
  restarts: 0,
  startTime: Date.now()
};

// ==================== MONITOR ====================
function getMemory() {
  const m = process.memoryUsage();
  return { rss: (m.rss / 1024 / 1024).toFixed(2), heapUsed: (m.heapUsed / 1024 / 1024).toFixed(2), heapTotal: (m.heapTotal / 1024 / 1024).toFixed(2) };
}

function getCPU() {
  const cpus = os.cpus();
  let idle = 0, total = 0;
  cpus.forEach(cpu => { for (const t in cpu.times) total += cpu.times[t]; idle += cpu.times.idle; });
  return { cores: cpus.length, usage: (100 - (idle / total * 100)).toFixed(1) };
}

function getUptime() {
  const ms = Date.now() - stats.startTime;
  const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
  return `${d}d ${h}h ${m}m ${s}s`;
}

// ==================== LOGGER ====================
const log = {
  info: msg => console.log(chalk.cyan(`[INFO] ${msg}`)),
  success: msg => console.log(chalk.green(`[OK] ${msg}`)),
  warn: msg => console.log(chalk.yellow(`[AVISO] ${msg}`)),
  error: msg => { stats.errors++; console.log(chalk.red(`[ERRO] ${msg}`)); },
  cmd: (cmd, user, guild) => {
    stats.totalCommands++;
    stats.commandsUsed[cmd] = (stats.commandsUsed[cmd] || 0) + 1;
    console.log(chalk.magenta(`[CMD] /${cmd} por ${user}${guild ? ` em ${guild}` : ''}`));
  },
  ascii: () => {
    console.log(chalk.cyan("\n╔════════════════════════════════════╗"));
    console.log(chalk.cyan("║") + chalk.white("  HostVille • BOT") + chalk.cyan(" ║"));
    console.log(chalk.cyan("╚════════════════════════════════════╝\n"));
  }
};

// ==================== COMANDOS SLASH ====================
const commands = [
  new SlashCommandBuilder().setName('rule').setDescription('Exibe as regras do servidor')
    .addStringOption(o => o.setName('code').setDescription('Código de acesso').setRequired(true)),
  new SlashCommandBuilder().setName('info').setDescription('Mostra informações do bot'),
  new SlashCommandBuilder().setName('restart').setDescription('Reinicia o bot')
    .addStringOption(o => o.setName('code').setDescription('Código de acesso').setRequired(true))
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    log.success('Comandos registrados no servidor!');
  } catch (err) { log.error('Erro ao registrar comandos: ' + err); }
}

// ==================== CLIENT READY ====================
client.once('clientReady', async () => {
  log.ascii();
  log.success('🤖 BOT ONLINE');
  log.info(`Tag: ${client.user.tag}`);
  log.info(`ID: ${client.user.id}`);
  log.info(`Bem-vindo Isac!`);
  log.info(`Seu bot está com ${stats.errors === 0 ? "sem erros" : stats.errors + " erros"}.`);
  await registerCommands();
});

// ==================== INTERACTIONS ====================
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName, user, guild } = interaction;
  log.cmd(commandName, user.tag, guild?.name);

  // ====== /RULE ======
  if (commandName === 'rule') {
    const code = interaction.options.getString('code');
    if (code !== ACCESS_CODE) return interaction.reply({ content: "❌ Código inválido!", flags: 64 });
    await interaction.deferReply({ flags: 64 });
    const embed = new EmbedBuilder()
      .setColor(0x89CFF0)
      .setTitle("📜 Regras - HostVille Greenville RP")
      .setDescription(`
As regras gerais têm como objetivo garantir a ordem, o respeito e a boa convivência entre todos.

➤ Ao participar do HostVille Greenville RP, você concorda em agir com educação, responsabilidade e bom senso.

━━━━━━━━━━━━━━━━━━━━

📘 **Para mais informações sobre as regras, acesse o documento abaixo:**

📚 [Regras](https://docs.google.com/document/d/1ZU-oLyI88HEB2RMDunr4NNF1nkGQ3BWmcyYagY0T3dk/edit?usp=drivesdk)

━━━━━━━━━━━━━━━━━━━━

🔗 **Documentos Oficiais**

📄 [Política de Privacidade](https://docs.google.com/document/d/1hoL-0AcJhrTXZAPIschLxoeF3kzAi7knTVPDXdT20nE/edit?usp=drivesdk)

📜 [Termos de Uso](https://docs.google.com/document/d/1ZrScgrEAb7NnBGZW1XLQvBRaGIDrzatq8XBjlVyYP_k/edit?usp=drivesdk)

━━━━━━━━━━━━━━━━━━━━
✨ Powered by Y2k_Nat
`)
      .setImage("https://image2url.com/r2/default/images/1771466090995-ea6150ee-52be-4f03-953e-f6a41480320e.png");
    await interaction.channel.send({ embeds: [embed] });
    await interaction.deleteReply();
  }

  // ====== /INFO ======
  if (commandName === 'info') {
    const online = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
    const offline = guild.memberCount - online;
    const embed = new EmbedBuilder()
      .setColor(0x89CFF0)
      .setTitle("🤖 Informações do Bot")
      .addFields(
        { name: "Nome", value: client.user.tag, inline: true },
        { name: "ID", value: client.user.id, inline: true },
        { name: "Servidores", value: `${client.guilds.cache.size}`, inline: true },
        { name: "Online", value: `${online}`, inline: true },
        { name: "Offline", value: `${offline}`, inline: true },
        { name: "Ping", value: `${client.ws.ping}ms`, inline: true },
        { name: "Uptime", value: getUptime(), inline: true }
      )
      .setFooter({ text: "HostVille Greenville RP" });
    await interaction.reply({ embeds: [embed], flags: 64 });
  }

  // ====== /RESTART ======
  if (commandName === 'restart') {
    const code = interaction.options.getString('code');
    if (code !== ACCESS_CODE) return interaction.reply({ content: "❌ Código inválido!", flags: 64 });
    await interaction.reply({ content: "⚠️ Reiniciando bot...", flags: 64 });
    stats.restarts++;
    client.destroy();
    setTimeout(() => client.login(TOKEN), 3000);
  }
});

// ==================== EVENTOS ====================
client.on('guildMemberAdd', member => log.info(`👋 ${member.user.tag} entrou no servidor (${member.guild.name})`));
client.on('guildMemberRemove', member => log.warn(`👋 ${member.user.tag} saiu do servidor (${member.guild.name})`));
client.on('messageDelete', msg => {
  if (msg.author.bot) return;
  log.warn(`❗️ ${msg.author.tag} apagou uma mensagem: "${msg.content}"`);
});

client.login(TOKEN);
process.on('unhandledRejection', r => log.error(`Rejeição não tratada: ${r}`));
process.on('uncaughtException', e => log.error(`Exceção não tratada: ${e}`));
