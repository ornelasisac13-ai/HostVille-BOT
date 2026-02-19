const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ==================== CONFIGURAÇÃO ====================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1473705296101900420";
const GUILD_ID = "928614664840052757";
const ACCESS_CODE = process.env.ACCESS_CODE;

// ==================== CORES ANSI ====================
const C = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m'
};

// ==================== ESTATÍSTICAS ====================
const stats = {
    commandsUsed: {},
    totalCommands: 0,
    startTime: Date.now(),
    restarts: 0,
    errors: 0
};

// ==================== LOGGER ====================
const Logger = {
    logFile: path.join(__dirname, 'bot.log'),
    
    format: (type, msg, color) => {
        const timestamp = new Date().toLocaleString('pt-BR');
        const line = `[${timestamp}] ${type}: ${msg}`;
        try { fs.appendFileSync(Logger.logFile, line + '\n'); } catch {}
        return `${C.cyan}[${timestamp}]${C.reset} ${color}${type}:${C.reset} ${msg}`;
    },
    
    info: (msg) => console.log(Logger.format('ℹ️ INFO', msg, C.blue)),
    success: (msg) => console.log(Logger.format('✅ OK', msg, C.green)),
    warn: (msg) => console.log(Logger.format('⚠️ AVISO', msg, C.yellow)),
    error: (msg, err = null) => {
        stats.errors++;
        console.log(Logger.format('❌ ERRO', msg, C.red));
        if (err) console.log(`${C.gray}    └─ ${err.message || err}${C.reset}`);
    },
    cmd: (cmd, user, guild) => {
        stats.totalCommands++;
        stats.commandsUsed[cmd] = (stats.commandsUsed[cmd] || 0) + 1;
        const guildText = guild ? ` em ${guild}` : '';
        console.log(Logger.format('📝 CMD', `/${cmd} por ${user}${guildText}`, C.magenta));
    },
    
    ascii: (text) => console.log(`\n${C.cyan}╔════════════════════════════════════╗\n║  ${C.white}${text}${C.cyan}\n╚════════════════════════════════════╝${C.reset}\n`),
    
    line: () => console.log(C.gray + '─────────────────────────────────────' + C.reset)
};

