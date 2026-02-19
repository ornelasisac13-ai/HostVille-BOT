// ==================== IMPORTS ====================
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, Events } from 'discord.js';
import chalk from 'chalk';
import fs from 'fs';
import os from 'os';

// ==================== CONFIGURAÇÃO ====================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1473705296101900420";
const GUILD_ID = "928614664840052757";
const ACCESS_CODE = process.env.ACCESS_CODE;

if (!TOKEN) {
    console.error(chalk.red('❌ TOKEN não definido!'));
    process.exit(1);
}

if (!ACCESS_CODE) {
    console.error(chalk.red('❌ ACCESS_CODE não definido!'));
    process.exit(1);
}

// ==================== ESTATÍSTICAS ====================
const stats = {
    totalCommands: 0,
    commandsUsed: {},
    errors: 0,
    restarts: 0,
    startTime: Date.now()
};

// ==================== LOGGER ====================
const Logger = {
    logFile: './bot.log',

    log: (type, msg) => {
        const timestamp = new Date().toLocaleString('pt-BR');
        const line = `[${timestamp}] ${type}: ${msg}`;
        fs.appendFileSync(Logger.logFile, line + '\n');
        return line;
    },

    info: msg => console.log(chalk.cyanBright('[ℹ️ INFO]'), msg),
    success: msg => console.log(chalk.cyanBright('[✅ OK]'), msg),
    warn: msg => console.log(chalk.yellowBright('[⚠️ AVISO]'), msg),
    error: (msg, err = null) => {
        stats.errors++;
        console.log(chalk.redBright('[❌ ERRO]'), msg);
        if (err) console.log(chalk.gray(`    └─ ${err.message || err}`));
    },
    cmd: (cmd, user, guild) => {
        stats.totalCommands++;
        stats.commandsUsed[cmd] = (stats.commandsUsed[cmd] || 0) + 1;
        console.log(chalk.magentaBright(`[📝 CMD] /${cmd} por ${user}${guild ? ' em ' + guild : ''}`));
    }
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

    show: () => {
        const mem = Monitor.getMemory();
        const cpu = Monitor.getCPU();
        console.log(chalk.cyanBright(`
┌─── 📊 MONITORAMENTO
│ 💾 RAM: ${mem.rss} MB (Heap: ${mem.heapUsed}/${mem.heapTotal} MB)
│ ⚡ CPU: ${cpu.usage}% (${cpu.cores} núcleos)
│ ⏱️ Uptime: ${Monitor.getUptime()}
└─────────────────────────────`));
    }
};

// ==================== ASCII BOAS VINDAS ====================
function welcomeMessage() {
    console.clear();
    console.log(chalk.cyanBright(`
██╗    ██╗███████╗██╗      ██████╗ ██████╗ ███████╗██████╗ 
██║    ██║██╔════╝██║     ██╔═══██╗██╔══██╗██╔════╝██╔══██╗
██║ █╗ ██║█████╗  ██║     ██║   ██║██████╔╝█████╗  ██████╔╝
██║███╗██║██╔══╝  ██║     ██║   ██║██╔══██╗██╔══╝  ██╔══██╗
╚███╔███╔╝███████╗███████╗╚██████╔╝██║  ██║███████╗██║  ██║
 ╚══╝╚══╝ ╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
`));
    console.log(chalk.cyanBright(`Bem-vindo Isac!`));
    console.log(chalk.cyanBright(`Seu bot está ${stats.errors === 0 ? 'sem erros' : stats.errors + ' erro(s)'}`));
    Monitor.show();
}

// ==================== CLIENTE ====================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ],
    presence: { activities: [{ name: '/rule | /info | /restart', type: 0 }], status: 'online' }
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
        .setName('restart')
        .setDescription('Reinicia o bot (requere código)')
        .addStringOption(o => o.setName('code').setDescription('Código de acesso').setRequired(true))
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
    try {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        Logger.success(`Comandos registrados: ${commands.map(c => c.name).join(', ')}`);
    } catch (err) {
        Logger.error('Erro ao registrar comandos', err);
    }
}

// ==================== EVENTOS ====================
client.once(Events.ClientReady, async () => {
    welcomeMessage();
    await registerCommands();
    Logger.success(`Bot online como ${client.user.tag}`);
});

// ========= INTERACTIONS =========
client.on(Events.InteractionCreate, async interaction => {
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

    // ========= /INFO =========
    if (commandName === 'info') {
        const online = guild.members.cache.filter(m => m.presence?.status === 'online').size;
        const offline = guild.memberCount - online;

        const embed = new EmbedBuilder()
            .setColor(0x89CFF0)
            .setTitle("🤖 Informações do Bot")
            .addFields(
                { name: 'Nome', value: client.user.tag, inline: true },
                { name: 'ID', value: client.user.id, inline: true },
                { name: 'Servidores', value: `${client.guilds.cache.size}`, inline: true },
                { name: 'Membros Online', value: `${online}`, inline: true },
                { name: 'Membros Offline', value: `${offline}`, inline: true },
                { name: 'Uptime', value: Monitor.getUptime(), inline: true },
                { name: 'Ping', value: `${client.ws.ping}ms`, inline: true }
            );

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ========= /RESTART =========
    if (commandName === 'restart') {
        const code = interaction.options.getString('code');
        if (code !== ACCESS_CODE) return interaction.reply({ content: '❌ Código inválido!', ephemeral: true });

        await interaction.reply({ content: '🔄 Reiniciando bot...', ephemeral: true });
        stats.restarts++;
        process.exit(0); // Railway reinicia o processo
    }
});

// ==================== LOG DE MENSAGENS ====================
client.on(Events.MessageDelete, message => {
    if (!message.guild) return;
    const executor = message.author?.tag || 'Desconhecido';
    Logger.warn(`❗️ ${executor} apagou uma mensagem: "${message.content}"`);
});

// ==================== LOG DE MEMBROS ====================
client.on(Events.GuildMemberAdd, member => {
    Logger.success(`👋 Novo membro entrou: ${member.user.tag}`);
});
client.on(Events.GuildMemberRemove, member => {
    Logger.warn(`👋 Membro saiu: ${member.user.tag}`);
});

// ==================== TRATAMENTO DE ERROS ====================
process.on('unhandledRejection', err => Logger.error('Rejeição não tratada', err));
process.on('uncaughtException', err => Logger.error('Exceção não capturada', err));

// ==================== LOGIN ====================
client.login(TOKEN);
