import {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    EmbedBuilder,
    AuditLogEvent
} from "discord.js";

import chalk from "chalk";
import os from "os";
import process from "process";

/* ================= CONFIG ================= */

const TOKEN = process.env.TOKEN;
const ACCESS_CODE = process.env.ACCESS_CODE;
const CLIENT_ID = "1473705296101900420";
const GUILD_ID = "928614664840052757";

if (!TOKEN) process.exit(1);
if (!ACCESS_CODE) process.exit(1);

/* ================= ESTATÍSTICAS ================= */

const stats = {
    startTime: Date.now(),
    totalCommands: 0,
    commandsUsed: {},
    restarts: 0,
    errors: 0,
    joins: 0,
    leaves: 0,
    deletedMessages: 0
};

/* ================= COR ================= */

const C = chalk.hex("#00FFFF");

/* ================= CLIENT ================= */

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ]
});

/* ================= UTIL ================= */

function getRAM() {
    return (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
}

function getCPU() {
    const cpus = os.cpus();
    return cpus.length;
}

function getUptime() {
    const ms = Date.now() - stats.startTime;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
}

function banner() {
    console.clear();
    console.log(C("══════════════════════════════════════════════════════"));
    console.log(C.bold("ＨｏｓｔＶｉｌｌｅ • ＢＯＴ"));
    console.log(C("══════════════════════════════════════════════════════"));
    console.log(C(`💾 RAM: ${getRAM()} MB`));
    console.log(C(`🖥 CPU Cores: ${getCPU()}`));
    console.log(C(`📡 Ping: ${client.ws.ping}ms`));
    console.log(C(`⏱ Uptime: ${getUptime()}`));
    console.log(C(`👥 Entradas: ${stats.joins} | Saídas: ${stats.leaves}`));
    console.log(C(`🗑 Mensagens apagadas: ${stats.deletedMessages}`));
    console.log(C(`❌ Erros: ${stats.errors === 0 ? "Sem erros" : stats.errors}`));
    console.log(C("══════════════════════════════════════════════════════\n"));
}

/* ================= COMANDOS ================= */

const commands = [
    new SlashCommandBuilder()
        .setName("rule")
        .setDescription("Exibe as regras")
        .addStringOption(opt =>
            opt.setName("code").setDescription("Código").setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("info")
        .setDescription("Informações do bot"),

    new SlashCommandBuilder()
        .setName("restart")
        .setDescription("Reinicia o bot")
        .addStringOption(opt =>
            opt.setName("code").setDescription("Código").setRequired(true)
        )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function registerCommands() {
    await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
    );
}

/* ================= READY ================= */

client.once("clientReady", async () => {
    banner();
    await registerCommands();
});

/* ================= MONITOR AUTOMÁTICO ================= */

setInterval(() => {
    banner();
}, 3600000);

/* ================= EVENTOS ================= */

// Entrou
client.on("guildMemberAdd", member => {
    stats.joins++;
    console.log(C(`➕ ${member.user.tag} entrou.`));
});

// Saiu
client.on("guildMemberRemove", member => {
    stats.leaves++;
    console.log(C(`➖ ${member.user.tag} saiu.`));
});

// Mensagem apagada com executor
client.on("messageDelete", async message => {
    if (!message.guild || !message.author) return;

    stats.deletedMessages++;

    try {
        const logs = await message.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MessageDelete
        });

        const entry = logs.entries.first();
        if (!entry) return;

        const { executor } = entry;

        console.log(C(
            `🗑 ${executor.tag} apagou mensagem de ${message.author.tag}: ${message.content}`
        ));
    } catch {
        console.log(C(`🗑 ${message.author.tag} apagou: ${message.content}`));
    }
});

// Detectar tentativa de comando manual
client.on("messageCreate", msg => {
    if (msg.author.bot) return;
    if (msg.content.startsWith("/")) {
        console.log(C(`📡 ${msg.author.tag} digitou: ${msg.content}`));
    }
});

/* ================= INTERAÇÕES ================= */

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    stats.totalCommands++;
    stats.commandsUsed[interaction.commandName] =
        (stats.commandsUsed[interaction.commandName] || 0) + 1;

    console.log(C(`📌 /${interaction.commandName} por ${interaction.user.tag}`));

    if (interaction.commandName === "rule") {
        const code = interaction.options.getString("code");
        if (code !== ACCESS_CODE)
            return interaction.reply({ content: "Código inválido", ephemeral: true });

        const embed = new EmbedBuilder()
            .setColor(0x00FFFF)
            .setTitle("📜 Regras - HostVille")
            .setDescription("Documento oficial abaixo.")
            .setImage("https://image2url.com/r2/default/images/1771466090995-ea6150ee-52be-4f03-953e-f6a41480320e.png");

        await interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === "info") {
        const embed = new EmbedBuilder()
            .setColor(0x00FFFF)
            .setTitle("🤖 Informações")
            .addFields(
                { name: "Ping", value: `${client.ws.ping}ms`, inline: true },
                { name: "RAM", value: `${getRAM()} MB`, inline: true },
                { name: "Uptime", value: getUptime(), inline: true }
            );

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.commandName === "restart") {
        const code = interaction.options.getString("code");
        if (code !== ACCESS_CODE)
            return interaction.reply({ content: "Código inválido", ephemeral: true });

        await interaction.reply({ content: "Reiniciando...", ephemeral: true });
        stats.restarts++;
        process.exit(0);
    }
});

/* ================= ANTI-CRASH ================= */

process.on("unhandledRejection", err => {
    stats.errors++;
    console.log(C("⚠ Unhandled Rejection"));
    console.log(err);
});

process.on("uncaughtException", err => {
    stats.errors++;
    console.log(C("💥 Uncaught Exception"));
    console.log(err);
});

process.on("warning", warn => {
    console.log(C("⚠ Warning: " + warn.name));
});

/* ================= RATE LIMIT ================= */

client.rest.on("rateLimited", info => {
    console.log(C(`🚨 Rate Limit: ${info.timeout}ms`));
});

/* ================= RECONNECT ================= */

client.on("shardDisconnect", () => {
    console.log(C("🔌 Desconectado."));
});

client.on("shardReconnecting", () => {
    console.log(C("♻ Reconectando..."));
});

client.on("shardReady", () => {
    console.log(C("✅ Reconectado."));
});

/* ================= LOGIN ================= */

client.login(TOKEN);
