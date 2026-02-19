// index.js
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, Partials } from 'discord.js';
import chalk from 'chalk';
import os from 'os';
import process from 'process';

// ==================== CONFIGURAÇÃO ====================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1473705296101900420";
const GUILD_ID = "928614664840052757";
const ACCESS_CODE = process.env.ACCESS_CODE;

if (!TOKEN) {
    console.error(chalk.red("❌ TOKEN não definido!"));
    process.exit(1);
}
if (!ACCESS_CODE) {
    console.error(chalk.red("❌ ACCESS_CODE não definido!"));
    process.exit(1);
}

// ==================== STATS ====================
const stats = {
    commandsUsed: {},
    totalCommands: 0,
    startTime: Date.now(),
    restarts: 0,
    errors: 0
};

// ==================== LOGGER ====================
const log = {
    info: msg => console.log(chalk.cyan('[INFO]'), msg),
    warn: msg => console.log(chalk.yellow('[WARN]'), msg),
    error: msg => {
        stats.errors++;
        console.log(chalk.red('[ERROR]'), msg);
    },
    cmd: (cmd, user, guild) => {
        stats.totalCommands++;
        stats.commandsUsed[cmd] = (stats.commandsUsed[cmd] || 0) + 1;
        console.log(chalk.magenta(`[CMD] /${cmd} usado por ${user}${guild ? ` em ${guild}` : ''}`));
    }
};

// ==================== MONITORAMENTO ====================
function getMemory() {
    const m = process.memoryUsage();
    return `${(m.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(m.heapTotal / 1024 / 1024).toFixed(2)} MB`;
}

function getCPU() {
    const cpus = os.cpus();
    let totalIdle = 0, totalTick = 0;
    cpus.forEach(cpu => {
        for (let type in cpu.times) totalTick += cpu.times[type];
        totalIdle += cpu.times.idle;
    });
    const usage = 100 - Math.floor((totalIdle / totalTick) * 100);
    return `${usage}%`;
}

function getUptime() {
    const ms = Date.now() - stats.startTime;
    const d = Math.floor(ms / 86400000);
    const h = Math.floor(ms % 86400000 / 3600000);
    const m = Math.floor(ms % 3600000 / 60000);
    const s = Math.floor(ms % 60000 / 1000);
    return `${d}d ${h}h ${m}m ${s}s`;
}

// ==================== CLIENTE ====================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// ==================== BOAS-VINDAS NO CONSOLE ====================
function welcomeConsole(user) {
    console.clear();
    console.log(chalk.blue(`
ＨｏｓｔＶｉｌｌｅ • ＢＯＴ
Bem-vindo(a) ${user}!
Seu bot está com ${stats.errors ? stats.errors : "sem erros"}.
`));
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
        log.info("✅ Comandos registrados!");
    } catch (e) {
        log.error("Erro ao registrar comandos", e);
    }
}

// ==================== EVENTOS ====================
client.on('clientReady', async () => {
    welcomeConsole('Isac');
    log.info(`Bot online como ${client.user.tag} (ID: ${client.user.id})`);
    log.info(`Servidores: ${client.guilds.cache.size}`);
    await registerCommands();

    // Monitoramento a cada 6 horas
    setInterval(() => {
        log.info(`⏱️ Uptime: ${getUptime()} | RAM: ${getMemory()} | CPU: ${getCPU()} | Ping: ${client.ws.ping}ms`);
    }, 21600000);
});

// Interações slash
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName, user, guild } = interaction;
    log.cmd(commandName, user.tag, guild?.name);

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

📘 **Para mais informações sobre as regras, acesse:**
📚 [Regras](https://docs.google.com/document/d/1ZU-oLyI88HEB2RMDunr4NNF1nkGQ3BWmcyYagY0T3dk/edit?usp=drivesdk)

━━━━━━━━━━━━━━━━━━━━

🔗 **Documentos Oficiais**
📄 [Política de Privacidade](https://docs.google.com/document/d/1hoL-0AcJhrTXZAPIschLxoeF3kzAi7knTVPDXdT20nE/edit?usp=drivesdk)
📜 [Termos de Uso](https://docs.google.com/document/d/1ZrScgrEAb7NnBGZW1XLQvBRaGIDrzatq8XBjlVyYP_k/edit?usp=drivesdk)

━━━━━━━━━━━━━━━━━━━━
✨ Ｐｏｗｅｒｅｄ ｂｙ Ｙ２ｋＮａｔ
`)
            .setImage("https://image2url.com/r2/default/images/1771466090995-ea6150ee-52be-4f03-953e-f6a41480320e.png");

        await interaction.channel.send({ embeds: [embed] });
        await interaction.deleteReply();
    }

    if (commandName === 'info') {
        const members = guild.members.cache;
        const online = members.filter(m => m.presence?.status === 'online').size;
        const offline = members.filter(m => !m.presence || m.presence.status === 'offline').size;

        const embed = new EmbedBuilder()
            .setColor(0x89CFF0)
            .setTitle("🤖 Informações do Bot")
            .addFields(
                { name: "Nome", value: client.user.tag, inline: true },
                { name: "ID", value: client.user.id, inline: true },
                { name: "Servidores", value: `${client.guilds.cache.size}`, inline: true },
                { name: "Membros Online", value: `${online}`, inline: true },
                { name: "Membros Offline", value: `${offline}`, inline: true },
                { name: "Uptime", value: getUptime(), inline: true },
                { name: "Ping", value: `${client.ws.ping}ms`, inline: true }
            )
            .setFooter({ text: "HostVille Greenville RP" })
            .setTimestamp();
        await interaction.reply({ embeds: [embed], flags: 64 });
    }

    if (commandName === 'restart') {
        const code = interaction.options.getString('code');
        if (code !== ACCESS_CODE) return interaction.reply({ content: "❌ Código inválido!", flags: 64 });

        await interaction.reply({ content: "🔄 Reiniciando o bot...", flags: 64 });
        stats.restarts++;
        client.destroy();
        setTimeout(() => client.login(TOKEN), 3000);
    }
});

// ==================== LOGS DE MENSAGENS ====================
client.on('messageDelete', async msg => {
    if (msg.partial) await msg.fetch();
    const executor = msg.author?.tag || "Desconhecido";
    console.log(chalk.yellow(`❗️ ${executor} apagou uma mensagem: ${msg.content || '[conteúdo indisponível]'}`));
});

client.on('guildMemberAdd', member => {
    console.log(chalk.green(`👋 Novo membro entrou: ${member.user.tag}`));
});
client.on('guildMemberRemove', member => {
    console.log(chalk.red(`👋 Membro saiu: ${member.user.tag}`));
});

// ==================== LOGIN ====================
client.login(TOKEN);

// ==================== TRATAMENTO DE ERROS ====================
process.on('unhandledRejection', e => log.error("Rejeição não tratada", e));
process.on('uncaughtException', e => log.error("Exceção não capturada", e));
