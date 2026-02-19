import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import chalk from 'chalk';
import os from 'os';
import process from 'process';

// ==================== CONFIGURAÇÃO ====================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1473705296101900420";
const GUILD_ID = "928614664840052757";
const ACCESS_CODE = process.env.ACCESS_CODE;

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
    info: (msg) => console.log(chalk.cyanBright(`[ℹ️ INFO] ${msg}`)),
    success: (msg) => console.log(chalk.cyanBright(`[✅ OK] ${msg}`)),
    warn: (msg) => console.log(chalk.cyanBright(`[⚠️ AVISO] ${msg}`)),
    error: (msg, err = null) => {
        stats.errors++;
        console.log(chalk.cyanBright(`[❌ ERRO] ${msg}`));
        if (err) console.log(chalk.gray(`   └─ ${err.message || err}`));
    },
    cmd: (cmd, user, guild) => {
        stats.totalCommands++;
        stats.commandsUsed[cmd] = (stats.commandsUsed[cmd] || 0) + 1;
        const guildText = guild ? ` em ${guild}` : '';
        console.log(chalk.cyanBright(`[📝 CMD] /${cmd} por ${user}${guildText}`));
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
        console.log(chalk.cyanBright(`💾 RAM: ${mem.rss}MB | Heap: ${mem.heapUsed}/${mem.heapTotal} MB | ⏱️ Uptime: ${Monitor.getUptime()}`));
    }
};

// ==================== BOAS-VINDAS ====================
function welcomeConsole(user) {
    console.clear();
    console.log(chalk.cyanBright(`
ＨｏｓｔＶｉｌｌｅ • ＢＯＴ
Bem-vindo(a) ${user}!
Seu bot está com ${stats.errors ? stats.errors : "sem erros"}.
`));
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
    presence: {
        status: 'online',
        activities: [{ name: '/rule | /info | /restart', type: 0 }]
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
        .setName('restart')
        .setDescription('Reinicia o bot')
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
client.once('clientReady', async () => {
    welcomeConsole('Isac');
    Logger.success('Bot online!');
    await registerCommands();

    // Atualiza RAM e ping a cada 6 horas
    setInterval(() => {
        const mem = Monitor.getMemory();
        Logger.info(`💾 RAM: ${mem.rss}MB | Ping: ${client.ws.ping}ms`);
    }, 21600000);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName, user, guild } = interaction;
    Logger.cmd(commandName, user.tag, guild?.name);

    // ========= /RULE =========
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

    // ========= /INFO =========
    if (commandName === 'info') {
        const totalMembers = guild.memberCount;
        const onlineMembers = guild.members.cache.filter(m => m.presence?.status === 'online').size;
        const offlineMembers = totalMembers - onlineMembers;
        const embed = new EmbedBuilder()
            .setColor(0x89CFF0)
            .setTitle("🤖 Informações do Bot")
            .addFields(
                { name: "Nome", value: client.user.tag, inline: true },
                { name: "ID", value: client.user.id, inline: true },
                { name: "Servidores", value: `${client.guilds.cache.size}`, inline: true },
                { name: "Membros Online", value: `${onlineMembers}`, inline: true },
                { name: "Membros Offline", value: `${offlineMembers}`, inline: true },
                { name: "Uptime", value: Monitor.getUptime(), inline: true },
                { name: "Ping", value: `${client.ws.ping}ms`, inline: true }
            )
            .setFooter({ text: "HostVille Greenville RP" });
        await interaction.reply({ embeds: [embed], flags: 64 });
    }

    // ========= /RESTART =========
    if (commandName === 'restart') {
        const code = interaction.options.getString('code');
        if (code !== ACCESS_CODE) return interaction.reply({ content: "❌ Código inválido!", flags: 64 });
        await interaction.reply({ content: "♻️ Reiniciando...", flags: 64 });
        stats.restarts++;
        client.destroy();
        setTimeout(() => client.login(TOKEN), 3000);
    }
});

// ==================== LOGS DE MENSAGENS ====================
client.on('messageDelete', async message => {
    if (message.partial) return;
    Logger.warn(`❗️ ${message.author.tag} apagou uma mensagem: "${message.content}"`);
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (oldMessage.partial) return;
    Logger.info(`✏️ Mensagem editada por ${oldMessage.author.tag}: "${oldMessage.content}" → "${newMessage.content}"`);
});

// ==================== LOGIN ====================
client.login(TOKEN);

// ==================== TRATAMENTO DE ERROS ====================
process.on('unhandledRejection', (reason) => Logger.error('Rejeição não tratada', reason));
process.on('uncaughtException', (err) => Logger.error('Exceção não capturada', err));
