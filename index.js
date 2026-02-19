import { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    EmbedBuilder 
} from 'discord.js';

import chalk from 'chalk';
import os from 'os';
import process from 'process';

// ==================== CONFIG ====================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1473705296101900420";
const GUILD_ID = "928614664840052757";
const ACCESS_CODE = process.env.ACCESS_CODE;

if (!TOKEN) {
    console.log("TOKEN não definido.");
    process.exit(1);
}

if (!ACCESS_CODE) {
    console.log("ACCESS_CODE não definido.");
    process.exit(1);
}

// ==================== ESTATÍSTICAS ====================
const stats = {
    commandsUsed: {},
    totalCommands: 0,
    startTime: Date.now(),
    restarts: 0,
    errors: 0
};

// ==================== ESTILO ====================
const C = chalk.hex('#00FFFF'); // CIANO REAL FUNCIONANDO

// ==================== CLIENT ====================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ]
});

// ==================== MONITOR ====================
function getMemory() {
    const m = process.memoryUsage();
    return (m.rss / 1024 / 1024).toFixed(2);
}

function getUptime() {
    const ms = Date.now() - stats.startTime;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
}

function consoleBanner() {
    console.clear();

    console.log(C("══════════════════════════════════════════════════════"));
    console.log(C.bold("            ＨｏｓｔＶｉｌｌｅ • ＢＯＴ"));
    console.log(C("══════════════════════════════════════════════════════"));

    console.log(C("👤 Usuário: Isac"));
    console.log(C("📅 Data: " + new Date().toLocaleDateString("pt-BR")));
    console.log(C("⏰ Hora: " + new Date().toLocaleTimeString("pt-BR")));
    console.log(C("══════════════════════════════════════════════════════"));

    console.log(C(`💾 RAM: ${getMemory()} MB`));
    console.log(C(`⏱️ Uptime: ${getUptime()}`));
    console.log(C(`❌ Erros: ${stats.errors === 0 ? "Seu bot está sem erros" : stats.errors}`));

    console.log(C("══════════════════════════════════════════════════════\n"));
}

// Atualiza monitor a cada 6 horas
setInterval(() => {
    consoleBanner();
}, 21600000);

// ==================== COMANDOS ====================
const commands = [
    new SlashCommandBuilder()
        .setName('rule')
        .setDescription('Exibe as regras')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('Código de acesso')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('info')
        .setDescription('Informações do bot'),

    new SlashCommandBuilder()
        .setName('restart')
        .setDescription('Reinicia o bot')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('Código de acesso')
                .setRequired(true)
        )

].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
    await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
    );
}

// ==================== READY ====================
client.once('clientReady', async () => {
    consoleBanner();
    console.log(C("🤖 Bot conectado como " + client.user.tag));
    await registerCommands();
});

// ==================== EVENTOS ====================

// Membro entrou
client.on('guildMemberAdd', member => {
    console.log(C(`➕ ${member.user.tag} entrou no servidor.`));
});

// Membro saiu
client.on('guildMemberRemove', member => {
    console.log(C(`➖ ${member.user.tag} saiu do servidor.`));
});

// Mensagem apagada
client.on('messageDelete', message => {
    if (!message.author) return;
    console.log(C(`❗️ ${message.author.tag} apagou uma mensagem: ${message.content}`));
});

// ==================== INTERAÇÕES ====================
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    stats.totalCommands++;
    stats.commandsUsed[interaction.commandName] =
        (stats.commandsUsed[interaction.commandName] || 0) + 1;

    console.log(C(`📌 /${interaction.commandName} usado por ${interaction.user.tag}`));

    // RULE
    if (interaction.commandName === 'rule') {
        const code = interaction.options.getString('code');

        if (code !== ACCESS_CODE) {
            return interaction.reply({ content: "Código inválido.", ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor(0x00FFFF)
            .setTitle("📜 Regras - HostVille Greenville RP")
            .setDescription("Acesse o documento oficial abaixo.")
            .setImage("https://image2url.com/r2/default/images/1771466090995-ea6150ee-52be-4f03-953e-f6a41480320e.png");

        await interaction.reply({ embeds: [embed] });
    }

    // INFO
    if (interaction.commandName === 'info') {
        const embed = new EmbedBuilder()
            .setColor(0x00FFFF)
            .setTitle("🤖 Informações do Bot")
            .addFields(
                { name: "Servidores", value: `${client.guilds.cache.size}`, inline: true },
                { name: "Ping", value: `${client.ws.ping}ms`, inline: true },
                { name: "RAM", value: `${getMemory()} MB`, inline: true },
                { name: "Uptime", value: getUptime(), inline: true }
            );

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // RESTART
    if (interaction.commandName === 'restart') {
        const code = interaction.options.getString('code');

        if (code !== ACCESS_CODE) {
            return interaction.reply({ content: "Código inválido.", ephemeral: true });
        }

        await interaction.reply({ content: "Reiniciando...", ephemeral: true });
        stats.restarts++;
        process.exit(0); // Railway reinicia automaticamente
    }
});

// ==================== ERROS ====================
process.on('unhandledRejection', err => {
    stats.errors++;
    console.log(C("Erro não tratado: " + err));
});

process.on('uncaughtException', err => {
    stats.errors++;
    console.log(C("Exceção não tratada: " + err));
});

// ==================== LOGIN ====================
client.login(TOKEN);
