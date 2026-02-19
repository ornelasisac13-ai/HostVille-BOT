import { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits
} from "discord.js";

import chalk from "chalk";
import process from "process";

// ================= CONFIG =================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1473705296101900420";
const GUILD_ID = "928614664840052757";
const ACCESS_CODE = process.env.ACCESS_CODE;

// ================= COR FIXA =================
const C = chalk.cyanBright;

// ================= ESTATÍSTICAS =================
const stats = {
    commandsUsed: {},
    totalCommands: 0,
    startTime: Date.now(),
    restarts: 0,
    errors: 0,
    joins: 0,
    leaves: 0
};

// ================= HISTÓRICO EM MEMÓRIA =================
const activityHistory = [];

// ================= MONITOR =================
const Monitor = {
    getMemory() {
        const m = process.memoryUsage();
        return {
            rss: (m.rss / 1024 / 1024).toFixed(2),
            heapUsed: (m.heapUsed / 1024 / 1024).toFixed(2)
        };
    },

    getUptime() {
        const ms = Date.now() - stats.startTime;
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${h}h ${m}m ${s}s`;
    }
};

// ================= HORÁRIO BRASÍLIA =================
function getBrasiliaTime() {
    return new Date().toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo"
    });
}

// ================= LOG ESTRUTURADO =================
function structuredLog(type, message) {
    console.log(C("════════════════════════════════════════════"));
    console.log(C(`[${type}] ${getBrasiliaTime()}`));
    console.log(C(message));
    console.log(C("════════════════════════════════════════════"));
}

// ================= RELATÓRIO 24H =================
function logLast24HoursActivity() {
    const now = Date.now();
    const last24h = 24 * 60 * 60 * 1000;

    const recent = activityHistory.filter(a => now - a.timestamp <= last24h);

    const joins = recent.filter(a => a.type === "join");
    const leaves = recent.filter(a => a.type === "leave");

    structuredLog(
        "RELATÓRIO 24H",
        joins.length === 0
            ? "Não entrou ninguém no servidor nas últimas 24 horas"
            : `Entraram (${joins.length}) no servidor nas últimas 24 horas, sendo elas: ${joins.map(j => j.tag).join(", ")}`
    );

    if (leaves.length > 0) {
        console.log(C(`Saíram (${leaves.length}) nas últimas 24 horas: ${leaves.map(l => l.tag).join(", ")}`));
    }
}

// ================= CLIENT =================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ================= READY =================
client.once("ready", async () => {
    console.clear();
    structuredLog("BOOT", "ＨｏｓｔＶｉｌｌｅ • ＢＯＴ iniciado");

    console.log(C(`Logado como ${client.user.tag}`));
    console.log(C(`Ping: ${client.ws.ping}ms`));
    console.log(C(`Memória: ${Monitor.getMemory().rss} MB`));

    logLast24HoursActivity();

    setInterval(() => {
        logLast24HoursActivity();
    }, 60 * 60 * 1000);
});

// ================= ENTRADA =================
client.on("guildMemberAdd", member => {
    stats.joins++;
    activityHistory.push({
        type: "join",
        tag: member.user.tag,
        timestamp: Date.now()
    });

    structuredLog("JOIN", `${member.user.tag} entrou no servidor.`);
});

// ================= SAÍDA =================
client.on("guildMemberRemove", member => {
    stats.leaves++;
    activityHistory.push({
        type: "leave",
        tag: member.user.tag,
        timestamp: Date.now()
    });

    structuredLog("LEAVE", `${member.user.tag} saiu do servidor.`);
});

// ================= MENSAGEM APAGADA =================
client.on("messageDelete", message => {
    if (!message.author) return;

    structuredLog(
        "DELETE",
        `Mensagem apagada por ${message.author.tag} | Conteúdo: ${message.content || "Sem conteúdo"}`
    );
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
        ),

    new SlashCommandBuilder()
        .setName("adm")
        .setDescription("Painel administrativo")
        .addStringOption(opt =>
            opt.setName("code")
                .setDescription("Código de acesso")
                .setRequired(true)
        )
].map(c => c.toJSON());

// ================= REGISTRAR =================
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
    );
})();

// ================= INTERAÇÕES =================
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

    if (interaction.isChatInputCommand()) {
        stats.totalCommands++;

        if (interaction.commandName === "info") {
            const embed = new EmbedBuilder()
                .setTitle("HostVille Bot")
                .setColor("#00FFFF")
                .setDescription("Bot oficial do servidor.")
                .addFields(
                    { name: "Uptime", value: Monitor.getUptime(), inline: true },
                    { name: "Ping", value: `${client.ws.ping}ms`, inline: true }
                );

            structuredLog("CMD", `/info usado por ${interaction.user.tag}`);
            return interaction.reply({ embeds: [embed] });
        }

        if (interaction.commandName === "rule") {
            structuredLog("CMD", `/rule usado por ${interaction.user.tag}`);
            return interaction.reply({
                content: "📜 Regras do servidor:\nRespeite todos os membros.\nSem spam.\nSem divulgação.\nLink: https://discord.com/channels/928614664840052757"
            });
        }

        if (interaction.commandName === "restart") {
            const code = interaction.options.getString("code");

            if (code !== ACCESS_CODE) {
                structuredLog("SECURITY", `Tentativa inválida de restart por ${interaction.user.tag}`);
                return interaction.reply({ content: "Código inválido.", flags: 64 });
            }

            structuredLog("RESTART", `Bot reiniciado por ${interaction.user.tag}`);
            await interaction.reply("Reiniciando...");
            process.exit(0);
        }

        if (interaction.commandName === "adm") {
            const code = interaction.options.getString("code");

            if (code !== ACCESS_CODE) {
                structuredLog("SECURITY", `Tentativa inválida de ADM por ${interaction.user.tag}`);
                return interaction.reply({ content: "Código inválido.", flags: 64 });
            }

            structuredLog("ADM", `Painel acessado por ${interaction.user.tag}`);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("adm_stats")
                    .setLabel("Ver Estatísticas")
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId("adm_24h")
                    .setLabel("Relatório 24h")
                    .setStyle(ButtonStyle.Secondary)
            );

            return interaction.reply({
                content: "🔐 Painel Administrativo",
                components: [row]
            });
        }
    }

    if (interaction.isButton()) {
        if (interaction.customId === "adm_stats") {
            structuredLog("ADM_BTN", `Stats visualizado por ${interaction.user.tag}`);
            return interaction.reply({
                content: `Uptime: ${Monitor.getUptime()}\nJoins: ${stats.joins}\nLeaves: ${stats.leaves}`,
                flags: 64
            });
        }

        if (interaction.customId === "adm_24h") {
            structuredLog("ADM_BTN", `Relatório 24h visualizado por ${interaction.user.tag}`);
            logLast24HoursActivity();
            return interaction.reply({
                content: "Relatório enviado no console.",
                flags: 64
            });
        }
    }
});

// ================= LOGIN =================
client.login(TOKEN);