// ==================== MONITORAMENTO ====================
const Monitor = {
    getMemory: () => {
        const m = process.memoryUsage();
        return {
            rss: (m.rss / 1024 / 1024).toFixed(2),
            heapUsed: (m.heapUsed / 1024 / 1024).toFixed(2),
            heapTotal: (m.heapTotal / 1024 / 1024).toFixed(2)
        };
    },
    
    getCPU: () => {
        const cpus = os.cpus();
        let idle = 0, total = 0;
        cpus.forEach(cpu => {
            for (const type in cpu.times) total += cpu.times[type];
            idle += cpu.times.idle;
        });
        return {
            cores: cpus.length,
            usage: (100 - (idle / total * 100)).toFixed(1)
        };
    },
    
    getUptime: () => {
        const ms = Date.now() - stats.startTime;
        const d = Math.floor(ms / 86400000);
        const h = Math.floor((ms % 86400000) / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${d}d ${h}h ${m}m ${s}s`;
    },
    
    status: () => {
        const mem = Monitor.getMemory();
        const cpu = Monitor.getCPU();
        console.log(`
${C.cyan}┌─── 📊 MONITORAMENTO${C.reset}
│  💾 RAM: ${C.white}${mem.rss} MB${C.reset} (Heap: ${mem.heapUsed}/${mem.heapTotal} MB)
│  ⚡ CPU: ${C.white}${cpu.usage}%${C.reset} (${cpu.cores} núcleos)
│  ⏱️  Uptime: ${C.white}${Monitor.getUptime()}${C.reset}
└─────────────────────────────────${C.reset}
`);
    }
};

// ==================== CLI ====================
function setupConsoleCommands(client) {
    const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout });
    
    const prompt = () => {
        readline.question(C.green + '\n> ' + C.reset, async (input) => {
            const cmd = input.toLowerCase().trim();
            switch (cmd) {
                case 'status':
                    Monitor.status();
                    break;
                case 'stats':
                    console.log(stats);
                    break;
                case 'monitor':
                    Logger.info('Monitoramento ativo (Ctrl+C para sair)');
                    setInterval(() => {
                        const mem = Monitor.getMemory();
                        const cpu = Monitor.getCPU();
                        process.stdout.write(`\rCPU: ${cpu.usage}% | RAM: ${mem.rss}MB | Uptime: ${Monitor.getUptime()}   `);
                    }, 2000);
                    break;
                case 'clear':
                    console.clear();
                    break;
                case 'reload':
                    await registerCommands();
                    Logger.success('Comandos recarregados!');
                    break;
                case 'restart':
                    stats.restarts++;
                    client.destroy();
                    setTimeout(() => client.login(TOKEN), 3000);
                    break;
                case 'help':
                    Logger.info('Comandos: status, stats, monitor, clear, reload, restart, help, exit');
                    break;
                case 'exit':
                    client.destroy();
                    process.exit(0);
                    break;
                default:
                    if (cmd) Logger.warn(`Comando "${cmd}" não reconhecido.`);
            }
            prompt();
        });
    };
    prompt();
}

// ==================== VALIDAÇÃO ====================
if (!TOKEN || !ACCESS_CODE) {
    Logger.error('TOKEN ou ACCESS_CODE não definidos!');
    process.exit(1);
}

// ==================== CLIENTE ====================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    presence: { status: 'online', activities: [{ name: '/rule | /info | /stats', type: 0 }] }
});

// ==================== COMANDOS SLASH ====================
const commands = [
    new SlashCommandBuilder().setName('rule').setDescription('Exibe as regras do servidor').addStringOption(o => o.setName('code').setDescription('Código de acesso').setRequired(true)),
    new SlashCommandBuilder().setName('info').setDescription('Informações do bot'),
    new SlashCommandBuilder().setName('stats').setDescription('Estatísticas do bot').setDefaultMemberPermissions(0),
    new SlashCommandBuilder().setName('ping').setDescription('Testa a latência'),
    new SlashCommandBuilder().setName('server').setDescription('Informações do servidor')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
    try {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        Logger.success(`Comandos registrados: ${commands.map(c => c.name).join(', ')}`);
    } catch (err) { Logger.error('Erro ao registrar comandos', err); }
}

// ==================== EVENTOS ====================
client.once('ready', () => {
    Logger.ascii('HOSTVILLE BOT');
    Logger.success('Bot online!');
    Logger.info(`Tag: ${client.user.tag}`);
    Logger.info(`ID: ${client.user.id}`);
    Logger.line();
    
    registerCommands();
    setupConsoleCommands(client);

    // Status automático a cada 60s
    setInterval(() => {
        const mem = Monitor.getMemory();
        Logger.info(`RAM: ${mem.rss}MB | Ping: ${client.ws.ping}ms`);
    }, 60000);
});

process.on('uncaughtException', err => Logger.error('Exceção não capturada', err));
process.on('unhandledRejection', reason => Logger.error('Rejeição não tratada', reason));

// ==================== INTERACTIONS ====================
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName, user, guild } = interaction;
    Logger.cmd(commandName, user.tag, guild?.name);

    // ========= /RULE =========
    if (commandName === 'rule') {
        const code = interaction.options.getString('code');
        if (code !== ACCESS_CODE) return interaction.reply({ content: '❌ Código inválido!', ephemeral: true });

        await interaction.deferReply({ ephemeral: true });
        const embed = new EmbedBuilder()
            .setColor(0x89CFF0)
            .setTitle('📜 Regras - HostVille Greenville RP')
            .setDescription(`
As regras gerais têm como objetivo garantir a ordem, o respeito e a boa convivência entre todos.

➤ Ao participar do HostVille Greenville RP, você concorda em agir com educação, responsabilidade e bom senso.

━━━━━━━━━━━━━━━━━━━━

📘 **Para mais informações sobre as regras:**

📚 [Regras](https://docs.google.com/document/d/1ZU-oLyI88HEB2RMDunr4NNF1nkGQ3BWmcyYagY0T3dk/edit?usp=drivesdk)

━━━━━━━━━━━━━━━━━━━━

🔗 **Documentos Oficiais**

📄 [Política de Privacidade](https://docs.google.com/document/d/1hoL-0AcJhrTXZAPIschLxoeF3kzAi7knTVPDXdT20nE/edit?usp=drivesdk)

📜 [Termos de Uso](https://docs.google.com/document/d/1ZrScgrEAb7NnBGZW1XLQvBRaGIDrzatq8XBjlVyYP_k/edit?usp=drivesdk)

━━━━━━━━━━━━━━━━━━━━
✨ Powered by Y2k_Nat
`)
            .setImage('https://image2url.com/r2/default/images/1771466090995-ea6150ee-52be-4f03-953e-f6a41480320e.png');

        await interaction.editReply({ embeds: [embed] });
    }

    // ========= /INFO =========
    if (commandName === 'info') {
        const embed = new EmbedBuilder()
            .setColor(0x89CFF0)
            .setTitle('🤖 Informações do Bot')
            .addFields(
                { name: 'Nome', value: client.user.tag, inline: true },
                { name: 'ID', value: client.user.id, inline: true },
                { name: 'Servidores', value: `${client.guilds.cache.size}`, inline: true },
                { name: 'Uptime', value: Monitor.getUptime(), inline: true },
                { name: 'Ping', value: `${client.ws.ping}ms`, inline: true }
            )
            .setFooter({ text: 'HostVille Greenville RP' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ========= /STATS =========
    if (commandName === 'stats') {
        const topCmds = Object.entries(stats.commandsUsed)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([c, n]) => `/${c}: **${n}**`)
            .join('\n') || 'Nenhum comando usado';

        const embed = new EmbedBuilder()
            .setColor(0x89CFF0)
            .setTitle('📊 Estatísticas')
            .addFields(
                { name: 'Total de Comandos', value: `${stats.totalCommands}`, inline: true },
                { name: 'Erros', value: `${stats.errors}`, inline: true },
                { name: 'Reinícios', value: `${stats.restarts}`, inline: true },
                { name: 'Top Comandos', value: topCmds }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ========= /PING =========
    if (commandName === 'ping') {
        const pingAPI = client.ws.ping;
        await interaction.reply({ content: `🏓 Pong! | API: ${pingAPI}ms`, ephemeral: true });
    }

    // ========= /SERVER =========
    if (commandName === 'server') {
        if (!guild) return;
        const owner = await guild.fetchOwner();
        const embed = new EmbedBuilder()
            .setColor(0x89CFF0)
            .setTitle(`📌 ${guild.name}`)
            .setThumbnail(guild.iconURL())
            .addFields(
                { name: 'ID', value: guild.id, inline: true },
                { name: 'Membros', value: `${guild.memberCount}`, inline: true },
                { name: 'Criado em', value: guild.createdAt.toLocaleDateString('pt-BR'), inline: true },
                { name: 'Dono', value: owner.user.tag, inline: true },
                { name: 'Boosts', value: `${guild.premiumSubscriptionCount}`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
});

client.login(TOKEN);
