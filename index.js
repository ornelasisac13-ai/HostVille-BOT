const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');
const fs = require('fs');
const os = require('os');
const path = require('path');

// ==================== CONFIG ====================
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
        fs.appendFileSync(Logger.logFile, line + '\n');
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

// ==================== MONITOR ====================
const Monitor = {
    getMemory: () => {
        const m = process.memoryUsage();
        return {
            rss: (m.rss / 1024 / 1024).toFixed(2),
            heapUsed: (m.heapUsed / 1024 / 1024).toFixed(2),
            heapTotal: (m.heapTotal / 1024 / 1024).toFixed(2)
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
        console.log(`
${C.cyan}┌─── 📊 MONITORAMENTO${C.reset}
│  💾 RAM: ${C.white}${mem.rss} MB${C.reset} (Heap: ${mem.heapUsed}/${mem.heapTotal} MB)
│  ⏱️  Uptime: ${C.white}${Monitor.getUptime()}${C.reset}
└─────────────────────────────────${C.reset}
`);
    }
};

// ==================== CLIENTE ====================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ],
    presence: {
        status: 'online',
        activities: [{ name: '/rule | /info | /help', type: 0 }]
    }
});

// ==================== COMANDOS SLASH ====================
const commands = [
    new SlashCommandBuilder()
        .setName('rule')
        .setDescription('Exibe as regras do servidor')
        .addStringOption(o => o.setName('code').setDescription('Código de acesso').setRequired(true)),

    new SlashCommandBuilder()
        .setName('info')
        .setDescription('Informações do bot'),

    new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Estatísticas do bot')
        .setDefaultMemberPermissions(0),

    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Testa a latência'),

    new SlashCommandBuilder()
        .setName('server')
        .setDescription('Informações do servidor'),

    new SlashCommandBuilder()
        .setName('restart')
        .setDescription('Reinicia o bot')
        .setDefaultMemberPermissions(0)
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
    try {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        Logger.success(`Comandos registrados: ${commands.map(c => c.name).join(', ')}`);
    } catch (error) {
        Logger.error('Erro ao registrar comandos', error);
    }
}

// ==================== READY EVENT ====================
client.once('clientReady', async () => {
    Logger.ascii(`Bem-vindo, Isac!`);
    Logger.info(stats.errors === 0 ? '✅ Seu bot está sem erros!' : `⚠️ Seu bot possui ${stats.errors} erro(s)`);
    Logger.line();

    Logger.info(`🤖 Bot online: ${client.user.tag}`);
    Logger.info(`🆔 ID: ${client.user.id}`);
    Logger.info(`👥 Servidores: ${client.guilds.cache.size}`);
    Logger.info(`💬 Canais: ${client.channels.cache.size}`);
    Logger.info(`⏱️ Uptime: ${Monitor.getUptime()}`);
    Logger.info(`💾 RAM usada: ${Monitor.getMemory().rss} MB`);
    Logger.info(`⚡ Ping: ${client.ws.ping} ms`);
    Logger.line();

    console.log(`
${C.cyan}╔════════════════════════════════════════╗
║                                        ║
║        ${C.white}H O S T V I L L E • B O T${C.cyan}        ║
║                                        ║
╚════════════════════════════════════════╝
${C.reset}
`);

    registerCommands();

    // Atualização RAM/ping a cada 6h
    setInterval(() => {
        const mem = Monitor.getMemory();
        Logger.info(`💾 RAM usada: ${mem.rss} MB | ⚡ Ping: ${client.ws.ping} ms`);
    }, 6 * 60 * 60 * 1000);
});

// ==================== EVENTS ====================

// Membros entram
client.on('guildMemberAdd', member => {
    console.log(`👋 Novo membro entrou: ${member.user.tag} | Total: ${member.guild.memberCount}`);
});

// Membros saem
client.on('guildMemberRemove', member => {
    console.log(`👋 Membro saiu: ${member.user.tag} | Total restante: ${member.guild.memberCount}`);
});

