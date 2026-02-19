import {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags
} from "discord.js";

import chalk from "chalk";
import os from "os";
import process from "process";

// ================= CONFIG =================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1473705296101900420";
const GUILD_ID = "928614664840052757";
const ACCESS_CODE = process.env.ACCESS_CODE;

if (!TOKEN) {
    console.error("❌ TOKEN não definido.");
    process.exit(1);
}

if (!ACCESS_CODE) {
    console.error("❌ ACCESS_CODE não definido.");
    process.exit(1);
}

// ================= ESTATÍSTICAS =================
const stats = {
    totalCommands: 0,
    startTime: Date.now(),
    errors: 0
};

// ================= HISTÓRICO =================
const activityHistory = [];

// ================= COR FIXA =================
const C = chalk.cyanBright;

// ================= MONITOR =================
const Monitor = {
    getMemory() {
        const m = process.memoryUsage();
        return (m.rss / 1024 / 1024).toFixed(2);
    },

    getUptime() {
        const ms = Date.now() - stats.startTime;
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${h}h ${m}m ${s}s`;
    }
};

// ================= SAFE REPLY =================
async function safeReply(interaction, options) {
    try {
        if (interaction.replied || interaction.deferred) {
            return await interaction.followUp(options);
        } else {
            return await interaction.reply(options);
        }
    } catch (err) {
        stats.errors++;
        console.error("Erro ao responder interaction:", err.message);
    }
}

// ================= CLIENT =================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

// ================= READY =================
client.once("clientReady", async () => {
    console.clear();
    console.log(C("════════════════════════════════════"));
    console.log(C("ＨｏｓｔＶｉｌｌｅ • ＢＯＴ"));
    console.log(C(`Logado como ${client.user.tag}`));
    console.log(C(`Ping: ${client.ws.ping}ms`));
    console.log(C(`Memória: ${Monitor.getMemory()} MB`));
    console.log(C("════════════════════════════════════"));

    setInterval(() => {
        console.log(C(`⏱ Uptime: ${Monitor.getUptime()} | 💾 ${Monitor.getMemory()}MB | 📡 ${client.ws.ping}ms`));
    }, 6 * 60 * 60 * 1000);
});

// ================= ENTRADA =================
client.on("guildMemberAdd", member => {
    activityHistory.push({
        type: "join",
        tag: member.user.tag,
        timestamp: Date.now()
    });

    console.log(C(`➕ ${member.user.tag} entrou.`));
});

// ================= SAÍDA =================
client.on("guildMemberRemove", member => {
    activityHistory.push({
        type: "leave",
        tag: member.user.tag,
        timestamp: Date.now()
    });

    console.log(C(`➖ ${member.user.tag} saiu.`));
});

// ================= COMANDOS =================
const commands = [
    new SlashCommandBuilder()
        .setName("info")
        .setDescription("Informações do bot"),

    new SlashCommandBuilder()
        .setName("rule")
        .setDescription("Mostrar regras"),

    new SlashCommandBuilder()
        .setName("restart")
        .setDescription("Reiniciar bot")
        .addStringOption(opt =>
            opt.setName("code")
                .setDescription("Código de acesso")
                .setRequired(true)
        )
].map(c => c.toJSON());

// ================= REGISTRO =================
const rest = new REST({ version: "10" }).setToken(TOKEN);

async function registerCommands() {
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        console.log(C("✅ Comandos registrados."));
    } catch (err) {
        stats.errors++;
        console.error("Erro ao registrar comandos:", err.message);
    }
}

// ================= INTERAÇÕES =================
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    stats.totalCommands++;

    try {

        if (interaction.commandName === "info") {

            const embed = new EmbedBuilder()
                .setTitle("HostVille Bot")
                .setColor("#00FFFF")
                .addFields(
                    { name: "Uptime", value: Monitor.getUptime(), inline: true },
                    { name: "Ping", value: `${client.ws.ping}ms`, inline: true },
                    { name: "Memória", value: `${Monitor.getMemory()} MB`, inline: true }
                );

            await safeReply(interaction, { embeds: [embed] });
        }

        if (interaction.commandName === "rule") {

            await safeReply(interaction, {
                content: "Respeite todos os membros e siga as regras do servidor."
            });
        }

        if (interaction.commandName === "restart") {

            const code = interaction.options.getString("code");

            if (code !== ACCESS_CODE) {
                return safeReply(interaction, {
                    content: "Código inválido.",
                    flags: MessageFlags.Ephemeral
                });
            }

            await safeReply(interaction, { content: "Reiniciando..." });

            setTimeout(() => {
                process.exit(0);
            }, 1000);
        }

    } catch (err) {
        stats.errors++;
        console.error("Erro na interaction:", err.message);
    }
});

// ================= PROTEÇÃO GLOBAL =================
process.on("unhandledRejection", err => {
    stats.errors++;
    console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", err => {
    stats.errors++;
    console.error("Uncaught Exception:", err);
});

// ================= START =================
await registerCommands();
client.login(TOKEN);
