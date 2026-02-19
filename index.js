const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const chalk = require('chalk');
const os = require('os');

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
  startTime: Date.now(),
  lastRestart: null,
  lastAction: "Nenhuma ação ainda"
};

// ==================== MONITOR ====================
function getMemory() {
  const m = process.memoryUsage();
  return { 
    rss: (m.rss / 1024 / 1024).toFixed(2), 
    heapUsed: (m.heapUsed / 1024 / 1024).toFixed(2), 
    heapTotal: (m.heapTotal / 1024 / 1024).toFixed(2) 
  };
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

function getTime() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function getLastRestart() {
  if (!stats.lastRestart) return "Nunca";
  const date = new Date(stats.lastRestart);
  return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

// ==================== LOGGER ====================
const log = {
  info: msg => console.log(chalk.gray(`[${getTime()}]`) + chalk.cyan(` [INFO] `) + msg),
  success: msg => console.log(chalk.gray(`[${getTime()}]`) + chalk.green(` [OK]   `) + msg),
  warn: msg => console.log(chalk.gray(`[${getTime()}]`) + chalk.yellow(` [AVISO]`) + msg),
  error: msg => { stats.errors++; console.log(chalk.gray(`[${getTime()}]`) + chalk.red(` [ERRO] `) + msg); },
  
  cmd: (cmd, user, guild) => {
    stats.totalCommands++;
    stats.commandsUsed[cmd] = (stats.commandsUsed[cmd] || 0) + 1;
    stats.lastAction = `/${cmd} por ${user}`;
    const botName = client.user ? client.user.username : 'Unknown';
    console.log(chalk.gray(`[${getTime()}]`) + chalk.magenta(` [CMD]  `) + chalk.yellow(`⚠️ ${user} executou /${cmd} com o bot ${botName}`) + (guild ? chalk.gray(` em ${guild}`) : ''));
  },
  
  memberJoin: (user, guild) => {
    stats.lastAction = `Entrada: ${user}`;
    console.log(chalk.gray(`[${getTime()}]`) + chalk.green(` [JOIN] `) + chalk.white(`${user} entrou no servidor`) + chalk.gray(` (${guild})`));
  },
  
  memberLeave: (user, guild) => {
    stats.lastAction = `Saída: ${user}`;
    console.log(chalk.gray(`[${getTime()}]`) + chalk.red(` [LEFT] `) + chalk.white(`${user} saiu do servidor`) + chalk.gray(` (${guild})`));
  },
  
  msgDelete: (user, content, guild) => {
    if (!content) return;
    const truncated = content.length > 50 ? content.substring(0, 50) + '...' : content;
    stats.lastAction = `Msg apagada por ${user}`;
    console.log(chalk.gray(`[${getTime()}]`) + chalk.red(` [DEL]  `) + chalk.yellow(`⚠️ ${user} apagou a mensagem:`) + chalk.gray(` "${truncated}"`) + (guild ? chalk.gray(` em ${guild}`) : ''));
  },
  
  msgEdit: (user, oldContent, newContent, guild) => {
    if (!oldContent || !newContent) return;
    const oldTrunc = oldContent.length > 30 ? oldContent.substring(0, 30) + '...' : oldContent;
    const newTrunc = newContent.length > 30 ? newContent.substring(0, 30) + '...' : newContent;
    stats.lastAction = `Msg editada por ${user}`;
    console.log(chalk.gray(`[${getTime()}]`) + chalk.blue(` [EDIT] `) + chalk.yellow(`⚠️ ${user} editou a mensagem em ${guild}:`) + chalk.gray(` "${oldTrunc}" ➜ "${newTrunc}"`));
  },
  
  ban: (user, reason, guild) => {
    const reasonText = reason || "Sem motivo";
    stats.lastAction = `Ban: ${user}`;
    console.log(chalk.gray(`[${getTime()}]`) + chalk.red(` [BAN]  `) + chalk.yellow(`⚠️ ${user} foi banido do ${guild}`) + chalk.gray(` - Motivo: ${reasonText}`));
  },
  
  unban: (user, guild) => {
    stats.lastAction = `Unban: ${user}`;
    console.log(chalk.gray(`[${getTime()}]`) + chalk.green(` [UNBAN]`) + chalk.yellow(`⚠️ ${user} foi desbanido do ${guild}`));
  },

  ascii: () => {
    const mem = getMemory();
    const cpu = getCPU();
    const botName = client.user ? client.user.tag : 'Loading...';
    
    console.clear();
    console.log(chalk.cyan(`
    ██╗    ██╗███████╗██╗      ██████╗ ██████╗ ███████╗██████╗ 
    ██║    ██║██╔════╝██║     ██╔═══██╗██╔══██╗██╔════╝██╔══██╗
    ██║ █╗ ██║█████╗  ██║     ██║   ██║██████╔╝█████╗  ██████╔╝
    ██║███╗██║██╔══╝  ██║     ██║   ██║██╔══██╗██╔══╝  ██╔══██╗
    ╚███╔███╔╝███████╗███████╗╚██████╔╝██║  ██║███████╗██║  ██║
     ╚══╝╚══╝ ╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
    `));
    console.log(chalk.gray(`   ╔═══════════════════════════════════════════════════════════════╗`));
    console.log(chalk.gray(`   ║`) + chalk.white(` 🤖 HOSTVILLE • BOT v2.3                                     `) + chalk.gray(`║`));
    console.log(chalk.gray(`   ╠═══════════════════════════════════════════════════════════════╣`));
    console.log(chalk.gray(`   ║`) + chalk.white(` Bot:        `) + chalk.cyan(botName) + chalk.gray(' '.repeat(50 - botName.length)) + `║`));
    console.log(chalk.gray(`   ║`) + chalk.white(` Servidores:`) + chalk.cyan(` ${client.guilds.cache.size}`) + chalk.gray(' '.repeat(51 - String(client.guilds.cache.size).length)) + `║`));
    console.log(chalk.gray(`   ║`) + chalk.white(` RAM:        `) + chalk.cyan(` ${mem.heapUsed} MB`) + chalk.gray(' '.repeat(51 - String(mem.heapUsed).length - 3)) + `║`));
    console.log(chalk.gray(`   ║`) + chalk.white(` CPU:        `) + chalk.cyan(` ${cpu.usage}% (${cpu.cores} cores)`) + chalk.gray(' '.repeat(51 - String(cpu.usage).length - String(cpu.cores).length - 10)) + `║`));
    console.log(chalk.gray(`   ║`) + chalk.white(` Uptime:     `) + chalk.cyan(` ${getUptime()}`) + chalk.gray(' '.repeat(51 - getUptime().length)) + `║`));
    console.log(chalk.gray(`   ║`) + chalk.white(` Última ação:`) + chalk.yellow(` ${stats.lastAction}`) + chalk.gray(' '.repeat(51 - stats.lastAction.length - 10)) + `║`));
    console.log(chalk.gray(`   ║`) + chalk.white(` Último res:`) + chalk.cyan(` ${getLastRestart()}`) + chalk.gray(' '.repeat(51 - getLastRestart().length)) + `║`));
    console.log(chalk.gray(`   ║`) + chalk.white(` Erros:      `) + (stats.errors > 0 ? chalk.red(` ${stats.errors}`) : chalk.green(` 0`)) + chalk.gray(' '.repeat(51 - String(stats.errors).length)) + `║`));
    console.log(chalk.gray(`   ╚═══════════════════════════════════════════════════════════════╝`));
    console.log('');
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
client.once('ready', async () => {
  stats.lastRestart = Date.now();
  log.ascii();
  log.success('🤖 BOT ONLINE');
  log.info(`Bem-vindo Isac!`);
  log.info(`Seu bot está com ${stats.errors === 0 ? chalk.green("sem erros") : chalk.red(stats.errors + " erros")}.`);
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

📘 **Para mais informações sobre as regras, acesso o documento abaixo:**

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
        { name: "Uptime", value: getUptime(), inline: true },
        { name: "Último Restart", value: getLastRestart(), inline: true }
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
    log.warn(`Reinício solicitado por ${interaction.user.tag}`);
    client.destroy();
    setTimeout(() => {
      client.login(TOKEN).catch(err => {
        log.error('Falha ao reconectar: ' + err);
      });
    }, 3000);
  }
});

// ==================== EVENTOS ====================
client.on('guildMemberAdd', member => log.memberJoin(member.user.tag, member.guild.name));
client.on('guildMemberRemove', member => log.memberLeave(member
