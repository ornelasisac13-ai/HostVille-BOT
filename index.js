import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, PermissionsBitField } from 'discord.js';
import chalk from 'chalk';
import os from 'os';
import process from 'process';

// ==================== CONFIGURAÇÃO ====================
const TOKEN = process.env.TOKEN;
const ACCESS_CODE = process.env.ACCESS_CODE;
const CLIENT_ID = "1473705296101900420";
const GUILD_ID = "928614664840052757";

// ==================== VALIDAÇÃO ====================
if (!TOKEN) {
    console.error(chalk.red("❌ TOKEN não definido!"));
    process.exit(1);
}

if (!ACCESS_CODE) {
    console.error(chalk.red("❌ ACCESS_CODE não definido!"));
    process.exit(1);
}

// ==================== ESTATÍSTICAS ====================
const stats = {
    commandsUsed: {},
    totalCommands: 0,
    startTime: Date.now(),
    errors: 0,
    restarts: 0
};

// ==================== CLIENT ====================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ],
    presence: {
        status: 'online',
        activities: [{ name: '/rule | /info | /restart', type: 0 }]
    }
});

// ==================== LOGGER ====================
function logInfo(msg) { console.log(chalk.cyan(`[INFO] ${msg}`)); }
function logSuccess(msg) { console.log(chalk.blueBright(`[OK] ${msg}`)); }
function logWarn(msg) { console.log(chalk.yellow(`[WARN] ${msg}`)); }
function logError(msg, err = null) {
    stats.errors++;
    console.log(chalk.red(`[ERROR] ${msg}`));
    if (err) console.log(chalk.gray(`    └─ ${err.message || err}`));
}
function logCommand(cmd, user, guild) {
    stats.totalCommands++;
    stats.commandsUsed[cmd] = (stats.commandsUsed[cmd] || 0) + 1;
    console.log(chalk.magenta(`[CMD] /${cmd} usado por ${user}${guild ? ` em ${guild}` : ''}`));
}

// ==================== MONITORAMENTO ====================
function getMemoryUsage() {
    const m = process.memoryUsage();
    return {
        rss: (m.rss / 1024 / 1024).toFixed(2),
        heapUsed: (m.heapUsed / 1024 / 1024).toFixed(2),
        heapTotal: (m.heapTotal / 1024 / 1024).toFixed(2)
    };
}

function getCPUUsage() {
    const cpus = os.cpus();
    let idle = 0, total = 0;
    cpus.forEach(cpu => {
        for (let type in cpu.times) total += cpu.times[type];
        idle += cpu.times.idle;
    });
    return {
        cores: cpus.length,
        usage: (100 - (idle / total * 100)).toFixed(2)
    };
}

function getUptime() {
    const ms = Date.now() - stats.startTime;
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${d}d ${h}h ${m}m ${s}s`;
}

function showMonitor() {
    const mem = getMemoryUsage();
    const cpu = getCPUUsage();
    console.log(chalk.cyan(`
┌─── 📊 MONITORAMENTO
│  💾 RAM: ${chalk.white(mem.rss)}MB (Heap: ${mem.heapUsed}/${mem.heapTotal}MB)
│  ⚡ CPU: ${chalk.white(cpu.usage)}% (${cpu.cores} cores)
│  ⏱️  Uptime: ${chalk.white(getUptime())}
└────────────────────────────
`));
}

// ==================== ASCII BOAS VINDAS ====================
function welcomeMessage() {
    console.clear();
    console.log(chalk.cyanBright(`
██╗  ██╗ ██████╗ ████████╗███████╗██╗   ██╗██╗     ███████╗
██║  ██║██╔═══██╗╚══██╔══╝██╔════╝██║   ██║██║     ██╔════╝
███████║██║   ██║   ██║   █████╗  ██║   ██║██║     █████╗  
██╔══██║██║   ██║   ██║   ██╔══╝  ██║   ██║██║     ██╔══╝  
██║  ██║╚██████╔╝   ██║   ███████╗╚██████╔╝███████╗███████╗
╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚══════╝ ╚═════╝ ╚══════╝╚══════╝
`));
    console.log(chalk.blueBright(`Bem-vindo Isac!`));
    console.log(chalk.blueBright(`Seu bot está com ${stats.errors} erro(s)`));
    showMonitor();
}

// ==================== COMANDOS SLASH ====================
const commands = [
    new SlashCommandBuilder()
        .setName('rule')
        .setDescription('Exibe as regras do servidor')
        .addStringOption(o => o.setName('code').setDescription('Código de acesso').setRequired(true)),
    new SlashCommandBuilder()
        .setName('info')
        .setDescription('Mostra informações do bot'),
    new SlashCommandBuilder()
        .setName('restart')
        .setDescription('Reinicia o bot')
        .addStringOption(o => o.setName('code').setDescription('Código de acesso').setRequired(true))
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);
async function registerCommands() {
    try {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        logSuccess(`Comandos registrados: ${commands.map(c => c.name).join(', ')}`);
    } catch (err) {
        logError('Erro ao registrar comandos', err);
    }
}

// ==================== EVENTOS ====================
client.once('clientReady', async () => {
    welcomeMessage();
    await registerCommands();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName, user, guild } = interaction;
    logCommand(commandName, user.tag, guild?.name);

    if (commandName === 'rule') {
        const code = interaction.options.getString('code');
        if (code !== ACCESS_CODE) return interaction.reply({ content: "❌ Código inválido", flags: 64 });
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

    if (commandName === 'info') {
        const mem = getMemoryUsage();
        const cpu = getCPUUsage();
        const embed = new EmbedBuilder()
            .setColor(0x89CFF0)
            .setTitle("🤖 Informações do Bot")
            .addFields(
                { name: "Nome", value: client.user.tag, inline: true },
                { name: "ID", value: client.user.id, inline: true },
                { name: "Servidores", value: `${client.guilds.cache.size}`, inline: true },
                { name: "Membros online", value: `${client.guilds.cache.reduce((a,g) => a + g.presences.cache.filter(p => p.status === 'online').size,0)}`, inline: true },
                { name: "RAM usada", value: `${mem.rss}MB`, inline: true },
                { name: "CPU", value: `${cpu.usage}%`, inline: true },
                { name: "Uptime", value: getUptime(), inline: true },
                { name: "Ping", value: `${client.ws.ping}ms`, inline: true }
            )
            .setTimestamp();
        await interaction.reply({ embeds: [embed], flags: 64 });
    }

    if (commandName === 'restart') {
        const code = interaction.options.getString('code');
        if (code !== ACCESS_CODE) return interaction.reply({ content: "❌ Código inválido", flags: 64 });
        await interaction.reply({ content: "♻️ Reiniciando...", flags: 64 });
        stats.restarts++;
        client.destroy();
        setTimeout(() => client.login(TOKEN), 3000);
    }
});

// ==================== LOGS DE MENSAGENS E MEMBROS ====================
client.on('messageDelete', message => {
    if (message.partial) return;
    console.log(chalk.red(`❗️ ${message.author.tag} apagou uma mensagem: "${message.content}"`));
});

client.on('guildMemberAdd', member => {
    console.log(chalk.green(`👋 Novo membro entrou: ${member.user.tag}`));
});

client.on('guildMemberRemove', member => {
    console.log(chalk.yellow(`👋 Membro saiu: ${member.user.tag}`));
});

// ==================== LOGIN ====================
client.login(TOKEN);