// Mensagem deletada
client.on('messageDelete', async message => {
    if (message.partial) await message.fetch().catch(() => null);
    if (!message || message.author?.bot) return;

    let deletedBy = 'Desconhecido';
    try {
        const logs = await message.guild.fetchAuditLogs({ limit: 1, type: 72 });
        const entry = logs.entries.first();
        if (entry && entry.target.id === message.author.id && (Date.now() - entry.createdTimestamp) < 5000) {
            deletedBy = entry.executor.tag;
        }
    } catch {
        deletedBy = 'Desconhecido';
    }

    console.log(`${C.red}❗️ ${deletedBy} apagou uma mensagem de ${message.author.tag}:${C.reset} "${message.content}"`);
});

// Mensagens criadas (log de comandos e mensagens)
client.on('messageCreate', message => {
    if (message.author.bot) return;
    console.log(`${C.green}💬 Nova mensagem de ${message.author.tag}:${C.reset} "${message.content}"`);
});

// Comandos
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName, user, guild } = interaction;
    Logger.cmd(commandName, user.tag, guild?.name);

    try {
        if (commandName === 'rule') {
            const code = interaction.options.getString('code');
            if (code !== ACCESS_CODE) return interaction.reply({ content: "❌ Código inválido!", flags: 64 });

            await interaction.deferReply({ flags: 64 });
            const embed = new EmbedBuilder()
                .setColor(0x89CFF0)
                .setTitle("📜 Regras - HostVille Greenville RP")
                .setDescription("As regras gerais e links oficiais...")
                .setImage("https://image2url.com/r2/default/images/1771466090995-ea6150ee-52be-4f03-953e-f6a41480320e.png");

            await interaction.channel.send({ embeds: [embed] });
            await interaction.deleteReply();
        }

        if (commandName === 'info') {
            const members = guild.members.cache;
            const online = members.filter(m => m.presence?.status === 'online').size;
            const offline = members.size - online;

            const embed = new EmbedBuilder()
                .setColor(0x89CFF0)
                .setTitle("🤖 Informações do Bot")
                .addFields(
                    { name: "Nome", value: client.user.tag, inline: true },
                    { name: "ID", value: client.user.id, inline: true },
                    { name: "Servidores", value: `${client.guilds.cache.size}`, inline: true },
                    { name: "Membros Online", value: `${online}`, inline: true },
                    { name: "Membros Offline", value: `${offline}`, inline: true },
                    { name: "Ping", value: `${client.ws.ping}ms`, inline: true },
                    { name: "Uptime", value: Monitor.getUptime(), inline: true }
                )
                .setFooter({ text: "HostVille Greenville RP" })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: 64 });
        }

        if (commandName === 'restart') {
            Logger.warn('Reiniciando bot...');
            stats.restarts++;
            await interaction.reply({ content: '♻️ Reiniciando...', flags: 64 });
            client.destroy();
            setTimeout(() => client.login(TOKEN), 3000);
        }

        if (commandName === 'ping') {
            const msg = await interaction.reply({ content: '🏓 Pong!', flags: 64, fetchReply: true });
            const ping = msg.createdTimestamp - interaction.createdTimestamp;
            await interaction.editReply(`🏓 Pong! | Latência: ${ping}ms | API: ${client.ws.ping}ms`);
        }
    } catch (error) {
        Logger.error(`Erro ao executar comando ${commandName}`, error);
    }
});

// ==================== ERROS ====================
process.on('unhandledRejection', reason => Logger.error('Rejeição não tratada', reason));
process.on('uncaughtException', error => Logger.error('Exceção não capturada', error));

// ==================== LOGIN ====================
if (!TOKEN || !ACCESS_CODE) {
    Logger.error('TOKEN ou ACCESS_CODE não definidos!');
    process.exit(1);
}

client.login(TOKEN);
